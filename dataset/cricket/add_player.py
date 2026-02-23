"""
add_player.py
=============
Adds a new cricket player to MongoDB, fetching their complete historical data
from Cricsheet (https://cricsheet.org).

Usage:
    python add_player.py --name "V Kohli" --cricsheet-id "a1b2c3d4-..."
    python add_player.py --name "V Kohli"          # fuzzy-match from register

Dependencies:
    pip install pymongo requests tqdm python-dotenv

MongoDB collections used:
    - players          : one doc per player (profile + aggregate career stats)
    - player_matches   : one doc per (player × match) with per-match stats
"""

import argparse
import io
import json
import logging
import os
import re
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
import requests
from pymongo import MongoClient, UpdateOne

# Load .env from the parent directory (dataset/.env)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    sys.exit("ERROR: MONGO_URI is not set. Add it to dataset/.env or export it.")
DB_NAME   = os.getenv("DB", "sportfolio")

# Cricsheet base URL
CS_BASE = "https://cricsheet.org"

# All competitions we want to pull (Cricsheet codes).
# See https://cricsheet.org/downloads/ for the full list.
COMPETITIONS = {
    # --- International formats ---
    "tests": "Test matches",
    "odis":  "One-day internationals",
    "t20s":  "T20 internationals",
    "it20s": "Unofficial T20 internationals",

    # --- Indian domestic ---
    "ipl":   "IPL",
    "wpl":   "Women's Premier League",
    "sma":   "Syed Mushtaq Ali Trophy",
    "mdms":  "Multi-day domestic matches (Ranji / Duleep / Irani)",
    "odms":  "One-day domestic matches (Vijay Hazare)",
}

GENDER = "male"   # change to "female" if needed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Cricsheet helpers
# ---------------------------------------------------------------------------

def download_zip(competition: str, gender: str = GENDER) -> Optional[bytes]:
    """Download the JSON zip for a competition from Cricsheet."""
    url = f"{CS_BASE}/downloads/{competition}_{gender}_json.zip"
    log.info(f"Downloading {url} …")
    try:
        r = requests.get(url, timeout=120)
        if r.status_code == 404:
            log.warning(f"  → 404 Not Found (skipping): {url}")
            return None
        r.raise_for_status()
        return r.content
    except requests.RequestException as exc:
        log.error(f"  → Failed to download {url}: {exc}")
        return None


def iter_matches_in_zip(zip_bytes: bytes):
    """Yield (match_id, match_dict) for every JSON file inside the zip."""
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for name in zf.namelist():
            if not name.endswith(".json"):
                continue
            match_id = name.replace(".json", "")
            try:
                data = json.loads(zf.read(name))
                yield match_id, data
            except json.JSONDecodeError as exc:
                log.warning(f"  Could not parse {name}: {exc}")


def download_people_register() -> dict:
    """
    Download Cricsheet people.csv and return a dict:
        { cricsheet_id: {name, unique_name, ...} }
    Also return a secondary index { unique_name_lower: cricsheet_id }.
    """
    url = f"{CS_BASE}/register/people.csv"
    log.info(f"Downloading player register: {url}")
    try:
        r = requests.get(url, timeout=60)
        r.raise_for_status()
    except requests.RequestException as exc:
        log.error(f"Failed to download register: {exc}")
        return {}, {}

    by_id   = {}
    by_name = {}

    for line in r.text.splitlines()[1:]:   # skip header
        if not line.strip():
            continue
        parts = line.split(",")
        if len(parts) < 2:
            continue
        cs_id       = parts[0].strip()
        name        = parts[1].strip()
        unique_name = parts[2].strip() if len(parts) > 2 else name
        by_id[cs_id] = {"name": name, "unique_name": unique_name}
        by_name[unique_name.lower()] = cs_id
        by_name[name.lower()]        = cs_id   # also index by display name

    log.info(f"Register loaded: {len(by_id)} people")
    return by_id, by_name


# ---------------------------------------------------------------------------
# Stat aggregation helpers
# ---------------------------------------------------------------------------

