#!/usr/bin/env python3
"""
Calculate and seed base_value, alpha, beta, gamma, performance_score, ai_score
from a wrestler's career_stats.

Usage:
    python calc_wrestling_params.py              # all wrestling players with career_stats
    python calc_wrestling_params.py <player_id>  # single player

Wrestling career_stats format:
    {
        "76kg_fs": {
            "label": "Women's 76kg Freestyle",
            "matches": 35,
            "medals": { "gold": 3, "silver": 1, "bronze": 3 }
        },
        ...
    }

Formulas:
────────────────────────────────────────────────────────────────────
base_value (10–200)
    raw = (
        0.30 * norm(total_gold, 0, 40)
      + 0.20 * norm(total_medals, 0, 80)
      + 0.20 * norm(total_matches, 0, 300)
      + 0.15 * norm(medal_rate, 0, 1.0)
      + 0.15 * norm(win_rate_proxy, 0, 1.0)   # gold / matches
    )
    base_value = 10 + raw * 190

alpha (0.3–1.0)  —  PS sensitivity
    raw = (
        0.40 * norm(total_gold, 0, 40)
      + 0.30 * norm(total_matches, 0, 300)
      + 0.30 * norm(medal_rate, 0, 1.0)
    )
    alpha = 0.3 + raw * 0.7

beta (0.02–0.10)  —  demand sensitivity
    raw = 1.0 - (
        0.40 * norm(total_matches, 0, 300)
      + 0.30 * norm(medal_rate, 0, 1.0)
      + 0.30 * norm(num_weight_classes, 0, 5)
    )
    beta = 0.02 + raw * 0.08

gamma (0.05–0.15)  —  buyback discount
    raw = 1.0 - (
        0.40 * norm(total_matches, 0, 300)
      + 0.30 * norm(total_gold, 0, 40)
      + 0.30 * norm(total_medals, 0, 80)
    )
    gamma = 0.05 + raw * 0.10

performance_score (0–1)
    actual_score   = gold dominance + match experience
    consistency    = medal rate + weight-class breadth
    growth         = proxy from total golds + matches
    fitness        = match frequency ratio
    ai_score       = heuristic blend

    PS = 0.30*A + 0.20*C + 0.15*G + 0.10*F + 0.25*AI

ai_score (0–1)
    Heuristic: blends gold dominance, medal depth, and experience.
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


# ── aggregate career_stats across all weight classes ─────────────

def aggregate(career_stats: dict) -> dict:
    """Flatten per-weight-class career_stats into totals."""
    total_matches = 0
    total_gold = 0
    total_silver = 0
    total_bronze = 0
    total_medals = 0
    num_weight_classes = 0

    for wc_key, wc in career_stats.items():
        if not isinstance(wc, dict):
            continue

        num_weight_classes += 1
        total_matches += wc.get("matches", 0)

        medals = wc.get("medals", {})
        g = medals.get("gold", 0)
        s = medals.get("silver", 0)
        b = medals.get("bronze", 0)
        total_gold += g
        total_silver += s
        total_bronze += b
        total_medals += g + s + b

    medal_rate = total_medals / max(1, total_matches)
    win_rate_proxy = total_gold / max(1, total_matches)

    return dict(
        total_matches=total_matches,
        total_gold=total_gold,
        total_silver=total_silver,
        total_bronze=total_bronze,
        total_medals=total_medals,
        num_weight_classes=num_weight_classes,
        medal_rate=medal_rate,
        win_rate_proxy=win_rate_proxy,
    )


# ── parameter calculations ───────────────────────────────────────

def calc_base_value(a: dict) -> float:
    raw = (
        0.30 * norm(a["total_gold"], 0, 40)
        + 0.20 * norm(a["total_medals"], 0, 80)
        + 0.20 * norm(a["total_matches"], 0, 300)
        + 0.15 * norm(a["medal_rate"], 0, 1.0)
        + 0.15 * norm(a["win_rate_proxy"], 0, 1.0)
    )
    return round(10 + raw * 190, 2)


def calc_alpha(a: dict) -> float:
    raw = (
        0.40 * norm(a["total_gold"], 0, 40)
        + 0.30 * norm(a["total_matches"], 0, 300)
        + 0.30 * norm(a["medal_rate"], 0, 1.0)
    )
    return round(0.3 + raw * 0.7, 4)


def calc_beta(a: dict) -> float:
    raw = 1.0 - (
        0.40 * norm(a["total_matches"], 0, 300)
        + 0.30 * norm(a["medal_rate"], 0, 1.0)
        + 0.30 * norm(a["num_weight_classes"], 0, 5)
    )
    return round(0.02 + clamp(raw) * 0.08, 4)


def calc_gamma(a: dict) -> float:
    raw = 1.0 - (
        0.40 * norm(a["total_matches"], 0, 300)
        + 0.30 * norm(a["total_gold"], 0, 40)
        + 0.30 * norm(a["total_medals"], 0, 80)
    )
    return round(0.05 + clamp(raw) * 0.10, 4)


def calc_performance_score(a: dict) -> float:
    """Seed initial PS from career aggregates."""
    actual_score = (
        0.50 * norm(a["total_gold"], 0, 40)
        + 0.30 * norm(a["win_rate_proxy"], 0, 1.0)
        + 0.20 * norm(a["total_matches"], 0, 300)
    )

    consistency = (
        0.60 * norm(a["medal_rate"], 0, 1.0)
        + 0.40 * norm(a["num_weight_classes"], 0, 5)
    )

    growth = (
        0.50 * norm(a["total_matches"], 0, 300)
        + 0.50 * norm(a["total_gold"], 0, 40)
    )

    fitness = norm(a["total_matches"], 0, 300)

    ai_score = 0.30 * actual_score + 0.25 * consistency + 0.25 * growth + 0.20 * fitness

    ps = (
        0.30 * actual_score
        + 0.20 * consistency
        + 0.15 * growth
        + 0.10 * fitness
        + 0.25 * ai_score
    )
    return round(clamp(ps), 4)


def calc_ai_score(a: dict) -> float:
    """Heuristic AI score."""
    gold_dominance = (
        0.50 * norm(a["total_gold"], 0, 40)
        + 0.50 * norm(a["win_rate_proxy"], 0, 1.0)
    )
    medal_depth = (
        0.50 * norm(a["total_medals"], 0, 80)
        + 0.30 * norm(a["medal_rate"], 0, 1.0)
        + 0.20 * norm(a["num_weight_classes"], 0, 5)
    )
    experience = norm(a["total_matches"], 0, 300)

    raw = 0.45 * gold_dominance + 0.30 * medal_depth + 0.25 * experience
    return round(clamp(raw), 4)


def calc_total_shares(a: dict) -> float:
    """Total share supply (500–10,000)."""
    raw = (
        0.30 * norm(a["total_matches"], 0, 300)
        + 0.30 * norm(a["total_gold"], 0, 40)
        + 0.20 * norm(a["total_medals"], 0, 80)
        + 0.20 * norm(a["num_weight_classes"], 0, 5)
    )
    return round(500 + raw * 9500, 0)


def calc_liquidity_pool_balance(total_shares: float, current_price: float) -> float:
    """Seed liquidity pool at 15% of total market cap."""
    return round(0.15 * total_shares * current_price, 2)


def calculate_all(career_stats: dict) -> dict:
    """Return all computed parameters for a wrestler's career_stats."""
    a = aggregate(career_stats)
    ps = calc_performance_score(a)
    ai = calc_ai_score(a)
    bv = calc_base_value(a)
    alpha = calc_alpha(a)
    cp = round(bv * (1 + alpha * ps), 2)
    ts = calc_total_shares(a)
    lpb = calc_liquidity_pool_balance(ts, cp)
    return dict(
        base_value=bv,
        alpha=alpha,
        beta=calc_beta(a),
        gamma=calc_gamma(a),
        performance_score=ps,
        ai_score=ai,
        fundamental_value=cp,
        current_price=cp,
        total_shares=ts,
        liquidity_pool_balance=lpb,
    )


