import pytest

from app.services import enrichment


@pytest.mark.asyncio
async def test_enrichment_without_token_returns_empty(
    monkeypatch,
):
    monkeypatch.setattr(
        enrichment.settings,
        "IPINFO_TOKEN",
        None,
    )

    result = await enrichment.enrich_visitor(
        "8.8.8.8"
    )

    assert result == {
        "company": None,
        "country": None,
    }


@pytest.mark.asyncio
async def test_empty_ip_returns_empty():
    result = await enrichment.enrich_visitor("")

    assert result == {
        "company": None,
        "country": None,
    }