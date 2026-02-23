"""
Player routes – public listing, detail, admin CRUD.
"""
from datetime import datetime, timezone
from typing import Annotated, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_current_user, require_admin
from app.db.mongo import get_db
from app.models.player import PlayerCreate, PlayerUpdate
from app.services.price_engine import recalculate_player_price

router = APIRouter(prefix="/players", tags=["players"])


def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


@router.get("/")
async def list_players(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    sport: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    query = {}
    if sport:
        query["sport"] = sport
    cursor = db.players.find(query).skip(skip).limit(limit)
    players = []
    async for doc in cursor:
        players.append(_serialize(doc))
    return players


@router.get("/{player_id}")
async def get_player(
    player_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    doc = await db.players.find_one({"_id": ObjectId(player_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Player not found")
    return _serialize(doc)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_player(
    body: PlayerCreate,
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
    result = await db.players.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.put("/{player_id}")
async def update_player(
    player_id: str,
    body: PlayerUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    update_data = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.players.update_one(
        {"_id": ObjectId(player_id)},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"updated": True}


@router.post("/{player_id}/recalculate-price")
async def trigger_recalculate(
    player_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    pricing = await recalculate_player_price(db, player_id)
    return pricing


@router.get("/{player_id}/price-history")
async def get_price_history(
    player_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    limit: int = Query(100, ge=1, le=1000),
):
    """Return chronological price snapshots for a player."""
    cursor = (
        db.price_history.find({"player_id": ObjectId(player_id)})
        .sort("timestamp", 1)
        .limit(limit)
    )
    history: List[dict] = []
    async for doc in cursor:
        history.append({
            "price": doc["price"],
            "fundamental_value": doc.get("fundamental_value"),
            "performance_score": doc.get("performance_score"),
            "timestamp": doc["timestamp"].isoformat(),
        })
    return history
