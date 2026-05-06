from __future__ import annotations

import asyncio
from datetime import date, timedelta
from typing import Any

from app.cache import TTLCache
from app.nasa_client import NasaClient


def chunk_range(start: date, end: date) -> list[tuple[date, date]]:
    """Split [start, end] into windows of at most 7 inclusive days (NASA feed limit)."""
    chunks: list[tuple[date, date]] = []
    current = start
    while current <= end:
        chunk_end = min(current + timedelta(days=6), end)
        chunks.append((current, chunk_end))
        current = chunk_end + timedelta(days=1)
    return chunks


def _normalize_feed_row(raw: dict[str, Any], approach: dict[str, Any]) -> dict[str, Any]:
    miss = approach.get("miss_distance") or {}
    vel = approach.get("relative_velocity") or {}
    est = (raw.get("estimated_diameter") or {}).get("kilometers") or {}
    try:
        miss_km = float(miss.get("kilometers", 0) or 0)
    except (TypeError, ValueError):
        miss_km = 0.0
    try:
        vel_kph = float(vel.get("kilometers_per_hour", 0) or 0)
    except (TypeError, ValueError):
        vel_kph = 0.0
    try:
        dmin = float(est.get("estimated_diameter_min", 0) or 0)
    except (TypeError, ValueError):
        dmin = 0.0
    try:
        dmax = float(est.get("estimated_diameter_max", 0) or 0)
    except (TypeError, ValueError):
        dmax = 0.0

    return {
        "id": str(raw.get("id", "")),
        "name": raw.get("name", ""),
        "nasa_jpl_url": raw.get("nasa_jpl_url") or "",
        "is_potentially_hazardous_asteroid": bool(
            raw.get("is_potentially_hazardous_asteroid", False)
        ),
        "close_approach_date_full": approach.get("close_approach_date_full") or "",
        "miss_distance_km": miss_km,
        "relative_velocity_kph": vel_kph,
        "estimated_diameter_km_min": dmin,
        "estimated_diameter_km_max": dmax,
    }


def _flatten_chunk(data: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    by_date = data.get("near_earth_objects") or {}
    for _day, asteroids in by_date.items():
        for raw in asteroids:
            approaches = raw.get("close_approach_data") or []
            if not approaches:
                continue
            approach = approaches[0]
            rows.append(_normalize_feed_row(raw, approach))
    return rows


def _dedup_best_miss(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    best: dict[str, dict[str, Any]] = {}
    for row in rows:
        iid = row["id"]
        if not iid:
            continue
        if iid not in best or row["miss_distance_km"] < best[iid]["miss_distance_km"]:
            best[iid] = row
    return list(best.values())


async def get_feed_aggregated(
    cache: TTLCache,
    nasa: NasaClient,
    start: date,
    end: date,
    *,
    concurrency: int,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    stats = {"hits": 0, "misses": 0}
    chunks = chunk_range(start, end)
    sem = asyncio.Semaphore(max(1, concurrency))

    async def fetch_one(c_start: date, c_end: date) -> dict[str, Any]:
        key = f"feed:{c_start.isoformat()}:{c_end.isoformat()}"
        cached = await cache.get(key)
        if cached is not None:
            stats["hits"] += 1
            return cached
        stats["misses"] += 1
        async with sem:
            payload = await nasa.fetch_feed(c_start, c_end)
        await cache.set(key, payload)
        return payload

    raw_chunks = await asyncio.gather(
        *[fetch_one(a, b) for a, b in chunks],
    )

    merged: list[dict[str, Any]] = []
    for payload in raw_chunks:
        merged.extend(_flatten_chunk(payload))

    asteroids = _dedup_best_miss(merged)
    asteroids.sort(key=lambda r: r["close_approach_date_full"])

    meta = {
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "count": len(asteroids),
        "hazardous_count": sum(
            1 for a in asteroids if a["is_potentially_hazardous_asteroid"]
        ),
        "chunks": len(chunks),
        "cache": {"hits": stats["hits"], "misses": stats["misses"]},
    }
    return asteroids, meta


async def get_neo_detail(
    cache: TTLCache,
    nasa: NasaClient,
    neo_id: str,
) -> dict[str, Any]:
    key = f"neo:{neo_id}"
    cached = await cache.get(key)
    if cached is not None:
        return cached
    payload = await nasa.fetch_neo(neo_id)
    await cache.set(key, payload)
    return payload
