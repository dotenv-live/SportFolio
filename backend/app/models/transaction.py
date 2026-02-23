from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models.common import BaseDocument, PyObjectId


class TransactionCreate(BaseModel):
    type: Literal["buy", "sell", "dividend", "liquidity_buyback"]
    user_id: PyObjectId
    player_id: PyObjectId
    shares: float
    price: float


class TransactionPublic(TransactionCreate):
    id: PyObjectId = Field(alias="_id")
    timestamp: datetime


class TransactionInDB(BaseDocument):
    type: Literal["buy", "sell", "dividend", "liquidity_buyback"]
    user_id: PyObjectId
    player_id: PyObjectId
    shares: float
    price: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
