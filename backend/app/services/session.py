from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import Session


SESSION_TIMEOUT = timedelta(minutes=30)


def _ensure_utc(timestamp: datetime) -> datetime:
    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=timezone.utc)
    return timestamp.astimezone(timezone.utc)


async def find_or_create_session(
    db: AsyncSession,
    visitor_id: str,
    client_session_id: str,
    timestamp: datetime,
) -> tuple[Session, bool]:
    """
    Find the visitor's current session or create a new one.

    Returns:
        (session, is_new)
    """

    timestamp = _ensure_utc(timestamp)

    result = await db.execute(
        select(Session).where(
            Session.session_id == client_session_id,
            Session.visitor_id == visitor_id,
        )
    )
    session = result.scalar_one_or_none()

    if session is not None:
        # end_time represents the latest known activity for the session.
        last_activity = session.end_time or session.start_time

        if timestamp - last_activity <= SESSION_TIMEOUT:
            session.end_time = timestamp
            await db.flush()
            return session, False

        # Existing session expired.
        # Close it at its last known activity rather than extending it
        # with the timestamp of the new event.
        session.end_time = last_activity

    # A new server-side session ID prevents collisions when the browser
    # continues sending an old client session ID after a timeout.
    new_session_id = (
        client_session_id
        if session is None
        else f"s_{uuid4()}"
    )

    new_session = Session(
        session_id=new_session_id,
        visitor_id=visitor_id,
        start_time=timestamp,
        end_time=timestamp,
        duration=0,
        page_count=0,
    )

    db.add(new_session)
    await db.flush()

    return new_session, True


async def update_session_metrics(
    db: AsyncSession,
    session_id: str,
) -> None:
    """
    Recalculate session duration and unique page count from stored events.
    """

    from app.models.event import Event

    result = await db.execute(
        select(Event)
        .where(Event.session_id == session_id)
        .order_by(Event.timestamp.asc())
    )
    events = result.scalars().all()

    if not events:
        return

    session_result = await db.execute(
        select(Session).where(Session.session_id == session_id)
    )
    session = session_result.scalar_one_or_none()

    if session is None:
        return

    page_views = [
        event
        for event in events
        if event.type == "page_view"
    ]

    unique_pages = {event.page for event in page_views}

    first_event = events[0]
    last_event = events[-1]

    duration = max(
        0,
        int(
            (
                _ensure_utc(last_event.timestamp)
                - _ensure_utc(first_event.timestamp)
            ).total_seconds()
        ),
    )

    session.page_count = len(unique_pages)
    session.duration = duration
    session.end_time = last_event.timestamp

    await db.flush()