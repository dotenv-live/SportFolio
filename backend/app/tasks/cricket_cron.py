"""
Cricket performance cron job – daily batch computation of PS for cricket players.

Fetches all players with sport == "Cricket", computes sub-scores
(C, G, F, A, AI, PS) via CricketPerformanceEngine, persists updates
to the ``players`` collection, and logs a summary.

Designed for APScheduler (async); the schedule is registered in
``app/tasks/scheduler.py`` and the cron hour/minute are configurable
via ``app/core/config.py``.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.db.mongo import mongodb
from app.services.cricket_performance import compute_all_scores

logger = logging.getLogger("sportfolio.tasks.cricket_cron")


async def daily_cricket_performance_update() -> None:
    """
    Cron entry-point: recompute and persist PS for every cricket player.

    Steps
    -----
    1. Ensure DB connection is available.
    2. Query all players where ``sport == "Cricket"``.
    3. For each player, call ``compute_all_scores`` (C, G, F, A, AI, PS).
    4. ``$set`` the player document with new sub-scores + ``last_updated``.
    5. Log the number of players updated and any per-player errors.
    """
    db = mongodb.db
    if db is None:
        logger.warning("DB not connected – skipping cricket performance update")
        return

    updated = 0
    errors = 0

    try:
        cursor = db.players.find({"sport": {"$regex": "^cricket$", "$options": "i"}})
        async for player in cursor:
            player_id = player["_id"]
            player_name = player.get("name", str(player_id))
            try:
                scores = await compute_all_scores(db, player)

                await db.players.update_one(
                    {"_id": player_id},
                    {
                        "$set": {
                            "performance_score": scores.performance_score,
                            "ai_score": scores.ai,
                            "consistency_score": scores.consistency,
                            "growth_score": scores.growth,
                            "fitness_score": scores.fitness,
                            "actual_score": scores.actual,
                            "last_updated": datetime.now(timezone.utc),
                        }
                    },
                )
                updated += 1
                logger.debug(
                    "Updated %s: PS=%.4f  C=%.4f  G=%.4f  F=%.4f  A=%.4f  AI=%.4f",
                    player_name,
                    scores.performance_score,
                    scores.consistency,
                    scores.growth,
                    scores.fitness,
                    scores.actual,
                    scores.ai,
                )
            except Exception:
                errors += 1
                logger.exception(
                    "Error computing performance for player %s (%s)",
                    player_name,
                    player_id,
                )

        logger.info(
            "Cricket performance cron complete: %d players updated, %d errors",
            updated,
            errors,
        )
    except Exception:
        logger.exception("Fatal error in cricket performance cron job")
