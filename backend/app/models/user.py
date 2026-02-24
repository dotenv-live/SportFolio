from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.models.common import BaseDocument, PyObjectId


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserPublic(UserBase):
    id: PyObjectId = Field(alias="_id")
    wallet_balance: float
    role: Literal["investor", "admin"]
    created_at: datetime


class UserInDB(BaseDocument):
    name: str
    email: EmailStr
    hashed_password: str
    wallet_balance: float = 0.0
    role: Literal["investor", "admin"] = "investor"
    created_at: datetime = Field(default_factory=datetime.utcnow)
