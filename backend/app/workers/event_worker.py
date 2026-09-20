from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.services.queue import consume_events

from app.models.event import Event
from app.models.visitor import Visitor
from app.schemas.tracking import QueuedEvent
from app.services.enrichment import enrich_visitor
from app.services.lead import process_lead
from app.services.session import (
    find_or_create_session,
    update_session_metrics,
)

logger = logging.getLogger(__name__)


def timestamp_to_datetime(timestamp: int) -> datetime:
    """
    Convert JavaScript Date.now() milliseconds to an aware UTC datetime.
    """

    return datetime.fromtimestamp(
        timestamp / 1000,
        tz=timezone.utc,
    )


async def process_event(
    db: AsyncSession,
    event: QueuedEvent,
) -> dict[str, Any]:
    """
    Process one queued tracking event.

    Pipeline:
        visitor -> session -> event -> metrics -> lead
    """

    timestamp = timestamp_to_datetime(event.timestamp)

    logger.info(
        "[worker] processing %s from %s @ %s",
        event.type,
        event.anonymous_id,
        event.page,
    )

    # ---------------------------------------------------------
    # 1. FIND OR CREATE VISITOR
    # ---------------------------------------------------------

    result = await db.execute(
        select(Visitor).where(
            Visitor.anonymous_id == event.anonymous_id
        )
    )

    visitor = result.scalar_one_or_none()
    new_visitor = visitor is None

    if visitor is None:
        company = None
        country = None

        if event.ip:
            enriched = await enrich_visitor(event.ip)
            company = enriched["company"]
            country = enriched["country"]

        visitor = Visitor(
            anonymous_id=event.anonymous_id,
            ip=event.ip,
            company=company,
            country=country,
            first_seen=timestamp,
            last_seen=timestamp,
        )

        db.add(visitor)
        await db.flush()

        logger.info(
            "[worker] created visitor %s",
            event.anonymous_id,
        )

    else:
        # Never move last_seen backwards if queued events arrive
        # slightly out of order.
        if timestamp > visitor.last_seen:
            visitor.last_seen = timestamp

        # Keep the newest IP we have.
        if event.ip and not visitor.ip:
            visitor.ip = event.ip

        # Only call IP enrichment when information is still missing.
        if event.ip and (not visitor.company or not visitor.country):
            enriched = await enrich_visitor(event.ip)

            if not visitor.company and enriched["company"]:
                visitor.company = enriched["company"]

            if not visitor.country and enriched["country"]:
                visitor.country = enriched["country"]

        await db.flush()

    # ---------------------------------------------------------
    # 2. FIND OR CREATE SESSION
    # ---------------------------------------------------------

    session, new_session = await find_or_create_session(
        db=db,
        visitor_id=event.anonymous_id,
        client_session_id=event.session_id,
        timestamp=timestamp,
    )

    # IMPORTANT:
    # The session returned here may have a server-generated ID if the
    # old browser session expired.
    effective_session_id = session.session_id

    # ---------------------------------------------------------
    # 3. STORE EVENT
    # ---------------------------------------------------------

    database_event = Event(
        visitor_id=event.anonymous_id,
        session_id=effective_session_id,
        type=event.type,
        page=event.page,
        timestamp=timestamp,
        metadata_=event.metadata,
    )

    db.add(database_event)
    await db.flush()

    # ---------------------------------------------------------
    # 4. UPDATE SESSION METRICS
    # ---------------------------------------------------------

    await update_session_metrics(
        db=db,
        session_id=effective_session_id,
    )

    # ---------------------------------------------------------
    # 5. RUN LEAD ENGINE
    # ---------------------------------------------------------

    lead_result = await process_lead(
        db=db,
        visitor_id=event.anonymous_id,
    )

    # ---------------------------------------------------------
    # 6. COMMIT EVERYTHING
    # ---------------------------------------------------------

    await db.commit()

    return {
        "ok": True,
        "visitor_id": event.anonymous_id,
        "session_id": effective_session_id,
        "new_visitor": new_visitor,
        "new_session": new_session,
        "lead_created": lead_result["created"],
        "score": lead_result["score"],
    }

async def process_queued_event(
    event_data: dict[str, Any],
) -> None:
    """
    Create a fresh database session for each queued event.
    """

    event = QueuedEvent.model_validate(event_data)

    async with AsyncSessionLocal() as db:
        await process_event(
            db=db,
            event=event,
        )

async def run_worker() -> None:
    """
    Start the Redis event consumer.
    """

    logger.info("[worker] starting SignalSnap event worker")

    await consume_events(
        process_queued_event,
    )