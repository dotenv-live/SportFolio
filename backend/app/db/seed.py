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

PLAYERS = [
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
    for coll in ["users", "players", "holdings", "transactions", "income_events", "player_matches", "sports", "price_history"]:
        await db[coll].drop()

    await create_indexes(db)

    # Insert users
    user_results = await db.users.insert_many(USERS)
    print(f"✓ Inserted {len(user_results.inserted_ids)} users")

    # Insert players
    player_results = await db.players.insert_many(PLAYERS)
    player_ids = player_results.inserted_ids
    print(f"✓ Inserted {len(player_ids)} players")

    # Insert sample price history (simulated daily snapshots for last 30 days)
    import random
    now = datetime.now(timezone.utc)
    price_history = []
    for i, pid in enumerate(player_ids):
        base = PLAYERS[i]["current_price"]
        price = base
        for day in range(30, 0, -1):
            # Random walk around the base price
            delta = random.uniform(-0.02, 0.025) * base
            price = max(base * 0.7, min(base * 1.4, price + delta))
            price_history.append({
                "player_id": pid,
                "price": round(price, 2),
                "fundamental_value": round(base * (1 + random.uniform(-0.05, 0.1)), 2),
                "performance_score": round(PLAYERS[i]["performance_score"] + random.uniform(-0.05, 0.05), 4),
                "timestamp": now - timedelta(days=day),
            })
        # Final snapshot = current price
        price_history.append({
            "player_id": pid,
            "price": PLAYERS[i]["current_price"],
            "fundamental_value": PLAYERS[i]["fundamental_value"],
            "performance_score": PLAYERS[i]["performance_score"],
            "timestamp": now,
        })
    await db.price_history.insert_many(price_history)
    print(f"✓ Inserted {len(price_history)} price history records")

    # Insert sample player matches
    player_matches = []
    for i, pid in enumerate(player_ids):
        for day_offset in range(5):
            match_date = now - timedelta(days=day_offset * 7)
            player_matches.append({
                "player_id": pid,
                "date": match_date.strftime("%Y-%m-%d"),
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
                "ingested_at": match_date,
            })
    await db.player_matches.insert_many(player_matches)
    print(f"✓ Inserted {len(player_matches)} player match records")

    # Seed default sport configurations
    await sport_config_service.ensure_defaults(db)
    sport_count = await db.sports.count_documents({})
    print(f"✓ Seeded {sport_count} sport configurations")

    # Insert sample income events
    income_events = []
    for pid in player_ids[:3]:
        income_events.append({
            "player_id": pid,
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
