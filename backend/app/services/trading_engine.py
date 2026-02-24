"""
Trading Engine – buy / sell logic with AMM buyback.

Buy flow:
    1. Validate wallet balance.
    2. Fraud precheck.
    3. Deduct wallet.
    4. Create / update holding.
    5. Increment buy_volume on player.
    6. Recalculate price.
    7. Record transaction.

Sell flow:
    1. Accrue pending dividends first.
    2. Try internal liquidity match (simulated order-book).
    3. If no buyer → AMM buyback:
        BuybackPrice = current_price * (1 - gamma)
        Deduct from liquidity pool.
    4. Credit wallet (sale + accrued dividends).
    5. Increment sell_volume on player.
    6. Recalculate price.
    7. Record transaction.
"""
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.fraud import audit_event, fraud_precheck
from app.services.dividend_engine import accrue_for_holding
from app.core.ws_manager import ws_manager


def _calculate_price_impact(
    beta: float,
    shares: float,
    total_shares: float,
    current_price: float,
    fundamental_value: float,
    direction: int,
) -> float:
    """Calculate what the price would be after a trade (without executing).

    Applies the change in DI as an incremental delta on top of the current
    price so that buys always push the price UP and sells always push DOWN,
    regardless of where current_price sits relative to FV × DI.

        delta = direction × FV × β × (shares / total_shares)
        new_price = current_price + delta

    The delta magnitude is derived from the FV × DI formula used by the
    cron price engine, keeping trade-time and cron-time consistent.

    direction: +1 for buy, -1 for sell.
    """
    delta = direction * fundamental_value * beta * (shares / max(total_shares, 1.0))
    new_price = max(0.01, current_price + delta)
    return round(new_price, 2)


async def calculate_exit_price(
    db: AsyncIOMotorDatabase,
    player_id: ObjectId,
    shares: float,
) -> float:
    """Calculate the effective price if selling the given number of shares.

    This accounts for the negative price impact (exit spread).
    Returns the price the market would move to after the sell.
    """
    doc = await db.players.find_one({"_id": player_id})
    beta = doc.get("beta", 0.05)
    total_shares = doc.get("total_shares", 1.0)
    current_price = doc.get("current_price", 1.0)
    fv = doc.get("fundamental_value", current_price)

    exit_price = _calculate_price_impact(
        beta, shares, total_shares, current_price, fv, direction=-1,
    )
    return exit_price


async def _apply_price_delta(
    db: AsyncIOMotorDatabase,
    player_id: ObjectId,
    shares: float,
    direction: int,  # +1 for buy, -1 for sell
) -> dict:
    """Apply an incremental price delta based on the FV × DI formula.

    delta = direction × FV × β × (shares / total_shares)
    new_price = current_price + delta

    Buys always push the price UP; sells always push it DOWN.
    The cron's recalculate_player_price anchors the price to FV × DI
    over time via smoothing.

    Returns {"current_price": new, "fundamental_value": fv}.
    """
    doc = await db.players.find_one({"_id": player_id})
    beta = doc.get("beta", 0.05)
    total_shares = doc.get("total_shares", 1.0)
    current_price = doc.get("current_price", 1.0)
    fv = doc.get("fundamental_value", current_price)

    new_price = _calculate_price_impact(
        beta, shares, total_shares, current_price, fv, direction,
    )

    await db.players.update_one(
        {"_id": player_id},
        {"$set": {"current_price": new_price}},
    )

    # Record price snapshot
    await db.price_history.insert_one({
        "player_id": player_id,
        "price": new_price,
        "fundamental_value": fv,
        "performance_score": doc.get("performance_score", 0.0),
        "timestamp": datetime.now(timezone.utc),
    })

    return {"current_price": new_price, "fundamental_value": fv}


