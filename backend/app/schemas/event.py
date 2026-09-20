from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class EventResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    visitor_id: str
    session_id: str
    type: str
    page: str
    timestamp: datetime
    metadata: dict[str, Any] | None = None