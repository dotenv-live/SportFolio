"""
Backfill script – recompute per-bout scores & price history for wrestling players.

For each wrestling player, walks through bouts chronologically and at each bout:
    1. Computes C, G, F, A, AI, PS using all bouts up to (and including) that point
    2. Stores the sub-scores on the ``player_matches`` document
    3. Derives price via FV → DI → smooth → price_history snapshot

Usage:
    cd backend/
    .venv/bin/python -m app.scripts.backfill_wrestling_scores
"""
from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime, timezone

import certifi
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings
from app.services.wrestling_performance import (
    compute_ai_score,
    compute_actual,
    compute_consistency,
    compute_fitness,
    compute_growth,
    compute_performance_score,
    DEFAULT_PHI,
)
from app.services.price_engine import (
    compute_demand_impact,
    compute_fundamental_value,
    compute_raw_price,
    smooth_price,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger("backfill_wrestling")


async def backfill() -> None:
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_uri, tlsCAFile=certifi.where())
    db = client[settings.mongo_db]

    # ── Find all wrestling players (case-insensitive) ────────────────
    wrestling_re = re.compile(r"^wrestling$", re.IGNORECASE)
    players = []
    async for p in db.players.find({"sport": wrestling_re}):
        players.append(p)

    if not players:
        logger.warning("No wrestling players found – nothing to backfill.")
        client.close()
        return

    logger.info("Found %d wrestling player(s) to backfill.", len(players))

    # ── Fetch sport config for AI weights / phi / metrics ────────────
    sport_config = await db.sports.find_one({"name": wrestling_re})
    ai_weights = sport_config.get("ai_weights") if sport_config else None
    phi = sport_config.get("phi", DEFAULT_PHI) if sport_config else DEFAULT_PHI
    metrics = sport_config.get("metrics", []) if sport_config else []

    total_history = 0
    total_bouts_updated = 0

    for player in players:
        pid = player["_id"]
        pname = player.get("name", str(pid))
        base_value = player.get("base_value", 50.0)
        alpha = player.get("alpha", 0.8)
        beta = player.get("beta", 0.05)
        float_shares = player.get("circulating_shares", player.get("total_shares", 1.0))
        is_injured = player.get("is_injured", False)

        # ── Gather all bouts, oldest-first ────────────────────────────
        bouts_asc: list[dict] = []
        async for m in db.player_matches.find({"player_id": pid}).sort("date", 1):
            bouts_asc.append(m)

        if not bouts_asc:
            logger.info("  %s: 0 bouts – skipping.", pname)
            continue

        # ── Delete existing price_history (we rebuild it) ─────────────
        del_result = await db.price_history.delete_many({"player_id": pid})
        logger.info(
            "  %s: cleared %d old price_history rows, processing %d bouts …",
            pname, del_result.deleted_count, len(bouts_asc),
        )

        prev_price = base_value
        history_docs = []

        for idx in range(len(bouts_asc)):
            window = list(reversed(bouts_asc[: idx + 1]))
            current_bout = bouts_asc[idx]

            # ── Compute sub-scores ───────────────────────────────────
            consistency = compute_consistency(window, metrics=metrics)
            growth = compute_growth(window, metrics=metrics)
            fitness = compute_fitness(window, is_injured=is_injured)
            ai = compute_ai_score("Wrestling", ai_weights, window)
            actual = compute_actual(window, ai, phi=phi, metrics=metrics)
            ps = compute_performance_score(actual, consistency, growth, fitness, ai)

            # ── Derive price ─────────────────────────────────────────
            fv = compute_fundamental_value(base_value, alpha, ps)
            di = compute_demand_impact(beta, float_shares, player.get("total_shares", 1.0))
            p_raw = compute_raw_price(fv, di)
            p_final = smooth_price(p_raw, prev_price)
            prev_price = p_final

            # ── Stamp scores onto bout document ──────────────────────
            await db.player_matches.update_one(
                {"_id": current_bout["_id"]},
                {
                    "$set": {
                        "scores": {
                            "consistency": round(consistency, 6),
                            "growth": round(growth, 6),
                            "fitness": round(fitness, 6),
                            "actual": round(actual, 6),
                            "ai": round(ai, 6),
                            "performance_score": round(ps, 6),
                        },
                        "price_snapshot": {
                            "price": round(p_final, 2),
                            "fundamental_value": round(fv, 2),
                            "performance_score": round(ps, 6),
                        },
                    }
                },
            )
            total_bouts_updated += 1

            # ── Build price_history entry ────────────────────────────
            bout_date_str = current_bout.get("date")
            if bout_date_str:
                try:
                    ts = datetime.strptime(bout_date_str, "%Y-%m-%d").replace(
                        tzinfo=timezone.utc
                    )
                except (ValueError, TypeError):
                    ts = datetime.now(timezone.utc)
            else:
                ts = datetime.now(timezone.utc)

            history_docs.append({
                "player_id": pid,
                "price": round(p_final, 2),
                "fundamental_value": round(fv, 2),
                "performance_score": round(ps, 6),
                "timestamp": ts,
            })

        # ── Bulk insert price_history ────────────────────────────────
        if history_docs:
            await db.price_history.insert_many(history_docs)
            total_history += len(history_docs)

        # ── Update player doc with latest scores ─────────────────────
        last = history_docs[-1] if history_docs else None
        if last:
            latest_window = list(reversed(bouts_asc))
            c = compute_consistency(latest_window, metrics=metrics)
            g = compute_growth(latest_window, metrics=metrics)
            f = compute_fitness(latest_window, is_injured=is_injured)
            ai_final = compute_ai_score("Wrestling", ai_weights, latest_window)
            a_final = compute_actual(latest_window, ai_final, phi=phi, metrics=metrics)
            ps_final = compute_performance_score(a_final, c, g, f, ai_final)

            await db.players.update_one(
                {"_id": pid},
                {
                    "$set": {
                        "performance_score": ps_final,
                        "ai_score": ai_final,
                        "consistency_score": c,
                        "growth_score": g,
                        "fitness_score": f,
                        "actual_score": a_final,
                        "fundamental_value": last["fundamental_value"],
                        "current_price": last["price"],
                        "last_updated": datetime.now(timezone.utc),
                    }
                },
            )

        logger.info(
            "  %s: %d bouts scored, %d price_history rows, latest price=%.2f",
            pname, len(bouts_asc), len(history_docs),
            history_docs[-1]["price"] if history_docs else 0,
        )

    logger.info(
        "Backfill complete: %d bouts updated, %d price_history rows inserted.",
        total_bouts_updated, total_history,
    )
    client.close()


if __name__ == "__main__":
    asyncio.run(backfill())
