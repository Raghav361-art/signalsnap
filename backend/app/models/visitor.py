from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.lead import Lead
    from app.models.session import Session


class Visitor(Base):
    __tablename__ = "visitors"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    anonymous_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    ip: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True,
    )

    country: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    company: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    first_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    sessions: Mapped[list["Session"]] = relationship(
        "Session",
        back_populates="visitor",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    events: Mapped[list["Event"]] = relationship(
        "Event",
        back_populates="visitor",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    leads: Mapped[list["Lead"]] = relationship(
        "Lead",
        back_populates="visitor",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )