from __future__ import annotations

from datetime import date
from typing import Any

import httpx

from app.errors import AppError


class NasaClient:
    def __init__(self, client: httpx.AsyncClient, api_key: str) -> None:
        self._client = client
        self._api_key = api_key

    async def fetch_feed(self, start: date, end: date) -> dict[str, Any]:
        params = {
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "api_key": self._api_key,
        }
        return await self._request("GET", "/feed", params=params)

    async def fetch_neo(self, neo_id: str) -> dict[str, Any]:
        params = {"api_key": self._api_key}
        return await self._request("GET", f"/neo/{neo_id}", params=params)

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        try:
            r = await self._client.request(method, path, params=params)
        except httpx.RequestError as e:
            raise AppError(
                502,
                "UPSTREAM_ERROR",
                f"Could not reach NASA API: {e!s}",
            ) from e

        if r.status_code == 429:
            retry_after = r.headers.get("Retry-After")
            msg = "NASA rate limit reached. Try again later or use your own API key."
            if retry_after:
                msg += f" Retry-After: {retry_after}s."
            raise AppError(429, "RATE_LIMITED", msg)

        if r.status_code >= 500:
            raise AppError(
                502,
                "UPSTREAM_ERROR",
                f"NASA returned server error {r.status_code}.",
            )

        if r.status_code == 404:
            raise AppError(404, "NOT_FOUND", "Asteroid not found.")

        if r.status_code >= 400:
            try:
                body = r.json()
                err = body.get("error_message") or body.get("error", {}).get("message")
            except Exception:
                err = r.text[:200]
            raise AppError(
                502,
                "UPSTREAM_ERROR",
                err or f"NASA returned {r.status_code}",
            )

        try:
            return r.json()
        except ValueError as e:
            raise AppError(
                502,
                "UPSTREAM_ERROR",
                "Invalid JSON from NASA API.",
            ) from e
