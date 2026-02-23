"""
CricketPerformanceEngine – computes cricket-specific performance sub-scores.

Formulas
--------
C  (Consistency)     – average normalised per-match score across N matches
G  (Growth)          – trend comparing recent 3 vs previous 3 matches
F  (Fitness)         – sigmoid of match frequency, bowling workload, injury
A  (Actual Perf.)    – hybrid of formula-based + ML prediction
AI (AI Component)    – λ₁·XGBoost + λ₂·LSTM via MLModelResolver
PS (Perf. Score)     – w₁A + w₂C + w₃G + w₄F + w₅AI

All outputs are clipped to [0, 1].  Missing metrics are treated as 0.

Metric weights for batting/bowling are derived from the sport config
``metrics`` list.  Field names are **not** hardcoded — the config keys
(e.g. ``batting_stats.runs``) drive which stat fields are read.
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

logger = logging.getLogger("sportfolio.cricket_perf")

# ──────────────────────────────────────────────────────────────────────
# Configurable constants  (safe defaults)
# ──────────────────────────────────────────────────────────────────────

# PS weights
DEFAULT_PS_WEIGHTS = {
    "w_actual": 0.30,
    "w_consistency": 0.20,
    "w_growth": 0.15,
    "w_fitness": 0.10,
    "w_ai": 0.25,
}

# Growth epsilon (prevents division by zero)
EPSILON = 1e-6

# Fitness sigmoid constants
K1_MATCH_FREQ = 2.5
K2_WORKLOAD = 1.5
K3_INJURY = 3.0

# Fitness context
MAX_MATCHES_30_DAYS = 10
RECOMMENDED_MAX_OVERS_7D = 40

# Hybrid blend default (phi)
DEFAULT_PHI = 0.3

# Growth window
GROWTH_WINDOW = 3

# Inverted metrics — lower raw value = better performance
_INVERTED_KEYS = frozenset({
    "bowling_stats.economy",
    "bowling_stats.runs_conceded",
    "bowling_stats.wides",
    "bowling_stats.no_balls",
})


# ──────────────────────────────────────────────────────────────────────
# Helpers: parse sport config metrics into batting / bowling groups
# ──────────────────────────────────────────────────────────────────────


def _partition_metrics(
    metrics: List[dict],
) -> tuple[List[dict], List[dict], List[dict]]:
    """Split metric definitions into (batting, bowling, other) groups
    based on the key prefix."""
    batting: List[dict] = []
    bowling: List[dict] = []
    other: List[dict] = []
    for m in metrics:
        key: str = m.get("key", "")
        if key.startswith("batting_stats."):
            batting.append(m)
        elif key.startswith("bowling_stats."):
            bowling.append(m)
        else:
            other.append(m)
    return batting, bowling, other


def _group_weight(group: List[dict]) -> float:
    """Sum of weights for a metric group."""
    return sum(m.get("weight", 0.0) for m in group)


def _compute_gamma(
    metrics: List[dict],
) -> tuple[float, float]:
    """Derive γ_bat, γ_bowl from total metric weights.

    Returns normalised blend factors that sum to 1.
    Falls back to 0.55 / 0.45 if metrics are empty.
    """
    batting, bowling, _ = _partition_metrics(metrics)
    w_bat = _group_weight(batting)
    w_bowl = _group_weight(bowling)
    total = w_bat + w_bowl
    if total <= 0:
        return 0.55, 0.45
    return w_bat / total, w_bowl / total


# ──────────────────────────────────────────────────────────────────────
# Config-driven per-match scoring
# ──────────────────────────────────────────────────────────────────────


def _compute_maxes_from_config(
    matches: List[dict],
    metric_keys: List[str],
) -> Dict[str, float]:
    """Derive per-metric maximums across all matches for the given keys."""
    maxes: Dict[str, float] = {k: 0.0 for k in metric_keys}
    for m in matches:
        stats = m.get("stats", {})
        for key in metric_keys:
            val = safe_float(resolve_dotpath(stats, key))
            if val > maxes[key]:
                maxes[key] = val
    # Floor at 1.0 to avoid division by zero
    return {k: max(v, 1.0) for k, v in maxes.items()}


def _normalised_group_score(
    stats: dict,
    group_metrics: List[dict],
    maxes: Dict[str, float],
) -> float:
    """Compute weighted normalised score for a metric group in one match.

    For inverted metrics (economy, wides, etc.) uses ``1 - val/max``.
    """
    if not group_metrics:
        return 0.0
    total_weight = _group_weight(group_metrics)
    if total_weight <= 0:
        return 0.0

    score = 0.0
    for m in group_metrics:
        key = m["key"]
        weight = m.get("weight", 0.0)
        mx = maxes.get(key, 1.0)
        raw = safe_float(resolve_dotpath(stats, key))
        ratio = raw / mx if mx > 0 else 0.0

        if key in _INVERTED_KEYS:
            ratio = 1.0 - ratio

        # Normalise weight relative to group total so group score ∈ [0, 1]
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
    C = γ_bat · C_batting + γ_bowl · C_bowling

    C_batting  = (1/N) Σ bat_normalised_score_i
    C_bowling  = (1/N) Σ bowl_normalised_score_i

    Metric field names and weights are read from the sport config ``metrics``.
    """
    if not matches:
        return 0.0

    batting, bowling, _ = _partition_metrics(metrics or [])
    gamma_bat, gamma_bowl = _compute_gamma(metrics or [])

    all_keys = [m["key"] for m in (batting + bowling)]
    maxes = _compute_maxes_from_config(matches, all_keys)

    n = len(matches)
    c_bat_total = 0.0
    c_bowl_total = 0.0

    for m in matches:
        stats = m.get("stats", {})
        c_bat_total += _normalised_group_score(stats, batting, maxes)
        c_bowl_total += _normalised_group_score(stats, bowling, maxes)

    c_bat = c_bat_total / n
    c_bowl = c_bowl_total / n
    c = gamma_bat * c_bat + gamma_bowl * c_bowl
    return max(0.0, min(1.0, c))


