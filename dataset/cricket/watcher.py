"""
match_watcher.py
================
Long-running daemon that periodically pulls newly-added/played matches from
Cricsheet and updates MongoDB with stats for every tracked player.

Run once and leave it:
    python match_watcher.py

Or with custom settings:
    POLL_INTERVAL_HOURS=6 python match_watcher.py

Environment variables:
    MONGO_URI              MongoDB connection string (default: mongodb://localhost:27017)
    CRICKET_DB             Database name            (default: cricket)
    POLL_INTERVAL_HOURS    Hours between polls      (default: 6)
    LOOKBACK_DAYS          Cricsheet "recently_played_N" window (2, 7, or 30)  (default: 7)
    GENDER                 male | female            (default: male)

Dependencies:
    pip install pymongo requests schedule python-dotenv

MongoDB collections used:
    - players          : must already contain documents added by add_player.py
    - player_matches   : upserted per-match stats
    - watcher_state    : internal state (last run time, processed match IDs)
"""

import io
import json
import logging
import os
import signal
import sys
import time
import zipfile
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
import requests
import schedule
from pymongo import MongoClient, UpdateOne

# Load .env from the parent directory (dataset/.env)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# ---------------------------------------------------------------------------
# Configuration (all overridable via environment variables)
# ---------------------------------------------------------------------------

MONGO_URI           = os.getenv("MONGO_URI")
if not MONGO_URI:
    sys.exit("ERROR: MONGO_URI is not set. Add it to dataset/.env or export it.")
DB_NAME             = os.getenv("CRICKET_DB", "SportFolio")
POLL_INTERVAL_HOURS = float(os.getenv("POLL_INTERVAL_HOURS", "6"))
LOOKBACK_DAYS       = int(os.getenv("LOOKBACK_DAYS", "7"))   # 2, 7, or 30
GENDER              = os.getenv("GENDER", "male")

