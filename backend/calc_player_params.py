#!/usr/bin/env python3
"""
Calculate and seed base_value, alpha, beta, gamma, performance_score, ai_score
from a player's career_stats (Cricsheet data).

Usage:
    python calc_player_params.py              # all players with career_stats
    python calc_player_params.py <player_id>  # single player

Formulas (all derived from career_stats aggregated across formats):
────────────────────────────────────────────────────────────────────
base_value (10–200)
    Represents the intrinsic market value of the player.
    Driven by total runs, wickets, matches, and boundary-hitting power.

    raw = (
        0.35 * norm(total_runs, 0, 15000)
      + 0.20 * norm(batting_avg, 0, 60)
      + 0.15 * norm(total_wickets, 0, 500)
      + 0.15 * norm(total_matches, 0, 500)
      + 0.10 * norm(strike_rate, 80, 200)
      + 0.05 * norm(boundary_pct, 0, 0.30)       # (4s+6s) / balls_faced
    )
    base_value = 10 + raw * 190                   # scale to [10, 200]

alpha (0.3–1.0)  —  PS sensitivity
    How much performance_score swings the fundamental value.
    High-impact players (lots of matches, high hundreds + five_fors) get
    higher alpha → their price reacts more to form.

    raw = (
        0.40 * norm(hundreds + five_fors, 0, 80)
      + 0.30 * norm(total_matches, 0, 500)
      + 0.30 * norm(batting_avg, 0, 60)
    )
    alpha = 0.3 + raw * 0.7                       # scale to [0.3, 1.0]

beta (0.02–0.10)  —  demand sensitivity
    Maps to consistency (low variance → lower beta, more stable pricing).
    Players with more innings and steadier averages get lower beta.

    raw = 1.0 - (
        0.50 * norm(total_innings, 0, 600)
      + 0.30 * norm(not_outs / innings, 0, 0.4)   # survival rate
      + 0.20 * norm(total_matches, 0, 500)
    )
    beta = 0.02 + raw * 0.08                      # scale to [0.02, 0.10]

gamma (0.05–0.15)  —  buyback discount
    The AMM buyback haircut.  More proven players → lower gamma (tighter
    buyback), since market makers face less risk.

    raw = 1.0 - (
        0.40 * norm(total_matches, 0, 500)
      + 0.30 * norm(batting_avg, 0, 60)
      + 0.30 * norm(total_runs + total_wickets * 30, 0, 20000)
    )
    gamma = 0.05 + raw * 0.10                     # scale to [0.05, 0.15]

performance_score (0–1)
    Uses the same PS formula as price_engine but seeds initial component
    scores from career data.

    actual_score   = weighted batting avg + SR + economy (bowling)
    consistency    = survival rate + innings ratio
    growth         = boundary pct + strike rate trend proxy
    fitness        = matches played ratio (proxy for availability)
    ai_score       = placeholder heuristic (avg of above)

    PS = 0.30*A + 0.20*C + 0.15*G + 0.10*F + 0.25*AI

ai_score (0–1)
    Heuristic stand-in until real ML models are trained.
    Blends batting dominance, bowling impact, and experience.
────────────────────────────────────────────────────────────────────
"""
import asyncio
import sys
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient


# ── helpers ───────────────────────────────────────────────────────

def clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))


def norm(value: float, lo: float, hi: float) -> float:
    """Normalise *value* into [0, 1] given expected [lo, hi] range."""
    if hi <= lo:
        return 0.0
    return clamp((value - lo) / (hi - lo))


# ── aggregate career_stats across all formats ────────────────────

