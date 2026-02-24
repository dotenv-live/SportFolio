"""
Trading routes – buy & sell shares.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.db.mongo import get_db
from app.services.trading_engine import buy_shares, sell_shares

router = APIRouter(prefix="/trade", tags=["trading"])


class TradeRequest(BaseModel):
    player_id: str
    shares: float = Field(gt=0)


@router.post("/buy")
async def buy(
    body: TradeRequest,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
):
    try:
        result = await buy_shares(
            db,
            user_id=current_user["_id"],
            player_id=body.player_id,
            shares=body.shares,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sell")
async def sell(
    body: TradeRequest,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
):
    try:
        result = await sell_shares(
            db,
            user_id=current_user["_id"],
            player_id=body.player_id,
            shares=body.shares,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
