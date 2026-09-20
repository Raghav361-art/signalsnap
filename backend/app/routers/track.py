# app/routers/track.py

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request, status, Depends

from app.schemas.tracking import TrackBatch
from app.services.queue import enqueue_events
from app.dependencies import SessionDep, get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/track",
    tags=["Tracking"],
)


def get_client_ip(request: Request) -> str | None:
    """
    Extract the real client IP while respecting reverse proxies.
    """

    forwarded = request.headers.get("x-forwarded-for")

    if forwarded:
        return forwarded.split(",")[0].strip()

    if request.client:
        return request.client.host

    return None


def detect_device(user_agent: str) -> str:
    """
    Match the device classification used by the original SignalSnap
    tracker.
    """

    if "Mobi" in user_agent or (
        "Android" in user_agent
        and "Mobile" in user_agent
    ):
        return "mobile"

    if (
        "Tablet" in user_agent
        or "iPad" in user_agent
        or (
            "Android" in user_agent
            and "Mobile" not in user_agent
        )
    ):
        return "tablet"

    return "desktop"


@router.post("", status_code=status.HTTP_200_OK)
async def track_events(
    payload: TrackBatch,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Receive tracking events and push them into Redis.

    The API does NOT process events synchronously.
    """

    client_ip = get_client_ip(request)

    user_agent = request.headers.get(
        "user-agent",
        "",
    )

    device = detect_device(user_agent)

    events: list[dict[str, Any]] = []

    for event in payload.events:
        event_data = event.model_dump()

        event_data["ip"] = client_ip
        event_data["device"] = device
        event_data["user_agent"] = user_agent

        events.append(event_data)

    queued = await enqueue_events(events)

    return {
        "ok": True,
        "queued": queued,
    }