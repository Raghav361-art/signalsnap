from __future__ import annotations

import asyncio
import logging

import httpx

from app.config import settings
from app.models.event import Event
from sqlalchemy import select

logger = logging.getLogger(__name__)


async def _send_slack(
    payload: dict,
    recent_pages: list[str],
) -> None:
    webhook_url = getattr(settings, "SLACK_WEBHOOK_URL", None)

    if not webhook_url:
        return

    text = (
        "*High Intent Lead Detected*\n\n"
        f"Company: {payload.get('company') or 'Unknown'}\n"
        f"Country: {payload.get('country') or 'Unknown'}\n"
        f"Pages: {', '.join(recent_pages) or 'N/A'}\n"
        f"Score: *{payload['score']}*\n"
        f"Intent: *{payload['intent']}*\n"
        f"Visitor: `{payload['visitor_id']}`"
    )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                webhook_url,
                json={"text": text},
            )
            response.raise_for_status()

    except httpx.HTTPError as exc:
        logger.error(
            "[routing] Slack webhook failed: %s",
            exc,
        )


async def _send_crm(payload: dict) -> None:
    webhook_url = getattr(settings, "CRM_WEBHOOK_URL", None)

    if not webhook_url:
        return

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                webhook_url,
                json=payload,
            )
            response.raise_for_status()

    except httpx.HTTPError as exc:
        logger.error(
            "[routing] CRM webhook failed: %s",
            exc,
        )


async def route_lead(
    db,
    payload: dict,
) -> None:
    """
    Send a lead to configured external destinations.

    Failures in external integrations must not break event processing.
    """

    result = await db.execute(
        select(Event.page)
        .where(
            Event.visitor_id == payload["visitor_id"],
            Event.type == "page_view",
        )
        .order_by(Event.timestamp.desc())
        .limit(5)
    )

    recent_pages = list(result.scalars().all())

    await asyncio.gather(
        _send_slack(payload, recent_pages),
        _send_crm(payload),
        return_exceptions=True,
    )