def aggregate(career_stats: dict) -> dict:
    """Flatten per-format career_stats into totals."""
    agg = dict(
        matches=0,
        bat_innings=0, not_outs=0, runs=0, balls_faced=0,
        fours=0, sixes=0, fifties=0, hundreds=0, highest=0,
        bowl_innings=0, balls_bowled=0, runs_conceded=0, wickets=0,
        wides=0, no_balls_bowled=0, five_fors=0,
    )
    best_bat_avg = 0.0
    best_bat_sr = 0.0
    best_bowl_eco = None
    best_bowl_avg = None

    for code, fmt in career_stats.items():
        if not isinstance(fmt, dict):
            continue
        agg["matches"] += fmt.get("matches", 0)

        bat = fmt.get("batting", {})
        agg["bat_innings"] += bat.get("innings", 0)
        agg["not_outs"] += bat.get("not_outs", 0)
        agg["runs"] += bat.get("runs", 0)
        agg["balls_faced"] += bat.get("balls_faced", 0)
        agg["fours"] += bat.get("fours", 0)
        agg["sixes"] += bat.get("sixes", 0)
        agg["fifties"] += bat.get("fifties", 0)
        agg["hundreds"] += bat.get("hundreds", 0)
        agg["highest"] = max(agg["highest"], bat.get("highest", 0))
        if bat.get("average") is not None:
            best_bat_avg = max(best_bat_avg, bat["average"])
        if bat.get("strike_rate") is not None:
            best_bat_sr = max(best_bat_sr, bat["strike_rate"])

        bwl = fmt.get("bowling", {})
        agg["bowl_innings"] += bwl.get("innings", 0)
        agg["balls_bowled"] += bwl.get("balls", 0)
        agg["runs_conceded"] += bwl.get("runs", 0)
        agg["wickets"] += bwl.get("wickets", 0)
        agg["wides"] += bwl.get("wides", 0)
        agg["no_balls_bowled"] += bwl.get("no_balls", 0)
        agg["five_fors"] += bwl.get("five_fors", 0)
        if bwl.get("economy") is not None:
            if best_bowl_eco is None or bwl["economy"] < best_bowl_eco:
                best_bowl_eco = bwl["economy"]
        if bwl.get("average") is not None:
            if best_bowl_avg is None or bwl["average"] < best_bowl_avg:
                best_bowl_avg = bwl["average"]

    # Derived aggregates
    total_innings = agg["bat_innings"] + agg["bowl_innings"]
    overall_bat_avg = (
        agg["runs"] / max(1, agg["bat_innings"] - agg["not_outs"])
        if agg["bat_innings"] > 0 else 0.0
    )
    overall_bat_sr = (
        (agg["runs"] / max(1, agg["balls_faced"])) * 100
        if agg["balls_faced"] > 0 else 0.0
    )
    boundary_pct = (
        (agg["fours"] + agg["sixes"]) / max(1, agg["balls_faced"])
        if agg["balls_faced"] > 0 else 0.0
    )
    survival_rate = (
        agg["not_outs"] / max(1, agg["bat_innings"])
        if agg["bat_innings"] > 0 else 0.0
    )
    overall_bowl_eco = (
        (agg["runs_conceded"] / max(1, agg["balls_bowled"])) * 6
        if agg["balls_bowled"] > 0 else None
    )

    agg.update(
        total_innings=total_innings,
        overall_bat_avg=overall_bat_avg,
        overall_bat_sr=overall_bat_sr,
        boundary_pct=boundary_pct,
        survival_rate=survival_rate,
        best_bat_avg=best_bat_avg,
        best_bat_sr=best_bat_sr,
        best_bowl_eco=best_bowl_eco,
        best_bowl_avg=best_bowl_avg,
        overall_bowl_eco=overall_bowl_eco,
    )
    return agg


# ── parameter calculations ───────────────────────────────────────

def calc_base_value(a: dict) -> float:
    raw = (
        0.35 * norm(a["runs"], 0, 15_000)
        + 0.20 * norm(a["overall_bat_avg"], 0, 60)
        + 0.15 * norm(a["wickets"], 0, 500)
        + 0.15 * norm(a["matches"], 0, 500)
        + 0.10 * norm(a["overall_bat_sr"], 80, 200)
        + 0.05 * norm(a["boundary_pct"], 0, 0.30)
    )
    return round(10 + raw * 190, 2)


def calc_alpha(a: dict) -> float:
    milestones = a["hundreds"] + a["five_fors"]
    raw = (
        0.40 * norm(milestones, 0, 80)
        + 0.30 * norm(a["matches"], 0, 500)
        + 0.30 * norm(a["overall_bat_avg"], 0, 60)
    )
    return round(0.3 + raw * 0.7, 4)


def calc_beta(a: dict) -> float:
    raw = 1.0 - (
        0.50 * norm(a["total_innings"], 0, 600)
        + 0.30 * norm(a["survival_rate"], 0, 0.4)
        + 0.20 * norm(a["matches"], 0, 500)
    )
    return round(0.02 + clamp(raw) * 0.08, 4)


def calc_gamma(a: dict) -> float:
    composite = a["runs"] + a["wickets"] * 30
    raw = 1.0 - (
        0.40 * norm(a["matches"], 0, 500)
        + 0.30 * norm(a["overall_bat_avg"], 0, 60)
        + 0.30 * norm(composite, 0, 20_000)
    )
    return round(0.05 + clamp(raw) * 0.10, 4)