CS_BASE = "https://cricsheet.org"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("match_watcher.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Graceful shutdown
# ---------------------------------------------------------------------------

_running = True

def _handle_signal(signum, frame):
    global _running
    log.info(f"Received signal {signum}. Shutting down after current poll …")
    _running = False

signal.signal(signal.SIGINT,  _handle_signal)
signal.signal(signal.SIGTERM, _handle_signal)

# ---------------------------------------------------------------------------
# Cricsheet helpers  (same as add_player.py — kept self-contained)
# ---------------------------------------------------------------------------

def _download_recent_zip(lookback_days: int = LOOKBACK_DAYS,
                         gender: str = GENDER) -> Optional[bytes]:
    """
    Download the 'recently_played_N' zip from Cricsheet.
    N must be one of 2, 7, or 30.
    """
    url = f"{CS_BASE}/downloads/recently_played_{lookback_days}_{gender}_json.zip"
    log.info(f"Fetching recent matches: {url}")
    try:
        r = requests.get(url, timeout=120)
        if r.status_code == 404:
            log.warning(f"404 for {url} — skipping")
            return None
        r.raise_for_status()
        return r.content
    except requests.RequestException as exc:
        log.error(f"Download failed: {exc}")
        return None


def _iter_matches(zip_bytes: bytes):
    """Yield (match_id, match_dict) for every JSON file in a zip."""
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for name in zf.namelist():
            if not name.endswith(".json"):
                continue
            match_id = name.replace(".json", "")
            try:
                yield match_id, json.loads(zf.read(name))
            except json.JSONDecodeError as exc:
                log.warning(f"Cannot parse {name}: {exc}")


# ---------------------------------------------------------------------------
# Stat extraction (duplicated from add_player.py for self-containment)
# ---------------------------------------------------------------------------

def _batting_stats(innings_list: list, player_name: str) -> dict:
    runs = balls = fours = sixes = 0
    dismissal = None
    did_bat   = False

    for inning in innings_list:
        for over in inning.get("overs", []):
            for d in over.get("deliveries", []):
                batter = d.get("batter") or d.get("batsman", "")
                if batter != player_name:
                    continue
                did_bat = True
                r = d.get("runs", {}).get("batter", 0)
                runs  += r
                balls += 1
                if r == 4: fours += 1
                if r == 6: sixes += 1
                for w in d.get("wickets", []):
                    if w.get("player_out") == player_name:
                        dismissal = w.get("kind", "unknown")

    if not did_bat:
        return {}
    sr = round(runs / balls * 100, 2) if balls else 0
    return {
        "runs": runs, "balls_faced": balls,
        "fours": fours, "sixes": sixes,
        "strike_rate": sr,
        "dismissal": dismissal,
        "not_out": dismissal is None,
    }


def _bowling_stats(innings_list: list, player_name: str) -> dict:
    runs_c = wickets = balls_b = wides = no_balls = 0
    did_bowl = False

    for inning in innings_list:
        for over in inning.get("overs", []):
            for d in over.get("deliveries", []):
                if d.get("bowler", "") != player_name:
                    continue
                did_bowl = True
                r       = d.get("runs", {})
                extras  = d.get("extras", {})
                runs_c += r.get("total", 0) - r.get("penalty", 0)
                if "wides" in extras:
                    wides    += extras["wides"]
                elif "noballs" in extras:
                    no_balls += extras["noballs"]
                else:
                    balls_b  += 1
                for w in d.get("wickets", []):
                    if w.get("kind") not in ("run out", "obstructing the field", "retired hurt"):
                        wickets += 1

    if not did_bowl:
        return {}
    overs_str = f"{balls_b // 6}.{balls_b % 6}"
    economy   = round(runs_c / (balls_b / 6), 2) if balls_b else 0
    return {
        "overs": overs_str, "balls_bowled": balls_b,
        "runs_conceded": runs_c, "wickets": wickets,
        "wides": wides, "no_balls": no_balls,
        "economy": economy,
    }


# ---------------------------------------------------------------------------
# Career stat updater  (incremental — only add what's new)
# ---------------------------------------------------------------------------

def _aggregate_one_format(match_list: list) -> dict:
    """Roll up batting/bowling stats for a single format group."""
    batting = {"innings": 0, "not_outs": 0, "runs": 0, "balls_faced": 0,
               "fours": 0, "sixes": 0, "fifties": 0, "hundreds": 0, "highest": 0}
    bowling = {"innings": 0, "balls": 0, "runs": 0, "wickets": 0,
               "wides": 0, "no_balls": 0, "five_fors": 0,
               "best_wickets": 0, "best_runs": 9999}

    for m in match_list:
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
            if r >= 100: batting["hundreds"] += 1
            elif r >= 50: batting["fifties"] += 1
            if r > batting["highest"]: batting["highest"] = r

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
            if wk >= 5: bowling["five_fors"] += 1
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

    balls_b = bowling["balls"]
    bowling["overs_bowled"] = f"{balls_b // 6}.{balls_b % 6}"
    bowling["economy"]      = round(bowling["runs"] / (balls_b / 6), 2) if balls_b else None
    bowling["average"]      = round(bowling["runs"] / bowling["wickets"], 2) \
                              if bowling["wickets"] else None
    bowling["strike_rate"]  = round(balls_b / bowling["wickets"], 2) \
                              if bowling["wickets"] else None
    bowling["best_innings"] = f"{bowling['best_wickets']}/{bowling['best_runs']}" \
                              if bowling["best_runs"] != 9999 else None

    return {"batting": batting, "bowling": bowling}


def _update_career_stats(player_doc: dict, _unused_new_matches: list, db) -> dict:
    """
    Re-compute per-format career stats by reading ALL player_matches for the player.
    Reads the nested stats sub-object introduced in the new schema.
    """
    from collections import defaultdict
    player_id = player_doc["_id"]
    all_matches = list(db["player_matches"].find(
        {"player_id": player_id},
        {"stats.batting_stats": 1, "stats.bowling_stats": 1,
         "stats.competition": 1, "stats.competition_label": 1}
    ))

    # Flatten the nested stats field for the aggregation helper
    flat = [
        {
            "batting_stats":     m.get("stats", {}).get("batting_stats", {}),
            "bowling_stats":     m.get("stats", {}).get("bowling_stats", {}),
            "competition":       m.get("stats", {}).get("competition", "unknown"),
            "competition_label": m.get("stats", {}).get("competition_label", ""),
        }
        for m in all_matches
    ]

    groups: dict = defaultdict(list)
    labels: dict = {}
    for m in flat:
        comp = m["competition"]
        groups[comp].append(m)
        if comp not in labels:
            labels[comp] = m["competition_label"]

    result = {}
    for comp, matches in groups.items():
        stats = _aggregate_one_format(matches)
        result[comp] = {
            "label":   labels[comp],
            "matches": len(matches),
            **stats,
        }

    return result


# Map Cricsheet match_type values → competition codes used in add_player.py.
# The watcher downloads a single "recently played" zip that spans all formats,
# so we derive the code from the match_type field in each JSON file.
_MATCH_TYPE_TO_COMP = {
    "Test":  "tests",
    "ODI":   "odis",
    "T20":   "t20s",
    "IT20":  "it20s",
    "MDM":   "mdms",
    "ODM":   "odms",
}

# Event-name fragments → (competition_code, label)
# Checked as case-insensitive substrings; more-specific entries come first.
_EVENT_NAME_TO_COMP = [
    # Indian domestic
    ("indian premier league",  "ipl",  "IPL"),
    ("ipl",                    "ipl",  "IPL"),
    ("women's premier league", "wpl",  "Women's Premier League"),
    ("syed mushtaq ali",       "sma",  "Syed Mushtaq Ali Trophy"),
    ("vijay hazare",           "odms", "One-day domestic matches (Vijay Hazare)"),
    ("ranji",                  "mdms", "Multi-day domestic matches (Ranji / Duleep / Irani)"),
    ("duleep",                 "mdms", "Multi-day domestic matches (Ranji / Duleep / Irani)"),
    ("irani",                  "mdms", "Multi-day domestic matches (Ranji / Duleep / Irani)"),
]

_COMP_LABELS = {
    "tests": "Test matches",
    "odis":  "One-day internationals",
    "t20s":  "T20 internationals",
    "it20s": "Unofficial T20 internationals",
    "mdms":  "Multi-day domestic matches (Ranji / Duleep / Irani)",
    "odms":  "One-day domestic matches (Vijay Hazare)",
}


def _resolve_competition(match_type: str, event_name: str) -> tuple[str, str]:
    """
    Return (competition_code, competition_label) for a match.
    Tries event-name fragments first (more specific), then falls back to match_type.
    """
    ev_lower = event_name.lower()
    for fragment, code, label in _EVENT_NAME_TO_COMP:
        if fragment in ev_lower:
            return code, label

    code = _MATCH_TYPE_TO_COMP.get(match_type, "other")
    label = _COMP_LABELS.get(code, match_type or "Other")
    return code, label


def _get_processed_ids(db) -> set:
    """Load all match_ids already stored in player_matches to avoid reprocessing."""
    state = db["watcher_state"].find_one({"_id": "processed_ids"})
    if state:
        return set(state.get("ids", []))
    return set()


def _save_processed_ids(ids: set, db):
    db["watcher_state"].update_one(
        {"_id": "processed_ids"},
        {"$set": {"ids": list(ids), "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )


def _load_tracked_players(db) -> list:
    """Return all player documents from the players collection."""
    return list(db["players"].find(
        {},
        {"_id": 1, "name": 1, "cricsheet_id": 1, "competitions": 1}
    ))


def poll_new_matches():
    """
    Single poll cycle:
      1. Download recently-played matches from Cricsheet.
      2. For each new match, check if any tracked player appeared.
      3. Compute and upsert per-match stats.
      4. Refresh career stats for affected players.
    """
    log.info("=" * 60)
    log.info(f"Poll started at {datetime.now(timezone.utc).isoformat()}")

    client = MongoClient(MONGO_URI)
    db     = client[DB_NAME]

    # --- Load current state ---
    processed_ids = _get_processed_ids(db)
    tracked       = _load_tracked_players(db)

    if not tracked:
        log.warning("No tracked players found. Add players first with add_player.py.")
        client.close()
        return

    log.info(f"Tracking {len(tracked)} player(s).")

    # Build fast-lookup maps
    name_to_player   = {p["name"]: p for p in tracked}
    csid_to_player   = {p["cricsheet_id"]: p for p in tracked
                        if p.get("cricsheet_id")}

    # --- Download recent matches ---
    zip_bytes = _download_recent_zip(LOOKBACK_DAYS, GENDER)
    if not zip_bytes:
        log.error("Could not download recent matches zip. Will retry next cycle.")
        client.close()
        return

    new_match_ids = []
    affected_players = set()   # player _ids who got new data

    match_ops = []   # bulk write ops for player_matches

    for match_id, match in _iter_matches(zip_bytes):
        if match_id in processed_ids:
            continue   # already processed

        new_match_ids.append(match_id)
        info     = match.get("info", {})
        innings  = match.get("innings", [])
        registry = info.get("registry", {}).get("people", {})

        # cs_id → name reverse map for this match
        cs_id_to_name = {v: k for k, v in registry.items()}

        dates      = info.get("dates", [])
        match_date = dates[0] if dates else None
        match_type = info.get("match_type", "unknown")
        event_info = info.get("event", {})
        event_name = event_info.get("name", "") if isinstance(event_info, dict) else ""
        competition_code, competition_label = _resolve_competition(match_type, event_name)

        # Identify all tracked players that appear in this match
        for player_name_in_match, cs_id in registry.items():
            player_doc = name_to_player.get(player_name_in_match) or \
                         csid_to_player.get(cs_id)
            if not player_doc:
                continue

            bs = _batting_stats(innings, player_name_in_match)
            bw = _bowling_stats(innings, player_name_in_match)

            if not bs and not bw:
                continue   # player listed but didn't bat or bowl

            affected_players.add(str(player_doc["_id"]))

            doc = {
                "player_id":  player_doc["_id"],
                "match_id":   match_id,
                "date":       match_date,
                "stats": {
                    "player_name":       player_doc["name"],
                    "cricsheet_id":      player_doc.get("cricsheet_id"),
                    "competition":       competition_code,
                    "competition_label": competition_label,
                    "match_type":        match_type,
                    "event":             event_name,
                    "teams":             info.get("teams", []),
                    "venue":             info.get("venue", ""),
                    "outcome":           info.get("outcome", {}),
                    "batting_stats":     bs,
                    "bowling_stats":     bw,
                },
                "ingested_at": datetime.now(timezone.utc),
            }
            match_ops.append(
                UpdateOne(
                    {"match_id": match_id, "player_id": player_doc["_id"]},
                    {"$set": doc},
                    upsert=True,
                )
            )

    # --- Bulk write match docs ---
    if match_ops:
        res = db["player_matches"].bulk_write(match_ops, ordered=False)
        log.info(f"player_matches: {res.upserted_count} inserted, "
                 f"{res.modified_count} updated across {len(new_match_ids)} new matches")
    else:
        log.info(f"No new stats to write ({len(new_match_ids)} new match files processed)")

    # --- Refresh career stats for affected players ---
    for pid_str in affected_players:
        from bson import ObjectId
        pid = ObjectId(pid_str)
        player_doc = db["players"].find_one({"_id": pid})
        if not player_doc:
            continue
        career = _update_career_stats(player_doc, [], db)
        db["players"].update_one(
            {"_id": pid},
            {"$set": {
                "sport":        "cricket",
                "career_stats": career,
                "total_matches": db["player_matches"].count_documents({"player_id": pid}),
                "last_updated": datetime.now(timezone.utc),
            }}
        )
        log.info(f"Career stats refreshed for: {player_doc['name']}")

    # --- Persist processed IDs ---
    processed_ids.update(new_match_ids)
    _save_processed_ids(processed_ids, db)

    # --- Record last run ---
    db["watcher_state"].update_one(
        {"_id": "last_run"},
        {"$set": {
            "timestamp":   datetime.now(timezone.utc),
            "new_matches": len(new_match_ids),
            "affected_players": len(affected_players),
        }},
        upsert=True,
    )

    log.info(
        f"Poll complete. New match files: {len(new_match_ids)}, "
        f"Players updated: {len(affected_players)}"
    )
    client.close()


# ---------------------------------------------------------------------------
# Scheduler loop
# ---------------------------------------------------------------------------

def main():
    log.info("=" * 60)
    log.info("Cricket Match Watcher starting …")
    log.info(f"  MongoDB   : {MONGO_URI}  /  db={DB_NAME}")
    log.info(f"  Poll every: {POLL_INTERVAL_HOURS}h")
    log.info(f"  Lookback  : recently_played_{LOOKBACK_DAYS} days")
    log.info(f"  Gender    : {GENDER}")
    log.info("=" * 60)

    # Run immediately on startup
    poll_new_matches()

    # Then schedule recurring runs
    schedule.every(POLL_INTERVAL_HOURS).hours.do(poll_new_matches)

    while _running:
        schedule.run_pending()
        time.sleep(30)   # check scheduler every 30 seconds

    log.info("Match watcher stopped cleanly.")


if __name__ == "__main__":
    main()