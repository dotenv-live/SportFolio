"""
WrestlingPerformanceEngine – computes wrestling-specific performance sub-scores.

Formulas
--------
C  (Consistency)     – average normalised per-bout score across N bouts
G  (Growth)          – trend comparing recent 3 vs previous 3 bouts
F  (Fitness)         – sigmoid of bout frequency and recovery
A  (Actual Perf.)    – hybrid of formula-based + ML prediction
AI (AI Component)    – λ₁·XGBoost + λ₂·LSTM via MLModelResolver
PS (Perf. Score)     – w₁A + w₂C + w₃G + w₄F + w₅AI

All outputs are clipped to [0, 1].  Missing metrics are treated as 0.

Wrestling-specific notes
------------------------
- result: Win = 1.0, Loss = 0.0
- technical_points_scored: higher = better
- technical_points_conceded: lower = better → inverted during scoring
- status codes: VSU (dominant) > VPO1 > VPO > VFA > VIN etc.
- match_type: Final > Semifinal > Quarterfinal > Qualification
"""
from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.ai.model_resolver import ml_model_resolver
from app.services.metric_normalizer import MetricNormalizer, resolve_dotpath, safe_float
from app.services.sport_config import sport_config_service

logger = logging.getLogger("sportfolio.wrestling_perf")

# ──────────────────────────────────────────────────────────────────────
# Configurable constants
# ──────────────────────────────────────────────────────────────────────

DEFAULT_PS_WEIGHTS = {
    "w_actual": 0.30,
    "w_consistency": 0.20,
    "w_growth": 0.15,
    "w_fitness": 0.10,
    "w_ai": 0.25,
}

EPSILON = 1e-6

# Fitness sigmoid
K1_BOUT_FREQ = 2.5
K2_RECOVERY = 1.5
K3_INJURY = 3.0

MAX_BOUTS_30_DAYS = 10
RECOMMENDED_MAX_BOUTS_7D = 4

DEFAULT_PHI = 0.35
GROWTH_WINDOW = 3

# Result / status mappings → numeric scores for normalisation
_RESULT_MAP = {"win": 1.0, "loss": 0.0, "draw": 0.5}

_STATUS_MAP = {
    "vsu": 1.0,    # Victory by Superior technical (10-0)
    "vst": 0.95,   # Victory by Superior technical
    "vfa": 0.90,   # Victory by Fall / Pin
    "vpo1": 0.75,  # Victory by Points (with 1 caution)
    "vpo": 0.70,   # Victory by Points
    "vin": 0.60,   # Victory by Injury of opponent
    "vca": 0.55,   # Victory by Caution
    "dsq": 0.50,   # Disqualification
}

_MATCH_TYPE_MAP = {
    "final": 1.0,
    "gold medal match": 1.0,
    "bronze medal match": 0.85,
    "semifinal": 0.80,
    "quarterfinal": 0.65,
    "repechage": 0.55,
    "round of 16": 0.50,
    "qualification": 0.40,
    "pool": 0.35,
}

# Inverted metrics
_INVERTED_KEYS = frozenset({
    "performance.technical_points_conceded",
})


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────

def _resolve_wrestling_value(stats: dict, key: str) -> float:
    """Resolve a dotpath key, mapping string fields to numeric scores."""
    raw = resolve_dotpath(stats, key)
    if raw is None:
        return 0.0

    # Handle string-based fields
    if key == "performance.result":
        return _RESULT_MAP.get(str(raw).lower().strip(), 0.0)
    if key == "performance.status":
        return _STATUS_MAP.get(str(raw).lower().strip(), 0.5)
    if key == "match_type":
        return _MATCH_TYPE_MAP.get(str(raw).lower().strip(), 0.3)

    return safe_float(raw)


def _compute_maxes(
    matches: List[dict],
    metric_keys: List[str],
) -> Dict[str, float]:
    """Derive per-metric maximums across all bouts."""
    maxes: Dict[str, float] = {k: 0.0 for k in metric_keys}
    for m in matches:
        stats = m.get("stats", {})
        for key in metric_keys:
            val = _resolve_wrestling_value(stats, key)
            if val > maxes[key]:
                maxes[key] = val
    return {k: max(v, 1.0) for k, v in maxes.items()}


