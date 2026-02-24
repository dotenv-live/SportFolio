"""
Database index creation – run once on startup.
"""
from motor.motor_asyncio import AsyncIOMotorDatabase


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    # Users
    await db.users.create_index("email", unique=True)

    # Players (merged Athlete + Cricsheet)
    await db.players.create_index("sport")
    await db.players.create_index("name", unique=True)
    await db.players.create_index("cricsheet_id")
    await db.players.create_index("competitions")

    # Sports – unique name
    await db.sports.create_index("name", unique=True)

    # Holdings – compound unique
    await db.holdings.create_index(
        [("user_id", 1), ("player_id", 1)],
        unique=True,
    )

    # Transactions
    await db.transactions.create_index([("user_id", 1), ("timestamp", -1)])
    await db.transactions.create_index([("player_id", 1), ("type", 1)])

    # IncomeEvents
    await db.income_events.create_index([("player_id", 1), ("distributed", 1)])

    # PlayerMatches — one doc per (player × match), Cricsheet schema
    await db.player_matches.create_index([("player_id", 1), ("date", -1)])
    await db.player_matches.create_index(
        [("match_id", 1), ("player_id", 1)],
        unique=True,
        partialFilterExpression={"match_id": {"$exists": True}},
    )
    await db.player_matches.create_index("stats.competition")
    await db.player_matches.create_index("stats.player_name")

    # PriceHistory
    await db.price_history.create_index([("player_id", 1), ("timestamp", 1)])
