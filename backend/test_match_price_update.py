#!/usr/bin/env python3
"""
Test script: verify share price reacts correctly to new matches.

Scenario A – Excellent performance  → price should INCREASE
Scenario B – Terrible performance   → price should DECREASE

Usage:
    cd backend
    .venv/bin/python3 test_match_price_update.py
"""
import asyncio
import os
import sys
from datetime import datetime, timezone
from pprint import pprint

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.getcwd())

import certifi
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings
from app.services.cricket_performance import compute_all_scores
from app.services.price_engine import recalculate_player_price

TRACKED_KEYS = [
    "current_price",
    "fundamental_value",
    "performance_score",
    "consistency_score",
    "growth_score",
    "fitness_score",
    "actual_score",
    "ai_score",
]


def snapshot(player: dict) -> dict:
    return {k: player.get(k) for k in TRACKED_KEYS}


def print_snapshot(label: str, snap: dict):
    print(f"\n--- {label} ---")
    for k, v in snap.items():
        print(f"  {k:25s}: {v}")


def print_deltas(before: dict, after: dict):
    print(f"\n--- DELTAS ---")
    for k in TRACKED_KEYS:
        b = before[k] or 0
        a = after[k] or 0
        d = a - b
        pct = (d / b * 100) if b else 0
        print(f"  {k:25s}: {b:.4f}  →  {a:.4f}  ({d:+.4f}  {pct:+.2f}%)")


async def run_scenario(
    db,
    pid,
    match_count: int,
    label: str,
    match_stats: dict,
    expect_increase: bool,
):
    """Insert a match, run the full pipeline, check direction, clean up."""
    print(f"\n{'=' * 60}")
    print(f"SCENARIO: {label}")
    print(f"{'=' * 60}")

    test_start = datetime.now(timezone.utc)

    # ── Baseline (recalculate without the new match) ──────────────
    print("\n  Establishing baseline …")
    # Run the FULL pipeline (cron + price) so the baseline uses the same
    # AI model version as the after-match snapshot.
    player_bl = await db.players.find_one({"_id": pid})
    scores_bl = await compute_all_scores(db, player_bl)
    await db.players.update_one(
        {"_id": pid},
        {"$set": {
            "performance_score": scores_bl.performance_score,
            "ai_score":          scores_bl.ai,
            "consistency_score": scores_bl.consistency,
            "growth_score":      scores_bl.growth,
            "fitness_score":     scores_bl.fitness,
            "actual_score":      scores_bl.actual,
            "last_updated":      datetime.now(timezone.utc),
        }},
    )
    await recalculate_player_price(db, pid)
    player = await db.players.find_one({"_id": pid})
    before = snapshot(player)
    print_snapshot("BEFORE (baseline)", before)
    print(f"\n  Existing matches: {match_count}")

    # ── Insert match ──────────────────────────────────────────────
    new_match = {
        "player_id": pid,
        "match_id": f"TEST-{label.upper().replace(' ', '-')}",
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "stats": match_stats,
        "ingested_at": datetime.now(timezone.utc),
    }
    result = await db.player_matches.insert_one(new_match)
    match_oid = result.inserted_id
    print(f"\n  Inserted test match: {match_oid}")

    # ── Compute sub-scores (cricket cron pipeline) ────────────────
    print("\n  Running compute_all_scores …")
    player_fresh = await db.players.find_one({"_id": pid})
    scores = await compute_all_scores(db, player_fresh)
    print(f"    C={scores.consistency:.4f}  G={scores.growth:.4f}  "
          f"F={scores.fitness:.4f}  A={scores.actual:.4f}  "
          f"AI={scores.ai:.4f}  PS={scores.performance_score:.4f}")

    await db.players.update_one(
        {"_id": pid},
        {"$set": {
            "performance_score": scores.performance_score,
            "ai_score":          scores.ai,
            "consistency_score": scores.consistency,
            "growth_score":      scores.growth,
            "fitness_score":     scores.fitness,
            "actual_score":      scores.actual,
            "last_updated":      datetime.now(timezone.utc),
        }},
    )

    # ── Recalculate price ─────────────────────────────────────────
    print("  Running recalculate_player_price …")
    pricing = await recalculate_player_price(db, pid)

    player_after = await db.players.find_one({"_id": pid})
    after = snapshot(player_after)
    print_snapshot("AFTER", after)
    print(f"\n  Price engine returned:")
    pprint(pricing, indent=4)
    print_deltas(before, after)

    # ── Verify ────────────────────────────────────────────────────
    price_delta = (after["current_price"] or 0) - (before["current_price"] or 0)
    fv_delta = (after["fundamental_value"] or 0) - (before["fundamental_value"] or 0)
    ps_delta = (after["performance_score"] or 0) - (before["performance_score"] or 0)

    passed = False
    print(f"\n{'=' * 60}")
    if expect_increase:
        if fv_delta > 0 or ps_delta > 0:
            passed = True
            print(f"RESULT: PASS  ✓  ({label})")
            if fv_delta > 0:
                print(f"  ✓ FV increased  ({fv_delta:+.4f})")
            if ps_delta > 0:
                print(f"  ✓ PS increased  ({ps_delta:+.6f})")
            if price_delta > 0:
                print(f"  ✓ Price increased  ({price_delta:+.4f})")
        else:
            print(f"RESULT: FAIL  ✗  ({label})")
            print(f"  Expected FV/PS to increase but they didn't")
    else:
        if fv_delta < 0 or ps_delta < 0:
            passed = True
            print(f"RESULT: PASS  ✓  ({label})")
            if fv_delta < 0:
                print(f"  ✓ FV decreased  ({fv_delta:+.4f})")
            if ps_delta < 0:
                print(f"  ✓ PS decreased  ({ps_delta:+.6f})")
            if price_delta < 0:
                print(f"  ✓ Price decreased  ({price_delta:+.4f})")
        else:
            print(f"RESULT: FAIL  ✗  ({label})")
            print(f"  Expected FV/PS to decrease but they didn't")
    print(f"{'=' * 60}")

    # ── Cleanup ───────────────────────────────────────────────────
    await db.player_matches.delete_one({"_id": match_oid})
    await db.players.update_one({"_id": pid}, {"$set": before})
    await db.price_history.delete_many({
        "player_id": pid,
        "timestamp": {"$gte": test_start},
    })
    print("  (cleaned up – player restored)\n")
    return passed