def _normalised_score(
    stats: dict,
    metrics: List[dict],
    maxes: Dict[str, float],
) -> float:
    """Weighted normalised score for a single bout."""
    if not metrics:
        return 0.0
    total_weight = sum(m.get("weight", 0.0) for m in metrics)
    if total_weight <= 0:
        return 0.0

    score = 0.0
    for m in metrics:
        key = m["key"]
        weight = m.get("weight", 0.0)
        mx = maxes.get(key, 1.0)
        raw = _resolve_wrestling_value(stats, key)
        ratio = raw / mx if mx > 0 else 0.0

        if key in _INVERTED_KEYS:
            ratio = 1.0 - ratio

        score += (weight / total_weight) * ratio

    return max(0.0, min(1.0, score))


# ──────────────────────────────────────────────────────────────────────
# 1) Consistency  (C)
# ──────────────────────────────────────────────────────────────────────

def compute_consistency(
    matches: List[dict],
    metrics: Optional[List[dict]] = None,
) -> float:
    """C = (1/N) Σ normalised_score_i — average bout quality."""
    if not matches:
        return 0.0
    all_keys = [m["key"] for m in (metrics or [])]
    maxes = _compute_maxes(matches, all_keys)
    total = sum(
        _normalised_score(m.get("stats", {}), metrics or [], maxes)
        for m in matches
    )
    return max(0.0, min(1.0, total / len(matches)))


# ──────────────────────────────────────────────────────────────────────
# 2) Growth  (G)
# ──────────────────────────────────────────────────────────────────────

def _avg_score(
    matches: List[dict],
    metrics: List[dict],
    maxes: Dict[str, float],
) -> float:
    if not matches:
        return 0.0
    return sum(
        _normalised_score(m.get("stats", {}), metrics, maxes) for m in matches
    ) / len(matches)


def compute_growth(
    matches: List[dict],
    metrics: Optional[List[dict]] = None,
) -> float:
    """G normalised via tanh to [0, 1]."""
    if len(matches) < 2:
        return 0.0
    last3 = matches[:GROWTH_WINDOW]
    prev3 = matches[GROWTH_WINDOW: GROWTH_WINDOW * 2]
    if not prev3:
        return 0.5
    all_keys = [m["key"] for m in (metrics or [])]
    window = last3 + prev3
    maxes = _compute_maxes(window, all_keys)
    avg_last = _avg_score(last3, metrics or [], maxes)
    avg_prev = _avg_score(prev3, metrics or [], maxes)
    g = (avg_last - avg_prev) / (avg_prev + EPSILON)
    return max(0.0, min(1.0, 0.5 + 0.5 * math.tanh(g)))


# ──────────────────────────────────────────────────────────────────────
# 3) Fitness  (F)
# ──────────────────────────────────────────────────────────────────────

