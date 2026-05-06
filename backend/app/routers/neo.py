from fastapi import APIRouter, Request

from app.schemas import AsteroidDetail
from app.services import get_neo_detail

router = APIRouter(tags=["neo"])


@router.get("/neo/{asteroid_id}", response_model=AsteroidDetail)
async def neo_detail(request: Request, asteroid_id: str) -> AsteroidDetail:
    cache = request.app.state.cache
    nasa = request.app.state.nasa
    raw = await get_neo_detail(cache, nasa, asteroid_id)
    return AsteroidDetail.from_nasa(raw)