def _batting_stats_from_innings(innings_list: list, player_name: str) -> dict:
    """Compute batting stats for a player across all innings in a match."""
    runs       = 0
    balls      = 0
    fours      = 0
    sixes      = 0
    dismissal  = None
    did_bat    = False

    for inning in innings_list:
        for over in inning.get("overs", []):
            for delivery in over.get("deliveries", []):
                batter = delivery.get("batter") or delivery.get("batsman", "")
                if batter != player_name:
                    continue
                did_bat = True
                runs  += delivery.get("runs", {}).get("batter", 0)
                balls += 1
                if delivery.get("runs", {}).get("batter", 0) == 4:
                    fours += 1
                if delivery.get("runs", {}).get("batter", 0) == 6:
                    sixes += 1
                wicket = delivery.get("wickets", [])
                if wicket:
                    for w in wicket:
                        if w.get("player_out") == player_name:
                            dismissal = w.get("kind", "unknown")

    if not did_bat:
        return {}

    sr = round(runs / balls * 100, 2) if balls else 0
    return {
        "runs": runs,
        "balls_faced": balls,
        "fours": fours,
        "sixes": sixes,
        "strike_rate": sr,
        "dismissal": dismissal,
        "not_out": dismissal is None,
    }


def _bowling_stats_from_innings(innings_list: list, player_name: str) -> dict:
    """Compute bowling stats for a player across all innings in a match."""
    runs_conceded  = 0
    wickets        = 0
    balls_bowled   = 0
    wides          = 0
    no_balls       = 0
    did_bowl       = False

    for inning in innings_list:
        for over in inning.get("overs", []):
            for delivery in over.get("deliveries", []):
                bowler = delivery.get("bowler", "")
                if bowler != player_name:
                    continue
                did_bowl = True
                r = delivery.get("runs", {})
                runs_conceded += r.get("total", 0) - r.get("penalty", 0)
                extras = delivery.get("extras", {})
                if "wides" in extras:
                    wides    += extras["wides"]
                elif "noballs" in extras:
                    no_balls += extras["noballs"]
                else:
                    balls_bowled += 1  # legal delivery

                for w in delivery.get("wickets", []):
                    if w.get("kind") not in ("run out", "obstructing the field", "retired hurt"):
                        wickets += 1

    if not did_bowl:
        return {}

    overs_str = f"{balls_bowled // 6}.{balls_bowled % 6}"
    economy   = round(runs_conceded / (balls_bowled / 6), 2) if balls_bowled else 0

    return {
        "overs": overs_str,
        "balls_bowled": balls_bowled,
        "runs_conceded": runs_conceded,
        "wickets": wickets,
        "wides": wides,
        "no_balls": no_balls,
        "economy": economy,
    }


def _aggregate_one_format(match_stats_list: list) -> dict:
    """Roll up per-match stats for a single competition format."""
    batting  = {"innings": 0, "not_outs": 0, "runs": 0, "balls_faced": 0,
                "fours": 0, "sixes": 0, "fifties": 0, "hundreds": 0, "highest": 0}
    bowling  = {"innings": 0, "balls": 0, "runs": 0, "wickets": 0,
                "wides": 0, "no_balls": 0, "five_fors": 0, "best_wickets": 0,
                "best_runs": 9999}

    for m in match_stats_list:
        bs = m.get("batting_stats", {})
        if bs:
            batting["innings"]     += 1
            batting["runs"]        += bs.get("runs", 0)
            batting["balls_faced"] += bs.get("balls_faced", 0)
            batting["fours"]       += bs.get("fours", 0)
            batting["sixes"]       += bs.get("sixes", 0)
            if bs.get("not_out"):
                batting["not_outs"] += 1
            r = bs.get("runs", 0)
            if r >= 100:
                batting["hundreds"] += 1
            elif r >= 50:
                batting["fifties"]  += 1
            if r > batting["highest"]:
                batting["highest"]  = r

        bw = m.get("bowling_stats", {})
        if bw:
            bowling["innings"]  += 1
            bowling["balls"]    += bw.get("balls_bowled", 0)
            bowling["runs"]     += bw.get("runs_conceded", 0)
            bowling["wickets"]  += bw.get("wickets", 0)
            bowling["wides"]    += bw.get("wides", 0)
            bowling["no_balls"] += bw.get("no_balls", 0)
            wk = bw.get("wickets", 0)
            rc = bw.get("runs_conceded", 0)
            if wk >= 5:
                bowling["five_fors"] += 1
            if wk > bowling["best_wickets"] or \
               (wk == bowling["best_wickets"] and rc < bowling["best_runs"]):
                bowling["best_wickets"] = wk
                bowling["best_runs"]    = rc

    inn   = batting["innings"]
    no    = batting["not_outs"]
    denom = inn - no
    batting["average"]     = round(batting["runs"] / denom, 2) if denom else None
    balls                  = batting["balls_faced"]
    batting["strike_rate"] = round(batting["runs"] / balls * 100, 2) if balls else None

    balls_b  = bowling["balls"]
    bowling["overs_bowled"] = f"{balls_b // 6}.{balls_b % 6}"
    bowling["economy"]      = round(bowling["runs"] / (balls_b / 6), 2) if balls_b else None
    bowling["average"]      = round(bowling["runs"] / bowling["wickets"], 2) \
                              if bowling["wickets"] else None
    bowling["strike_rate"]  = round(balls_b / bowling["wickets"], 2) \
                              if bowling["wickets"] else None
    if bowling["best_runs"] == 9999:
        bowling["best_innings"] = None
    else:
        bowling["best_innings"] = f"{bowling['best_wickets']}/{bowling['best_runs']}"

    return {"batting": batting, "bowling": bowling}


