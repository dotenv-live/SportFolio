from datetime import datetime
from pydantic import BaseModel, Field

from app.models.common import BaseDocument, PyObjectId


class HoldingBase(BaseModel):
    user_id: PyObjectId
    player_id: PyObjectId


class HoldingPublic(HoldingBase):
    id: PyObjectId = Field(alias="_id")
    shares_owned: float
    accrued_dividend: float
    last_accrual_timestamp: datetime | None


class HoldingInDB(BaseDocument):
    user_id: PyObjectId
    player_id: PyObjectId
    shares_owned: float = 0.0
    accrued_dividend: float = 0.0
    last_accrual_timestamp: datetime | None = None
