from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.event import EventResponse
from app.schemas.lead import LeadResponse
from app.schemas.session import SessionResponse


class VisitorBase(BaseModel):
    anonymous_id: str
    ip: str | None = None
    country: str | None = None
    company: str | None = None


class VisitorResponse(VisitorBase):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    first_seen: datetime
    last_seen: datetime


class VisitorDetailResponse(VisitorResponse):
    sessions: list[SessionResponse] = Field(default_factory=list)
    events: list[EventResponse] = Field(default_factory=list)
    leads: list[LeadResponse] = Field(default_factory=list)