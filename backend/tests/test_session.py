import pytest
from datetime import datetime, timedelta, timezone

from app.models.session import Session
from app.services.session import find_or_create_session


class FakeResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class FakeDB:
    def __init__(self, existing=None):
        self.existing = existing
        self.added = []
        self.flushed = False

    async def execute(self, statement):
        return FakeResult(self.existing)

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        self.flushed = True


@pytest.mark.asyncio
async def test_creates_session_when_missing():
    now = datetime.now(timezone.utc)

    db = FakeDB()

    session, created = await find_or_create_session(
        db=db,
        visitor_id="v_test",
        client_session_id="s_test",
        timestamp=now,
    )

    assert created is True
    assert session.session_id == "s_test"
    assert session.visitor_id == "v_test"
    assert db.flushed is True


@pytest.mark.asyncio
async def test_reuses_active_session():
    now = datetime.now(timezone.utc)

    existing = Session(
        id=1,
        session_id="s_test",
        visitor_id="v_test",
        start_time=now - timedelta(minutes=5),
        end_time=now - timedelta(minutes=1),
        duration=60,
        page_count=1,
    )

    db = FakeDB(existing)

    session, created = await find_or_create_session(
        db=db,
        visitor_id="v_test",
        client_session_id="s_test",
        timestamp=now,
    )

    assert created is False
    assert session is existing
    assert session.end_time == now


@pytest.mark.asyncio
async def test_creates_new_server_session_after_timeout():
    now = datetime.now(timezone.utc)

    existing = Session(
        id=1,
        session_id="s_test",
        visitor_id="v_test",
        start_time=now - timedelta(hours=1),
        end_time=now - timedelta(minutes=31),
        duration=60,
        page_count=1,
    )

    db = FakeDB(existing)

    session, created = await find_or_create_session(
        db=db,
        visitor_id="v_test",
        client_session_id="s_test",
        timestamp=now,
    )

    assert created is True
    assert session.session_id != "s_test"
    assert session.session_id.startswith("s_")