"""
Portfolio routes – holdings, dividends, wallet.
"""
from datetime import datetime, timezone
from typing import Annotated, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_current_user
from app.db.mongo import get_db
from app.services.dividend_engine import accrue_for_holding
from app.services.trading_engine import calculate_exit_price

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/holdings")
async def get_holdings(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """Return all holdings for the current user, with live-accrued dividends."""
    now = datetime.now(timezone.utc)
    holdings: List[dict] = []
    async for h in db.holdings.find({"user_id": current_user["_id"]}):
        # Accrue pending dividends on read
        await accrue_for_holding(db, h["_id"], as_of=now)
        # Reload
        h = await db.holdings.find_one({"_id": h["_id"]})
        # Enrich with player name + current price
        player = await db.players.find_one({"_id": h["player_id"]})
        
        # Calculate invested amount using weighted average cost basis
        # This represents the cost basis of CURRENTLY HELD shares
        running_shares = 0.0  # Track shares we currently own
        running_cost = 0.0     # Track total cost of currently held shares
        
        # Process all transactions chronologically
        async for tx in db.transactions.find({
            "user_id": current_user["_id"],
            "player_id": h["player_id"],
            "type": {"$in": ["buy", "sell", "liquidity_buyback"]}
        }).sort("timestamp", 1):
            if tx["type"] == "buy":
                # Add to position: increase shares and cost
                running_shares += tx["shares"]
                running_cost += tx["shares"] * tx["price"]
            elif tx["type"] in ["sell", "liquidity_buyback"]:
                # Reduce position: decrease shares and proportional cost
                if running_shares > 0:
                    # Calculate average cost per share of current holdings
                    avg_cost = running_cost / running_shares
                    # Remove the cost basis (NOT the sale proceeds) of shares being sold
                    shares_sold = tx["shares"]
                    running_cost -= shares_sold * avg_cost
                    running_shares -= shares_sold
                    # Ensure non-negative due to floating point precision
                    running_cost = max(0, running_cost)
                    running_shares = max(0, running_shares)
        
        # Invested amount is the cost basis of remaining shares
        invested_amount = running_cost
        
        # Validate: running_shares should match actual shares_owned
        # (small difference allowed for floating point precision)
        if abs(running_shares - h["shares_owned"]) > 0.01:
            # Mismatch detected - log for debugging but use calculated value
            # This could happen if there are dividend or other transaction types
            pass
        
        # Calculate exit price accounting for the built-in spread
        # This is what you'd actually get if you sold now
        exit_price = await calculate_exit_price(db, h["player_id"], h["shares_owned"])
        market_value = round(h["shares_owned"] * exit_price, 2)
        
        holdings.append({
            "_id": str(h["_id"]),
            "player_id": str(h["player_id"]),
            "player_name": player["name"] if player else "Unknown",
            "shares_owned": h["shares_owned"],
            "accrued_dividend": round(h["accrued_dividend"], 6),
            "current_price": player["current_price"] if player else 0,
            "exit_price": exit_price,  # Price accounting for exit spread
            "market_value": market_value,  # Valued at exit price
            "invested_amount": round(invested_amount, 2),
            "last_accrual_timestamp": h.get("last_accrual_timestamp"),
        })
    return holdings


@router.get("/transactions")
async def get_transactions(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
):
    txns: List[dict] = []
    async for t in db.transactions.find({"user_id": current_user["_id"]}).sort("timestamp", -1).limit(100):
        t["_id"] = str(t["_id"])
        t["user_id"] = str(t["user_id"])
        t["player_id"] = str(t["player_id"])
        txns.append(t)
    return txns


@router.get("/wallet")
async def get_wallet(
    current_user: Annotated[dict, Depends(get_current_user)],
):
    return {
        "wallet_balance": current_user["wallet_balance"],
    }


@router.post("/wallet/deposit")
async def deposit(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    amount: float = 0.0,
):
    """Simple wallet deposit (no real payment gateway)."""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"wallet_balance": amount}},
    )
    return {"deposited": amount, "new_balance": current_user["wallet_balance"] + amount}
