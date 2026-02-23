"""
Price Engine – implements the full pricing model.

Formulas:
    Performance Score (PS) = weighted combination of:
        actual_score, consistency, growth, fitness, ai_score

    AI Score = weighted XGBoost + LSTM output (computed by AIPredictor)

    Fundamental Value:
        FV = base_value * (1 + alpha * PS)

    Demand Impact:
        float_shares = circulating_shares (shares held by investors)
        DI = 1 + beta * ((buy_volume - sell_volume) / float_shares)

    Raw Price:
        P = FV * DI

    Smoothed Price:
        P_final = eta * P_new + (1 - eta) * P_old

All parameters are stored per player and configurable.
"""
from typing import Any, Dict

from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.config import get_settings
from app.services.performance_engine import hybrid_performance_service
from app.services.sport_config import sport_config_service
from app.ai.model_resolver import ml_model_resolver

# ---------- Performance Score Weights ----------
W_ACTUAL_SCORE = 0.30
W_CONSISTENCY = 0.20
W_GROWTH = 0.15
W_FITNESS = 0.10
W_AI_SCORE = 0.25


def compute_performance_score(
    actual_score: float,
    consistency: float,
    growth: float,
    fitness: float,
    ai_score: float,
) -> float:
    """
    PS = w1*actual + w2*consistency + w3*growth + w4*fitness + w5*ai_score
    All inputs expected in [0, 1]; output clipped to [0, 1].
    """
    ps = (
        W_ACTUAL_SCORE * actual_score
        + W_CONSISTENCY * consistency
        + W_GROWTH * growth
        + W_FITNESS * fitness
        + W_AI_SCORE * ai_score
    )
    return max(0.0, min(1.0, ps))


def compute_fundamental_value(base_value: float, alpha: float, ps: float) -> float:
    """FV = B * (1 + alpha * PS)"""
    return base_value * (1.0 + alpha * ps)


def compute_demand_impact(
    beta: float,
    buy_volume: float,
    sell_volume: float,
    float_shares: float,
) -> float:
    """DI = 1 + beta * ((buy_vol - sell_vol) / float_shares)"""
    if float_shares <= 0:
        return 1.0
    return 1.0 + beta * ((buy_volume - sell_volume) / float_shares)


def compute_raw_price(fv: float, di: float) -> float:
    """P = FV * DI"""
    return max(0.01, fv * di)


def smooth_price(p_new: float, p_old: float, eta: float | None = None) -> float:
    """P_final = eta * P_new + (1 - eta) * P_old"""
    if eta is None:
        eta = get_settings().price_smoothing_eta
    return eta * p_new + (1.0 - eta) * p_old


async def recalculate_player_price(
    db: AsyncIOMotorDatabase,
    player_id: str | ObjectId,
) -> Dict[str, Any]:
    """
    Full price recalculation pipeline for a single player.
    Reads current doc, computes FV, DI, raw P, applies smoothing, persists.
    Returns updated pricing fields.
    """
    if isinstance(player_id, str):
        player_id = ObjectId(player_id)

    doc = await db.players.find_one({"_id": player_id})
    if doc is None:
        raise ValueError(f"Player {player_id} not found")

    # --- Derive sub-scores from latest match stats if available ---
    latest_stat = await db.player_matches.find_one(
        {"player_id": player_id},
        sort=[("date", -1)],
    )

    # --- Sport-dynamic AI score ---
    ai_score = doc.get("ai_score", 0.0)
    sport_name = doc.get("sport", "")
    sport_config = await sport_config_service.get_by_name(db, sport_name)
    if sport_config is not None:
        # Recompute AI = λ₁·XGB + λ₂·LSTM using sport-specific weights
        player_stats = []
        async for s_doc in db.player_matches.find({"player_id": player_id}).sort("date", -1).limit(50):
            player_stats.append(s_doc)
        if player_stats:
            ai_weights = sport_config.get("ai_weights")
            ai_score = ml_model_resolver.compute_ai_score(sport_name, ai_weights, player_stats)

    # --- Sport-dynamic actual score (A) ---
    actual_score = await hybrid_performance_service.compute_actual_score(
        db, doc, latest_stat, ai_score,
    )

    # --- Consistency, growth, fitness from player doc (set by cron) ---
    consistency = float(doc.get("consistency_score", 0.5))
    growth = float(doc.get("growth_score", 0.5))
    fitness = float(doc.get("fitness_score", 0.5))

    ps = compute_performance_score(actual_score, consistency, growth, fitness, ai_score)
    fv = compute_fundamental_value(doc.get("base_value", 50.0), doc.get("alpha", 0.8), ps)

    float_shares = doc.get("circulating_shares", doc.get("total_shares", 1.0))
    di = compute_demand_impact(
        doc.get("beta", 0.05),
        doc.get("buy_volume", 0.0),
        doc.get("sell_volume", 0.0),
        float_shares,
    )
    p_raw = compute_raw_price(fv, di)

    p_old = doc.get("current_price", p_raw)
    p_final = smooth_price(p_raw, p_old)

    update_fields = {
        "performance_score": ps,
        "fundamental_value": fv,
        "current_price": p_final,
    }

    await db.players.update_one(
        {"_id": player_id},
        {"$set": update_fields},
    )

    # ---------- record price snapshot ----------
    from datetime import datetime, timezone as tz
    await db.price_history.insert_one({
        "player_id": player_id,
        "price": p_final,
        "fundamental_value": fv,
        "performance_score": ps,
        "timestamp": datetime.now(tz.utc),
    })

    return {**update_fields, "raw_price": p_raw, "demand_impact": di}
