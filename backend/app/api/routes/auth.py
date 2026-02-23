"""
Auth routes – register, login, profile.
"""
from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import create_access_token, hash_password, verify_password
from app.db.mongo import get_db
from app.models.auth import LoginRequest, Token
from app.models.user import UserCreate, UserPublic
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    body: UserCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "name": body.name,
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "wallet_balance": 0.0,
        "role": "investor",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    token = create_access_token(subject=str(result.inserted_id))
    return Token(access_token=token)


@router.post("/login", response_model=Token)
async def login(
    body: LoginRequest,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(subject=str(user["_id"]))
    return Token(access_token=token)


@router.get("/me")
async def get_me(current_user: Annotated[dict, Depends(get_current_user)]):
    return {
        "_id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "wallet_balance": current_user["wallet_balance"],
        "role": current_user["role"],
        "created_at": current_user.get("created_at"),
    }
