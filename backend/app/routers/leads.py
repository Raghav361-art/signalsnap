from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import SessionDep, get_current_user
from app.models.lead import Lead
from app.models.user import User


router = APIRouter(
    prefix="/leads",
    tags=["Leads"],
)


VALID_STATUSES = {
    "new",
    "contacted",
    "qualified",
    "lost",
}


class LeadStatusUpdate(BaseModel):
    status: str


@router.get("")
async def get_leads(
    db: SessionDep,
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Lead)
        .options(
            selectinload(Lead.visitor),
        )
        .order_by(Lead.created_at.desc())
    )

    leads = result.scalars().all()

    return [
        {
            "id": lead.id,
            "visitor_id": lead.visitor_id,
            "score": lead.score,
            "intent_level": lead.intent_level,
            "status": lead.status,
            "company": lead.visitor.company if lead.visitor else None,
            "country": lead.visitor.country if lead.visitor else None,
            "created_at": lead.created_at,
        }
        for lead in leads
    ]


@router.get("/{lead_id}")
async def get_lead(
    lead_id: int,
    db: SessionDep,
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Lead)
        .options(
            selectinload(Lead.visitor).selectinload(
                Lead.visitor.events
            ),
            selectinload(Lead.visitor).selectinload(
                Lead.visitor.sessions
            ),
        )
        .where(Lead.id == lead_id)
    )

    lead = result.scalar_one_or_none()

    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    return lead


@router.patch("/{lead_id}/status")
async def update_lead_status(
    lead_id: int,
    payload: LeadStatusUpdate,
    db: SessionDep,
    current_user: User = Depends(get_current_user)
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Invalid status",
                "valid_statuses": sorted(VALID_STATUSES),
            },
        )

    result = await db.execute(
        select(Lead).where(Lead.id == lead_id)
    )

    lead = result.scalar_one_or_none()

    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    lead.status = payload.status

    await db.commit()
    await db.refresh(lead)

    return lead