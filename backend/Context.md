# SportFolio Backend — Context Reference

> **Purpose:** Comprehensive reference for the backend codebase to avoid full scans in future queries.
> **Last updated:** 2026-02-23

---

## 1. Project Overview

**SportFolio** is an AI-powered Player Revenue Share Marketplace. Investors buy/sell shares in players whose prices are driven by real match performance, AI predictions, and market demand. The system supports dividends from player income, liquidity backstops (AMM buyback), and cross-sport scalability.

- **Framework:** FastAPI (Python 3.12+)
- **Database:** MongoDB (async via Motor)
- **Auth:** JWT (HS256) via `python-jose` + `bcrypt`
- **Rate Limiting:** SlowAPI (`100/minute` default)
- **Background Tasks:** APScheduler (AsyncIO)
- **AI/ML:** Placeholder XGBoost + LSTM models (mock implementations)
- **Real-time:** WebSocket price/trade broadcasts
- **Entry point:** `main.py` → `uvicorn main:app --host 0.0.0.0 --port 8000`

---

## 2. Directory Structure

```
backend/
├── main.py                      # FastAPI app, lifespan, routers, WS endpoints
├── requirements.txt             # Python dependencies
├── test.py                      # Comprehensive API test suite (sport config focus)
├── test_e2e.py                  # End-to-end smoke tests
├── app/
│   ├── __init__.py              # (empty)
│   ├── ai/                      # ML models & prediction
│   │   ├── predictor.py         # AIPredictor facade (combines XGB + LSTM)
│   │   ├── model_resolver.py    # MLModelResolver — per-sport model management
│   │   ├── xgboost_model.py     # XGBoostModel placeholder
│   │   └── lstm_model.py        # LSTMModel placeholder
│   ├── api/
│   │   ├── deps.py              # Shared dependencies (get_current_user, require_admin)
│   │   └── routes/
│   │       ├── auth.py          # /auth — register, login, /me
│   │       ├── players.py      # /players — CRUD, price history, recalculate
│   │       ├── trading.py       # /trade — buy/sell shares
│   │       ├── portfolio.py     # /portfolio — holdings, transactions, wallet
│   │       ├── income.py        # /income — income events & distribution
│   │       ├── player_matches.py   # /player-matches — CRUD with sport-aware validation
│   │       ├── admin.py         # /admin — liquidity, AI override, retrain, audit
│   │       └── sports.py        # /sports — sport config CRUD
│   ├── core/
│   │   ├── config.py            # Settings (pydantic-settings, .env)
│   │   ├── security.py          # Password hashing, JWT create/decode
│   │   ├── fraud.py             # Fraud precheck & audit hooks (placeholder)
│   │   ├── rate_limit.py        # SlowAPI limiter factory
│   │   └── ws_manager.py        # WebSocket ConnectionManager (per-player channels + global)
│   ├── db/
│   │   ├── mongo.py             # Motor client singleton, connect/close, get_db
│   │   ├── indexes.py           # Index creation on startup
│   │   └── seed.py              # Seed script (5 players, 3 users, price history, stats)
│   ├── models/                  # Pydantic models (Create/Update/Public/InDB patterns)
│   │   ├── common.py            # PyObjectId, BaseDocument
│   │   ├── player.py            # PlayerCreate/Update/Public/InDB (merged with Cricsheet)
│   │   ├── auth.py              # Token, LoginRequest
│   │   ├── user.py              # UserCreate/Public/InDB
│   │   ├── holding.py           # HoldingPublic/InDB
│   │   ├── transaction.py       # TransactionCreate/Public/InDB
│   │   ├── income_event.py      # IncomeEventCreate/Public/InDB
│   │   ├── player_match.py      # PlayerMatchCreate/Update/Public/InDB (merged with Cricsheet)
│   │   └── sport.py             # MetricDefinition, AIWeights, SportCreate/Update/Public/InDB
│   ├── services/                # Business logic
│   │   ├── price_engine.py      # Full pricing pipeline (PS → FV → DI → smooth → persist)
│   │   ├── trading_engine.py    # Buy/sell with AMM buyback & WS broadcasts
│   │   ├── performance_engine.py# HybridPerformanceService — sport-dynamic actual score (A)
│   │   ├── dividend_engine.py   # Income distribution & time-weighted dividend accrual
│   │   ├── metric_normalizer.py # MetricNormalizer — minmax/zscore/log strategies
│   │   └── sport_config.py      # SportConfigService — CRUD + in-memory cache (5min TTL)
│   └── tasks/
│       └── scheduler.py         # APScheduler cron jobs (dividends, retrain, recalc, audit)
```

