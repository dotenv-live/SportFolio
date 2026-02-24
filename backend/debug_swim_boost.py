#!/usr/bin/env python3
"""Test: verify boost/tank work correctly for all sports."""
import asyncio
import os, sys, copy

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.getcwd())

import certifi
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings
from app.api.routes.admin import _build_swimming_stats, _build_wrestling_stats, _template_for
from app.services.swimming_performance import compute_all_scores as swim_all
from app.services.wrestling_performance import compute_all_scores as wrest_all
from app.services.cricket_performance import compute_all_scores as cricket_all
from app.services.price_engine import recalculate_player_price
from datetime import datetime, timezone


async def test_sport(db, sport, compute_fn, build_fn):
    player = await db.players.find_one({"sport": sport})
    if not player:
        print(f"  No {sport} player found – skipping")
        return

    for quality in ("excellent", "terrible"):
        # Snapshot before
        before_ps = player.get("performance_score", 0)
        before_price = player.get("current_price", 0)

        # Build stats
        if build_fn:
            stats = await build_fn(db, player["_id"], quality)
        else:
            stats = _template_for(sport, quality)
            match_count = await db.player_matches.count_documents({"player_id": player["_id"]})
            for key in ("batting_stats", "bowling_stats"):
                if key in stats:
                    stats[key]["matches"] = match_count + 1

        # Insert match
        new_match = {
            "player_id": player["_id"],
            "match_id": f"TEST-{quality.upper()}",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "stats": stats,
            "ingested_at": datetime.now(timezone.utc),
            "simulated": True,
        }
        res = await db.player_matches.insert_one(new_match)

        # Recompute
        fresh = await db.players.find_one({"_id": player["_id"]})
        scores = await compute_fn(db, fresh)
        await db.players.update_one({"_id": player["_id"]}, {"$set": {
            "performance_score": scores.performance_score,
            "ai_score": scores.ai,
            "consistency_score": scores.consistency,
            "growth_score": scores.growth,
            "fitness_score": scores.fitness,
            "actual_score": scores.actual,
        }})
        pricing = await recalculate_player_price(db, player["_id"])

        ps_delta = scores.performance_score - before_ps
        price_delta = pricing["current_price"] - before_price

        expected_up = quality == "excellent"
        passed = (ps_delta > 0) == expected_up
        symbol = "✅" if passed else "❌"

        print(f"  {symbol} {quality:10s} | PS: {before_ps:.4f} → {scores.performance_score:.4f} ({ps_delta:+.4f}) | Price: {before_price:.2f} → {pricing['current_price']:.2f} ({price_delta:+.2f})")

        # Cleanup
        await db.player_matches.delete_one({"_id": res.inserted_id})
        # Restore player
        await db.players.update_one({"_id": player["_id"]}, {"$set": {
            "performance_score": before_ps,
            "current_price": before_price,
            "consistency_score": player.get("consistency_score", 0),
            "growth_score": player.get("growth_score", 0),
            "fitness_score": player.get("fitness_score", 0),
            "actual_score": player.get("actual_score", 0),
            "ai_score": player.get("ai_score", 0),
            "fundamental_value": player.get("fundamental_value", 0),
        }})


async def main():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_uri, tlsCAFile=certifi.where())
    db = client[settings.mongo_db]

    print("CRICKET:")
    await test_sport(db, "cricket", cricket_all, None)

    print("\nSWIMMING:")
    await test_sport(db, "swimming", swim_all, _build_swimming_stats)

    print("\nWRESTLING:")
    await test_sport(db, "wrestling", wrest_all, _build_wrestling_stats)

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
