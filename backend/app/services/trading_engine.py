"""
Trading Engine – buy / sell logic with AMM buyback.

Buy flow:
    1. Validate wallet balance.
    2. Fraud precheck.
    3. Deduct wallet.
    4. Create / update holding.
    5. Increment buy_volume on athlete.
    6. Recalculate price.
    7. Record transaction.

Sell flow:
    1. Accrue pending dividends first.
    2. Try internal liquidity match (simulated order-book).
    3. If no buyer → AMM buyback:
        BuybackPrice = current_price * (1 - gamma)
        Deduct from liquidity pool.
    4. Credit wallet (sale + accrued dividends).
    5. Increment sell_volume on athlete.
    6. Recalculate price.
    7. Record transaction.
"""
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.fraud import audit_event, fraud_precheck
from app.services.dividend_engine import accrue_for_holding
from app.services.price_engine import recalculate_athlete_price


async def buy_shares(
    db: AsyncIOMotorDatabase,
    user_id: str | ObjectId,
    athlete_id: str | ObjectId,
    shares: float,
) -> dict:
    """
    Execute a buy order.
    Returns transaction summary dict.
    """
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    if isinstance(athlete_id, str):
        athlete_id = ObjectId(athlete_id)

    # ---------- load data ----------
    user = await db.users.find_one({"_id": user_id})
    athlete = await db.athletes.find_one({"_id": athlete_id})
    if user is None:
        raise ValueError("User not found")
    if athlete is None:
        raise ValueError("Athlete not found")

    price = athlete["current_price"]
    total_cost = price * shares

    # ---------- fraud check ----------
    fraud_reason = fraud_precheck(str(user_id), str(athlete_id), shares, price)
    if fraud_reason:
        raise ValueError(f"Fraud check failed: {fraud_reason}")

    # ---------- wallet check ----------
    if user["wallet_balance"] < total_cost:
        raise ValueError("Insufficient wallet balance")

    # ---------- check available shares ----------
    issued = athlete.get("circulating_shares", 0)
    available = athlete["total_shares"] - issued
    if shares > available:
        raise ValueError(f"Only {available} shares available for purchase")

    # ---------- deduct wallet ----------
    await db.users.update_one(
        {"_id": user_id},
        {"$inc": {"wallet_balance": -total_cost}},
    )

    # ---------- upsert holding ----------
    now = datetime.now(timezone.utc)
    existing = await db.holdings.find_one({"user_id": user_id, "athlete_id": athlete_id})
    if existing:
        await db.holdings.update_one(
            {"_id": existing["_id"]},
            {"$inc": {"shares_owned": shares}},
        )
    else:
        await db.holdings.insert_one({
            "user_id": user_id,
            "athlete_id": athlete_id,
            "shares_owned": shares,
            "accrued_dividend": 0.0,
            "last_accrual_timestamp": now,
        })

    # ---------- increment buy volume & circulating ----------
    await db.athletes.update_one(
        {"_id": athlete_id},
        {"$inc": {"buy_volume": shares, "circulating_shares": shares}},
    )

    # ---------- recalculate price ----------
    pricing = await recalculate_athlete_price(db, athlete_id)

    # ---------- record transaction ----------
    txn = {
        "type": "buy",
        "user_id": user_id,
        "athlete_id": athlete_id,
        "shares": shares,
        "price": price,
        "timestamp": now,
    }
    result = await db.transactions.insert_one(txn)
    audit_event("buy", {"txn_id": str(result.inserted_id), "user": str(user_id)})

    return {
        "transaction_id": str(result.inserted_id),
        "shares": shares,
        "price_per_share": price,
        "total_cost": total_cost,
        "new_price": pricing["current_price"],
    }