---

## 3. Configuration (`app/core/config.py`)

Loaded from `.env` via `pydantic-settings`:

| Setting                       | Default                        | Description                          |
|-------------------------------|--------------------------------|--------------------------------------|
| `app_name`                    | `"SportFolio Backend"`         | Application name                     |
| `environment`                 | `"development"`                | Environment label                    |
| `mongo_uri`                   | `"mongodb://localhost:27017"`  | MongoDB connection string            |
| `mongo_db`                    | `"sportfolio"`                 | Database name                        |
| `jwt_secret`                  | `"CHANGE_ME"`                  | JWT signing secret                   |
| `jwt_algorithm`               | `"HS256"`                      | JWT algorithm                        |
| `access_token_expire_minutes` | `1440` (24h)                   | Token TTL                            |
| `rate_limit`                  | `"100/minute"`                 | Global rate limit                    |
| `price_smoothing_eta`         | `0.6`                          | EMA smoothing factor (η)            |
| `investor_income_share`       | `0.10`                         | 10% of income → investors           |
| `liquidity_income_share`      | `0.03`                         | 3% of income → liquidity pool       |
| `platform_income_share`       | `0.02`                         | 2% of income → platform reserve     |

---

## 4. Database (MongoDB)

### Collections & Key Indexes

| Collection       | Indexes                                                      |
|------------------|--------------------------------------------------------------|
| `users`          | `email` (unique)                                             |
| `players`        | `sport`, `name`, `cricsheet_id`, `competitions`              |
| `sports`         | `name` (unique)                                              |
| `holdings`       | `(user_id, player_id)` compound unique                       |
| `transactions`   | `(user_id, timestamp)`, `(player_id, type)`                  |
| `income_events`  | `(player_id, distributed)`                                   |
| `player_matches` | `(player_id, date)`, `(match_id, player_id)` unique, `stats.competition`, `stats.player_name` |
| `price_history`  | `(player_id, timestamp)`                                     |

### Key Document Shapes

**Player (merged):**
```
{ name, sport, total_shares, base_value, alpha, beta, gamma,
  performance_score, ai_score, fundamental_value, current_price,
  liquidity_pool_balance, circulating_shares, buy_volume, sell_volume, created_at,
  # Optional Cricsheet fields:
  cricsheet_id, register_info{name, unique_name},
  career_stats{ <competition_code>: { label, matches, batting{...}, bowling{...} } },
  competitions[], total_matches }
```
Competition codes: `tests`, `odis`, `t20s`, `it20s`, `ipl`, `wpl`, `sma`, `mdms`, `odms`

Batting sub-fields: `innings, not_outs, runs, balls_faced, fours, sixes, fifties, hundreds, highest, average, strike_rate`

Bowling sub-fields: `innings, balls, overs_bowled, runs, wickets, wides, no_balls, five_fors, best_innings, economy, average, strike_rate`

**User:**
```
{ name, email, hashed_password, wallet_balance, role("investor"|"admin"), created_at }
```

**Holding:**
```
{ user_id, player_id, shares_owned, accrued_dividend, last_accrual_timestamp }
```

**Transaction:**
```
{ type("buy"|"sell"|"dividend"|"liquidity_buyback"), user_id, player_id, shares, price, timestamp }
```

**IncomeEvent:**
```
{ player_id, verified_income, income_date, distributed(bool),
  investor_pool, liquidity_add, platform_reserve, daily_rate_per_share }
```

**PlayerMatch:**
```
{ player_id, match_id, date("YYYY-MM-DD"),
  stats{ player_name, cricsheet_id, competition, competition_label, match_type,
         event, teams[], venue, outcome{winner,by,result},
         batting_stats{runs, balls_faced, fours, sixes, strike_rate, dismissal, not_out},
         bowling_stats{overs, balls_bowled, runs_conceded, wickets, wides, no_balls, economy},
         ...any custom marketplace metrics },
  ingested_at }
```
All match-level data (Cricsheet and marketplace) lives inside the `stats` sub-object.

