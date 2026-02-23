"""
Player match routes – CRUD with flexible / dynamic stat fields.
Admin-editable, not strictly validated.
Sport-aware metric validation (soft): unknown keys are kept, missing sport keys → warning.
"""
from datetime import datetime, timezone
from typing import Annotated, Any, Dict, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import require_admin, get_current_user
from app.db.mongo import get_db
from app.models.player_match import PlayerMatchCreate, PlayerMatchUpdate
from app.services.price_engine import recalculate_player_price
from app.services.sport_config import sport_config_service

router = APIRouter(prefix="/player-matches", tags=["player-matches"])


async def _validate_stats_against_sport(
    db: AsyncIOMotorDatabase,
    player_id: ObjectId,
    stats: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Soft-validate stat keys against the player's sport config.
    Returns a dict with recognized keys, extra keys, and missing keys.
    Does NOT raise – unknown keys are kept, missing keys are noted.
    """
    player = await db.players.find_one({"_id": player_id})
    if player is None:
        return {"validation": "player_not_found"}

    sport_name = player.get("sport", "")
    sport_config = await sport_config_service.get_by_name(db, sport_name)
    if sport_config is None:
        return {"validation": "no_sport_config", "sport": sport_name}

    defined_keys = {m["key"] for m in sport_config.get("metrics", [])}
    provided_keys = set(stats.keys())

    return {
        "validation": "ok",
        "sport": sport_name,
        "recognized": sorted(provided_keys & defined_keys),
        "extra": sorted(provided_keys - defined_keys),
        "missing": sorted(defined_keys - provided_keys),
    }


@router.get("/")
async def list_player_matches(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _user: Annotated[dict, Depends(get_current_user)],
    player_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    query: dict = {}
    if player_id:
        query["player_id"] = ObjectId(player_id)
    results: List[dict] = []
    async for doc in db.player_matches.find(query).sort("date", -1).skip(skip).limit(limit):
        doc["_id"] = str(doc["_id"])
        doc["player_id"] = str(doc["player_id"])
        results.append(doc)
    return results


@router.get("/{stat_id}")
async def get_player_match(
    stat_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _user: Annotated[dict, Depends(get_current_user)],
):
    doc = await db.player_matches.find_one({"_id": ObjectId(stat_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Player match not found")
    doc["_id"] = str(doc["_id"])
    doc["player_id"] = str(doc["player_id"])
    return doc


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_player_match(
    body: PlayerMatchCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    doc = body.model_dump()
    doc["player_id"] = ObjectId(str(doc["player_id"]))
    if doc.get("ingested_at") is None:
        doc["ingested_at"] = datetime.now(timezone.utc)

    # Soft sport-aware metric validation
    validation = await _validate_stats_against_sport(db, doc["player_id"], doc.get("stats", {}))

    result = await db.player_matches.insert_one(doc)

    # Trigger price recalculation after new stats
    try:
        await recalculate_player_price(db, doc["player_id"])
    except Exception:
        pass  # Non-blocking

    return {
        "_id": str(result.inserted_id),
        "status": "created",
        "metric_validation": validation,
    }


@router.put("/{stat_id}")
async def update_player_match(
    stat_id: str,
    body: PlayerMatchUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """
    Update player match – allows partial updates with dynamic fields.
    Stats field is a free-form dict (not strictly validated).
    """
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.player_matches.update_one(
        {"_id": ObjectId(stat_id)},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Player match not found")

    # Trigger price recalculation
    doc = await db.player_matches.find_one({"_id": ObjectId(stat_id)})
    if doc:
        try:
            await recalculate_player_price(db, doc["player_id"])
        except Exception:
            pass

    return {"updated": True}


@router.delete("/{stat_id}")
async def delete_player_match(
    stat_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    result = await db.player_matches.delete_one({"_id": ObjectId(stat_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Player match not found")
    return {"deleted": True}