def compute_fitness(
    matches: List[dict],
    is_injured: bool = False,
) -> float:
    """Sigmoid of bout frequency and recovery."""
    now = datetime.now(timezone.utc)
    thirty_ago = now - timedelta(days=30)
    seven_ago = now - timedelta(days=7)

    bouts_30 = 0
    bouts_7 = 0
    for m in matches:
        ds = m.get("date")
        if not ds:
            continue
        try:
            dt = datetime.strptime(ds, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            continue
        if dt >= thirty_ago:
            bouts_30 += 1
        if dt >= seven_ago:
            bouts_7 += 1

    freq = bouts_30 / MAX_BOUTS_30_DAYS
    recovery = max(0.0, 1.0 - bouts_7 / RECOMMENDED_MAX_BOUTS_7D)
    injury = 1.0 if is_injured else 0.0

    exp = -(K1_BOUT_FREQ * freq + K2_RECOVERY * recovery - K3_INJURY * injury)
    return max(0.0, min(1.0, 1.0 / (1.0 + math.exp(exp))))


# ──────────────────────────────────────────────────────────────────────
# 4) Actual Performance  (A)
# ──────────────────────────────────────────────────────────────────────

def compute_actual_formula(
    matches: List[dict],
    metrics: Optional[List[dict]] = None,
) -> float:
    """A_formula from up to 5 most-recent bouts."""
    if not matches:
        return 0.0
    recent = matches[:5]
    all_keys = [m["key"] for m in (metrics or [])]
    maxes = _compute_maxes(recent, all_keys)
    total = sum(
        _normalised_score(m.get("stats", {}), metrics or [], maxes) for m in recent
    )
    return max(0.0, min(1.0, total / len(recent)))


def compute_actual(
    matches: List[dict],
    ai_score: float,
    phi: float = DEFAULT_PHI,
    metrics: Optional[List[dict]] = None,
) -> float:
    """A = (1 − φ)·A_formula + φ·A_ML"""
    a_formula = compute_actual_formula(matches, metrics=metrics)
    if phi > 0 and ai_score > 0:
        return max(0.0, min(1.0, (1.0 - phi) * a_formula + phi * ai_score))
    return a_formula


# ──────────────────────────────────────────────────────────────────────
# 5) AI Component
# ──────────────────────────────────────────────────────────────────────

def compute_ai_score(
    sport_name: str,
    ai_weights: Optional[Dict[str, float]],
    historical_stats: List[dict],
) -> float:
    """AI = λ₁·XGBoost + λ₂·LSTM"""
    try:
        return ml_model_resolver.compute_ai_score(
            sport_name, ai_weights, historical_stats
        )
    except Exception:
        logger.warning("AI score computation failed – returning 0.0")
        return 0.0


# ──────────────────────────────────────────────────────────────────────
# 6) Performance Score  (PS)
# ──────────────────────────────────────────────────────────────────────

def compute_performance_score(
    actual: float,
    consistency: float,
    growth: float,
    fitness: float,
    ai: float,
    weights: Optional[Dict[str, float]] = None,
) -> float:
    """PS = w₁·A + w₂·C + w₃·G + w₄·F + w₅·AI"""
    w = weights or DEFAULT_PS_WEIGHTS
    ps = (
        w.get("w_actual", 0.30) * actual
        + w.get("w_consistency", 0.20) * consistency
        + w.get("w_growth", 0.15) * growth
        + w.get("w_fitness", 0.10) * fitness
        + w.get("w_ai", 0.25) * ai
    )
    return max(0.0, min(1.0, ps))


# ──────────────────────────────────────────────────────────────────────
# Full pipeline
# ──────────────────────────────────────────────────────────────────────

@dataclass
class WrestlingScores:
    """Container for all computed sub-scores."""
    consistency: float = 0.0
    growth: float = 0.0
    fitness: float = 0.0
    actual: float = 0.0
    ai: float = 0.0
    performance_score: float = 0.0


async def compute_all_scores(
    db: AsyncIOMotorDatabase,
    player_doc: dict,
    *,
    ps_weights: Optional[Dict[str, float]] = None,
) -> WrestlingScores:
    """End-to-end computation of C, G, F, A, AI, PS for a single wrestler."""
    player_id = player_doc["_id"]
    sport_name = player_doc.get("sport", "Wrestling")

    matches: List[dict] = []
    cursor = (
        db.player_matches.find({"player_id": player_id})
        .sort("date", -1)
        .limit(50)
    )
    async for doc in cursor:
        matches.append(doc)

    if not matches:
        logger.debug("No bouts for player %s – returning zero scores", player_id)
        return WrestlingScores()

    sport_config = await sport_config_service.get_by_name(db, sport_name)
    ai_weights = sport_config.get("ai_weights") if sport_config else None
    phi = sport_config.get("phi", DEFAULT_PHI) if sport_config else DEFAULT_PHI
    metrics = sport_config.get("metrics", []) if sport_config else []

    is_injured = player_doc.get("is_injured", False)

    consistency = compute_consistency(matches, metrics=metrics)
    growth = compute_growth(matches, metrics=metrics)
    fitness = compute_fitness(matches, is_injured=is_injured)
    ai = compute_ai_score(sport_name, ai_weights, matches)
    actual = compute_actual(matches, ai, phi=phi, metrics=metrics)

    ps = compute_performance_score(
        actual, consistency, growth, fitness, ai,
        weights=ps_weights,
    )

    return WrestlingScores(
        consistency=consistency,
        growth=growth,
        fitness=fitness,
        actual=actual,
        ai=ai,
        performance_score=ps,
    )
