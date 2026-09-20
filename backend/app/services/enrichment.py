from __future__ import annotations

from typing import Any

import httpx

from app.config import settings


_cache: dict[str, dict[str, str | None]] = {}


async def enrich_visitor(ip: str) -> dict[str, str | None]:
    """
    Enrich an IP address using IPInfo.
    """

    if not ip:
        return {
            "company": None,
            "country": None,
        }

    cached = _cache.get(ip)
    if cached is not None:
        return cached

    token = getattr(settings, "IPINFO_TOKEN", None)

    if not token:
        return {
            "company": None,
            "country": None,
        }

    url = f"https://ipinfo.io/{ip}"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                url,
                params={"token": token},
            )

        response.raise_for_status()

        data: dict[str, Any] = response.json()

        result = {
            "company": (
                data.get("org")
                or (data.get("company") or {}).get("name")
            ),
            "country": data.get("country"),
        }

        _cache[ip] = result

        return result

    except (httpx.HTTPError, ValueError, TypeError):
        return {
            "company": None,
            "country": None,
        }