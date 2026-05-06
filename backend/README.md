# NASA NEO — FastAPI backend

Proxy for [NASA NeoWs](https://api.nasa.gov/) with TTL caching (memory + JSON files under `CACHE_DIR`).

## Setup

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness |
| GET | `/api/feed?start_date=&end_date=` | Aggregated feed for a range (chunked ≤7 days per NASA call, cached per chunk) |
| GET | `/api/neo/{id}` | Single asteroid detail (cached) |

Errors return JSON: `{"detail": "...", "code": "..."}`.

## Tests

```bash
pytest
```
