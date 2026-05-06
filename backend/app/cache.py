from __future__ import annotations

import asyncio
import hashlib
import json
import os
import time
from collections import defaultdict
from pathlib import Path
from typing import Any


class TTLCache:
    """In-memory TTL cache with JSON file mirror and per-key asyncio locks."""

    def __init__(self, cache_dir: Path, ttl_seconds: int) -> None:
        self.cache_dir = cache_dir
        self.ttl_seconds = ttl_seconds
        self._memory: dict[str, tuple[float, Any]] = {}
        self._locks: defaultdict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

    def _path_for(self, key: str) -> Path:
        h = hashlib.sha1(key.encode("utf-8")).hexdigest()
        return self.cache_dir / f"{h}.json"

    def warm_from_disk(self) -> int:
        """Load non-expired entries from disk into memory. Returns count loaded."""
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        now = time.time()
        loaded = 0
        for path in self.cache_dir.glob("*.json"):
            if path.suffix == ".tmp" or path.name.endswith(".json.tmp"):
                continue
            try:
                with open(path, encoding="utf-8") as f:
                    envelope = json.load(f)
                exp = float(envelope["expires_at"])
                if exp <= now:
                    path.unlink(missing_ok=True)
                    continue
                key = envelope.get("key")
                if key:
                    self._memory[key] = (exp, envelope["value"])
                loaded += 1
            except (OSError, json.JSONDecodeError, KeyError, TypeError):
                continue
        return loaded

    async def get(self, key: str) -> Any | None:
        async with self._locks[key]:
            now = time.time()
            if key in self._memory:
                exp, val = self._memory[key]
                if exp > now:
                    return val
                del self._memory[key]

            path = self._path_for(key)
            if not path.exists():
                return None
            try:
                with open(path, encoding="utf-8") as f:
                    envelope = json.load(f)
                exp = float(envelope["expires_at"])
                if exp <= now:
                    path.unlink(missing_ok=True)
                    return None
                val = envelope["value"]
                self._memory[key] = (exp, val)
                return val
            except (OSError, json.JSONDecodeError, KeyError, TypeError):
                return None

    async def set(self, key: str, value: Any) -> None:
        async with self._locks[key]:
            exp = time.time() + self.ttl_seconds
            self._memory[key] = (exp, value)
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            path = self._path_for(key)
            tmp = path.with_suffix(".json.tmp")
            envelope = {"expires_at": exp, "key": key, "value": value}
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(envelope, f)
            os.replace(tmp, path)
