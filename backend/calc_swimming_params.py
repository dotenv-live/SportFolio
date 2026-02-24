#!/usr/bin/env python3
"""
Calculate and seed base_value, alpha, beta, gamma, performance_score, ai_score
from a swimmer's career_stats.

Usage:
    python calc_swimming_params.py              # all swimming players with career_stats
    python calc_swimming_params.py <player_id>  # single player

Formulas (all derived from career_stats aggregated across events):
────────────────────────────────────────────────────────────────────
The swimming career_stats format:
    {
        "100_free_lcm": {
            "label": "100m Freestyle (LCM)",
            "races": 35,
            "personal_best": {
                "time": "56.78",
                "time_ms": 56780,
                "date": "2025-06-25",
                "meet_name": "78th Senior National Aquatic Championships",
                "fina_points": 755
            },
            "medals": { "gold": 15, "silver": 4, "bronze": 2 }
        },
        ...
    }

base_value (10–200)
    Represents the intrinsic market value of the swimmer.
    Driven by best FINA points, total medals, total races, and medal rate.

    raw = (
        0.35 * norm(best_fina_points, 400, 950)
      + 0.20 * norm(avg_fina_points, 400, 900)
      + 0.20 * norm(total_gold, 0, 50)
      + 0.15 * norm(total_races, 0, 200)
      + 0.10 * norm(medal_rate, 0, 1.0)
    )
    base_value = 10 + raw * 190                   # scale to [10, 200]

alpha (0.3–1.0)  —  PS sensitivity
    How much performance_score swings the fundamental value.
    Elite swimmers with high FINA points and many golds get higher alpha.

    raw = (
        0.40 * norm(best_fina_points, 400, 950)
      + 0.30 * norm(total_gold, 0, 50)
      + 0.30 * norm(total_races, 0, 200)
    )
    alpha = 0.3 + raw * 0.7

beta (0.02–0.10)  —  demand sensitivity
    consistency → lower beta, more stable pricing.
    Swimmers with more races and higher medal rates get lower beta.

    raw = 1.0 - (
        0.40 * norm(total_races, 0, 200)
      + 0.30 * norm(medal_rate, 0, 1.0)
      + 0.30 * norm(num_events, 0, 8)
    )
    beta = 0.02 + raw * 0.08

gamma (0.05–0.15)  —  buyback discount
    More proven swimmers → lower gamma.

    raw = 1.0 - (
        0.40 * norm(total_races, 0, 200)
      + 0.30 * norm(best_fina_points, 400, 950)
      + 0.30 * norm(total_medals, 0, 100)
    )
    gamma = 0.05 + raw * 0.10

performance_score (0–1)
    actual_score   = FINA points + PB time quality
    consistency    = medal rate + multi-event versatility
    growth         = proxy from recent PB improvements
    fitness        = race frequency ratio
    ai_score       = heuristic blend

    PS = 0.30*A + 0.20*C + 0.15*G + 0.10*F + 0.25*AI

ai_score (0–1)
    Heuristic: blends FINA excellence, medal dominance, and experience.
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


# ── aggregate career_stats across all events ─────────────────────

def aggregate(career_stats: dict) -> dict:
    """Flatten per-event swimming career_stats into totals."""
    total_races = 0
    total_gold = 0
    total_silver = 0
    total_bronze = 0
    total_medals = 0
    num_events = 0
    best_fina = 0
    fina_sum = 0.0
    fina_count = 0
    best_time_ms = None  # lowest (fastest) PB across events
    pb_dates: list[str] = []

    for event_key, event in career_stats.items():
        if not isinstance(event, dict):
            continue

        num_events += 1
        races = event.get("races", 0)
        total_races += races

        medals = event.get("medals", {})
        g = medals.get("gold", 0)
        s = medals.get("silver", 0)
        b = medals.get("bronze", 0)
        total_gold += g
        total_silver += s
        total_bronze += b
        total_medals += g + s + b

        pb = event.get("personal_best", {})
        fina = pb.get("fina_points", 0)
        if fina > 0:
            best_fina = max(best_fina, fina)
            fina_sum += fina
            fina_count += 1

        time_ms = pb.get("time_ms", 0)
        if time_ms > 0:
            if best_time_ms is None or time_ms < best_time_ms:
                best_time_ms = time_ms

        pb_date = pb.get("date")
        if pb_date:
            pb_dates.append(pb_date)

    avg_fina = fina_sum / max(1, fina_count)
    medal_rate = total_medals / max(1, total_races)

    return dict(
        total_races=total_races,
        total_gold=total_gold,
        total_silver=total_silver,
        total_bronze=total_bronze,
        total_medals=total_medals,
        num_events=num_events,
        best_fina=best_fina,
        avg_fina=avg_fina,
        best_time_ms=best_time_ms,
        medal_rate=medal_rate,
        pb_dates=pb_dates,
    )


# ── parameter calculations ───────────────────────────────────────

def calc_base_value(a: dict) -> float:
    raw = (
        0.35 * norm(a["best_fina"], 400, 950)
        + 0.20 * norm(a["avg_fina"], 400, 900)
        + 0.20 * norm(a["total_gold"], 0, 50)
        + 0.15 * norm(a["total_races"], 0, 200)
        + 0.10 * norm(a["medal_rate"], 0, 1.0)
    )
    return round(10 + raw * 190, 2)


def calc_alpha(a: dict) -> float:
    raw = (
        0.40 * norm(a["best_fina"], 400, 950)
        + 0.30 * norm(a["total_gold"], 0, 50)
        + 0.30 * norm(a["total_races"], 0, 200)
    )
    return round(0.3 + raw * 0.7, 4)


def calc_beta(a: dict) -> float:
    raw = 1.0 - (
        0.40 * norm(a["total_races"], 0, 200)
        + 0.30 * norm(a["medal_rate"], 0, 1.0)
        + 0.30 * norm(a["num_events"], 0, 8)
    )
    return round(0.02 + clamp(raw) * 0.08, 4)


def calc_gamma(a: dict) -> float:
    raw = 1.0 - (
        0.40 * norm(a["total_races"], 0, 200)
        + 0.30 * norm(a["best_fina"], 400, 950)
        + 0.30 * norm(a["total_medals"], 0, 100)
    )
    return round(0.05 + clamp(raw) * 0.10, 4)


def calc_performance_score(a: dict) -> float:
    """Seed an initial PS from career aggregates."""
    # Actual score: FINA-based performance quality
    actual_score = (
        0.50 * norm(a["best_fina"], 400, 950)
        + 0.30 * norm(a["avg_fina"], 400, 900)
        + 0.20 * norm(a["total_gold"], 0, 50)
    )

    # Consistency: medal rate + multi-event versatility
    consistency = (
        0.60 * norm(a["medal_rate"], 0, 1.0)
        + 0.40 * norm(a["num_events"], 0, 8)
    )

    # Growth: proxy — number of recent PBs (more PBs = more improvement)
    # In absence of time-series data, use total_races as growth proxy
    growth = (
        0.50 * norm(a["total_races"], 0, 200)
        + 0.50 * norm(a["total_gold"], 0, 50)
    )

    # Fitness proxy: race availability
    fitness = norm(a["total_races"], 0, 200)

    # AI score placeholder
    ai_score = 0.30 * actual_score + 0.25 * consistency + 0.25 * growth + 0.20 * fitness

    # PS = standard weights
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
    fina_excellence = (
        0.50 * norm(a["best_fina"], 400, 950)
        + 0.50 * norm(a["avg_fina"], 400, 900)
    )
    medal_dominance = (
        0.50 * norm(a["total_gold"], 0, 50)
        + 0.30 * norm(a["total_medals"], 0, 100)
        + 0.20 * norm(a["medal_rate"], 0, 1.0)
    )
    experience = norm(a["total_races"], 0, 200)

    raw = 0.45 * fina_excellence + 0.30 * medal_dominance + 0.25 * experience
    return round(clamp(raw), 4)


def calc_total_shares(a: dict) -> float:
    """Total share supply (500–10,000).

    More established swimmers get more shares to provide deeper liquidity.
    Driven by races, FINA points, medals, and event breadth.

    raw = 0.30 * norm(total_races, 0, 200)
        + 0.30 * norm(best_fina, 400, 950)
        + 0.20 * norm(total_medals, 0, 100)
        + 0.20 * norm(num_events, 0, 8)
    total_shares = 500 + raw * 9500
    """
    raw = (
        0.30 * norm(a["total_races"], 0, 200)
        + 0.30 * norm(a["best_fina"], 400, 950)
        + 0.20 * norm(a["total_medals"], 0, 100)
        + 0.20 * norm(a["num_events"], 0, 8)
    )
    return round(500 + raw * 9500, 0)


def calc_liquidity_pool_balance(total_shares: float, current_price: float) -> float:
    """Seed liquidity pool at 15% of total market cap."""
    return round(0.15 * total_shares * current_price, 2)


def calculate_all(career_stats: dict) -> dict:
    """Return all computed parameters for a swimmer's career_stats."""
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

    query: dict = {"sport": {"$regex": "^swimming$", "$options": "i"}}
    if player_id:
        query["_id"] = ObjectId(player_id)

    # Only process swimming players that have career_stats
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
        print(f"      events={agg['num_events']}  races={agg['total_races']}  gold={agg['total_gold']}  silver={agg['total_silver']}  bronze={agg['total_bronze']}")
        print(f"      best_fina={agg['best_fina']}  avg_fina={agg['avg_fina']:.0f}  medal_rate={agg['medal_rate']:.2f}")
        print(f"      base_value={params['base_value']}  alpha={params['alpha']}  beta={params['beta']}  gamma={params['gamma']}")
        print(f"      performance_score={params['performance_score']}  ai_score={params['ai_score']}")
        print(f"      fundamental_value={params['fundamental_value']}  current_price={params['current_price']}")
        print(f"      total_shares={params['total_shares']}  liquidity_pool_balance={params['liquidity_pool_balance']}")

    if updated == 0:
        if player_id:
            print(f"⚠️  Player {player_id} not found or has no career_stats")
        else:
            print("⚠️  No swimming players with career_stats found in the database")
    else:
        print(f"\n🏊 Updated {updated} swimmer(s)")

    client.close()


if __name__ == "__main__":
    pid = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(run(pid))
