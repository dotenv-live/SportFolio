"""
Sport management routes – CRUD for sport configurations.

Endpoints:
    POST   /sports      – create a new sport config
    GET    /sports      – list all sport configs
    GET    /sports/{id} – get a single sport config
    PUT    /sports/{id} – update a sport config
"""
from typing import Annotated, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_current_user, require_admin
from app.db.mongo import get_db
from app.models.sport import SportCreate, SportUpdate
from app.services.sport_config import sport_config_service

router = APIRouter(prefix="/sports", tags=["sports"])


def _serialize(doc: dict) -> dict:
    """Convert ObjectId fields to strings for JSON serialization."""
    doc["_id"] = str(doc["_id"])
    return doc


@router.get("/")
async def list_sports(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _user: Annotated[dict, Depends(get_current_user)],
) -> List[dict]:
    """List all sport configurations."""
    configs = await sport_config_service.get_all(db)
    return [_serialize({**c}) for c in configs]


@router.get("/{sport_id}")
async def get_sport(
    sport_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _user: Annotated[dict, Depends(get_current_user)],
):
    """Get a single sport configuration by ID."""
    config = await sport_config_service.get_by_id(db, sport_id)
    if config is None:
        raise HTTPException(status_code=404, detail="Sport config not found")
    return _serialize({**config})


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_sport(
    body: SportCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """Create a new sport configuration (admin only)."""
    data = body.model_dump()
    try:
        doc = await sport_config_service.create(db, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return _serialize(doc)


@router.put("/{sport_id}")
async def update_sport(
    sport_id: str,
    body: SportUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """Update an existing sport configuration (admin only)."""
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        doc = await sport_config_service.update(db, sport_id, update_data)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return _serialize({**doc})