def _aggregate_career_by_format(match_stats_list: list) -> dict:
    """
    Group matches by competition and return per-format career stats.

    Return value shape:
    {
        "ipl":   {"label": "IPL", "matches": 87, "batting": {...}, "bowling": {...}},
        "tests": {"label": "Test matches", "matches": 113, "batting": {...}, "bowling": {...}},
        ...
    }
    """
    from collections import defaultdict
    groups: dict[str, list] = defaultdict(list)
    labels: dict[str, str]  = {}

    for m in match_stats_list:
        comp = m.get("competition", "unknown")
        groups[comp].append(m)
        if comp not in labels:
            labels[comp] = m.get("competition_label", comp)

    result = {}
    for comp, matches in groups.items():
        stats = _aggregate_one_format(matches)
        result[comp] = {
            "label":   labels[comp],
            "matches": len(matches),
            **stats,
        }

    return result


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------

def find_player_in_register(name: str, by_name: dict) -> Optional[str]:
    """Try to resolve a player name to a Cricsheet ID."""
    key = name.strip().lower()
    if key in by_name:
        return by_name[key]
    # Partial match fallback
    matches = [cid for n, cid in by_name.items() if key in n]
    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        log.warning(f"Multiple register matches for '{name}': {matches[:5]} …")
    return None


def fetch_all_player_matches(
    player_name: str,
    cricsheet_id: Optional[str],
) -> list:
    """
    Iterate over all competitions, parse every match JSON, and collect
    per-match stats for the given player.
    """
    results = []

    for comp_code, comp_label in COMPETITIONS.items():
        zip_bytes = download_zip(comp_code)
        if not zip_bytes:
            continue

        match_count = 0
        found_count = 0

        for match_id, match in iter_matches_in_zip(zip_bytes):
            info     = match.get("info", {})
            registry = info.get("registry", {}).get("people", {})
            innings  = match.get("innings", [])

            # Check if the player appeared in this match
            # The registry maps display name → cricsheet_id
            player_in_match = player_name in registry or \
                (cricsheet_id and cricsheet_id in registry.values())

            # Also scan player lists
            if not player_in_match:
                for team_name, roster in info.get("players", {}).items():
                    if player_name in roster:
                        player_in_match = True
                        break

            if not player_in_match:
                continue

            match_count += 1
            found_count += 1

            dates      = info.get("dates", [])
            match_date = dates[0] if dates else None
            match_type = info.get("match_type", "unknown")
            event_info = info.get("event", {})
            event_name = event_info.get("name", "") if isinstance(event_info, dict) else ""

            batting_stats = _batting_stats_from_innings(innings, player_name)
            bowling_stats = _bowling_stats_from_innings(innings, player_name)

            results.append({
                "match_id":      match_id,
                "competition":   comp_code,
                "competition_label": comp_label,
                "match_type":    match_type,
                "event":         event_name,
                "date":          match_date,
                "teams":         info.get("teams", []),
                "venue":         info.get("venue", ""),
                "outcome":       info.get("outcome", {}),
                "batting_stats": batting_stats,
                "bowling_stats": bowling_stats,
            })

        log.info(f"  {comp_label}: scanned, found player in {found_count} match(es)")

    return results


