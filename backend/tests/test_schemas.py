import pytest
from pydantic import ValidationError

from app.schemas.tracking import TrackBatch, TrackEvent


def valid_event(**overrides):
    data = {
        "type": "page_view",
        "page": "https://example.com/",
        "timestamp": 1779403800000,
        "anonymous_id": "v_test",
        "session_id": "s_test",
        "metadata": {},
    }

    data.update(overrides)

    return data


def test_track_event_accepts_valid_payload():
    event = TrackEvent(**valid_event())

    assert event.type == "page_view"
    assert event.anonymous_id == "v_test"


def test_track_batch_accepts_up_to_50_events():
    batch = TrackBatch(
        events=[
            valid_event()
            for _ in range(50)
        ]
    )

    assert len(batch.events) == 50


def test_track_batch_rejects_more_than_50_events():
    with pytest.raises(ValidationError):
        TrackBatch(
            events=[
                valid_event()
                for _ in range(51)
            ]
        )


def test_track_event_rejects_invalid_timestamp():
    with pytest.raises(ValidationError):
        TrackEvent(
            **valid_event(timestamp=0)
        )


def test_track_event_rejects_unknown_fields():
    with pytest.raises(ValidationError):
        TrackEvent(
            **valid_event(
                extra_field="not allowed"
            )
        )