import pytest
from datetime import datetime, timezone

from app.models.event import Event
from app.models.session import Session
from app.models.visitor import Visitor


@pytest.fixture
def visitor():
    now = datetime.now(timezone.utc)

    return Visitor(
        id=1,
        anonymous_id="v_test",
        ip="127.0.0.1",
        country="IN",
        company="Test Company",
        first_seen=now,
        last_seen=now,
    )


@pytest.fixture
def session():
    now = datetime.now(timezone.utc)

    return Session(
        id=1,
        session_id="s_test",
        visitor_id="v_test",
        start_time=now,
        end_time=now,
        duration=60,
        page_count=3,
    )


@pytest.fixture
def event():
    now = datetime.now(timezone.utc)

    return Event(
        id=1,
        visitor_id="v_test",
        session_id="s_test",
        type="page_view",
        page="https://example.com/pricing",
        timestamp=now,
        metadata_={},
    )