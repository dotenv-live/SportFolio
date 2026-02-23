"""
Seed script – populates the database with example data.

Usage:
    python -m app.db.seed
"""
import asyncio
from datetime import datetime, timezone, timedelta

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.indexes import create_indexes
from app.services.sport_config import sport_config_service

ATHLETES = [
    {
        "name": "Virat Kohli",
        "sport": "Cricket",
        "total_shares": 100_000,
        "base_value": 50.0,
        "alpha": 0.8,
        "beta": 0.05,
        "gamma": 0.10,
        "performance_score": 0.85,
        "ai_score": 0.80,
        "fundamental_value": 50.0,
        "current_price": 50.0,
        "liquidity_pool_balance": 10_000.0,
        "circulating_shares": 0.0,
        "buy_volume": 0.0,
        "sell_volume": 0.0,
        "created_at": datetime.now(timezone.utc),
    },
    {
        "name": "Lionel Messi",
        "sport": "Football",
        "total_shares": 200_000,
        "base_value": 120.0,
        "alpha": 0.7,
        "beta": 0.04,
        "gamma": 0.08,
        "performance_score": 0.92,
        "ai_score": 0.90,
        "fundamental_value": 120.0,
        "current_price": 120.0,
        "liquidity_pool_balance": 25_000.0,
        "circulating_shares": 0.0,
        "buy_volume": 0.0,
        "sell_volume": 0.0,
        "created_at": datetime.now(timezone.utc),
    },
    {
        "name": "LeBron James",
        "sport": "Basketball",
        "total_shares": 150_000,
        "base_value": 95.0,
        "alpha": 0.75,
        "beta": 0.06,
        "gamma": 0.09,
        "performance_score": 0.88,
        "ai_score": 0.85,
        "fundamental_value": 95.0,
        "current_price": 95.0,
        "liquidity_pool_balance": 15_000.0,
        "circulating_shares": 0.0,
        "buy_volume": 0.0,
        "sell_volume": 0.0,
        "created_at": datetime.now(timezone.utc),
    },
    {
        "name": "Serena Williams",
        "sport": "Tennis",
        "total_shares": 80_000,
        "base_value": 70.0,
        "alpha": 0.65,
        "beta": 0.05,
        "gamma": 0.12,
        "performance_score": 0.82,
        "ai_score": 0.78,
        "fundamental_value": 70.0,
        "current_price": 70.0,
        "liquidity_pool_balance": 8_000.0,
        "circulating_shares": 0.0,
        "buy_volume": 0.0,
        "sell_volume": 0.0,
        "created_at": datetime.now(timezone.utc),
    },
    {
        "name": "Cristiano Ronaldo",
        "sport": "Football",
        "total_shares": 200_000,
        "base_value": 110.0,
        "alpha": 0.72,
        "beta": 0.045,
        "gamma": 0.085,
        "performance_score": 0.90,
        "ai_score": 0.88,
        "fundamental_value": 110.0,
        "current_price": 110.0,
        "liquidity_pool_balance": 20_000.0,
        "circulating_shares": 0.0,
        "buy_volume": 0.0,
        "sell_volume": 0.0,
        "created_at": datetime.now(timezone.utc),
    },
]

USERS = [
    {
        "name": "Admin User",
        "email": "admin@sportfolio.io",
        "hashed_password": hash_password("admin12345"),
        "wallet_balance": 100_000.0,
        "role": "admin",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "name": "John Investor",
        "email": "john@example.com",
        "hashed_password": hash_password("investor123"),
        "wallet_balance": 50_000.0,
        "role": "investor",
        "created_at": datetime.now(timezone.utc),
    },
    {
        "name": "Jane Trader",
        "email": "jane@example.com",
        "hashed_password": hash_password("investor123"),
        "wallet_balance": 25_000.0,
        "role": "investor",
        "created_at": datetime.now(timezone.utc),
    },
]


async def seed():
    import certifi
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_uri, tlsCAFile=certifi.where())
    db = client[settings.mongo_db]

    # Drop existing collections
    for coll in ["users", "athletes", "holdings", "transactions", "income_events", "match_stats", "sports"]:
        await db[coll].drop()

    await create_indexes(db)

    # Insert users
    user_results = await db.users.insert_many(USERS)
    print(f"✓ Inserted {len(user_results.inserted_ids)} users")

    # Insert athletes
    athlete_results = await db.athletes.insert_many(ATHLETES)
    athlete_ids = athlete_results.inserted_ids
    print(f"✓ Inserted {len(athlete_ids)} athletes")

    # Insert sample match stats
    now = datetime.now(timezone.utc)
    match_stats = []
    for i, aid in enumerate(athlete_ids):
        for day_offset in range(5):
            match_stats.append({
                "athlete_id": aid,
                "match_date": now - timedelta(days=day_offset * 7),
                "stats": {
                    "score": round(0.6 + i * 0.05 + day_offset * 0.02, 2),
                    "actual_score": round(0.5 + i * 0.06 + day_offset * 0.01, 2),
                    "consistency": round(0.7 + i * 0.03, 2),
                    "growth": round(0.5 + day_offset * 0.03, 2),
                    "fitness": round(0.8 - day_offset * 0.02, 2),
                    "goals": max(0, 2 - day_offset + i),
                    "assists": max(0, 1 + i - day_offset),
                    "minutes_played": 90 - day_offset * 5,
                    "win_rate": round(0.6 + i * 0.04, 2),
                    "consistency_score": round(0.65 + i * 0.05, 2),
                },
                "manually_updated": False,
                "created_at": now - timedelta(days=day_offset * 7),
            })
    await db.match_stats.insert_many(match_stats)
    print(f"✓ Inserted {len(match_stats)} match stat records")

    # Seed default sport configurations
    await sport_config_service.ensure_defaults(db)
    sport_count = await db.sports.count_documents({})
    print(f"✓ Seeded {sport_count} sport configurations")

    # Insert sample income events
    income_events = []
    for aid in athlete_ids[:3]:
        income_events.append({
            "athlete_id": aid,
            "verified_income": 500_000.0,
            "income_date": now - timedelta(days=15),
            "distributed": False,
        })
    await db.income_events.insert_many(income_events)
    print(f"✓ Inserted {len(income_events)} income events")

    print("\n🌱 Seed complete!")
    print("  Admin login:    admin@sportfolio.io / admin12345")
    print("  Investor login:  john@example.com / investor123")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
