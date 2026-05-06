from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.cache import TTLCache
from app.config import get_settings
from app.errors import AppError
from app.nasa_client import NasaClient
from app.routers import feed, health, neo


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    backend_root = Path(__file__).resolve().parent.parent
    cache_dir = (backend_root / settings.CACHE_DIR).resolve()
    cache = TTLCache(cache_dir, settings.CACHE_TTL_SECONDS)
    cache.warm_from_disk()

    client = httpx.AsyncClient(
        base_url=settings.NASA_BASE_URL.rstrip("/"),
        timeout=httpx.Timeout(30.0),
    )
    app.state.settings = settings
    app.state.cache = cache
    app.state.nasa = NasaClient(client, settings.NASA_API_KEY)

    yield

    await client.aclose()


app = FastAPI(
    title="NASA NEO Proxy",
    description="Proxy and cache for NASA Near Earth Object Web Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(_, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
    )


app.include_router(health.router, prefix="/api")
app.include_router(feed.router, prefix="/api")
app.include_router(neo.router, prefix="/api")