# ──────────────────────────────────────────────────────────────────────
# 2) Growth  (G)
# ──────────────────────────────────────────────────────────────────────


def _avg_group_score(
    matches: List[dict],
    group_metrics: List[dict],
    maxes: Dict[str, float],
) -> float:
    if not matches:
        return 0.0
    total = sum(
        _normalised_group_score(m.get("stats", {}), group_metrics, maxes)
        for m in matches
    )
    return total / len(matches)


def compute_growth(
    matches: List[dict],
    metrics: Optional[List[dict]] = None,
) -> float:
    """
    G = γ_bat · G_batting + γ_bowl · G_bowling

    G_x = (avg_last3 - avg_prev3) / (avg_prev3 + ε)

    Matches must be sorted most-recent first.
    """
    if len(matches) < 2:
        return 0.0

    last3 = matches[:GROWTH_WINDOW]
    prev3 = matches[GROWTH_WINDOW: GROWTH_WINDOW * 2]
    if not prev3:
        return 0.5

    batting, bowling, _ = _partition_metrics(metrics or [])
    gamma_bat, gamma_bowl = _compute_gamma(metrics or [])

    all_keys = [m["key"] for m in (batting + bowling)]
    window = last3 + prev3
    maxes = _compute_maxes_from_config(window, all_keys)

    avg_last_bat = _avg_group_score(last3, batting, maxes)
    avg_prev_bat = _avg_group_score(prev3, batting, maxes)
    g_bat = (avg_last_bat - avg_prev_bat) / (avg_prev_bat + EPSILON)

    avg_last_bowl = _avg_group_score(last3, bowling, maxes)
    avg_prev_bowl = _avg_group_score(prev3, bowling, maxes)
    g_bowl = (avg_last_bowl - avg_prev_bowl) / (avg_prev_bowl + EPSILON)

    g = gamma_bat * g_bat + gamma_bowl * g_bowl
    g_normalised = 0.5 + 0.5 * math.tanh(g)
    return max(0.0, min(1.0, g_normalised))


