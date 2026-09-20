from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.lead import Lead
from app.models.visitor import Visitor
from app.services.routing import route_lead
from app.services.scoring import calculate_intent_score


LEAD_THRESHOLD = getattr(settings, "LEAD_SCORE_THRESHOLD", 20)
LEAD_DEDUP_WINDOW = timedelta(hours=24)


async def process_lead(
    db: AsyncSession,
    visitor_id: str,
) -> dict:
    """
    Calculate score and create/update a lead when the threshold is reached.
    """

    scoring = await calculate_intent_score(
        db=db,
        visitor_id=visitor_id,
    )

    score = scoring["score"]
    intent_level = scoring["intent_level"]

    if score < LEAD_THRESHOLD:
        return {
            "created": False,
            "score": score,
            "intent_level": intent_level,
        }

    result = await db.execute(
        select(Lead)
        .where(Lead.visitor_id == visitor_id)
        .order_by(Lead.created_at.desc())
    )

    existing = result.scalars().first()

    now = datetime.now(timezone.utc)

    if existing is not None:
        created_at = existing.created_at

        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        if now - created_at < LEAD_DEDUP_WINDOW:
            existing.score = score
            existing.intent_level = intent_level

            await db.flush()

            return {
                "created": False,
                "score": score,
                "intent_level": intent_level,
                "lead_id": existing.id,
            }

    visitor_result = await db.execute(
        select(Visitor).where(
            Visitor.anonymous_id == visitor_id
        )
    )
    visitor = visitor_result.scalar_one_or_none()

    lead = Lead(
        visitor_id=visitor_id,
        score=score,
        intent_level=intent_level,
        status="new",
        created_at=now,
    )

    db.add(lead)
    await db.flush()

    await route_lead(
        db=db,
        payload={
            "visitor_id": visitor_id,
            "company": visitor.company if visitor else None,
            "country": visitor.country if visitor else None,
            "intent": intent_level,
            "score": score,
        },
    )

    return {
        "created": True,
        "score": score,
        "intent_level": intent_level,
        "lead_id": lead.id,
    }