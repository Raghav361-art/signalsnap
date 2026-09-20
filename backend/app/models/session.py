from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.visitor import Visitor


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    session_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    visitor_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey(
            "visitors.anonymous_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    duration: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    page_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    visitor: Mapped["Visitor"] = relationship(
        "Visitor",
        back_populates="sessions",
    )

    events: Mapped[list["Event"]] = relationship(
        "Event",
        back_populates="session",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )