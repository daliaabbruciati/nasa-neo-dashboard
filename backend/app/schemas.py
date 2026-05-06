from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CacheStats(BaseModel):
    hits: int
    misses: int


class FeedMeta(BaseModel):
    start_date: str
    end_date: str
    count: int
    hazardous_count: int
    chunks: int
    cache: CacheStats


class AsteroidSummary(BaseModel):
    id: str
    name: str
    nasa_jpl_url: str
    is_potentially_hazardous_asteroid: bool
    close_approach_date_full: str
    miss_distance_km: float
    relative_velocity_kph: float
    estimated_diameter_km_min: float
    estimated_diameter_km_max: float


class FeedResponse(BaseModel):
    asteroids: list[AsteroidSummary]
    meta: FeedMeta


class AsteroidDetail(BaseModel):
    """Subset + passthrough fields from NASA /neo/{id} response."""

    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    nasa_jpl_url: str | None = None
    absolute_magnitude_h: float | None = None
    is_potentially_hazardous_asteroid: bool = False
    estimated_diameter: dict[str, Any] = Field(default_factory=dict)
    orbital_data: dict[str, Any] | None = None
    close_approach_data: list[dict[str, Any]] = Field(default_factory=list)

    @classmethod
    def from_nasa(cls, raw: dict[str, Any]) -> AsteroidDetail:
        return cls(
            id=str(raw.get("id", "")),
            name=raw.get("name", ""),
            nasa_jpl_url=raw.get("nasa_jpl_url"),
            absolute_magnitude_h=_to_float(raw.get("absolute_magnitude_h")),
            is_potentially_hazardous_asteroid=bool(
                raw.get("is_potentially_hazardous_asteroid", False)
            ),
            estimated_diameter=raw.get("estimated_diameter") or {},
            orbital_data=raw.get("orbital_data"),
            close_approach_data=list(raw.get("close_approach_data") or []),
        )


def _to_float(v: Any) -> float | None:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


class HealthResponse(BaseModel):
    status: str = "ok"
