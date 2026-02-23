"""
Income event routes – admin adds verified income, triggers distribution.
"""
from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import require_admin
from app.db.mongo import get_db
from app.models.income_event import IncomeEventCreate
from app.services.dividend_engine import distribute_income_event

router = APIRouter(prefix="/income", tags=["income"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_income_event(
    body: IncomeEventCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    doc = body.model_dump()
    doc["distributed"] = False
    doc["athlete_id"] = ObjectId(str(doc["athlete_id"]))
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.income_events.insert_one(doc)
    return {"_id": str(result.inserted_id), "status": "created"}


@router.post("/{event_id}/distribute")
async def distribute(
    event_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    try:
        result = await distribute_income_event(db, event_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/")
async def list_income_events(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
    athlete_id: str | None = None,
):
    query: dict = {}
    if athlete_id:
        query["athlete_id"] = ObjectId(athlete_id)
    events = []
    async for ev in db.income_events.find(query).sort("income_date", -1):
        ev["_id"] = str(ev["_id"])
        ev["athlete_id"] = str(ev["athlete_id"])
        events.append(ev)
    return events