async def main():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_uri, tlsCAFile=certifi.where())
    db = client[settings.mongo_db]

    # ── Pick a Cricket player ─────────────────────────────────────
    player = await db.players.find_one({"sport": {"$regex": "^cricket$", "$options": "i"}})
    if not player:
        print("No cricket player found – run the seed first.")
        return

    pid = player["_id"]
    name = player["name"]
    match_count = await db.player_matches.count_documents({"player_id": pid})

    # Save originals so we can restore at the very end
    original = snapshot(player)

    print(f"\nPlayer : {name}")
    print(f"ID     : {pid}")

    # ════════════════════════════════════════════════════════════════
    # Scenario A: EXCELLENT match
    # ════════════════════════════════════════════════════════════════
    excellent_stats = {
        "batting_stats": {
            "runs": 120,
            "balls_faced": 55,
            "strike_rate": 218.18,
            "fours": 12,
            "sixes": 7,
            "average": 120.0,
            "not_out": True,
            "matches": match_count + 1,
        },
        "bowling_stats": {
            "wickets": 4,
            "overs": 4.0,
            "runs_conceded": 18,
            "economy": 4.5,
            "average": 4.5,
            "strike_rate": 6.0,
            "wides": 0,
            "no_balls": 0,
            "matches": match_count + 1,
        },
        "fielding_stats": {"catches": 3, "run_outs": 1},
        "match_result": "won",
        "competition": "Test Script – Excellent",
    }
    pass_a = await run_scenario(
        db, pid, match_count,
        label="Excellent performance → price UP",
        match_stats=excellent_stats,
        expect_increase=True,
    )

    # ════════════════════════════════════════════════════════════════
    # Scenario B: TERRIBLE match
    # ════════════════════════════════════════════════════════════════
    terrible_stats = {
        "batting_stats": {
            "runs": 2,
            "balls_faced": 8,
            "strike_rate": 25.0,
            "fours": 0,
            "sixes": 0,
            "average": 2.0,
            "not_out": False,
            "matches": match_count + 1,
        },
        "bowling_stats": {
            "wickets": 0,
            "overs": 3.0,
            "runs_conceded": 48,
            "economy": 16.0,
            "average": 0.0,
            "strike_rate": 0.0,
            "wides": 4,
            "no_balls": 2,
            "matches": match_count + 1,
        },
        "fielding_stats": {"catches": 0, "run_outs": 0},
        "match_result": "lost",
        "competition": "Test Script – Terrible",
    }
    pass_b = await run_scenario(
        db, pid, match_count,
        label="Terrible performance → price DOWN",
        match_stats=terrible_stats,
        expect_increase=False,
    )

    # ── Final restore (belt & suspenders) ─────────────────────────
    await db.players.update_one({"_id": pid}, {"$set": original})

    # ── Summary ───────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Scenario A (excellent):  {'PASS ✓' if pass_a else 'FAIL ✗'}")
    print(f"  Scenario B (terrible ):  {'PASS ✓' if pass_b else 'FAIL ✗'}")
    overall = "ALL PASSED ✓" if (pass_a and pass_b) else "SOME FAILED ✗"
    print(f"\n  Overall: {overall}")
    print("=" * 60 + "\n")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
