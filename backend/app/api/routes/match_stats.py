"""
Match stats routes – CRUD with flexible / dynamic stat fields.
Admin-editable, not strictly validated.
"""
from datetime import datetime, timezone
from typing import Annotated, Any, Dict, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import require_admin, get_current_user
from app.db.mongo import get_db
from app.models.match_stats import MatchStatsCreate, MatchStatsUpdate
from app.services.price_engine import recalculate_athlete_price

router = APIRouter(prefix="/match-stats", tags=["match-stats"])


@router.get("/")
async def list_match_stats(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _user: Annotated[dict, Depends(get_current_user)],
    athlete_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    query: dict = {}
    if athlete_id:
        query["athlete_id"] = ObjectId(athlete_id)
    results: List[dict] = []
    async for doc in db.match_stats.find(query).sort("match_date", -1).skip(skip).limit(limit):
        doc["_id"] = str(doc["_id"])
        doc["athlete_id"] = str(doc["athlete_id"])
        results.append(doc)
    return results


@router.get("/{stat_id}")
async def get_match_stat(
    stat_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _user: Annotated[dict, Depends(get_current_user)],
):
    doc = await db.match_stats.find_one({"_id": ObjectId(stat_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Match stat not found")
    doc["_id"] = str(doc["_id"])
    doc["athlete_id"] = str(doc["athlete_id"])
    return doc


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_match_stat(
    body: MatchStatsCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    doc = body.model_dump()
    doc["athlete_id"] = ObjectId(str(doc["athlete_id"]))
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.match_stats.insert_one(doc)

    # Trigger price recalculation after new stats
    try:
        await recalculate_athlete_price(db, doc["athlete_id"])
    except Exception:
        pass  # Non-blocking

    return {"_id": str(result.inserted_id), "status": "created"}


@router.put("/{stat_id}")
async def update_match_stat(
    stat_id: str,
    body: MatchStatsUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """
    Update match stats – allows partial updates with dynamic fields.
    Stats field is a free-form dict (not strictly validated).
    """
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Convert athlete_id if present
    if "athlete_id" in update_data:
        update_data["athlete_id"] = ObjectId(str(update_data["athlete_id"]))

    update_data["manually_updated"] = True

    result = await db.match_stats.update_one(
        {"_id": ObjectId(stat_id)},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Match stat not found")

    # Trigger price recalculation
    doc = await db.match_stats.find_one({"_id": ObjectId(stat_id)})
    if doc:
        try:
            await recalculate_athlete_price(db, doc["athlete_id"])
        except Exception:
            pass

    return {"updated": True}


@router.delete("/{stat_id}")
async def delete_match_stat(
    stat_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    result = await db.match_stats.delete_one({"_id": ObjectId(stat_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Match stat not found")
    return {"deleted": True}
