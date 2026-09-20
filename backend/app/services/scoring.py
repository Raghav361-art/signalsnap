from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event
from app.models.session import Session
from app.models.visitor import Visitor


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


async def calculate_intent_score(
    db: AsyncSession,
    visitor_id: str,
) -> dict:
    """
    Calculate the visitor's current intent score.
    """

    event_result = await db.execute(
        select(Event)
        .where(Event.visitor_id == visitor_id)
        .order_by(Event.timestamp.asc())
    )
    events = event_result.scalars().all()

    session_result = await db.execute(
        select(Session)
        .where(Session.visitor_id == visitor_id)
    )
    sessions = session_result.scalars().all()

    visitor_result = await db.execute(
        select(Visitor).where(Visitor.anonymous_id == visitor_id)
    )
    visitor = visitor_result.scalar_one_or_none()

    raw_score = 0
    breakdown: dict[str, int] = {}

    # +10 for pricing-page visit.
    page_views = [
        event.page
        for event in events
        if event.type == "page_view"
    ]

    if any("pricing" in page.lower() for page in page_views):
        raw_score += 10
        breakdown["visited_pricing_page"] = 10

    # +2 per unique page.
    unique_pages = set(page_views)
    page_score = len(unique_pages) * 2

    if page_score > 0:
        raw_score += page_score
        breakdown["unique_pages"] = page_score

    # +1 per 30 seconds of total session duration.
    total_duration = sum(
        max(0, session.duration or 0)
        for session in sessions
    )

    time_score = total_duration // 30

    if time_score > 0:
        raw_score += time_score
        breakdown["time_on_site"] = time_score

    # +8 for returning visitors.
    if len(sessions) > 1:
        raw_score += 8
        breakdown["returning_visitor"] = 8

    # -1 per hour since the most recent event.
    last_event = events[-1] if events else None

    if last_event is not None and visitor is not None:
        now = datetime.now(timezone.utc)
        last_timestamp = _ensure_utc(last_event.timestamp)

        hours_since_event = (
            now - last_timestamp
        ).total_seconds() / 3600

        decay = int(hours_since_event)

        if decay > 0:
            raw_score = max(0, raw_score - decay)
            breakdown["inactivity_decay"] = -decay

    if raw_score >= 20:
        intent_level = "high"
    elif raw_score >= 10:
        intent_level = "medium"
    else:
        intent_level = "low"

    return {
        "score": raw_score,
        "intent_level": intent_level,
        "breakdown": breakdown,
    }