def calc_performance_score(a: dict) -> float:
    """Seed an initial PS from career aggregates."""
    # Actual score: batting dominance + bowling economy
    bat_component = (
        0.50 * norm(a["overall_bat_avg"], 0, 60)
        + 0.30 * norm(a["overall_bat_sr"], 80, 200)
        + 0.20 * norm(a["boundary_pct"], 0, 0.30)
    )
    bowl_component = 0.0
    if a["wickets"] > 0 and a["overall_bowl_eco"] is not None:
        bowl_component = (
            0.50 * norm(50 - min(a["overall_bowl_eco"], 50), 0, 50)  # lower eco = better
            + 0.50 * norm(a["wickets"], 0, 500)
        )
    # Weight batting vs bowling by innings share
    total_inn = max(1, a["bat_innings"] + a["bowl_innings"])
    bat_w = a["bat_innings"] / total_inn
    bwl_w = a["bowl_innings"] / total_inn
    actual_score = bat_w * bat_component + bwl_w * bowl_component
    if a["bat_innings"] == 0 and a["bowl_innings"] == 0:
        actual_score = 0.0

    # Consistency: survival + innings depth
    consistency = (
        0.60 * norm(a["survival_rate"], 0, 0.4)
        + 0.40 * norm(a["bat_innings"], 0, 400)
    )

    # Growth: boundary aggression + strike rate
    growth = (
        0.50 * norm(a["boundary_pct"], 0, 0.30)
        + 0.50 * norm(a["overall_bat_sr"], 80, 200)
    )

    # Fitness proxy: match availability
    fitness = norm(a["matches"], 0, 500)

    # AI score placeholder: blend of above
    ai_score = 0.30 * actual_score + 0.25 * consistency + 0.25 * growth + 0.20 * fitness

    # PS = standard weights from price_engine
    ps = (
        0.30 * actual_score
        + 0.20 * consistency
        + 0.15 * growth
        + 0.10 * fitness
        + 0.25 * ai_score
    )
    return round(clamp(ps), 4)


def calc_ai_score(a: dict) -> float:
    """Heuristic AI score until real models are trained."""
    bat_dom = (
        0.40 * norm(a["overall_bat_avg"], 0, 60)
        + 0.30 * norm(a["overall_bat_sr"], 80, 200)
        + 0.30 * norm(a["hundreds"], 0, 50)
    )
    bowl_impact = 0.0
    if a["wickets"] > 0:
        eco_norm = norm(50 - min(a.get("overall_bowl_eco") or 50, 50), 0, 50)
        bowl_impact = (
            0.40 * norm(a["wickets"], 0, 500)
            + 0.30 * norm(a["five_fors"], 0, 30)
            + 0.30 * eco_norm
        )
    experience = norm(a["matches"], 0, 500)

    total_inn = max(1, a["bat_innings"] + a["bowl_innings"])
    bat_w = a["bat_innings"] / total_inn
    bwl_w = a["bowl_innings"] / total_inn

    raw = 0.50 * (bat_w * bat_dom + bwl_w * bowl_impact) + 0.30 * experience + 0.20 * norm(a["runs"], 0, 15_000)
    return round(clamp(raw), 4)


def calculate_all(career_stats: dict) -> dict:
    """Return all six computed parameters for a player's career_stats."""
    a = aggregate(career_stats)
    ps = calc_performance_score(a)
    ai = calc_ai_score(a)
    bv = calc_base_value(a)
    return dict(
        base_value=bv,
        alpha=calc_alpha(a),
        beta=calc_beta(a),
        gamma=calc_gamma(a),
        performance_score=ps,
        ai_score=ai,
        fundamental_value=round(bv * (1 + calc_alpha(a) * ps), 2),
        current_price=round(bv * (1 + calc_alpha(a) * ps), 2),
    )


# ── main ─────────────────────────────────────────────────────────

async def run(player_id: str | None = None):
    import certifi
    from app.core.config import get_settings

    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_uri, tlsCAFile=certifi.where())
    db = client[settings.mongo_db]

    query: dict = {}
    if player_id:
        query["_id"] = ObjectId(player_id)

    # Only process players that have career_stats
    query["career_stats"] = {"$exists": True, "$ne": {}}
    cursor = db.players.find(query)

    updated = 0
    async for player in cursor:
        name = player.get("name", str(player["_id"]))
        career_stats = player.get("career_stats", {})
        if not career_stats:
            print(f"  ⏭  {name} — no career_stats, skipping")
            continue

        params = calculate_all(career_stats)
        agg = aggregate(career_stats)

        await db.players.update_one(
            {"_id": player["_id"]},
            {"$set": params},
        )
        updated += 1
        print(f"  ✅ {name}")
        print(f"      matches={agg['matches']}  runs={agg['runs']}  wickets={agg['wickets']}  bat_avg={agg['overall_bat_avg']:.1f}  sr={agg['overall_bat_sr']:.1f}")
        print(f"      base_value={params['base_value']}  alpha={params['alpha']}  beta={params['beta']}  gamma={params['gamma']}")
        print(f"      performance_score={params['performance_score']}  ai_score={params['ai_score']}")
        print(f"      fundamental_value={params['fundamental_value']}  current_price={params['current_price']}")

    if updated == 0:
        if player_id:
            print(f"⚠️  Player {player_id} not found or has no career_stats")
        else:
            print("⚠️  No players with career_stats found in the database")
    else:
        print(f"\n🏏 Updated {updated} player(s)")

    client.close()


if __name__ == "__main__":
    pid = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(run(pid))
