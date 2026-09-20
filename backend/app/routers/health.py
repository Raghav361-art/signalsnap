from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import text

from app.dependencies import SessionDep

router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("")
async def health_check(db: SessionDep):
    db_ok = True

    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return {
        "status": "ok" if db_ok else "degraded",
        "db": db_ok,
        "timestamp": datetime.now(timezone.utc),
    }