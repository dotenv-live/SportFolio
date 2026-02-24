"""
SwimmingPerformanceEngine – computes swimming-specific performance sub-scores.

Formulas
--------
C  (Consistency)     – average normalised per-race score across N races
G  (Growth)          – trend comparing recent 3 vs previous 3 races
F  (Fitness)         – sigmoid of race frequency and training load
A  (Actual Perf.)    – hybrid of formula-based + ML prediction
AI (AI Component)    – λ₁·XGBoost + λ₂·LSTM via MLModelResolver
PS (Perf. Score)     – w₁A + w₂C + w₃G + w₄F + w₅AI

All outputs are clipped to [0, 1].  Missing metrics are treated as 0.

Swimming-specific notes
-----------------------
- Lower time_ms = better  → inverted during scoring
- Lower rank = better     → inverted during scoring
- Higher fina_points = better
- reaction_time may be null (not measured in all events)
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

logger = logging.getLogger("sportfolio.swimming_perf")

# ──────────────────────────────────────────────────────────────────────
# Configurable constants
# ──────────────────────────────────────────────────────────────────────

# PS weights
DEFAULT_PS_WEIGHTS = {
    "w_actual": 0.30,
    "w_consistency": 0.20,
    "w_growth": 0.15,
    "w_fitness": 0.10,
    "w_ai": 0.25,
}

EPSILON = 1e-6

# Fitness sigmoid constants
K1_RACE_FREQ = 2.5
K2_TRAINING = 1.5
K3_INJURY = 3.0

# Fitness context
MAX_RACES_30_DAYS = 8
RECOMMENDED_MAX_RACES_7D = 4

# Hybrid blend default (phi)
DEFAULT_PHI = 0.25

# Growth window
GROWTH_WINDOW = 3

# Inverted metrics — lower raw value = better performance
_INVERTED_KEYS = frozenset({
    "performance.time_ms",
    "performance.rank",
})


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────


def _compute_maxes_from_config(
    matches: List[dict],
    metric_keys: List[str],
) -> Dict[str, float]:
    """Derive per-metric maximums across all races for the given keys."""
    maxes: Dict[str, float] = {k: 0.0 for k in metric_keys}
    for m in matches:
        stats = m.get("stats", {})
        for key in metric_keys:
            val = safe_float(resolve_dotpath(stats, key))
            if val > maxes[key]:
                maxes[key] = val
    return {k: max(v, 1.0) for k, v in maxes.items()}


def _normalised_score(
    stats: dict,
    metrics: List[dict],
    maxes: Dict[str, float],
) -> float:
    """Compute weighted normalised score for a single race."""
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
        raw = safe_float(resolve_dotpath(stats, key))
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
    """
    C = (1/N) Σ normalised_score_i

    A swimmer's consistency = average normalised race score.
    """
    if not matches:
        return 0.0

    all_keys = [m["key"] for m in (metrics or [])]
    maxes = _compute_maxes_from_config(matches, all_keys)

    n = len(matches)
    total = 0.0
    for m in matches:
        stats = m.get("stats", {})
        total += _normalised_score(stats, metrics or [], maxes)

    c = total / n
    return max(0.0, min(1.0, c))


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
    total = sum(
        _normalised_score(m.get("stats", {}), metrics, maxes)
        for m in matches
    )
    return total / len(matches)


def compute_growth(
    matches: List[dict],
    metrics: Optional[List[dict]] = None,
) -> float:
    """
    G = (avg_last3 - avg_prev3) / (avg_prev3 + ε)
    Normalised via tanh to [0, 1].
    """
    if len(matches) < 2:
        return 0.0

    last3 = matches[:GROWTH_WINDOW]
    prev3 = matches[GROWTH_WINDOW: GROWTH_WINDOW * 2]
    if not prev3:
        return 0.5

    all_keys = [m["key"] for m in (metrics or [])]
    window = last3 + prev3
    maxes = _compute_maxes_from_config(window, all_keys)

    avg_last = _avg_score(last3, metrics or [], maxes)
    avg_prev = _avg_score(prev3, metrics or [], maxes)
    g = (avg_last - avg_prev) / (avg_prev + EPSILON)
    g_normalised = 0.5 + 0.5 * math.tanh(g)
    return max(0.0, min(1.0, g_normalised))


# ──────────────────────────────────────────────────────────────────────
# 3) Fitness  (F)
# ──────────────────────────────────────────────────────────────────────

def compute_fitness(
    matches: List[dict],
    is_injured: bool = False,
) -> float:
    """
    F = 1 / (1 + exp( −(k₁·race_freq + k₂·training − k₃·injury) ))

    For swimming we track race frequency instead of overs bowled.
    """
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)

    races_last_30 = 0
    races_last_7 = 0

    for m in matches:
        match_date_str = m.get("date")
        if not match_date_str:
            continue
        try:
            match_date = datetime.strptime(match_date_str, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
        except (ValueError, TypeError):
            continue

        if match_date >= thirty_days_ago:
            races_last_30 += 1
        if match_date >= seven_days_ago:
            races_last_7 += 1

    race_freq_score = races_last_30 / MAX_RACES_30_DAYS
    # For swimming: more races in 7 days can indicate fatigue
    training_score = max(0.0, 1.0 - races_last_7 / RECOMMENDED_MAX_RACES_7D)
    injury_penalty = 1.0 if is_injured else 0.0

    exponent = -(
        K1_RACE_FREQ * race_freq_score
        + K2_TRAINING * training_score
        - K3_INJURY * injury_penalty
    )
    f = 1.0 / (1.0 + math.exp(exponent))
    return max(0.0, min(1.0, f))


# ──────────────────────────────────────────────────────────────────────
# 4) Actual Performance  (A)
# ──────────────────────────────────────────────────────────────────────

def compute_actual_formula(
    matches: List[dict],
    metrics: Optional[List[dict]] = None,
) -> float:
    """
    A_formula = (1/N) Σ score_i

    Uses up to the 5 most-recent races.
    """
    if not matches:
        return 0.0

    recent = matches[:5]
    all_keys = [m["key"] for m in (metrics or [])]
    maxes = _compute_maxes_from_config(recent, all_keys)

    total = 0.0
    for m in recent:
        stats = m.get("stats", {})
        total += _normalised_score(stats, metrics or [], maxes)

    a_formula = total / len(recent)
    return max(0.0, min(1.0, a_formula))


def compute_actual(
    matches: List[dict],
    ai_score: float,
    phi: float = DEFAULT_PHI,
    metrics: Optional[List[dict]] = None,
) -> float:
    """
    A = (1 − φ) · A_formula + φ · A_ML
    """
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
    """
    AI = λ₁·XGBoost + λ₂·LSTM
    """
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
    """
    PS = w₁·A + w₂·C + w₃·G + w₄·F + w₅·AI
    """
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
# Full pipeline – compute everything for one swimmer
# ──────────────────────────────────────────────────────────────────────

@dataclass
class SwimmingScores:
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
) -> SwimmingScores:
    """
    End-to-end computation of C, G, F, A, AI, PS for a single swimmer.
    """
    player_id = player_doc["_id"]
    sport_name = player_doc.get("sport", "Swimming")

    # ---- Fetch matches (sorted most-recent first) ----
    matches: List[dict] = []
    cursor = (
        db.player_matches.find({"player_id": player_id})
        .sort("date", -1)
        .limit(50)
    )
    async for doc in cursor:
        matches.append(doc)

    if not matches:
        logger.debug("No races for player %s – returning zero scores", player_id)
        return SwimmingScores()

    # ---- Sport config ----
    sport_config = await sport_config_service.get_by_name(db, sport_name)
    ai_weights = sport_config.get("ai_weights") if sport_config else None
    phi = sport_config.get("phi", DEFAULT_PHI) if sport_config else DEFAULT_PHI
    metrics = sport_config.get("metrics", []) if sport_config else []

    # ---- Detect injury ----
    is_injured = player_doc.get("is_injured", False)

    # ---- Compute sub-scores ----
    consistency = compute_consistency(matches, metrics=metrics)
    growth = compute_growth(matches, metrics=metrics)
    fitness = compute_fitness(matches, is_injured=is_injured)
    ai = compute_ai_score(sport_name, ai_weights, matches)
    actual = compute_actual(matches, ai, phi=phi, metrics=metrics)

    ps = compute_performance_score(
        actual, consistency, growth, fitness, ai,
        weights=ps_weights,
    )

    return SwimmingScores(
        consistency=consistency,
        growth=growth,
        fitness=fitness,
        actual=actual,
        ai=ai,
        performance_score=ps,
    )
