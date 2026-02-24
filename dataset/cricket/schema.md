# SportFolio — MongoDB Schema Reference

**Database:** `SportFolio`  
**Source:** Cricsheet — ingested via [add_player.py](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/add_player.py) / kept live by [watcher.py](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/watcher.py)

---

## Collection: [players](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/watcher.py#368-374)

One document per player. Contains profile metadata and all-time career stats broken down by competition format.

### Top-level fields

| Field | Type | Description |
|---|---|---|
| [_id](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/espn_to_mongo.py#57-87) | `ObjectId` | Primary key |
| `name` | `String` | Display name e.g. `"V Kohli"` |
| `cricsheet_id` | `String` | Cricsheet short ID e.g. `"b11d8647"` |
| `register_info` | `Object` | `{name, unique_name}` from Cricsheet register |
| [career_stats](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/watcher.py#257-299) | `Object` | Per-format career stats — see below |
| `competitions` | `String[]` | Competition codes the player has appeared in |
| `total_matches` | `Int` | Total matches across all formats |
| `last_updated` | `Date` | UTC timestamp of last ingestion |

### [career_stats](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/watcher.py#257-299) sub-schema

Dynamic object keyed by competition code. Only formats the player has played in are present.

```json
{
  "career_stats": {
    "<competition_code>": {
      "label":   "String — human-readable name",
      "matches": "Int",
      "batting": { ... },
      "bowling": { ... }
    }
  }
}
```

**Competition codes:**

| Code | Label |
|---|---|
| `tests` | Test matches |
| `odis` | One-day internationals |
| `t20s` | T20 internationals |
| `it20s` | Unofficial T20 internationals |
| `ipl` | IPL |
| `wpl` | Women's Premier League |
| `sma` | Syed Mushtaq Ali Trophy |
| `mdms` | Multi-day domestic (Ranji / Duleep / Irani) |
| `odms` | One-day domestic (Vijay Hazare) |

### [batting](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/watcher.py#126-157) object (per format)

| Field | Type | Description |
|---|---|---|
| [innings](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/add_player.py#186-231) | `Int` | Innings batted |
| `not_outs` | `Int` | Not-out innings |
| `runs` | `Int` | Total runs |
| `balls_faced` | `Int` | Total balls faced |
| `fours` | `Int` | Total 4s |
| `sixes` | `Int` | Total 6s |
| `fifties` | `Int` | 50–99 scores |
| `hundreds` | `Int` | 100+ scores |
| `highest` | `Int` | Highest individual score |
| `average` | `Float\|null` | `runs / (innings - not_outs)` |
| `strike_rate` | `Float\|null` | `runs / balls_faced × 100` |

### [bowling](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/watcher.py#159-192) object (per format)

| Field | Type | Description |
|---|---|---|
| [innings](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/add_player.py#186-231) | `Int` | Innings bowled |
| `balls` | `Int` | Legal balls bowled |
| `overs_bowled` | `String` | e.g. `"42.3"` |
| `runs` | `Int` | Runs conceded |
| `wickets` | `Int` | Wickets taken |
| `wides` | `Int` | Wides |
| `no_balls` | `Int` | No-balls |
| `five_fors` | `Int` | Five-wicket hauls |
| `best_innings` | `String\|null` | e.g. `"5/23"` |
| `economy` | `Float\|null` | Runs per over |
| `average` | `Float\|null` | Runs per wicket |
| `strike_rate` | `Float\|null` | Balls per wicket |

### Indexes

```js
db.players.createIndex({ "name": 1 }, { unique: true })
db.players.createIndex({ "cricsheet_id": 1 })
db.players.createIndex({ "competitions": 1 })
```

### Example document

```json
{
  "_id": "699c71d828d500ebcf9f526c",
  "name": "Ashwin Hebbar",
  "cricsheet_id": "b11d8647",
  "register_info": { "name": "Ashwin Hebbar", "unique_name": "Ashwin Hebbar" },
  "career_stats": {
    "sma": {
      "label": "Syed Mushtaq Ali Trophy",
      "matches": 35,
      "batting": {
        "innings": 33, "not_outs": 2, "runs": 712, "balls_faced": 510,
        "fours": 64, "sixes": 18, "fifties": 5, "hundreds": 0, "highest": 78,
        "average": 22.97, "strike_rate": 139.61
      },
      "bowling": {
        "innings": 0, "balls": 0, "overs_bowled": "0.0", "runs": 0, "wickets": 0,
        "wides": 0, "no_balls": 0, "five_fors": 0, "best_innings": null,
        "economy": null, "average": null, "strike_rate": null
      }
    }
  },
  "competitions": ["sma"],
  "total_matches": 35,
  "last_updated": "2026-02-23T15:27:20Z"
}
```

---

## Collection: [player_matches](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/add_player.py#349-416)

One document per **(player × match)**. Stores only matches from the **last 365 days**. All match-level data lives inside the [stats](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/watcher.py#126-157) sub-object.

### Top-level fields

| Field | Type | Description |
|---|---|---|
| [_id](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/espn_to_mongo.py#57-87) | `ObjectId` | Primary key |
| [player_id](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/espn_to_mongo.py#57-87) | `ObjectId` | Ref → `players._id` |
| `match_id` | `String` | Cricsheet match file ID |
| [date](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/espn_to_mongo.py#168-201) | `String` | Match date `YYYY-MM-DD` |
| [stats](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/watcher.py#126-157) | `Object` | All match details — see below |
| `ingested_at` | `Date` | UTC write timestamp |

### [stats](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/watcher.py#126-157) sub-object

| Field | Type | Description |
|---|---|---|
| `player_name` | `String` | Denormalised player name |
| `cricsheet_id` | `String` | Cricsheet short ID |
| [competition](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/watcher.py#337-350) | `String` | Competition code (see codes above) |
| `competition_label` | `String` | Human-readable competition name |
| `match_type` | `String` | Cricsheet type: `"T20"`, `"ODI"`, `"Test"`, `"MDM"` … |
| `event` | `String` | Tournament name from Cricsheet JSON |
| `teams` | `String[2]` | The two teams e.g. `["Karnataka", "Punjab"]` |
| `venue` | `String` | Ground name |
| `outcome` | `Object` | Match result — see below |
| [batting_stats](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/watcher.py#126-157) | `Object\|{}` | Per-match batting (`{}` if did not bat) |
| [bowling_stats](file:///Users/abhinavbajpai/Documents/Hackathon/SportFolio/dataset/watcher.py#159-192) | `Object\|{}` | Per-match bowling (`{}` if did not bowl) |

### `stats.outcome` object

```json
{ "winner": "Karnataka", "by": { "runs": 24 } }
{ "winner": "Mumbai", "by": { "wickets": 5 } }
{ "result": "tie" }
{ "result": "no result" }
```

### `stats.batting_stats` object (single match)

| Field | Type | Description |
|---|---|---|
| `runs` | `Int` | Runs scored |
| `balls_faced` | `Int` | Balls faced |
| `fours` | `Int` | Boundaries |
| `sixes` | `Int` | Maximums |
| `strike_rate` | `Float` | Innings SR |
| `dismissal` | `String\|null` | `"caught"`, `"bowled"`, etc. or `null` if not out |
| `not_out` | `Boolean` | `true` if not dismissed |

### `stats.bowling_stats` object (single match)

| Field | Type | Description |
|---|---|---|
| `overs` | `String` | Overs bowled e.g. `"4.2"` |
| `balls_bowled` | `Int` | Legal deliveries |
| `runs_conceded` | `Int` | Runs given |
| `wickets` | `Int` | Wickets taken |
| `wides` | `Int` | Wides |
| `no_balls` | `Int` | No-balls |
| `economy` | `Float` | Economy rate |

### Indexes

```js
db.player_matches.createIndex({ "player_id": 1, "date": -1 })
db.player_matches.createIndex({ "match_id": 1, "player_id": 1 }, { unique: true })
db.player_matches.createIndex({ "stats.competition": 1 })
db.player_matches.createIndex({ "stats.player_name": 1 })
```

### Example document

```json
{
  "_id": "...",
  "player_id": "699c71d828d500ebcf9f526c",
  "match_id": "1362865",
  "date": "2025-11-21",
  "stats": {
    "player_name": "Ashwin Hebbar",
    "cricsheet_id": "b11d8647",
    "competition": "sma",
    "competition_label": "Syed Mushtaq Ali Trophy",
    "match_type": "T20",
    "event": "Syed Mushtaq Ali Trophy",
    "teams": ["Karnataka", "Rajasthan"],
    "venue": "M.Chinnaswamy Stadium, Bengaluru",
    "outcome": { "winner": "Karnataka", "by": { "runs": 18 } },
    "batting_stats": {
      "runs": 54, "balls_faced": 38,
      "fours": 6, "sixes": 2,
      "strike_rate": 142.10,
      "dismissal": "caught",
      "not_out": false
    },
    "bowling_stats": {}
  },
  "ingested_at": "2026-02-23T15:27:20Z"
}
```

---

## Relationship diagram

```
players
  _id  ──────────────────────────────┐
  name                               │  (1 → many)
  career_stats                       │
    └─ {comp_code}                   │
         ├─ batting                  │
         └─ bowling                  │
                                     │
player_matches                       │
  player_id  ────────────────────────┘
  match_id         ← unique per player+match
  date
  ingested_at
  stats
    ├─ competition / competition_label
    ├─ match_type / event
    ├─ teams / venue / outcome
    ├─ batting_stats
    └─ bowling_stats
```
