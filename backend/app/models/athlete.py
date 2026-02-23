from datetime import datetime
from pydantic import BaseModel, Field

from app.models.common import BaseDocument, PyObjectId


class AthleteBase(BaseModel):
    name: str
    sport: str
    total_shares: float
    base_value: float
    alpha: float
    beta: float
    gamma: float


class AthleteCreate(AthleteBase):
    performance_score: float = 0.0
    ai_score: float = 0.0


class AthleteUpdate(BaseModel):
    name: str | None = None
    sport: str | None = None
    total_shares: float | None = None
    base_value: float | None = None
    alpha: float | None = None
    beta: float | None = None
    gamma: float | None = None
    performance_score: float | None = None
    ai_score: float | None = None
    fundamental_value: float | None = None
    current_price: float | None = None
    liquidity_pool_balance: float | None = None
    circulating_shares: float | None = None


class AthletePublic(AthleteBase):
    id: PyObjectId = Field(alias="_id")
    performance_score: float
    ai_score: float
    fundamental_value: float
    current_price: float
    liquidity_pool_balance: float
    circulating_shares: float
    buy_volume: float
    sell_volume: float
    created_at: datetime


class AthleteInDB(BaseDocument):
    name: str
    sport: str
    total_shares: float
    base_value: float
    alpha: float
    beta: float
    gamma: float
    performance_score: float = 0.0
    ai_score: float = 0.0
    fundamental_value: float = 0.0
    current_price: float = 0.0
    liquidity_pool_balance: float = 0.0
    circulating_shares: float = 0.0
    buy_volume: float = 0.0
    sell_volume: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
