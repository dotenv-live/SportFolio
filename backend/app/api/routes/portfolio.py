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
        holdings.append({
            "_id": str(h["_id"]),
            "player_id": str(h["player_id"]),
            "player_name": player["name"] if player else "Unknown",
            "shares_owned": h["shares_owned"],
            "accrued_dividend": round(h["accrued_dividend"], 6),
            "current_price": player["current_price"] if player else 0,
            "market_value": round(h["shares_owned"] * (player["current_price"] if player else 0), 2),
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