async def sell_shares(
    db: AsyncIOMotorDatabase,
    user_id: str | ObjectId,
    athlete_id: str | ObjectId,
    shares: float,
) -> dict:
    """
    Execute a sell order with AMM buyback fallback.
    Returns transaction summary dict.
    """
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    if isinstance(athlete_id, str):
        athlete_id = ObjectId(athlete_id)

    # ---------- load data ----------
    user = await db.users.find_one({"_id": user_id})
    athlete = await db.athletes.find_one({"_id": athlete_id})
    holding = await db.holdings.find_one({"user_id": user_id, "athlete_id": athlete_id})

    if user is None:
        raise ValueError("User not found")
    if athlete is None:
        raise ValueError("Athlete not found")
    if holding is None or holding["shares_owned"] < shares:
        raise ValueError("Insufficient shares to sell")

    # ---------- accrue dividends first ----------
    now = datetime.now(timezone.utc)
    accrued = await accrue_for_holding(db, holding["_id"], as_of=now)

    # Reload holding after accrual
    holding = await db.holdings.find_one({"_id": holding["_id"]})
    total_dividend = holding["accrued_dividend"]

    price = athlete["current_price"]
    gamma = athlete["gamma"]

    # ---------- fraud check ----------
    fraud_reason = fraud_precheck(str(user_id), str(athlete_id), shares, price)
    if fraud_reason:
        raise ValueError(f"Fraud check failed: {fraud_reason}")

    # ---------- try internal liquidity match (simulated) ----------
    # In production: scan pending buy orders for the same athlete.
    # For now, fall straight through to AMM buyback.
    internal_matched = 0.0  # shares matched internally
    remaining = shares - internal_matched

    # ---------- AMM buyback for remaining ----------
    buyback_price = price * (1.0 - gamma)
    buyback_cost = buyback_price * remaining

    liq_pool = athlete.get("liquidity_pool_balance", 0.0)
    if buyback_cost > liq_pool:
        # Partial fill up to what pool can cover
        if liq_pool > 0:
            remaining = liq_pool / buyback_price
            buyback_cost = liq_pool
        else:
            raise ValueError("Liquidity pool exhausted – cannot complete sell")

    total_proceeds = (internal_matched * price) + (remaining * buyback_price) + total_dividend

    # ---------- update liquidity pool ----------
    await db.athletes.update_one(
        {"_id": athlete_id},
        {"$inc": {"liquidity_pool_balance": -buyback_cost}},
    )

    # ---------- update holding ----------
    new_shares = holding["shares_owned"] - (internal_matched + remaining)
    if new_shares <= 0:
        await db.holdings.delete_one({"_id": holding["_id"]})
    else:
        await db.holdings.update_one(
            {"_id": holding["_id"]},
            {"$set": {"shares_owned": new_shares, "accrued_dividend": 0.0}},
        )

    # ---------- credit wallet ----------
    await db.users.update_one(
        {"_id": user_id},
        {"$inc": {"wallet_balance": total_proceeds}},
    )

    # ---------- increment sell volume & decrease circulating ----------
    sold_total = internal_matched + remaining
    await db.athletes.update_one(
        {"_id": athlete_id},
        {"$inc": {"sell_volume": sold_total, "circulating_shares": -sold_total}},
    )

    # ---------- recalculate price ----------
    pricing = await recalculate_athlete_price(db, athlete_id)

    # ---------- record transaction(s) ----------
    txn_type = "liquidity_buyback" if remaining > 0 else "sell"
    txn = {
        "type": txn_type,
        "user_id": user_id,
        "athlete_id": athlete_id,
        "shares": sold_total,
        "price": buyback_price if remaining > 0 else price,
        "timestamp": now,
    }
    result = await db.transactions.insert_one(txn)

    # Record dividend payout transaction
    if total_dividend > 0:
        await db.transactions.insert_one({
            "type": "dividend",
            "user_id": user_id,
            "athlete_id": athlete_id,
            "shares": 0,
            "price": total_dividend,
            "timestamp": now,
        })

    audit_event("sell", {"txn_id": str(result.inserted_id), "user": str(user_id)})

    return {
        "transaction_id": str(result.inserted_id),
        "shares_sold": sold_total,
        "internal_matched": internal_matched,
        "buyback_shares": remaining,
        "buyback_price": buyback_price,
        "dividend_paid": total_dividend,
        "total_proceeds": total_proceeds,
        "new_price": pricing["current_price"],
    }