**Sport:**
```
{ name, metrics[{key, weight, normalization}], phi, ai_weights{xgb, lstm}, created_at }
```

**PriceHistory:**
```
{ player_id, price, fundamental_value, performance_score, timestamp }
```

---

## 5. API Routes (all prefixed `/api/v1`)

### Auth (`/auth`)
| Method | Endpoint              | Auth     | Description                      |
|--------|-----------------------|----------|----------------------------------|
| POST   | `/auth/register`      | None     | Create user, return JWT          |
| POST   | `/auth/login`         | None     | Login, return JWT                |
| GET    | `/auth/me`            | User     | Current user profile             |

### Players (`/players`)
| Method | Endpoint                                | Auth  | Description                      |
|--------|-----------------------------------------|-------|----------------------------------|
| GET    | `/players/`                            | None  | List (filterable by `sport`)     |
| GET    | `/players/{id}`                        | None  | Single player detail            |
| POST   | `/players/`                            | Admin | Create player                   |
| PUT    | `/players/{id}`                        | Admin | Update player fields            |
| POST   | `/players/{id}/recalculate-price`      | Admin | Trigger price recalculation      |
| GET    | `/players/{id}/price-history`          | None  | Chronological price snapshots    |

### Trading (`/trade`)
| Method | Endpoint       | Auth | Body                        | Description           |
|--------|----------------|------|-----------------------------|-----------------------|
| POST   | `/trade/buy`   | User | `{player_id, shares}`      | Buy shares            |
| POST   | `/trade/sell`  | User | `{player_id, shares}`      | Sell shares (AMM)     |

### Portfolio (`/portfolio`)
| Method | Endpoint                       | Auth | Description                          |
|--------|--------------------------------|------|--------------------------------------|
| GET    | `/portfolio/holdings`          | User | All holdings with live dividends     |
| GET    | `/portfolio/transactions`      | User | Last 100 transactions                |
| GET    | `/portfolio/wallet`            | User | Wallet balance                       |
| POST   | `/portfolio/wallet/deposit`    | User | Deposit (query param `amount`)       |

### Income (`/income`)
| Method | Endpoint                       | Auth  | Description                          |
|--------|--------------------------------|-------|--------------------------------------|
| POST   | `/income/`                     | Admin | Add income event                     |
| POST   | `/income/{id}/distribute`      | Admin | Trigger distribution (10/3/2 split)  |
| GET    | `/income/`                     | Admin | List income events                   |

### Player Matches (`/player-matches`)
| Method | Endpoint                | Auth  | Description                                   |
|--------|-------------------------|-------|-----------------------------------------------|
| GET    | `/player-matches/`         | User  | List (filterable by `player_id`)             |
| GET    | `/player-matches/{id}`     | User  | Single stat record                            |
| POST   | `/player-matches/`         | Admin | Create (triggers price recalc, soft validation)|
| PUT    | `/player-matches/{id}`     | Admin | Update (flexible dict, triggers recalc)       |
| DELETE | `/player-matches/{id}`     | Admin | Delete stat record                            |

### Sports (`/sports`)
| Method | Endpoint          | Auth  | Description                    |
|--------|-------------------|-------|--------------------------------|
| GET    | `/sports/`        | User  | List all sport configs         |
| GET    | `/sports/{id}`    | User  | Single sport config            |
| POST   | `/sports/`        | Admin | Create sport config            |
| PUT    | `/sports/{id}`    | Admin | Update sport config            |

### Admin (`/admin`)
| Method | Endpoint                              | Auth  | Description                              |
|--------|---------------------------------------|-------|------------------------------------------|
| POST   | `/admin/liquidity/adjust`             | Admin | Adjust player liquidity pool            |
| POST   | `/admin/ai-score/override`            | Admin | Override AI score + recalc price         |
| POST   | `/admin/dividends/accrue-all`         | Admin | Run dividend accrual for all             |
| POST   | `/admin/dividends/accrue/{player_id}`| Admin | Run accrual for one player              |
| POST   | `/admin/ai/retrain`                   | Admin | Retrain AI per sport (all)               |
| POST   | `/admin/ai/retrain/{player_id}`      | Admin | Retrain AI for single player            |
| POST   | `/admin/price/recalculate-all`        | Admin | Recalculate all player prices           |
| POST   | `/admin/liquidity/audit`              | Admin | Audit liquidity pool integrity           |

