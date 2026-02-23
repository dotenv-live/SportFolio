"""
Dividend Engine – daily accrual of income to share-holders.

When a verified income event is added:
    • 10 % → Investor pool (distributed proportionally by shares)
    • 3 %  → Liquidity pool (added to athlete.liquidity_pool_balance)
    • 2 %  → Platform reserve (not implemented yet – logged)

Daily dividend accrual:
    DailyDividendPerShare = (0.10 * income) / (days_in_period * total_shares)

The accrual is time-weighted:
    pending = DailyDividendPerShare * shares_owned * days_since_last_accrual
"""
from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_settings


async def distribute_income_event(
    db: AsyncIOMotorDatabase,
    income_event_id: str | ObjectId,
) -> dict:
    """
    Process a single IncomeEvent:
        1. Mark as distributed.
        2. Add 3 % to liquidity pool.
        3. Record investor pool per share for daily accrual.
    """
    if isinstance(income_event_id, str):
        income_event_id = ObjectId(income_event_id)

    settings = get_settings()
    event = await db.income_events.find_one({"_id": income_event_id})
    if event is None:
        raise ValueError("Income event not found")
    if event.get("distributed"):
        return {"status": "already_distributed"}

    athlete_id = event["athlete_id"]
    income = event["verified_income"]

    athlete = await db.athletes.find_one({"_id": athlete_id})
    if athlete is None:
        raise ValueError("Athlete not found")

    investor_pool = settings.investor_income_share * income     # 10 %
    liquidity_add = settings.liquidity_income_share * income     # 3 %
    platform_reserve = settings.platform_income_share * income   # 2 %

    # Add to liquidity pool
    await db.athletes.update_one(
        {"_id": athlete_id},
        {"$inc": {"liquidity_pool_balance": liquidity_add}},
    )

    # Store per-share daily rate on the event for accrual
    total_shares = athlete["total_shares"]
    # Assume income covers 30-day period by default; overridable via field
    days_in_period = event.get("period_days", 30)
    daily_rate_per_share = investor_pool / (days_in_period * total_shares) if total_shares > 0 else 0

    await db.income_events.update_one(
        {"_id": income_event_id},
        {"$set": {
            "distributed": True,
            "investor_pool": investor_pool,
            "liquidity_add": liquidity_add,
            "platform_reserve": platform_reserve,
            "daily_rate_per_share": daily_rate_per_share,
        }},
    )

    return {
        "investor_pool": investor_pool,
        "liquidity_add": liquidity_add,
        "platform_reserve": platform_reserve,
        "daily_rate_per_share": daily_rate_per_share,
    }


async def accrue_dividends_for_athlete(
    db: AsyncIOMotorDatabase,
    athlete_id: str | ObjectId,
    as_of: datetime | None = None,
) -> int:
    """
    Walk every holding for *athlete_id* and accrue pending dividends
    based on time-weighted daily rate.
    Returns count of holdings updated.
    """
    if isinstance(athlete_id, str):
        athlete_id = ObjectId(athlete_id)
    if as_of is None:
        as_of = datetime.now(timezone.utc)

    # Gather all distributed income events for this athlete
    events: List[dict] = []
    async for ev in db.income_events.find({"athlete_id": athlete_id, "distributed": True}):
        events.append(ev)

    if not events:
        return 0

    # Sum daily_rate_per_share across all active income events
    total_daily_rate = sum(e.get("daily_rate_per_share", 0) for e in events)

    updated = 0
    async for holding in db.holdings.find({"athlete_id": athlete_id, "shares_owned": {"$gt": 0}}):
        last_ts = holding.get("last_accrual_timestamp")
        if last_ts is None:
            last_ts = holding.get("created_at", as_of)
        if last_ts.tzinfo is None:
            last_ts = last_ts.replace(tzinfo=timezone.utc)

        days_elapsed = (as_of - last_ts).total_seconds() / 86400.0
        if days_elapsed <= 0:
            continue

        accrual = total_daily_rate * holding["shares_owned"] * days_elapsed

        await db.holdings.update_one(
            {"_id": holding["_id"]},
            {
                "$inc": {"accrued_dividend": accrual},
                "$set": {"last_accrual_timestamp": as_of},
            },
        )
        updated += 1

    return updated


async def accrue_dividends_all(
    db: AsyncIOMotorDatabase,
    as_of: datetime | None = None,
) -> dict:
    """Run daily accrual for every athlete that has distributed events."""
    athlete_ids = await db.income_events.distinct("athlete_id", {"distributed": True})
    total_updated = 0
    for aid in athlete_ids:
        total_updated += await accrue_dividends_for_athlete(db, aid, as_of)
    return {"athletes_processed": len(athlete_ids), "holdings_updated": total_updated}


async def accrue_for_holding(
    db: AsyncIOMotorDatabase,
    holding_id: str | ObjectId,
    as_of: datetime | None = None,
) -> float:
    """
    Accrue dividends for a single holding (used before sell / view).
    Returns accrued amount added.
    """
    if isinstance(holding_id, str):
        holding_id = ObjectId(holding_id)
    if as_of is None:
        as_of = datetime.now(timezone.utc)

    holding = await db.holdings.find_one({"_id": holding_id})
    if not holding:
        return 0.0

    athlete_id = holding["athlete_id"]
    events = []
    async for ev in db.income_events.find({"athlete_id": athlete_id, "distributed": True}):
        events.append(ev)

    total_daily_rate = sum(e.get("daily_rate_per_share", 0) for e in events)

    last_ts = holding.get("last_accrual_timestamp")
    if last_ts is None:
        last_ts = holding.get("created_at", as_of)
    if last_ts.tzinfo is None:
        last_ts = last_ts.replace(tzinfo=timezone.utc)

    days_elapsed = (as_of - last_ts).total_seconds() / 86400.0
    if days_elapsed <= 0:
        return 0.0

    accrual = total_daily_rate * holding["shares_owned"] * days_elapsed

    await db.holdings.update_one(
        {"_id": holding["_id"]},
        {
            "$inc": {"accrued_dividend": accrual},
            "$set": {"last_accrual_timestamp": as_of},
        },
    )
    return accrual