# ──────────────────────────────────────────────────────────────────────
# 3) Fitness  (F)
# ──────────────────────────────────────────────────────────────────────


def compute_fitness(
    matches: List[dict],
    is_injured: bool = False,
    overs_key: str = "bowling_stats.overs",
) -> float:
    """
    F = 1 / (1 + exp( −(k₁·match_freq + k₂·workload − k₃·injury) ))

    ``overs_key`` is resolved via dot-path against ``stats``.
    """
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)

    matches_last_30 = 0
    overs_last_7 = 0.0

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
            matches_last_30 += 1
        if match_date >= seven_days_ago:
            overs_last_7 += safe_float(resolve_dotpath(m.get("stats", {}), overs_key))

    match_freq_score = matches_last_30 / MAX_MATCHES_30_DAYS
    workload_score = max(0.0, 1.0 - overs_last_7 / RECOMMENDED_MAX_OVERS_7D)
    injury_penalty = 1.0 if is_injured else 0.0

    exponent = -(
        K1_MATCH_FREQ * match_freq_score
        + K2_WORKLOAD * workload_score
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
    A_formula = (1/N) Σ (γ_bat · bat_score + γ_bowl · bowl_score)

    Uses up to the 5 most-recent matches.
    """
    if not matches:
        return 0.0

    recent = matches[:5]
    batting, bowling, _ = _partition_metrics(metrics or [])
    gamma_bat, gamma_bowl = _compute_gamma(metrics or [])

    all_keys = [m["key"] for m in (batting + bowling)]
    maxes = _compute_maxes_from_config(recent, all_keys)

    total = 0.0
    for m in recent:
        stats = m.get("stats", {})
        bat_score = _normalised_group_score(stats, batting, maxes)
        bowl_score = _normalised_group_score(stats, bowling, maxes)
        total += gamma_bat * bat_score + gamma_bowl * bowl_score

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

    If AI score is unavailable (0), pure formula is used.
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

    Delegates to MLModelResolver. Returns 0.0 on failure.
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

    All inputs expected in [0, 1]; output clipped to [0, 1].
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
# Full pipeline – compute everything for one player
# ──────────────────────────────────────────────────────────────────────


@dataclass
class CricketScores:
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
) -> CricketScores:
    """
    End-to-end computation of C, G, F, A, AI, PS for a single cricket player.

    Reads the sport config ``metrics`` to determine which stat fields to use
    and how to weight batting vs bowling.
    """
    player_id = player_doc["_id"]
    sport_name = player_doc.get("sport", "Cricket")

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
        logger.debug("No matches for player %s – returning zero scores", player_id)
        return CricketScores()

    # ---- Sport config ----
    sport_config = await sport_config_service.get_by_name(db, sport_name)
    ai_weights = sport_config.get("ai_weights") if sport_config else None
    phi = sport_config.get("phi", DEFAULT_PHI) if sport_config else DEFAULT_PHI
    metrics = sport_config.get("metrics", []) if sport_config else []

    # ---- Detect injury (from player doc or latest match) ----
    is_injured = player_doc.get("is_injured", False)

    # ---- Compute sub-scores (config-driven) ----
    consistency = compute_consistency(matches, metrics=metrics)
    growth = compute_growth(matches, metrics=metrics)
    fitness = compute_fitness(matches, is_injured=is_injured)
    ai = compute_ai_score(sport_name, ai_weights, matches)
    actual = compute_actual(matches, ai, phi=phi, metrics=metrics)

    ps = compute_performance_score(
        actual, consistency, growth, fitness, ai,
        weights=ps_weights,
    )

    return CricketScores(
        consistency=consistency,
        growth=growth,
        fitness=fitness,
        actual=actual,
        ai=ai,
        performance_score=ps,
    )