### WebSocket
| Endpoint                   | Description                          |
|----------------------------|--------------------------------------|
| `/ws/prices`               | Global — all player price updates   |
| `/ws/prices/{player_id}`  | Per-player price updates             |

### Health
| Endpoint    | Description        |
|-------------|--------------------|
| `/health`   | `{"status": "ok"}` |

---

## 6. Core Mathematical Model

### Performance Score (PS)
```
PS = 0.30·actual_score + 0.20·consistency + 0.15·growth + 0.10·fitness + 0.25·ai_score
```
Weights defined in `price_engine.py` as `W_ACTUAL_SCORE`, `W_CONSISTENCY`, `W_GROWTH`, `W_FITNESS`, `W_AI_SCORE`.

### Hybrid Actual Score (A)
```
A_formula = Σ θ_k · normalize(M_k)     # sport-specific weighted metrics
A = (1 − φ) · A_formula + φ · A_ML     # hybrid blend with AI
```
- `θ_k` = metric weights from sport config
- `φ` = hybrid blend factor from sport config
- `A_ML` = AI score
- Implemented in `performance_engine.py → HybridPerformanceService`

### AI Score
```
AI = λ₁·XGBoost + λ₂·LSTM
```
- `λ₁`, `λ₂` from sport config `ai_weights`
- Per-sport model isolation via `MLModelResolver`
- Auto-normalizes if one model fails

### Fundamental Value (FV)
```
FV = base_value × (1 + α × PS)
```

### Demand Impact (DI)
```
DI = 1 + β × ((buy_volume − sell_volume) / circulating_shares)
```

### Price
```
P_raw = FV × DI
P_final = η × P_raw + (1 − η) × P_old     # EMA smoothing
```
- `η` = `price_smoothing_eta` (default 0.6)

### Buyback (Liquidity Backstop)
```
BuybackPrice = current_price × (1 − γ)
```

### Dividends
```
DailyDividendPerShare = (0.10 × income) / (days_in_period × total_shares)
Accrual = DailyDPS × shares_owned × days_since_last_accrual
```
Income split: 10% investors, 3% liquidity, 2% platform.

---

## 7. Service Layer Details

### `price_engine.py`
- `compute_performance_score()` — weighted PS formula
- `compute_fundamental_value()` — FV = B(1+αPS)
- `compute_demand_impact()` — DI formula
- `compute_raw_price()` — FV × DI
- `smooth_price()` — EMA smoothing
- `recalculate_player_price(db, player_id)` — **full pipeline**: fetches latest stats, computes sport-dynamic AI score via `MLModelResolver`, actual score via `HybridPerformanceService`, runs PS→FV→DI→smooth, persists to `players` + `price_history`

### `trading_engine.py`
- `buy_shares(db, user_id, player_id, shares)` — wallet check, fraud precheck, available shares check, deduct wallet, upsert holding, increment buy_volume + circulating_shares, recalc price, record txn, WS broadcast
- `sell_shares(db, user_id, player_id, shares)` — accrue dividends first, attempt internal liquidity match (stub), AMM buyback fallback (with partial fill if pool low), credit wallet, decrement circulating, recalc price, record txn(s), WS broadcast

### `dividend_engine.py`
- `distribute_income_event(db, event_id)` — mark distributed, split 10/3/2%, compute daily_rate_per_share
- `accrue_dividends_for_player(db, player_id)` — walk holdings, time-weighted accrual
- `accrue_dividends_all(db)` — accrue for all players with distributed events
- `accrue_for_holding(db, holding_id)` — single holding accrual (used before sell/view)

### `performance_engine.py`
- `HybridPerformanceService.compute_actual_score(db, player_doc, latest_stat, ai_score)` — sport-dynamic A score with metric normalization, hybrid blend, legacy fallback
- Gathers historical metric values (last 50 matches) for normalization context

### `metric_normalizer.py`
- `MetricNormalizer.normalize(value, strategy, historical)` — stateless, strategies: `minmax`, `zscore`, `log`
- All outputs clipped to [0, 1]

