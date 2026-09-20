from pydantic import BaseModel, Field


class StatsResponse(BaseModel):
    totalVisitors: int = Field(
        ge=0,
    )

    totalLeads: int = Field(
        ge=0,
    )

    totalEvents: int = Field(
        ge=0,
    )

    activeNow: int = Field(
        ge=0,
    )

    leadsToday: int = Field(
        ge=0,
    )

    highIntentLeads: int = Field(
        ge=0,
    )

    leadsByStatus: dict[str, int]

    leadsByIntent: dict[str, int]