from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


IntentLevel = Literal[
    "low",
    "medium",
    "high",
]

LeadStatus = Literal[
    "new",
    "contacted",
    "qualified",
    "lost",
]


class LeadBase(BaseModel):
    visitor_id: str
    score: int = Field(
        ge=0,
    )
    intent_level: IntentLevel
    status: LeadStatus = "new"


class LeadResponse(LeadBase):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    created_at: datetime


class LeadListResponse(LeadResponse):
    company: str | None = None
    country: str | None = None


class LeadStatusUpdate(BaseModel):
    status: LeadStatus