### `sport_config.py`
- `SportConfigService` — singleton with in-memory cache (5min TTL)
- `get_by_name()`, `get_by_id()`, `get_all()` — cached reads
- `create()`, `update()`, `delete()` — write + invalidate cache
- `ensure_defaults(db)` — seeds 4 default sports if collection empty
- **Default sports:** Football, Cricket, Basketball, Tennis

---

## 8. AI/ML Layer

### `predictor.py` — `AIPredictor`
- Facade combining XGBoost + LSTM
- `compute_ai_score(historical_stats)` — weighted blend
- `retrain(historical_stats)` — dummy retraining

### `model_resolver.py` — `MLModelResolver`
- Per-sport model isolation (`_models: Dict[str, {"xgb": XGBoostModel, "lstm": LSTMModel}]`)
- `compute_ai_score(sport_name, ai_weights, historical_stats)` — sport-specific AI = λ₁·XGB + λ₂·LSTM
- Auto-normalizes weights if one model fails
- `retrain(sport_name, historical_stats)` — retrain both models for a sport
- `remove_sport(sport_name)` — clear cached models

### `xgboost_model.py` — `XGBoostModel` (placeholder)
- `predict(historical_stats)` → aggregates stat values, returns normalized mean/max ratio
- `train(X, y)` → returns dummy metrics

### `lstm_model.py` — `LSTMModel` (placeholder)
- `predict(historical_stats)` → detects trend by comparing recent avg to overall avg
- `train(X, y)` → returns dummy metrics

---

## 9. Background Tasks (`tasks/scheduler.py`)

| Job                        | Schedule             | Function                   | Description                                  |
|----------------------------|----------------------|----------------------------|----------------------------------------------|
| `daily_dividend_accrual`   | Daily 00:05 UTC      | `accrue_dividends_all`     | Time-weighted accrual for all holdings       |
| `weekly_ai_retrain`        | Sunday 02:00 UTC     | per-sport retrain pipeline | Retrain models, update ai_scores, recalc     |
| `price_recalc_all`         | Daily 00:30 UTC      | `recalculate_player_price`| Recalculate all player prices               |
| `liquidity_audit`          | Daily 01:00 UTC      | `liquidity_audit_task`     | Log liquidity pool discrepancies             |

---

## 10. Auth & Security

- **Password hashing:** bcrypt via `passlib`
- **JWT:** HS256, subject = user `_id` (string), expiry = 24h
- **Dependencies** (`api/deps.py`):
  - `get_current_user` — decode JWT → fetch user doc
  - `require_admin` — check `role == "admin"`
- **Fraud** (`core/fraud.py`): placeholder `fraud_precheck()` (validates shares/price > 0), `audit_event()` (logging stub)
- **Rate limiting:** SlowAPI with `get_remote_address`, configurable default

---

## 11. WebSocket (`core/ws_manager.py`)

- `ConnectionManager` — singleton (`ws_manager`)
- Channels: per-player (`_channels: Dict[player_id, Set[WebSocket]]`) + global (`_global`)
- `connect(ws, player_id?)` — accept + subscribe
- `disconnect(ws, player_id?)` — cleanup
- `broadcast_price_update(player_id, data)` — sends `{"type": "price_update", "playerId": ..., "price": ..., "fundamentalValue": ...}`
- `broadcast_trade(player_id, data)` — sends `{"type": "trade", ...}`
- WS endpoints: `/ws/prices` (global), `/ws/prices/{player_id}` (per-player)

---

## 12. Models Pattern

All Pydantic models follow Create / Update / Public / InDB pattern:
- **`common.py`**: `PyObjectId` (custom ObjectId type for Pydantic v2), `BaseDocument` (with `_id` alias, `created_at`)
- **Create**: fields required for insertion
- **Update**: all fields optional (partial update)
- **Public**: includes `_id` alias, for API responses
- **InDB**: full document shape with defaults

### Sport Config Validation
- Metric weights must sum to 1.0
- AI weights (`xgb + lstm`) must sum to 1.0
- At least one metric required
- Normalization must be one of: `minmax`, `zscore`, `log`

---

## 13. Seed Data (`db/seed.py`)

Run: `python -m app.db.seed`

