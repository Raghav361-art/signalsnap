import pytest
from datetime import datetime, timedelta, timezone

from app.models.event import Event
from app.models.session import Session
from app.models.visitor import Visitor
from app.services.scoring import calculate_intent_score


class FakeResult:
    def __init__(self, values):
        self.values = values

    def scalars(self):
        return self

    def all(self):
        return self.values

    def scalar_one_or_none(self):
        if self.values:
            return self.values[0]

        return None


class FakeDB:
    def __init__(self, events, sessions, visitor):
        self.events = events
        self.sessions = sessions
        self.visitor = visitor

    async def execute(self, statement):
        sql = str(statement)

        if "FROM events" in sql:
            return FakeResult(self.events)

        if "FROM sessions" in sql:
            return FakeResult(self.sessions)

        if "FROM visitors" in sql:
            if self.visitor:
                return FakeResult([self.visitor])

            return FakeResult([])

        raise AssertionError(
            f"Unexpected query: {sql}"
        )


def make_event(
    page,
    timestamp,
    event_type="page_view",
):
    return Event(
        id=None,
        visitor_id="v_test",
        session_id="s_test",
        type=event_type,
        page=page,
        timestamp=timestamp,
        metadata_={},
    )


@pytest.mark.asyncio
async def test_pricing_page_adds_10_points():
    now = datetime.now(timezone.utc)

    db = FakeDB(
        events=[
            make_event(
                "https://example.com/pricing",
                now,
            )
        ],
        sessions=[],
        visitor=Visitor(
            anonymous_id="v_test",
            first_seen=now,
            last_seen=now,
        ),
    )

    result = await calculate_intent_score(
        db,
        "v_test",
    )

    assert result["score"] >= 10

    assert (
        result["breakdown"]["visited_pricing_page"]
        == 10
    )


@pytest.mark.asyncio
async def test_three_unique_pages_add_six_points():
    now = datetime.now(timezone.utc)

    events = [
        make_event(
            "https://example.com/",
            now,
        ),
        make_event(
            "https://example.com/features",
            now + timedelta(seconds=1),
        ),
        make_event(
            "https://example.com/pricing",
            now + timedelta(seconds=2),
        ),
    ]

    db = FakeDB(
        events=events,
        sessions=[],
        visitor=Visitor(
            anonymous_id="v_test",
            first_seen=now,
            last_seen=now,
        ),
    )

    result = await calculate_intent_score(
        db,
        "v_test",
    )

    assert result["breakdown"]["unique_pages"] == 6


@pytest.mark.asyncio
async def test_returning_visitor_adds_eight_points():
    now = datetime.now(timezone.utc)

    sessions = [
        Session(
            session_id="s1",
            visitor_id="v_test",
            start_time=now,
            duration=0,
            page_count=1,
        ),
        Session(
            session_id="s2",
            visitor_id="v_test",
            start_time=now,
            duration=0,
            page_count=1,
        ),
    ]

    db = FakeDB(
        events=[],
        sessions=sessions,
        visitor=Visitor(
            anonymous_id="v_test",
            first_seen=now,
            last_seen=now,
        ),
    )

    result = await calculate_intent_score(
        db,
        "v_test",
    )

    assert (
        result["breakdown"]["returning_visitor"]
        == 8
    )