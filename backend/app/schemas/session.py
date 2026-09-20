from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SessionResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    session_id: str
    visitor_id: str
    start_time: datetime
    end_time: datetime | None = None
    duration: int
    page_count: int