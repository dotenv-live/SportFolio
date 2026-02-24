# SportFolio — Comprehensive MongoDB Schema Reference

**Database:** `SportFolio`  
**Supported Sports:** Cricket · Swimming · Wrestling  
**Collections:** `players` · `player_matches`  
**Ingestion Scripts:** `cricket/add_player.py` · `cricket/watcher.py` · `swimming/swim_seed.py` · `wrestling/wrestle_seed.py`

> **Design principle:** Both collections are **sport-agnostic at the top level**. The `sport` field on each `players` document and the sport-specific sub-objects inside `stats` are the only places the schema diverges per sport.

---

## Table of Contents

1. [Collection: `players`](#collection-players)  
   - [Common top-level fields](#common-top-level-fields)  
   - [Cricket — `career_stats`](#cricket--career_stats)  
   - [Swimming — `career_stats`](#swimming--career_stats)  
   - [Wrestling — `career_stats`](#wrestling--career_stats)  
   - [Indexes](#players-indexes)  
2. [Collection: `player_matches`](#collection-player_matches)  
   - [Common top-level fields](#common-top-level-fields-1)  
   - [Cricket — `stats`](#cricket--stats)  
   - [Swimming — `stats`](#swimming--stats)  
   - [Wrestling — `stats`](#wrestling--stats)  
   - [Indexes](#player_matches-indexes)  
3. [Relationship Diagram](#relationship-diagram)  
4. [Competition Codes Reference](#competition-codes-reference)

---

## Collection: `players`

One document per player. Contains profile metadata and all-time career stats broken down by competition / event category.

### Common top-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | ✅ | Primary key (MongoDB auto-generated or pre-assigned) |
| `name` | `String` | ✅ | Display name e.g. `"V Kohli"`, `"Srihari Nataraj"`, `"Bajrang Punia"` |
| `sport` | `String` | ✅ | One of `"cricket"` · `"swimming"` · `"wrestling"` |
| `cricsheet_id` | `String` | ✅ | Internal unique short ID. For cricket: Cricsheet 8-char hex. For swimming/wrestling: a human-readable slug (e.g. `"sn100back"`, `"wr_bajrang"`) |
| `register_info` | `Object` | Cricket only | `{ name: String, unique_name: String }` — from Cricsheet people registry |
| `career_stats` | `Object` | ✅ | Sport-specific career stats — see per-sport sections below |
| `competitions` | `String[]` | ✅ | Competition codes the player has appeared in (see [Competition Codes Reference](#competition-codes-reference)) |
| `total_matches` | `Int` | ✅ | Total matches/races/bouts across all formats |
| `last_updated` | `Date \| String` | ✅ | UTC timestamp of last ingestion (ISO-8601) |

---

### Cricket — `career_stats`

Dynamic object keyed by **competition code**. Only formats in which the player has appeared are present. Re-computed incrementally by `watcher.py` from all stored `player_matches`.

```json
{
  "career_stats": {
    "<competition_code>": {
      "label":   "<String> human-readable competition name",
      "matches": "<Int> total matches in this format",
      "batting": { ... },
      "bowling": { ... }
    }
  }
}
```

#### `career_stats.<comp>.batting` (cricket)

| Field | Type | Description |
|---|---|---|
| `innings` | `Int` | Innings batted |
| `not_outs` | `Int` | Not-out innings |
| `runs` | `Int` | Total runs scored |
| `balls_faced` | `Int` | Total balls faced |
| `fours` | `Int` | Total 4s |
| `sixes` | `Int` | Total 6s |
| `fifties` | `Int` | 50–99 scores |
| `hundreds` | `Int` | 100+ scores |
| `highest` | `Int` | Highest individual score |
| `average` | `Float \| null` | `runs / (innings - not_outs)`; `null` if denominator is 0 |
| `strike_rate` | `Float \| null` | `runs / balls_faced × 100`; `null` if 0 balls |

#### `career_stats.<comp>.bowling` (cricket)

| Field | Type | Description |
|---|---|---|
| `innings` | `Int` | Innings bowled |
| `balls` | `Int` | Legal balls bowled |
| `overs_bowled` | `String` | e.g. `"42.3"` |
| `runs` | `Int` | Runs conceded |
| `wickets` | `Int` | Wickets taken |
| `wides` | `Int` | Wides delivered |
| `no_balls` | `Int` | No-balls delivered |
| `five_fors` | `Int` | Five-wicket hauls |
| `best_innings` | `String \| null` | e.g. `"5/23"`; `null` if never bowled |
| `economy` | `Float \| null` | Runs per over |
| `average` | `Float \| null` | Runs conceded per wicket |
| `strike_rate` | `Float \| null` | Balls bowled per wicket |

#### Cricket player example document

```json
{
  "_id": "699c71d828d500ebcf9f526c",
  "name": "Ashwin Hebbar",
  "sport": "cricket",
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

### Swimming — `career_stats`

Dynamic object keyed by **event slug** (e.g. `"100_back_lcm"`, `"200_fly_lcm"`). Each key represents a distinct swim event the player competes in. Multiple event entries can exist per player.

```json
{
  "career_stats": {
    "<event_slug>": {
      "label":         "<String> human-readable event name e.g. '100m Backstroke (LCM)'",
      "races":         "<Int> total races in this event",
      "personal_best": { ... },
      "medals":        { "gold": Int, "silver": Int, "bronze": Int }
    }
  }
}
```

#### `career_stats.<event>.personal_best` (swimming)

| Field | Type | Description |
|---|---|---|
| `time` | `String` | Formatted time e.g. `"53.77"` or `"1:56.38"` |
| `time_ms` | `Int` | Time in milliseconds e.g. `53770` |
| `date` | `String` | Date of personal best `YYYY-MM-DD` |
| `meet_name` | `String` | Name of the meet where PB was set |
| `fina_points` | `Int` | World Aquatics (FINA) points score |

#### Common swim event slugs

| Slug | Label |
|---|---|
| `50_free_lcm` | 50m Freestyle (LCM) |
| `100_free_lcm` | 100m Freestyle (LCM) |
| `200_free_lcm` | 200m Freestyle (LCM) |
| `400_free_lcm` | 400m Freestyle (LCM) |
| `800_free_lcm` | 800m Freestyle (LCM) |
| `1500_free_lcm` | 1500m Freestyle (LCM) |
| `50_back_lcm` | 50m Backstroke (LCM) |
| `100_back_lcm` | 100m Backstroke (LCM) |
| `50_breast_lcm` | 50m Breaststroke (LCM) |
| `100_breast_lcm` | 100m Breaststroke (LCM) |
| `50_fly_lcm` | 50m Butterfly (LCM) |
| `100_fly_lcm` | 100m Butterfly (LCM) |
| `200_fly_lcm` | 200m Butterfly (LCM) |
| `200_im_lcm` | 200m Individual Medley (LCM) |

> **LCM** = Long Course Meters (50m pool — Olympic standard)

#### Swimming player example document

```json
{
  "_id": "609c71d828d500ebcf9f526a",
  "name": "Srihari Nataraj",
  "sport": "swimming",
  "cricsheet_id": "sn100back",
  "career_stats": {
    "100_back_lcm": {
      "label": "100m Backstroke (LCM)",
      "races": 65,
      "personal_best": {
        "time": "53.77", "time_ms": 53770,
        "date": "2021-06-27", "meet_name": "Sette Colli Trophy", "fina_points": 880
      },
      "medals": { "gold": 18, "silver": 8, "bronze": 4 }
    }
  },
  "competitions": ["olympics", "commonwealth_games", "asian_games", "wa_champs", "fisu_games"],
  "total_matches": 130,
  "last_updated": "2026-02-24T02:00:00Z"
}
```

---

### Wrestling — `career_stats`

Dynamic object keyed by **weight category slug** (e.g. `"65kg_fs"`, `"53kg_fs"`). Each key represents a distinct weight class the wrestler has competed in. Multiple weight class entries can exist per player (wrestlers change weight classes throughout career).

```json
{
  "career_stats": {
    "<weight_slug>": {
      "label":   "<String> human-readable e.g. 'Men\\'s 65kg Freestyle'",
      "matches": "<Int> total bouts in this weight category",
      "medals":  { "gold": Int, "silver": Int, "bronze": Int }
    }
  }
}
```

#### Common wrestling weight slugs

| Slug | Label |
|---|---|
| `57kg_fs` | Men's 57kg Freestyle |
| `65kg_fs` | Men's 65kg Freestyle |
| `61kg_fs` | Men's 61kg Freestyle |
| `60kg_fs` | Men's 60kg Freestyle |
| `86kg_fs` | Men's 86kg Freestyle |
| `92kg_fs` | Men's 92kg Freestyle |
| `48kg_fs` | Women's 48kg Freestyle |
| `50kg_fs` | Women's 50kg Freestyle |
| `53kg_fs` | Women's 53kg Freestyle |
| `55kg_fs` | Women's 55kg Freestyle |
| `57kg_fs` | Women's 57kg Freestyle |
| `58kg_fs` | Women's 58kg Freestyle |
| `59kg_fs` | Women's 59kg Freestyle |
| `62kg_fs` | Women's 62kg Freestyle |
| `65kg_fs` | Women's 65kg Freestyle |
| `68kg_fs` | Women's 68kg Freestyle |
| `72kg_fs` | Women's 72kg Freestyle |
| `76kg_fs` | Women's 76kg Freestyle |

> **fs** = Freestyle. All current Indian players compete in Freestyle. Greco-Roman would use suffix `_gr`.

#### Wrestling player example document

```json
{
  "_id": "609c71d828d500ebcf9f5201",
  "name": "Bajrang Punia",
  "sport": "wrestling",
  "cricsheet_id": "wr_bajrang",
  "career_stats": {
    "65kg_fs": {
      "label": "Men's 65kg Freestyle",
      "matches": 142,
      "medals": { "gold": 12, "silver": 5, "bronze": 8 }
    },
    "61kg_fs": {
      "label": "Men's 61kg Freestyle",
      "matches": 38,
      "medals": { "gold": 1, "silver": 3, "bronze": 2 }
    }
  },
  "competitions": ["olympics", "world_champs", "cwc", "asian_games", "asian_champs"],
  "total_matches": 235,
  "last_updated": "2026-02-24T02:00:00Z"
}
```

---

### Players Indexes

```js
// Applied for all sports
db.players.createIndex({ "name": 1 })
db.players.createIndex({ "cricsheet_id": 1 }, { unique: true, sparse: true })
db.players.createIndex({ "sport": 1 })
db.players.createIndex({ "competitions": 1 })
```

---

## Collection: `player_matches`

One document per **(player × match/race/bout)**. All per-event performance details live inside the `stats` sub-object. The top-level structure is **identical across all sports**; only `stats.performance` diverges per sport.

### Common top-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | `ObjectId` | ✅ | Primary key |
| `player_id` | `ObjectId` | ✅ | Foreign key → `players._id` |
| `match_id` | `String` | ✅ | Unique match/race/bout identifier. For cricket: Cricsheet file ID. For swimming/wrestling: manually assigned slug e.g. `"sn_01"`, `"m_1_1"` |
| `date` | `String` | ✅ | Event date `YYYY-MM-DD` |
| `ingested_at` | `Date` | ✅ | UTC timestamp when document was written |
| `stats` | `Object` | ✅ | All event details — see per-sport sections below |

---

### Cricket — `stats`

| Field | Type | Description |
|---|---|---|
| `player_name` | `String` | Denormalised display name |
| `cricsheet_id` | `String` | Player's Cricsheet short ID |
| `competition` | `String` | Competition code (see [Competition Codes Reference](#competition-codes-reference)) |
| `competition_label` | `String` | Human-readable competition name |
| `match_type` | `String` | Cricsheet type: `"T20"` · `"ODI"` · `"Test"` · `"MDM"` · `"IT20"` · `"ODM"` |
| `event` | `String` | Tournament name e.g. `"Syed Mushtaq Ali Trophy"` |
| `teams` | `String[2]` | The two teams e.g. `["Karnataka", "Punjab"]` |
| `venue` | `String` | Ground name |
| `outcome` | `Object` | Match result — see below |
| `batting_stats` | `Object \| {}` | Per-match batting (empty object `{}` if player did not bat) |
| `bowling_stats` | `Object \| {}` | Per-match bowling (empty object `{}` if player did not bowl) |

#### `stats.outcome` (cricket)

```json
// Win by runs
{ "winner": "Karnataka", "by": { "runs": 24 } }

// Win by wickets
{ "winner": "Mumbai", "by": { "wickets": 5 } }

// Tie
{ "result": "tie" }

// No result / abandoned
{ "result": "no result" }
```

#### `stats.batting_stats` (cricket — single match)

| Field | Type | Description |
|---|---|---|
| `runs` | `Int` | Runs scored |
| `balls_faced` | `Int` | Balls faced |
| `fours` | `Int` | Boundaries hit |
| `sixes` | `Int` | Maximums hit |
| `strike_rate` | `Float` | `runs / balls_faced × 100` |
| `dismissal` | `String \| null` | Dismissal mode e.g. `"caught"` · `"bowled"` · `"run out"` · `"lbw"` · `"stumped"` · `null` if not out |
| `not_out` | `Boolean` | `true` if player was not dismissed |

#### `stats.bowling_stats` (cricket — single match)

| Field | Type | Description |
|---|---|---|
| `overs` | `String` | Overs bowled e.g. `"4.2"` |
| `balls_bowled` | `Int` | Legal deliveries bowled |
| `runs_conceded` | `Int` | Runs given away |
| `wickets` | `Int` | Wickets taken |
| `wides` | `Int` | Wides |
| `no_balls` | `Int` | No-balls |
| `economy` | `Float` | Runs per over |

#### Cricket `player_matches` example document

```json
{
  "_id": "ObjectId(...)",
  "player_id": "699c71d828d500ebcf9f526c",
  "match_id": "1362865",
  "date": "2025-11-21",
  "ingested_at": "2026-02-23T15:27:20Z",
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
  }
}
```

---

### Swimming — `stats`

| Field | Type | Description |
|---|---|---|
| `player_name` | `String` | Denormalised display name |
| `cricsheet_id` | `String` | Player's internal ID slug |
| `competition` | `String` | Competition code (see [Competition Codes Reference](#competition-codes-reference)) |
| `competition_label` | `String` | Human-readable meet name e.g. `"Sette Colli Trophy"` |
| `match_type` | `String` | Round/stage: `"Final"` · `"Semi-Final"` · `"Heats"` · `"Time Trial"` |
| `event` | `String` | Full event name e.g. `"Men's 100m Backstroke"` |
| `venue` | `String` | Pool/arena name and location |
| `performance` | `Object` | Race result — see below |

#### `stats.performance` (swimming)

| Field | Type | Description |
|---|---|---|
| `status` | `String` | `"OK"` · `"DNS"` (did not start) · `"DNF"` (did not finish) · `"DQ"` (disqualified) |
| `time` | `String` | Finishing time e.g. `"53.77"` or `"1:56.38"` |
| `time_ms` | `Int` | Time in milliseconds e.g. `53770` |
| `reaction_time` | `Float \| null` | Reaction time off the block in seconds; `null` if not recorded |
| `rank` | `Int` | Finishing position in the race |
| `fina_points` | `Int` | World Aquatics (FINA) points score |
| `splits` | `Array` | Intermediate split times (empty `[]` if not recorded) |

#### Swimming `player_matches` example document

```json
{
  "_id": "ObjectId(...)",
  "player_id": "609c71d828d500ebcf9f526a",
  "match_id": "sn_01",
  "date": "2021-06-27",
  "ingested_at": "2026-02-24T02:00:00Z",
  "stats": {
    "player_name": "Srihari Nataraj",
    "cricsheet_id": "sn100back",
    "competition": "sette_colli",
    "competition_label": "Sette Colli Trophy",
    "match_type": "Final",
    "event": "Men's 100m Backstroke",
    "venue": "Stadio del Nuoto, Rome",
    "performance": {
      "status": "OK",
      "time": "53.77",
      "time_ms": 53770,
      "reaction_time": null,
      "rank": 1,
      "fina_points": 880,
      "splits": []
    }
  }
}
```

---

### Wrestling — `stats`

| Field | Type | Description |
|---|---|---|
| `player_name` | `String` | Denormalised display name |
| `cricsheet_id` | `String` | Player's internal ID slug e.g. `"wr_bajrang"` |
| `competition` | `String` | Competition code (see [Competition Codes Reference](#competition-codes-reference)) |
| `competition_label` | `String` | Human-readable tournament name e.g. `"Tokyo 2020 Olympics"` |
| `match_type` | `String` | Round/stage: `"Final"` · `"Semifinal"` · `"Quarterfinal"` · `"Round of 16"` · `"Bronze Medal Match"` · `"Repechage"` |
| `event` | `String` | Weight category e.g. `"Men's 65kg"`, `"Women's 53kg"` |
| `opponent_name` | `String` | Opponent's name and country code e.g. `"Daulet Niyazbekov (KAZ)"` |
| `performance` | `Object` | Bout result — see below |

#### `stats.performance` (wrestling)

| Field | Type | Description |
|---|---|---|
| `status` | `String` | Always `"VPO"`, `"VPO1"`, `"VSU"`, `"VSU1"`, `"VFA"`, `"VIN"`, `"VCA"`, `"VSC"` — UWW victory codes (see below) |
| `result` | `String` | `"Win"` or `"Loss"` |
| `technical_points_scored` | `Int` | Technical points scored by the tracked player |
| `technical_points_conceded` | `Int` | Technical points scored by the opponent |

#### UWW Victory/Result Codes

| Code | Meaning |
|---|---|
| `VPO` | Victory by Points |
| `VPO1` | Victory by Points (1 point difference) |
| `VSU` | Victory by Superiority (technical superiority) |
| `VSU1` | Victory by Superiority (1 point at time of call) |
| `VFA` | Victory by Fall / Pin |
| `VIN` | Victory by Injury default |
| `VCA` | Victory by Caution accumulation |
| `VSC` | Victory by Score (opponent reached 10-point deficit) |

#### Wrestling `player_matches` example document

```json
{
  "_id": "m_1_1",
  "player_id": "609c71d828d500ebcf9f5201",
  "match_id": "ext_1_1",
  "date": "2021-08-07",
  "ingested_at": "2026-02-24T02:00:00Z",
  "stats": {
    "player_name": "Bajrang Punia",
    "cricsheet_id": "wr_bajrang",
    "competition": "olympics",
    "competition_label": "Tokyo 2020 Olympics",
    "match_type": "Bronze Medal Match",
    "event": "Men's 65kg",
    "opponent_name": "Daulet Niyazbekov (KAZ)",
    "performance": {
      "status": "VPO",
      "result": "Win",
      "technical_points_scored": 8,
      "technical_points_conceded": 0
    }
  }
}
```

---

### `player_matches` Indexes

```js
// Applied for all sports
db.player_matches.createIndex({ "player_id": 1, "date": -1 })
db.player_matches.createIndex({ "match_id": 1, "player_id": 1 }, { unique: true })
db.player_matches.createIndex({ "stats.competition": 1 })
db.player_matches.createIndex({ "stats.player_name": 1 })
db.player_matches.createIndex({ "stats.event": 1 })
```

---

## Relationship Diagram

```
players
  _id  ──────────────────────────────────────────┐
  name                                            │  (1 → many)
  sport                                           │
  cricsheet_id                                    │
  career_stats (dynamic, sport-specific)          │
    Cricket  → { <comp_code>: { batting, bowling } }
    Swimming → { <event_slug>: { personal_best, medals, races } }
    Wrestling→ { <weight_slug>: { matches, medals } }
  competitions[]                                  │
  total_matches                                   │
  last_updated                                    │
                                                  │
player_matches                                    │
  _id                                             │
  player_id  ─────────────────────────────────────┘
  match_id ← unique per (player, match)
  date
  ingested_at
  stats (dynamic, sport-specific)
    Common:    player_name, cricsheet_id, competition,
               competition_label, match_type, event
    Cricket  → teams, venue, outcome, batting_stats, bowling_stats
    Swimming → venue, performance { time, time_ms, rank, fina_points, ... }
    Wrestling→ opponent_name, performance { status, result, pts_scored, pts_conceded }
```

---

## Competition Codes Reference

### Cricket

| Code | Label |
|---|---|
| `tests` | Test matches |
| `odis` | One-day internationals |
| `t20s` | T20 internationals |
| `it20s` | Unofficial T20 internationals |
| `ipl` | Indian Premier League |
| `wpl` | Women's Premier League |
| `sma` | Syed Mushtaq Ali Trophy |
| `mdms` | Multi-day domestic (Ranji / Duleep / Irani) |
| `odms` | One-day domestic (Vijay Hazare) |

### Swimming

| Code | Label |
|---|---|
| `olympics` | Olympic Games |
| `wa_champs` | World Aquatics Championships |
| `wa_junior_champs` | World Aquatics Junior Championships |
| `commonwealth_games` | Commonwealth Games |
| `asian_games` | Asian Games |
| `asian_aquatics` | Asian Aquatics Championships |
| `asian_age_group` | Asian Age Group Championships |
| `asian_youth_games` | Asian Youth Games |
| `fisu_games` | FISU World University Games |
| `saf_games` | South Asian Games |
| `nat_games` | National Games of India |
| `nat_champs` | Senior National Aquatic Championships |
| `junior_nats` | Junior National Aquatic Championships |
| `sette_colli` | Sette Colli Trophy |
| `dubai_open` | Dubai Open Swimming Championships |
| `sgp_champs` | Singapore National Championships |
| `aus_champs` | Australian National Championships |
| `fran_crippen` | Fran Crippen Swim Meet (CA TYR/MVN) |
| `gaf_gmaaa` | GAF-GMAAA Junior Aquatic Meet |
| `belgrade_trophy` | Belgrade Trophy |

### Wrestling

| Code | Label |
|---|---|
| `olympics` | Olympic Games |
| `world_champs` | UWW World Wrestling Championships |
| `world_u20` | UWW World Under-20 Championships |
| `world_u23` | UWW World Under-23 Championships |
| `asian_games` | Asian Games |
| `asian_champs` | UWW Asian Wrestling Championships |
| `asian_qualifiers` | UWW Asian Olympic Qualifiers |
| `cwc` | Commonwealth Wrestling Championships / CWG |

---

*Last updated: 2026-02-24*
