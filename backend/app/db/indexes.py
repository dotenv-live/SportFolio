"""
Database index creation – run once on startup.
"""
from motor.motor_asyncio import AsyncIOMotorDatabase


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    # Users
    await db.users.create_index("email", unique=True)

    # Athletes
    await db.athletes.create_index("sport")
    await db.athletes.create_index("name")

    # Holdings – compound unique
    await db.holdings.create_index(
        [("user_id", 1), ("athlete_id", 1)],
        unique=True,
    )

    # Transactions
    await db.transactions.create_index([("user_id", 1), ("timestamp", -1)])
    await db.transactions.create_index([("athlete_id", 1), ("type", 1)])

    # IncomeEvents
    await db.income_events.create_index([("athlete_id", 1), ("distributed", 1)])

    # MatchStats
    await db.match_stats.create_index([("athlete_id", 1), ("match_date", -1)])
