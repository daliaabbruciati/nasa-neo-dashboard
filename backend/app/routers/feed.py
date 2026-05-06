from datetime import date, datetime

from fastapi import APIRouter, Request

from app.errors import AppError
from app.schemas import AsteroidSummary, CacheStats, FeedMeta, FeedResponse
from app.services import get_feed_aggregated

router = APIRouter(tags=["feed"])


def _parse_date(value: str, field: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as e:
        raise AppError(
            400,
            "INVALID_DATE",
            f"{field} must be YYYY-MM-DD.",
        ) from e


def _validate_range(start: date, end: date, max_days: int) -> None:
    if end < start:
        raise AppError(
            400,
            "INVALID_DATE",
            "end_date must be on or after start_date.",
        )
    span_days = (end - start).days + 1
    if span_days > max_days:
        raise AppError(
            400,
            "RANGE_TOO_LONG",
            f"Date range exceeds maximum of {max_days} days.",
        )


@router.get("/feed", response_model=FeedResponse)
async def feed(
    request: Request,
    start_date: str,
    end_date: str,
) -> FeedResponse:
    settings = request.app.state.settings
    start = _parse_date(start_date, "start_date")
    end = _parse_date(end_date, "end_date")
    _validate_range(start, end, settings.MAX_RANGE_DAYS)

    cache = request.app.state.cache
    nasa = request.app.state.nasa

    rows, meta = await get_feed_aggregated(
        cache,
        nasa,
        start,
        end,
        concurrency=settings.NASA_CONCURRENCY,
    )

    return FeedResponse(
        asteroids=[AsteroidSummary(**r) for r in rows],
        meta=FeedMeta(
            start_date=meta["start_date"],
            end_date=meta["end_date"],
            count=meta["count"],
            hazardous_count=meta["hazardous_count"],
            chunks=meta["chunks"],
            cache=CacheStats(**meta["cache"]),
        ),
    )
