from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select

from app.dependencies import SessionDep, get_current_user
from app.models.user import User
from app.models.event import Event
from app.models.lead import Lead
from app.models.visitor import Visitor



router = APIRouter(
    prefix="/stats",
    tags=["Stats"],
)


@router.get("")
async def get_stats(
    db: SessionDep,
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)

    five_minutes_ago = now - timedelta(minutes=5)

    start_of_day = now.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    total_visitors = await db.scalar(
        select(func.count()).select_from(Visitor)
    )

    total_leads = await db.scalar(
        select(func.count()).select_from(Lead)
    )

    total_events = await db.scalar(
        select(func.count()).select_from(Event)
    )

    active_now = await db.scalar(
        select(func.count())
        .select_from(Visitor)
        .where(Visitor.last_seen >= five_minutes_ago)
    )

    leads_today = await db.scalar(
        select(func.count())
        .select_from(Lead)
        .where(Lead.created_at >= start_of_day)
    )

    high_intent_leads = await db.scalar(
        select(func.count())
        .select_from(Lead)
        .where(Lead.intent_level == "high")
    )

    status_result = await db.execute(
        select(
            Lead.status,
            func.count(Lead.id),
        ).group_by(Lead.status)
    )

    intent_result = await db.execute(
        select(
            Lead.intent_level,
            func.count(Lead.id),
        ).group_by(Lead.intent_level)
    )

    leads_by_status = {
        status: count
        for status, count in status_result.all()
    }

    leads_by_intent = {
        intent: count
        for intent, count in intent_result.all()
    }

    return {
        "totalVisitors": total_visitors or 0,
        "totalLeads": total_leads or 0,
        "totalEvents": total_events or 0,
        "activeNow": active_now or 0,
        "leadsToday": leads_today or 0,
        "highIntentLeads": high_intent_leads or 0,
        "leadsByStatus": leads_by_status,
        "leadsByIntent": leads_by_intent,
    }