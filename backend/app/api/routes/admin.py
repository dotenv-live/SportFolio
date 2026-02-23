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
from app.services.dividend_engine import accrue_dividends_all, accrue_dividends_for_player
from app.services.price_engine import recalculate_player_price
from app.services.sport_config import sport_config_service

router = APIRouter(prefix="/admin", tags=["admin"])


class LiquidityAdjust(BaseModel):
    player_id: str
    amount: float  # positive = add, negative = remove


class AIScoreOverride(BaseModel):
    player_id: str
    ai_score: float


@router.post("/liquidity/adjust")
async def adjust_liquidity(
    body: LiquidityAdjust,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    result = await db.players.update_one(
        {"_id": ObjectId(body.player_id)},
        {"$inc": {"liquidity_pool_balance": body.amount}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    player = await db.players.find_one({"_id": ObjectId(body.player_id)})
    return {"liquidity_pool_balance": player["liquidity_pool_balance"]}


@router.post("/ai-score/override")
async def override_ai_score(
    body: AIScoreOverride,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    result = await db.players.update_one(
        {"_id": ObjectId(body.player_id)},
        {"$set": {"ai_score": body.ai_score}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    pricing = await recalculate_player_price(db, body.player_id)
    return {"ai_score": body.ai_score, **pricing}


@router.post("/dividends/accrue-all")
async def trigger_accrue_all(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    result = await accrue_dividends_all(db)
    return result


@router.post("/dividends/accrue/{player_id}")
async def trigger_accrue_player(
    player_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    count = await accrue_dividends_for_player(db, player_id)
    return {"holdings_updated": count}


@router.post("/ai/retrain")
async def retrain_ai(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """Trigger AI model retraining per sport (sport-isolated)."""
    results = {}
    sports = await db.players.distinct("sport")
    for sport_name in sports:
        player_ids = []
        async for player in db.players.find({"sport": sport_name}):
            player_ids.append(player["_id"])
        sport_stats = []
        for pid in player_ids:
            async for stat in db.player_matches.find({"player_id": pid}):
                sport_stats.append(stat)
        if sport_stats:
            results[sport_name] = ml_model_resolver.retrain(sport_name, sport_stats)
    return results


@router.post("/ai/retrain/{player_id}")
async def retrain_ai_for_player(
    player_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """Retrain AI and update player's ai_score (sport-aware)."""
    player = await db.players.find_one({"_id": ObjectId(player_id)})
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    stats = []
    async for stat in db.player_matches.find({"player_id": ObjectId(player_id)}):
        stats.append(stat)
    if not stats:
        raise HTTPException(status_code=400, detail="No match stats available for retraining")

    sport_name = player.get("sport", "")
    ml_model_resolver.retrain(sport_name, stats)

    sport_config = await sport_config_service.get_by_name(db, sport_name)
    ai_weights = sport_config.get("ai_weights") if sport_config else None
    new_score = ml_model_resolver.compute_ai_score(sport_name, ai_weights, stats)

    await db.players.update_one(
        {"_id": ObjectId(player_id)},
        {"$set": {"ai_score": new_score}},
    )
    pricing = await recalculate_player_price(db, player_id)
    return {"ai_score": new_score, "sport": sport_name, **pricing}


@router.post("/price/recalculate-all")
async def recalculate_all_prices(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """Recalculate prices for all players."""
    results = []
    async for player in db.players.find():
        try:
            pricing = await recalculate_player_price(db, player["_id"])
            results.append({"player_id": str(player["_id"]), **pricing})
        except Exception as e:
            results.append({"player_id": str(player["_id"]), "error": str(e)})
    return results


@router.post("/liquidity/audit")
async def audit_liquidity(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """Audit liquidity pools across all players."""
    audit = []
    async for player in db.players.find():
        total_income_distributed = 0.0
        async for ev in db.income_events.find({"player_id": player["_id"], "distributed": True}):
            total_income_distributed += ev.get("liquidity_add", 0.0)

        # Total sold via buyback
        total_buyback = 0.0
        async for txn in db.transactions.find({"player_id": player["_id"], "type": "liquidity_buyback"}):
            total_buyback += txn["price"] * txn["shares"]

        expected_balance = total_income_distributed - total_buyback
        actual_balance = player.get("liquidity_pool_balance", 0.0)
        audit.append({
            "player_id": str(player["_id"]),
            "name": player["name"],
            "expected_balance": round(expected_balance, 6),
            "actual_balance": round(actual_balance, 6),
            "discrepancy": round(actual_balance - expected_balance, 6),
        })
    return audit