def upsert_player(
    player_name: str,
    cricsheet_id: Optional[str],
    register_info: dict,
    match_stats: list,
    db,
) -> str:
    """Insert/update the player document and all per-match documents."""
    players_col        = db["players"]
    player_matches_col = db["player_matches"]

    # Career stats are computed from ALL historical matches, broken down by format.
    career = _aggregate_career_by_format(match_stats)

    player_doc = {
        "name":            player_name,
        "sport":           "cricket",
        "cricsheet_id":    cricsheet_id,
        "register_info":   register_info,
        "career_stats":    career,
        "competitions":    list({m["competition"] for m in match_stats}),
        "total_matches":   len(match_stats),
        "last_updated":    datetime.now(timezone.utc),
    }

    result = players_col.update_one(
        {"name": player_name},
        {"$set": player_doc},
        upsert=True,
    )
    player_oid = result.upserted_id or \
                 players_col.find_one({"name": player_name}, {"_id": 1})["_id"]
    log.info(f"Player document upserted (id={player_oid})")

    # Only store matches from the last 7 days in player_matches.
    # Career stats above already incorporate the full history.
    from datetime import timedelta
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=1095)).strftime("%Y-%m-%d")
    recent_matches = [
        ms for ms in match_stats
        if ms.get("date") and str(ms["date"]) >= cutoff_date
    ]
    log.info(
        f"Storing {len(recent_matches)} recent match(es) (≥ {cutoff_date}) "
        f"out of {len(match_stats)} total in player_matches."
    )

    if recent_matches:
        ops = []
        for ms in recent_matches:
            doc = {
                "player_id":   player_oid,
                "match_id":    ms["match_id"],
                "date":        ms["date"],
                "stats": {
                    "player_name":       player_name,
                    "cricsheet_id":      cricsheet_id,
                    "competition":       ms["competition"],
                    "competition_label": ms["competition_label"],
                    "match_type":        ms["match_type"],
                    "event":             ms["event"],
                    "teams":             ms["teams"],
                    "venue":             ms["venue"],
                    "outcome":           ms["outcome"],
                    "batting_stats":     ms["batting_stats"],
                    "bowling_stats":     ms["bowling_stats"],
                },
                "ingested_at": datetime.now(timezone.utc),
            }
            ops.append(
                UpdateOne(
                    {"match_id": ms["match_id"], "player_id": player_oid},
                    {"$set": doc},
                    upsert=True,
                )
            )
        res = player_matches_col.bulk_write(ops, ordered=False)
        log.info(f"player_matches: {res.upserted_count} inserted, "
                 f"{res.modified_count} updated")

    return str(player_oid)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    global GENDER
    parser = argparse.ArgumentParser(
        description="Add a cricket player to the MongoDB dataset using Cricsheet data."
    )
    parser.add_argument(
        "--name", required=True,
        help="Player display name as used in Cricsheet (e.g. 'V Kohli')"
    )
    parser.add_argument(
        "--cricsheet-id", default=None,
        help="Cricsheet UUID for the player (optional; will be looked up if omitted)"
    )
    parser.add_argument(
        "--gender", default=GENDER, choices=["male", "female"],
        help="Player gender (default: male)"
    )
    args = parser.parse_args()

    GENDER = args.gender

    # --- Connect to MongoDB ---
    client = MongoClient(MONGO_URI)
    db     = client[DB_NAME]
    log.info(f"Connected to MongoDB: {MONGO_URI} / db={DB_NAME}")

    # --- Resolve Cricsheet ID ---
    cricsheet_id  = args.cricsheet_id
    register_info = {}

    by_id, by_name = download_people_register()

    if not cricsheet_id:
        cricsheet_id = find_player_in_register(args.name, by_name)
        if cricsheet_id:
            log.info(f"Resolved '{args.name}' → Cricsheet ID: {cricsheet_id}")
        else:
            log.warning(
                f"Could not resolve '{args.name}' in the Cricsheet register. "
                "Proceeding with name-based matching only."
            )

    if cricsheet_id and cricsheet_id in by_id:
        register_info = by_id[cricsheet_id]

    # --- Fetch all historical match data ---
    log.info(f"Fetching all historical data for: {args.name}")
    match_stats = fetch_all_player_matches(args.name, cricsheet_id)
    log.info(f"Total matches found: {len(match_stats)}")

    if not match_stats:
        log.warning("No matches found. Check the player name matches Cricsheet's spelling.")
        # Still create the player document so we can track them for future updates
        match_stats = []

    # --- Store in MongoDB ---
    player_oid = upsert_player(args.name, cricsheet_id, register_info, match_stats, db)

    log.info(
        f"\n✓ Done! Player '{args.name}' added/updated.\n"
        f"  MongoDB _id : {player_oid}\n"
        f"  Matches stored: {len(match_stats)}\n"
    )
    client.close()


if __name__ == "__main__":
    main()