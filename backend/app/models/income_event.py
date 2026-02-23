from datetime import datetime

from pydantic import BaseModel, Field

from app.models.common import BaseDocument, PyObjectId


class IncomeEventCreate(BaseModel):
    player_id: PyObjectId
    verified_income: float
    income_date: datetime


class IncomeEventPublic(IncomeEventCreate):
    id: PyObjectId = Field(alias="_id")
    distributed: bool


class IncomeEventInDB(BaseDocument):
    player_id: PyObjectId
    verified_income: float
    income_date: datetime
    distributed: bool = False
