"""
Admin routes – liquidity adjustment, AI score override, dividend accrual, retraining.
"""
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.api.deps import require_admin
from app.db.mongo import get_db
from app.ai.predictor import ai_predictor
from app.ai.model_resolver import ml_model_resolver
from app.services.dividend_engine import accrue_dividends_all, accrue_dividends_for_athlete
from app.services.price_engine import recalculate_athlete_price
from app.services.sport_config import sport_config_service

router = APIRouter(prefix="/admin", tags=["admin"])


class LiquidityAdjust(BaseModel):
    athlete_id: str
    amount: float  # positive = add, negative = remove


class AIScoreOverride(BaseModel):
    athlete_id: str
    ai_score: float


@router.post("/liquidity/adjust")
async def adjust_liquidity(
    body: LiquidityAdjust,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    result = await db.athletes.update_one(
        {"_id": ObjectId(body.athlete_id)},
        {"$inc": {"liquidity_pool_balance": body.amount}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Athlete not found")
    athlete = await db.athletes.find_one({"_id": ObjectId(body.athlete_id)})
    return {"liquidity_pool_balance": athlete["liquidity_pool_balance"]}


@router.post("/ai-score/override")
async def override_ai_score(
    body: AIScoreOverride,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    result = await db.athletes.update_one(
        {"_id": ObjectId(body.athlete_id)},
        {"$set": {"ai_score": body.ai_score}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Athlete not found")
    pricing = await recalculate_athlete_price(db, body.athlete_id)
    return {"ai_score": body.ai_score, **pricing}


@router.post("/dividends/accrue-all")
async def trigger_accrue_all(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    result = await accrue_dividends_all(db)
    return result


@router.post("/dividends/accrue/{athlete_id}")
async def trigger_accrue_athlete(
    athlete_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    count = await accrue_dividends_for_athlete(db, athlete_id)
    return {"holdings_updated": count}


@router.post("/ai/retrain")
async def retrain_ai(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """Trigger AI model retraining per sport (sport-isolated)."""
    results = {}
    sports = await db.athletes.distinct("sport")
    for sport_name in sports:
        athlete_ids = []
        async for athlete in db.athletes.find({"sport": sport_name}):
            athlete_ids.append(athlete["_id"])
        sport_stats = []
        for aid in athlete_ids:
            async for stat in db.match_stats.find({"athlete_id": aid}):
                sport_stats.append(stat)
        if sport_stats:
            results[sport_name] = ml_model_resolver.retrain(sport_name, sport_stats)
    return results


@router.post("/ai/retrain/{athlete_id}")
async def retrain_ai_for_athlete(
    athlete_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """Retrain AI and update athlete's ai_score (sport-aware)."""
    athlete = await db.athletes.find_one({"_id": ObjectId(athlete_id)})
    if athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")

    stats = []
    async for stat in db.match_stats.find({"athlete_id": ObjectId(athlete_id)}):
        stats.append(stat)
    if not stats:
        raise HTTPException(status_code=400, detail="No match stats available for retraining")

    sport_name = athlete.get("sport", "")
    ml_model_resolver.retrain(sport_name, stats)

    sport_config = await sport_config_service.get_by_name(db, sport_name)
    ai_weights = sport_config.get("ai_weights") if sport_config else None
    new_score = ml_model_resolver.compute_ai_score(sport_name, ai_weights, stats)

    await db.athletes.update_one(
        {"_id": ObjectId(athlete_id)},
        {"$set": {"ai_score": new_score}},
    )
    pricing = await recalculate_athlete_price(db, athlete_id)
    return {"ai_score": new_score, "sport": sport_name, **pricing}


@router.post("/price/recalculate-all")
async def recalculate_all_prices(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """Recalculate prices for all athletes."""
    results = []
    async for athlete in db.athletes.find():
        try:
            pricing = await recalculate_athlete_price(db, athlete["_id"])
            results.append({"athlete_id": str(athlete["_id"]), **pricing})
        except Exception as e:
            results.append({"athlete_id": str(athlete["_id"]), "error": str(e)})
    return results


@router.post("/liquidity/audit")
async def audit_liquidity(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """Audit liquidity pools across all athletes."""
    audit = []
    async for athlete in db.athletes.find():
        total_income_distributed = 0.0
        async for ev in db.income_events.find({"athlete_id": athlete["_id"], "distributed": True}):
            total_income_distributed += ev.get("liquidity_add", 0.0)

        # Total sold via buyback
        total_buyback = 0.0
        async for txn in db.transactions.find({"athlete_id": athlete["_id"], "type": "liquidity_buyback"}):
            total_buyback += txn["price"] * txn["shares"]

        expected_balance = total_income_distributed - total_buyback
        actual_balance = athlete.get("liquidity_pool_balance", 0.0)
        audit.append({
            "athlete_id": str(athlete["_id"]),
            "name": athlete["name"],
            "expected_balance": round(expected_balance, 6),
            "actual_balance": round(actual_balance, 6),
            "discrepancy": round(actual_balance - expected_balance, 6),
        })
    return audit