# ── main ─────────────────────────────────────────────────────────

async def run(player_id: str | None = None):
    import certifi
    from app.core.config import get_settings

    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_uri, tlsCAFile=certifi.where())
    db = client[settings.mongo_db]

    query: dict = {"sport": {"$regex": "^wrestling$", "$options": "i"}}
    if player_id:
        query["_id"] = ObjectId(player_id)

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
        print(f"      weight_classes={agg['num_weight_classes']}  matches={agg['total_matches']}  gold={agg['total_gold']}  silver={agg['total_silver']}  bronze={agg['total_bronze']}")
        print(f"      medal_rate={agg['medal_rate']:.2f}  win_rate={agg['win_rate_proxy']:.2f}")
        print(f"      base_value={params['base_value']}  alpha={params['alpha']}  beta={params['beta']}  gamma={params['gamma']}")
        print(f"      performance_score={params['performance_score']}  ai_score={params['ai_score']}")
        print(f"      fundamental_value={params['fundamental_value']}  current_price={params['current_price']}")
        print(f"      total_shares={params['total_shares']}  liquidity_pool_balance={params['liquidity_pool_balance']}")

    if updated == 0:
        if player_id:
            print(f"⚠️  Player {player_id} not found or has no career_stats")
        else:
            print("⚠️  No wrestling players with career_stats found in the database")
    else:
        print(f"\n🤼 Updated {updated} wrestler(s)")

    client.close()


if __name__ == "__main__":
    pid = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(run(pid))
