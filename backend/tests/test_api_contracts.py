from app.schemas.lead import LeadStatusUpdate
from app.schemas.stats import StatsResponse
from app.schemas.tracking import TrackBatch


def test_stats_response_contract():
    response = StatsResponse(
        totalVisitors=1,
        totalLeads=0,
        totalEvents=1,
        activeNow=1,
        leadsToday=0,
        highIntentLeads=0,
        leadsByStatus={},
        leadsByIntent={},
    )

    assert response.totalVisitors == 1
    assert response.totalEvents == 1


def test_lead_status_contract():
    payload = LeadStatusUpdate(
        status="qualified"
    )

    assert payload.status == "qualified"


def test_tracking_batch_contract():
    payload = TrackBatch(
        events=[
            {
                "type": "page_view",
                "page": "https://example.com",
                "timestamp": 1779403800000,
                "anonymous_id": "v_test",
                "session_id": "s_test",
                "metadata": {},
            }
        ]
    )

    assert len(payload.events) == 1