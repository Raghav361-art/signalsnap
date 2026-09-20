from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class TrackEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str = Field(
        min_length=1,
        max_length=100,
    )

    page: str = Field(
        min_length=1,
        max_length=2048,
    )

    # JavaScript Date.now() -> milliseconds since epoch
    timestamp: int = Field(
        gt=0,
    )

    anonymous_id: str = Field(
        min_length=1,
        max_length=255,
    )

    session_id: str = Field(
        min_length=1,
        max_length=255,
    )

    metadata: dict[str, Any] | None = None


class TrackBatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    events: list[TrackEvent] = Field(
        min_length=1,
        max_length=50,
    )


class QueuedEvent(TrackEvent):
    ip: str | None = None
    device: str | None = None
    user_agent: str | None = None