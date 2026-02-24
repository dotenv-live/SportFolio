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


# ── Simulate Match ────────────────────────────────────────────────


class SimulateMatch(BaseModel):
    player_id: str
    quality: str  # "excellent" or "terrible"


_CRICKET_TEMPLATES = {
    "excellent": {
        "batting_stats": {
            "runs": 120, "balls_faced": 55, "strike_rate": 218.18,
            "fours": 12, "sixes": 7, "average": 120.0, "not_out": True,
        },
        "bowling_stats": {
            "wickets": 4, "overs": 4.0, "runs_conceded": 18,
            "economy": 4.5, "average": 4.5, "strike_rate": 6.0,
            "wides": 0, "no_balls": 0,
        },
        "fielding_stats": {"catches": 3, "run_outs": 1},
        "match_result": "won",
        "competition": "Admin Simulated – Excellent",
    },
    "terrible": {
        "batting_stats": {
            "runs": 2, "balls_faced": 8, "strike_rate": 25.0,
            "fours": 0, "sixes": 0, "average": 2.0, "not_out": False,
        },
        "bowling_stats": {
            "wickets": 0, "overs": 3.0, "runs_conceded": 48,
            "economy": 16.0, "average": 0.0, "strike_rate": 0.0,
            "wides": 4, "no_balls": 2,
        },
        "fielding_stats": {"catches": 0, "run_outs": 0},
        "match_result": "lost",
        "competition": "Admin Simulated – Terrible",
    },
}

# Swimming and wrestling templates are built dynamically from the player's data
# to avoid minmax normalization issues with outlier values.


async def _build_swimming_stats(db, player_id, quality: str) -> dict:
    """Build swimming match stats relative to the player's existing data."""
    from app.services.metric_normalizer import resolve_dotpath, safe_float

    fina_vals = []
    time_vals = []
    rank_vals = []
    events = []

    async for m in db.player_matches.find({"player_id": player_id}).sort("date", -1).limit(50):
        stats = m.get("stats", {})
        fina = safe_float(resolve_dotpath(stats, "performance.fina_points"))
        time_ms = safe_float(resolve_dotpath(stats, "performance.time_ms"))
        rank = safe_float(resolve_dotpath(stats, "performance.rank"))
        if fina > 0:
            fina_vals.append(fina)
        if time_ms > 0:
            time_vals.append(time_ms)
        if rank > 0:
            rank_vals.append(rank)
        ev = stats.get("event") or stats.get("competition_label", "Race")
        if ev not in events:
            events.append(ev)

    # Use player's best/worst as reference
    if quality == "excellent":
        fina = max(fina_vals) if fina_vals else 850
        time_ms = min(time_vals) if time_vals else 50000
        rank = 1
        # Slightly better than their best
        fina = int(fina * 1.02)
        time_ms = int(time_ms * 0.98)
        label = "Admin Simulated – Excellent"
        result = "Gold"
    else:
        fina = min(fina_vals) if fina_vals else 500
        time_ms = max(time_vals) if time_vals else 120000
        rank = max(rank_vals) if rank_vals else 8
        # Slightly worse than their worst
        fina = int(fina * 0.90)
        time_ms = int(time_ms * 1.05)
        rank = int(rank + 2)
        label = "Admin Simulated – Terrible"
        result = "DNS"

    event = events[0] if events else "100m Freestyle"
    return {
        "event": event,
        "competition_label": label,
        "performance": {
            "time_ms": time_ms,
            "rank": rank,
            "fina_points": fina,
            "result": result,
        },
    }


async def _build_wrestling_stats(db, player_id, quality: str) -> dict:
    """Build wrestling match stats relative to the player's existing data."""
    from app.services.metric_normalizer import resolve_dotpath, safe_float

    pts_scored = []
    pts_conceded = []

    async for m in db.player_matches.find({"player_id": player_id}).sort("date", -1).limit(50):
        stats = m.get("stats", {})
        sc = safe_float(resolve_dotpath(stats, "performance.technical_points_scored"))
        co = safe_float(resolve_dotpath(stats, "performance.technical_points_conceded"))
        pts_scored.append(sc)
        pts_conceded.append(co)

    if quality == "excellent":
        scored = max(pts_scored) if pts_scored else 10
        conceded = min(pts_conceded) if pts_conceded else 0
        # Slightly better
        scored = int(scored * 1.1) + 1
        return {
            "match_type": "Final",
            "opponent_name": "Opponent",
            "competition_label": "Admin Simulated – Excellent",
            "performance": {
                "result": "Win",
                "technical_points_scored": scored,
                "technical_points_conceded": int(conceded),
                "status": "VSU",
            },
        }
    else:
        scored = min(pts_scored) if pts_scored else 0
        conceded = max(pts_conceded) if pts_conceded else 10
        # Slightly worse
        conceded = int(conceded * 1.1) + 1
        return {
            "match_type": "Qualification",
            "opponent_name": "Opponent",
            "competition_label": "Admin Simulated – Terrible",
            "performance": {
                "result": "Loss",
                "technical_points_scored": int(scored),
                "technical_points_conceded": conceded,
                "status": "VSU",
            },
        }


