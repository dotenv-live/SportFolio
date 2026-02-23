from typing import AsyncGenerator

import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings


class MongoDB:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


mongodb = MongoDB()


def connect_to_mongo() -> None:
    settings = get_settings()
    mongodb.client = AsyncIOMotorClient(
        settings.mongo_uri,
        tlsCAFile=certifi.where(),
    )
    mongodb.db = mongodb.client[settings.mongo_db]


def close_mongo_connection() -> None:
    if mongodb.client:
        mongodb.client.close()


async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    if mongodb.db is None:
        connect_to_mongo()
    assert mongodb.db is not None
    yield mongodb.db
