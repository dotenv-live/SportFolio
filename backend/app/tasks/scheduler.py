"""
Background tasks scheduled via FastAPI BackgroundTasks or APScheduler.

Tasks:
    1. daily_dividend_accrual   – runs every 24 h
    2. weekly_ai_retrain        – runs every 7 days
    3. price_recalc_all         – runs after match-stat update (also schedulable)
    4. liquidity_audit          – runs daily
"""
import asyncio
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import get_settings
from app.db.mongo import mongodb
from app.services.dividend_engine import accrue_dividends_all
from app.services.price_engine import recalculate_player_price
from app.services.sport_config import sport_config_service
from app.ai.predictor import ai_predictor
from app.ai.model_resolver import ml_model_resolver
from app.tasks.cricket_cron import daily_cricket_performance_update

logger = logging.getLogger("sportfolio.tasks")

scheduler = AsyncIOScheduler()


async def daily_dividend_accrual() -> None:
    """Accrue dividends for all players / holdings."""
    db = mongodb.db
    if db is None:
        logger.warning("DB not connected – skipping dividend accrual")
        return
    try:
        result = await accrue_dividends_all(db)
        logger.info("Daily dividend accrual: %s", result)
    except Exception:
        logger.exception("Error in daily dividend accrual")


async def weekly_ai_retrain() -> None:
    """Retrain AI models per sport (sport-isolated, no cross-sport contamination)."""
    db = mongodb.db
    if db is None:
        logger.warning("DB not connected – skipping AI retrain")
        return
    try:
        # Group players by sport
        sports = await db.players.distinct("sport")
        for sport_name in sports:
            # Collect all match stats for players in this sport
            player_ids = []
            async for player in db.players.find({"sport": sport_name}):
                player_ids.append(player["_id"])

            sport_stats = []
            for pid in player_ids:
                async for s in db.player_matches.find({"player_id": pid}):
                    sport_stats.append(s)

            if not sport_stats:
                continue

            # Retrain models for this sport
            result = ml_model_resolver.retrain(sport_name, sport_stats)
            logger.info("AI retrain for sport=%s: %s", sport_name, result)

            # Update ai_score per player using sport-specific weights
            sport_config = await sport_config_service.get_by_name(db, sport_name)
            ai_weights = sport_config.get("ai_weights") if sport_config else None

            for pid in player_ids:
                stats = []
                async for s in db.player_matches.find({"player_id": pid}):
                    stats.append(s)
                if stats:
                    score = ml_model_resolver.compute_ai_score(sport_name, ai_weights, stats)
                    await db.players.update_one(
                        {"_id": pid},
                        {"$set": {"ai_score": score}},
                    )
                    await recalculate_player_price(db, pid)

        logger.info("Sport-isolated AI retrain complete for %d sports", len(sports))
    except Exception:
        logger.exception("Error in weekly AI retrain")


async def price_recalc_all() -> None:
    """Recalculate prices for every player."""
    db = mongodb.db
    if db is None:
        return
    try:
        async for player in db.players.find():
            await recalculate_player_price(db, player["_id"])
        logger.info("Price recalculation complete for all players")
    except Exception:
        logger.exception("Error in price recalculation")


async def liquidity_audit_task() -> None:
    """Log liquidity pool discrepancies."""
    db = mongodb.db
    if db is None:
        return
    try:
        async for player in db.players.find():
            total_added = 0.0
            async for ev in db.income_events.find({"player_id": player["_id"], "distributed": True}):
                total_added += ev.get("liquidity_add", 0.0)
            total_used = 0.0
            async for txn in db.transactions.find({"player_id": player["_id"], "type": "liquidity_buyback"}):
                total_used += txn["price"] * txn["shares"]
            expected = total_added - total_used
            actual = player.get("liquidity_pool_balance", 0.0)
            if abs(actual - expected) > 0.01:
                logger.warning(
                    "Liquidity discrepancy for %s: expected=%.4f actual=%.4f",
                    player["name"], expected, actual,
                )
    except Exception:
        logger.exception("Error in liquidity audit")


def start_scheduler() -> None:
    """Register all cron jobs and start the scheduler."""
    # Daily at 00:05 UTC
    scheduler.add_job(
        daily_dividend_accrual,
        CronTrigger(hour=0, minute=5),
        id="daily_dividend_accrual",
        replace_existing=True,
    )
    # Weekly on Sunday at 02:00 UTC
    scheduler.add_job(
        weekly_ai_retrain,
        CronTrigger(day_of_week="sun", hour=2, minute=0),
        id="weekly_ai_retrain",
        replace_existing=True,
    )
    # Daily at 00:30 UTC
    scheduler.add_job(
        price_recalc_all,
        CronTrigger(hour=0, minute=30),
        id="price_recalc_all",
        replace_existing=True,
    )
    # Daily at 01:00 UTC
    scheduler.add_job(
        liquidity_audit_task,
        CronTrigger(hour=1, minute=0),
        id="liquidity_audit",
        replace_existing=True,
    )
    # Daily cricket performance score update (configurable UTC time)
    settings = get_settings()
    scheduler.add_job(
        daily_cricket_performance_update,
        CronTrigger(
            hour=settings.cricket_perf_cron_hour,
            minute=settings.cricket_perf_cron_minute,
        ),
        id="daily_cricket_performance",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Background scheduler started with %d jobs", len(scheduler.get_jobs()))


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