async def buy_shares(
    db: AsyncIOMotorDatabase,
    user_id: str | ObjectId,
    player_id: str | ObjectId,
    shares: float,
) -> dict:
    """
    Execute a buy order.
    Returns transaction summary dict.
    """
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    if isinstance(player_id, str):
        player_id = ObjectId(player_id)

    # ---------- load data ----------
    user = await db.users.find_one({"_id": user_id})
    player = await db.players.find_one({"_id": player_id})
    if user is None:
        raise ValueError("User not found")
    if player is None:
        raise ValueError("Player not found")

    price = player["current_price"]
    total_cost = price * shares

    # ---------- fraud check ----------
    fraud_reason = fraud_precheck(str(user_id), str(player_id), shares, price)
    if fraud_reason:
        raise ValueError(f"Fraud check failed: {fraud_reason}")

    # ---------- wallet check ----------
    if user["wallet_balance"] < total_cost:
        raise ValueError("Insufficient wallet balance")

    # ---------- check available shares ----------
    issued = player.get("circulating_shares", 0)
    available = player["total_shares"] - issued
    if shares > available:
        raise ValueError(f"Only {available} shares available for purchase")

    # ---------- deduct wallet ----------
    await db.users.update_one(
        {"_id": user_id},
        {"$inc": {"wallet_balance": -total_cost}},
    )

    # ---------- upsert holding ----------
    now = datetime.now(timezone.utc)
    existing = await db.holdings.find_one({"user_id": user_id, "player_id": player_id})
    if existing:
        await db.holdings.update_one(
            {"_id": existing["_id"]},
            {"$inc": {"shares_owned": shares}},
        )
    else:
        await db.holdings.insert_one({
            "user_id": user_id,
            "player_id": player_id,
            "shares_owned": shares,
            "accrued_dividend": 0.0,
            "last_accrual_timestamp": now,
        })

    # ---------- increment buy volume & circulating ----------
    # Fund the liquidity pool with gamma % of the purchase so sells can be fulfilled
    gamma = player.get("gamma", 0.05)
    pool_contribution = total_cost * gamma
    await db.players.update_one(
        {"_id": player_id},
        {"$inc": {
            "buy_volume": shares,
            "circulating_shares": shares,
            "liquidity_pool_balance": pool_contribution,
        }},
    )

    # ---------- recalculate price (delta: buy pushes price UP) ----------
    pricing = await _apply_price_delta(db, player_id, shares, direction=+1)

    # ---------- record transaction ----------
    txn = {
        "type": "buy",
        "user_id": user_id,
        "player_id": player_id,
        "shares": shares,
        "price": price,
        "timestamp": now,
    }
    result = await db.transactions.insert_one(txn)
    audit_event("buy", {"txn_id": str(result.inserted_id), "user": str(user_id)})

    # ---------- broadcast via WebSocket ----------
    await ws_manager.broadcast_price_update(str(player_id), {
        "price": pricing["current_price"],
        "fundamentalValue": pricing.get("fundamental_value"),
    })
    await ws_manager.broadcast_trade(str(player_id), {
        "tradeType": "buy",
        "shares": shares,
        "price": price,
    })

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
    player_id: str | ObjectId,
    shares: float,
) -> dict:
    """
    Execute a sell order with AMM buyback fallback.
    Returns transaction summary dict.
    """
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    if isinstance(player_id, str):
        player_id = ObjectId(player_id)

    # ---------- load data ----------
    user = await db.users.find_one({"_id": user_id})
    player = await db.players.find_one({"_id": player_id})
    holding = await db.holdings.find_one({"user_id": user_id, "player_id": player_id})

    if user is None:
        raise ValueError("User not found")
    if player is None:
        raise ValueError("Player not found")
    if holding is None or holding["shares_owned"] < shares:
        raise ValueError("Insufficient shares to sell")

    # ---------- accrue dividends first ----------
    now = datetime.now(timezone.utc)
    accrued = await accrue_for_holding(db, holding["_id"], as_of=now)

    # Reload holding after accrual
    holding = await db.holdings.find_one({"_id": holding["_id"]})
    total_dividend = holding["accrued_dividend"]

    price = player["current_price"]
    gamma = player["gamma"]

    # ---------- fraud check ----------
    fraud_reason = fraud_precheck(str(user_id), str(player_id), shares, price)
    if fraud_reason:
        raise ValueError(f"Fraud check failed: {fraud_reason}")

    # ---------- try internal liquidity match (simulated) ----------
    # In production: scan pending buy orders for the same player.
    # For now, fall straight through to AMM buyback.
    internal_matched = 0.0  # shares matched internally
    shares_to_sell = shares  # Always sell the full amount requested
    remaining = shares - internal_matched

    # ---------- AMM buyback for remaining ----------
    buyback_price = price * (1.0 - gamma)
    buyback_cost = buyback_price * remaining

    liq_pool = player.get("liquidity_pool_balance", 0.0)
    
    # Calculate actual proceeds
    if buyback_cost > liq_pool:
        # Platform absorbs the cost to avoid blocking sells
        # Pay user for all shares at buyback price, even if pool is insufficient
        buyback_cost_from_pool = liq_pool  # Use whatever is in the pool
        proceeds_from_buyback = remaining * buyback_price  # Still pay full amount
    else:
        buyback_cost_from_pool = buyback_cost
        proceeds_from_buyback = remaining * buyback_price

    total_proceeds = (internal_matched * price) + proceeds_from_buyback + total_dividend

    # ---------- update liquidity pool ----------
    await db.players.update_one(
        {"_id": player_id},
        {"$inc": {"liquidity_pool_balance": -buyback_cost_from_pool}},
    )

    # ---------- update holding ----------
    # ALWAYS remove the full amount the user wanted to sell
    new_shares = holding["shares_owned"] - shares_to_sell
    if new_shares <= 0.01:  # Account for floating point precision
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
    # Use the full amount the user sold, not just what was matched
    sold_total = shares_to_sell
    await db.players.update_one(
        {"_id": player_id},
        {"$inc": {"sell_volume": sold_total, "circulating_shares": -sold_total}},
    )

    # ---------- recalculate price (delta: sell pushes price DOWN) ----------
    pricing = await _apply_price_delta(db, player_id, sold_total, direction=-1)

    # ---------- record transaction(s) ----------
    txn_type = "liquidity_buyback" if remaining > 0 else "sell"
    txn = {
        "type": txn_type,
        "user_id": user_id,
        "player_id": player_id,
        "shares": sold_total,  # Record the full amount sold
        "price": buyback_price if remaining > 0 else price,
        "timestamp": now,
    }
    result = await db.transactions.insert_one(txn)

    # Record dividend payout transaction
    if total_dividend > 0:
        await db.transactions.insert_one({
            "type": "dividend",
            "user_id": user_id,
            "player_id": player_id,
            "shares": 0,
            "price": total_dividend,
            "timestamp": now,
        })

    audit_event("sell", {"txn_id": str(result.inserted_id), "user": str(user_id)})

    # ---------- broadcast via WebSocket ----------
    await ws_manager.broadcast_price_update(str(player_id), {
        "price": pricing["current_price"],
        "fundamentalValue": pricing.get("fundamental_value"),
    })
    await ws_manager.broadcast_trade(str(player_id), {
        "tradeType": "sell",
        "shares": sold_total,
        "price": buyback_price if remaining > 0 else price,
    })

    return {
        "transaction_id": str(result.inserted_id),
        "shares_sold": sold_total,
        "internal_matched": internal_matched,
        "buyback_shares": shares_to_sell - internal_matched,  # Shares bought back by AMM
        "buyback_price": buyback_price,
        "dividend_paid": total_dividend,
        "total_proceeds": total_proceeds,
        "new_price": pricing["current_price"],
    }
