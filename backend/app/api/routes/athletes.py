"""
Athlete routes – public listing, detail, admin CRUD.
"""
from datetime import datetime, timezone
from typing import Annotated, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_current_user, require_admin
from app.db.mongo import get_db
from app.models.athlete import AthleteCreate, AthleteUpdate
from app.services.price_engine import recalculate_athlete_price

router = APIRouter(prefix="/athletes", tags=["athletes"])


def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


@router.get("/")
async def list_athletes(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    sport: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    query = {}
    if sport:
        query["sport"] = sport
    cursor = db.athletes.find(query).skip(skip).limit(limit)
    athletes = []
    async for doc in cursor:
        athletes.append(_serialize(doc))
    return athletes


@router.get("/{athlete_id}")
async def get_athlete(
    athlete_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    doc = await db.athletes.find_one({"_id": ObjectId(athlete_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return _serialize(doc)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_athlete(
    body: AthleteCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    doc = body.model_dump()
    doc["fundamental_value"] = doc["base_value"]
    doc["current_price"] = doc["base_value"]
    doc["liquidity_pool_balance"] = 0.0
    doc["circulating_shares"] = 0.0
    doc["buy_volume"] = 0.0
    doc["sell_volume"] = 0.0
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.athletes.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.put("/{athlete_id}")
async def update_athlete(
    athlete_id: str,
    body: AthleteUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    update_data = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.athletes.update_one(
        {"_id": ObjectId(athlete_id)},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return {"updated": True}


@router.post("/{athlete_id}/recalculate-price")
async def trigger_recalculate(
    athlete_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    pricing = await recalculate_athlete_price(db, athlete_id)
    return pricing