- **Drops** all collections, recreates indexes
- **Users:** Admin (`admin@sportfolio.io` / `admin12345`), John Investor (`john@example.com` / `investor123`), Jane Trader (`jane@example.com` / `investor123`)
- **Players:** Virat Kohli (Cricket), Lionel Messi (Football), LeBron James (Basketball), Serena Williams (Tennis), Cristiano Ronaldo (Football)
- **Price history:** 30 days of random-walk snapshots per player
- **Player matches:** 5 matches per player (weekly intervals)
- **Sports:** 4 default configs (Football, Cricket, Basketball, Tennis)
- **Income events:** 3 undistributed events for first 3 players

---

## 14. Testing

### `test_e2e.py` — Smoke tests
Uses raw `urllib` against running server. Covers: health, auth, players CRUD, wallet deposit, buy/sell, player matches, income events, admin endpoints, RBAC.

### `test.py` — Comprehensive sport config tests
Extensive coverage of sport config CRUD, validation (weight sums, normalization types, empty metrics), RBAC, dynamic metric validation on player matches, price recalculation with sport configs, AI retrain per sport.

Both test files require the server running with seeded data.

---

## 15. Dependencies (`requirements.txt`)

| Package            | Purpose                    |
|--------------------|----------------------------|
| `fastapi`          | Web framework              |
| `uvicorn[standard]`| ASGI server                |
| `pydantic[email]`  | Data validation            |
| `pydantic-settings` | Settings from .env        |
| `motor`            | Async MongoDB driver       |
| `dnspython`        | MongoDB DNS resolution     |
| `python-jose`      | JWT encoding/decoding      |
| `passlib[bcrypt]`  | Password hashing           |
| `bcrypt`           | bcrypt backend             |
| `slowapi`          | Rate limiting              |
| `APScheduler`      | Background task scheduling |
| `numpy`            | Numerical operations (AI)  |
| `httpx`            | HTTP client (testing)      |
| `pytest`           | Test runner                |
| `pytest-asyncio`   | Async test support         |

---

## 16. Key Singletons & Global State

| Variable                    | Module                        | Type                   |
|-----------------------------|-------------------------------|------------------------|
| `mongodb`                   | `app.db.mongo`                | `MongoDB` (client+db)  |
| `ws_manager`                | `app.core.ws_manager`         | `ConnectionManager`    |
| `sport_config_service`      | `app.services.sport_config`   | `SportConfigService`   |
| `hybrid_performance_service`| `app.services.performance_engine` | `HybridPerformanceService` |
| `ml_model_resolver`         | `app.ai.model_resolver`       | `MLModelResolver`      |
| `ai_predictor`              | `app.ai.predictor`            | `AIPredictor`          |
| `scheduler`                 | `app.tasks.scheduler`         | `AsyncIOScheduler`     |
| `settings` (cached)         | `app.core.config`             | `Settings`             |
| `limiter`                   | `app.core.rate_limit`         | `Limiter`              |

---

## 17. Startup Lifecycle (`main.py`)

1. `connect_to_mongo()` — create Motor client
2. `create_indexes(db)` — ensure all indexes
3. `sport_config_service.ensure_defaults(db)` — seed default sports if empty
4. `start_scheduler()` — register cron jobs
5. *(yield — app runs)*
6. `stop_scheduler()`
7. `close_mongo_connection()`

---

## 18. Key Design Decisions & Notes

- **No ORM**: Direct MongoDB operations via Motor; Pydantic models for validation/serialization only.
- **Sport-dynamic pricing**: Sport configs define per-sport metrics, weights, normalization strategies, and AI blend factors. The pricing pipeline adapts based on the player's sport.
- **AI models are placeholders**: XGBoost and LSTM return heuristic scores. Real models should replace `predict()` and `train()` methods.
- **Internal liquidity matching is stubbed**: `sell_shares()` always falls through to AMM buyback. Production should implement order-book matching.
- **Fraud detection is a placeholder**: Only validates shares/price > 0.
- **Platform income reserve (2%) is logged but not implemented**.
- **CORS is set to `allow_origins=["*"]`** — must be restricted in production.
- **Price history** is recorded as a snapshot on every `recalculate_player_price()` call.
- **Dividends accrue on read**: `portfolio/holdings` endpoint calls `accrue_for_holding()` before returning data.