def _template_for(sport: str, quality: str) -> dict:
    """Return static template for cricket. Swimming/wrestling use dynamic builders."""
    return _CRICKET_TEMPLATES.get(quality, _CRICKET_TEMPLATES["excellent"])


@router.post("/simulate-match")
async def simulate_match(
    body: SimulateMatch,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    _admin: Annotated[dict, Depends(require_admin)],
):
    """
    Insert a synthetic match (excellent / terrible) for a player,
    run the full scoring + pricing pipeline, return before/after deltas.
    """
    from datetime import datetime, timezone

    pid = ObjectId(body.player_id)
    quality = body.quality.lower()
    if quality not in ("excellent", "terrible"):
        raise HTTPException(status_code=400, detail="quality must be 'excellent' or 'terrible'")

    player = await db.players.find_one({"_id": pid})
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    sport = player.get("sport", "Cricket")

    # ── Snapshot before ───────────────────────────────────────────
    before = {
        "current_price": player.get("current_price", 0),
        "fundamental_value": player.get("fundamental_value", 0),
        "performance_score": player.get("performance_score", 0),
    }

    # ── Build and insert match ────────────────────────────────────
    match_count = await db.player_matches.count_documents({"player_id": pid})
    sport_lower = sport.lower()

    if sport_lower == "swimming":
        stats = await _build_swimming_stats(db, pid, quality)
    elif sport_lower == "wrestling":
        stats = await _build_wrestling_stats(db, pid, quality)
    else:
        stats = _template_for(sport, quality)
        # Inject match count for cricket templates
        if sport_lower == "cricket":
            for key in ("batting_stats", "bowling_stats"):
                if key in stats:
                    stats[key]["matches"] = match_count + 1

    new_match = {
        "player_id": pid,
        "match_id": f"SIM-{quality.upper()}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "stats": stats,
        "ingested_at": datetime.now(timezone.utc),
        "simulated": True,
    }
    result = await db.player_matches.insert_one(new_match)

    # ── Run sport-specific scoring pipeline ───────────────────────
    player_fresh = await db.players.find_one({"_id": pid})

    if sport_lower == "cricket":
        from app.services.cricket_performance import compute_all_scores as cricket_scores
        scores = await cricket_scores(db, player_fresh)
    elif sport_lower == "swimming":
        from app.services.swimming_performance import compute_all_scores as swimming_scores
        scores = await swimming_scores(db, player_fresh)
    elif sport_lower == "wrestling":
        from app.services.wrestling_performance import compute_all_scores as wrestling_scores
        scores = await wrestling_scores(db, player_fresh)
    else:
        from app.services.cricket_performance import compute_all_scores as default_scores
        scores = await default_scores(db, player_fresh)

    await db.players.update_one(
        {"_id": pid},
        {"$set": {
            "performance_score": scores.performance_score,
            "ai_score": scores.ai,
            "consistency_score": scores.consistency,
            "growth_score": scores.growth,
            "fitness_score": scores.fitness,
            "actual_score": scores.actual,
            "last_updated": datetime.now(timezone.utc),
        }},
    )

    pricing = await recalculate_player_price(db, pid)

    # ── Snapshot after ────────────────────────────────────────────
    after = {
        "current_price": pricing["current_price"],
        "fundamental_value": pricing["fundamental_value"],
        "performance_score": pricing["performance_score"],
    }

    return {
        "player_id": body.player_id,
        "player_name": player["name"],
        "sport": sport,
        "quality": quality,
        "match_id": str(result.inserted_id),
        "before": before,
        "after": after,
        "deltas": {
            k: round(after[k] - before[k], 4) for k in before
        },
    }

