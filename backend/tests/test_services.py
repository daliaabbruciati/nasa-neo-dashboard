from datetime import date

import httpx
import pytest

from app.cache import TTLCache
from app.nasa_client import NasaClient
from app.services import chunk_range, get_feed_aggregated


def test_chunk_range_single_window():
    start = date(2024, 1, 1)
    end = date(2024, 1, 7)
    assert chunk_range(start, end) == [(start, end)]


def test_chunk_range_splits_at_week_boundary():
    start = date(2024, 1, 1)
    end = date(2024, 1, 10)
    assert chunk_range(start, end) == [
        (date(2024, 1, 1), date(2024, 1, 7)),
        (date(2024, 1, 8), date(2024, 1, 10)),
    ]


def _sample_feed_payload() -> dict:
    return {
        "element_count": 1,
        "near_earth_objects": {
            "2024-01-01": [
                {
                    "id": "2000999",
                    "name": "Test Asteroid (FAKE)",
                    "nasa_jpl_url": "https://example.jpl.nasa.gov/",
                    "is_potentially_hazardous_asteroid": False,
                    "estimated_diameter": {
                        "kilometers": {
                            "estimated_diameter_min": 0.05,
                            "estimated_diameter_max": 0.1,
                        }
                    },
                    "close_approach_data": [
                        {
                            "close_approach_date_full": "2024-Jan-01 00:00",
                            "miss_distance": {"kilometers": "1500000"},
                            "relative_velocity": {"kilometers_per_hour": "25000"},
                        }
                    ],
                }
            ]
        },
    }


@pytest.mark.asyncio
async def test_feed_cache_second_request_does_not_hit_transport(tmp_path):
    payload = _sample_feed_payload()
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(200, json=payload)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="https://api.nasa.gov/neo/rest/v1",
    ) as client:
        nasa = NasaClient(client, "DEMO_KEY")
        cache = TTLCache(tmp_path, ttl_seconds=3600)
        start, end = date(2024, 1, 1), date(2024, 1, 7)
        await get_feed_aggregated(cache, nasa, start, end, concurrency=2)
        await get_feed_aggregated(cache, nasa, start, end, concurrency=2)

    assert calls["n"] == 1
