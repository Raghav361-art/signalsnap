from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import SessionDep, get_current_user
from app.models.user import User
from app.models.visitor import Visitor


router = APIRouter(
    prefix="/visitors",
    tags=["Visitors"],
)


@router.get("")
async def get_visitors(
    db: SessionDep,
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Visitor)
        .options(
            selectinload(Visitor.sessions),
            selectinload(Visitor.events),
        )
        .order_by(Visitor.last_seen.desc())
    )

    visitors = result.scalars().unique().all()

    return visitors


@router.get("/{anonymous_id}")
async def get_visitor(
    anonymous_id: str,
    db: SessionDep,
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Visitor)
        .options(
            selectinload(Visitor.sessions),
            selectinload(Visitor.events),
            selectinload(Visitor.leads),
        )
        .where(Visitor.anonymous_id == anonymous_id)
    )

    visitor = result.scalar_one_or_none()

    if visitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found",
        )

    return visitor