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

from app.db.mongo import mongodb
from app.services.dividend_engine import accrue_dividends_all
from app.services.price_engine import recalculate_athlete_price
from app.ai.predictor import ai_predictor

logger = logging.getLogger("sportfolio.tasks")

scheduler = AsyncIOScheduler()


async def daily_dividend_accrual() -> None:
    """Accrue dividends for all athletes / holdings."""
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
    """Retrain AI models on all match stats."""
    db = mongodb.db
    if db is None:
        logger.warning("DB not connected – skipping AI retrain")
        return
    try:
        all_stats = []
        async for stat in db.match_stats.find():
            all_stats.append(stat)
        result = ai_predictor.retrain(all_stats)
        logger.info("Weekly AI retrain: %s", result)

        # Update ai_score for every athlete
        async for athlete in db.athletes.find():
            stats = []
            async for s in db.match_stats.find({"athlete_id": athlete["_id"]}):
                stats.append(s)
            if stats:
                score = ai_predictor.compute_ai_score(stats)
                await db.athletes.update_one(
                    {"_id": athlete["_id"]},
                    {"$set": {"ai_score": score}},
                )
                await recalculate_athlete_price(db, athlete["_id"])
        logger.info("AI scores updated for all athletes")
    except Exception:
        logger.exception("Error in weekly AI retrain")


async def price_recalc_all() -> None:
    """Recalculate prices for every athlete."""
    db = mongodb.db
    if db is None:
        return
    try:
        async for athlete in db.athletes.find():
            await recalculate_athlete_price(db, athlete["_id"])
        logger.info("Price recalculation complete for all athletes")
    except Exception:
        logger.exception("Error in price recalculation")


async def liquidity_audit_task() -> None:
    """Log liquidity pool discrepancies."""
    db = mongodb.db
    if db is None:
        return
    try:
        async for athlete in db.athletes.find():
            total_added = 0.0
            async for ev in db.income_events.find({"athlete_id": athlete["_id"], "distributed": True}):
                total_added += ev.get("liquidity_add", 0.0)
            total_used = 0.0
            async for txn in db.transactions.find({"athlete_id": athlete["_id"], "type": "liquidity_buyback"}):
                total_used += txn["price"] * txn["shares"]
            expected = total_added - total_used
            actual = athlete.get("liquidity_pool_balance", 0.0)
            if abs(actual - expected) > 0.01:
                logger.warning(
                    "Liquidity discrepancy for %s: expected=%.4f actual=%.4f",
                    athlete["name"], expected, actual,
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
    scheduler.start()
    logger.info("Background scheduler started with %d jobs", len(scheduler.get_jobs()))


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
