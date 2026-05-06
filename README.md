<div align="center">

# ⚡ SportFolio

### *Invest in Athletes. Profit from Performance.*

**An AI-powered fractional share marketplace where investors buy, trade, and earn dividends on athletes' future earnings — priced dynamically by real performance.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Motor-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org/)

</div>

---

## What is SportFolio?

SportFolio is a **sports investment marketplace** that lets anyone buy fractional shares in real athletes. Share prices are driven by a **mathematical performance engine** that fuses verified career statistics, AI predictions (XGBoost + LSTM ensemble), and live market demand — not hype.

When an athlete earns verified income (prize money, contracts, endorsements), **10% flows directly to shareholders as dividends**. When they perform better, their share price rises. When demand surges, the market responds in real time via WebSocket broadcasts.

Think stock exchange — but for human potential.

---

## Features

| Feature | Description |
|---------|-------------|
| **Fractional Share Trading** | Buy and sell fractional shares in athletes from Cricket, Swimming, and Wrestling |
| **ML-Driven Pricing** | XGBoost + LSTM ensemble calculates performance scores; price updates propagate via WebSocket |
| **Dividend Accrual** | Verified income events automatically distribute 10% to investors, time-weighted per share held |
| **Real-time Price Feed** | Global and per-athlete WebSocket subscriptions for live price updates |
| **Multi-Sport Engine** | Sport-specific scoring engines (cricket formats, swimming events, wrestling weight classes) |
| **Athlete Comparison** | Side-by-side performance and price comparison across athletes |
| **Watchlist & Alerts** | Track favorite athletes and set price alert thresholds |
| **Admin Dashboard** | Manage players, trigger income events, retrain AI models, audit liquidity |
| **Portfolio Analytics** | Holdings, transaction history, accrued dividends, ROI tracking |

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript** — component-driven SPA
- **Vite** — lightning-fast dev server and bundler
- **Tailwind CSS 4** + **Radix UI** — utility-first design system with accessible primitives
- **TanStack Query** — server state management and caching
- **React Router 7** — client-side navigation
- **Recharts** + **D3.js** — interactive price charts and analytics
- **Axios** — HTTP client with JWT interceptors
- **React Hook Form** + **Zod** — type-safe form validation

### Backend
- **FastAPI** — async Python web framework
- **Motor** — async MongoDB driver
- **APScheduler** — background task scheduling (cricket score cron, dividend accrual)
- **python-jose** + **bcrypt** — JWT auth and password hashing
- **XGBoost** + **LSTM** — ML ensemble for AI performance prediction
- **NumPy** — numerical computation for scoring math
- **slowapi** — request rate limiting
- **Pydantic v2** — runtime data validation

### Database
- **MongoDB** (local or Atlas) — document store for users, players, holdings, transactions, price history, and income events

---

## Architecture

```
SportFolio/
├── frontend/                   # React/TypeScript SPA
│   └── src/
│       ├── app/
│       │   ├── pages/          # 16+ page components
│       │   ├── components/     # Reusable UI components
│       │   └── routes.tsx      # React Router config
│       ├── services/api.ts     # Axios client + API adapters
│       ├── hooks/              # useApi, useWebSocket
│       └── context/            # AuthContext (JWT state)
│
├── backend/
│   └── app/
│       ├── api/routes/         # auth, players, trading, portfolio, income, admin
│       ├── models/             # Pydantic models (user, player, holding, transaction…)
│       ├── services/           # Business logic (price, performance, dividend, trading engines)
│       │   ├── price_engine.py
│       │   ├── performance_engine.py
│       │   ├── trading_engine.py
│       │   ├── dividend_engine.py
│       │   ├── cricket_performance.py
│       │   ├── swimming_performance.py
│       │   └── wrestling_performance.py
│       ├── ai/                 # XGBoost + LSTM predictor, model resolver
│       ├── core/               # Config, security, rate limiting, WebSocket manager
│       ├── db/                 # MongoDB connection, indexes, seed data
│       └── tasks/              # Cron jobs (scheduler, cricket score updates)
│
└── dataset/                    # Raw sport data (CricSheet, swimming, wrestling)
```

---

## Pricing Model

Share prices are not arbitrary — they are computed from a transparent mathematical framework:

**Performance Score**
```
PS = w₁·actual_score + w₂·consistency + w₃·growth + w₄·fitness + w₅·AI_score
```

**Fundamental Value**
```
FV = BaseValue × (1 + α · PS)
```

**Demand Impact** (market pressure from circulating supply)
```
DI = 1 + β × (circulating_shares / total_shares)
```

**Price with Exponential Smoothing** (prevents volatility spikes)
```
P_final = η · (FV × DI) + (1 − η) · P_old
```

**AI Score** (XGBoost + LSTM ensemble)
```
AI_score = λ₁ · XGBoost + λ₂ · LSTM     (λ₁ + λ₂ = 1)
```

**Daily Dividend Per Share**
```
DDPS = (0.10 × verified_income) / (distribution_days × total_shares)
Investor_Return = shares_held × DDPS × days_held + capital_gain
```

All weights (`α`, `β`, `η`, `w₁…w₅`, `λ₁`, `λ₂`) are configurable per sport via the sports configuration service.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 and npm
- **Python** ≥ 3.11
- **MongoDB** (local) or a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

### 1. Clone the Repository

```bash
git clone https://github.com/dotenv-live/SportFolio.git
cd SportFolio
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # macOS/Linux
# venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017
MONGO_DB=sportfolio

# Auth
JWT_SECRET=change-this-to-a-secure-random-string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Pricing Engine
PRICE_SMOOTHING_ETA=0.6
INVESTOR_INCOME_SHARE=0.10
LIQUIDITY_INCOME_SHARE=0.03
PLATFORM_INCOME_SHARE=0.02

# Rate Limiting
RATE_LIMIT=100/minute

# Cron
CRICKET_PERF_CRON_HOUR=1
CRICKET_PERF_CRON_MINUTE=30
```

Start the backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs are available at: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
VITE_API_BASE_PATH=/api/v1
```

Start the dev server:

```bash
npm run dev
```

App available at: `http://localhost:5173`

---

### 4. Seed the Database (Optional)

```bash
cd backend
python -m app.db.seed
```

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create a new investor account |
| `POST` | `/auth/login` | Login and receive a JWT |
| `GET` | `/auth/me` | Get current user profile |

### Players

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/players/` | List all athletes (paginated) |
| `GET` | `/players/{id}` | Get athlete detail and stats |
| `GET` | `/players/{id}/price-history` | Price history with performance snapshots |
| `POST` | `/players/{id}/recalculate-price` | Trigger price recalculation (admin) |

### Trading

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/trade/buy` | Buy shares in an athlete |
| `POST` | `/trade/sell` | Sell shares |

### Portfolio

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/portfolio/holdings` | Current holdings with live dividend accrual |
| `GET` | `/portfolio/transactions` | Full transaction history |
| `GET` | `/portfolio/wallet` | Wallet balance |
| `POST` | `/portfolio/wallet/deposit` | Deposit funds |

### Income & Dividends

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/income/` | Add income event (admin) |
| `POST` | `/income/{id}/distribute` | Distribute income to shareholders (admin) |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/price/recalculate-all` | Recalculate all player prices |
| `POST` | `/admin/dividends/accrue-all` | Accrue dividends across all holdings |
| `POST` | `/admin/ai/retrain` | Retrain ML models |
| `POST` | `/admin/liquidity/audit` | Audit liquidity pools |
| `POST` | `/admin/simulate-match` | Simulate a match for testing |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `WS /ws/prices` | Subscribe to all real-time price updates |
| `WS /ws/prices/{player_id}` | Subscribe to a single athlete's price feed |

---

## Pages & Navigation

| Route | Page | Description |
|-------|------|-------------|
| `/` | User Type Selection | Choose investor or athlete entry |
| `/auth` | Auth | Login / Register |
| `/home` | Home | Landing dashboard |
| `/dashboard` | Investor Dashboard | Portfolio overview and summary |
| `/marketplace` | Athlete Marketplace | Browse and filter all athletes |
| `/athlete/:id` | Athlete Detail | Career stats, price chart, share info |
| `/trading/:id` | Trading | Buy/sell interface for an athlete |
| `/portfolio` | Portfolio | Holdings, transactions, dividends |
| `/analytics` | Analytics | Performance metrics and charts |
| `/watchlist` | Watchlist | Saved athletes |
| `/compare` | Compare | Side-by-side athlete comparison |
| `/alerts` | Alerts | Price alert management |
| `/admin` | Admin Panel | Full admin controls |

---

## Available Scripts

### Backend

```bash
uvicorn app.main:app --reload               # Dev server with hot-reload
python calc_cricket_params.py               # Compute cricket performance parameters
python calc_swimming_params.py              # Compute swimming parameters
python calc_wrestling_params.py             # Compute wrestling parameters
python test_match_price_update.py           # Test price update flow
python -m app.scripts.backfill_cricket_scores   # Backfill cricket score history
python -m app.scripts.backfill_swimming_scores  # Backfill swimming score history
python -m app.scripts.backfill_wrestling_scores # Backfill wrestling score history
```

### Frontend

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run preview    # Preview production build locally
```

---

## Environment Variables — Quick Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB` | `sportfolio` | Database name |
| `JWT_SECRET` | *(must set)* | Secret key for JWT signing |
| `PRICE_SMOOTHING_ETA` | `0.6` | Price smoothing factor (0–1) |
| `INVESTOR_INCOME_SHARE` | `0.10` | Fraction of income to investors |
| `LIQUIDITY_INCOME_SHARE` | `0.03` | Fraction to liquidity pool |
| `PLATFORM_INCOME_SHARE` | `0.02` | Fraction to platform reserve |
| `RATE_LIMIT` | `100/minute` | API rate limit per IP |
| `VITE_API_URL` | `http://localhost:8000` | Backend URL (frontend) |

---

## Production Notes

- **CORS**: Currently set to `allow_origins=["*"]` — restrict to your domain in production
- **JWT Secret**: Generate a strong random secret (`openssl rand -hex 32`)
- **MongoDB**: Use [MongoDB Atlas](https://www.mongodb.com/atlas) for managed cloud hosting
- **WebSocket**: Ensure your load balancer or reverse proxy supports persistent WebSocket connections
- **Frontend**: Build with `npm run build` and deploy the `dist/` folder to Vercel, Netlify, or any static host
- **Backend**: Deploy via Docker + Uvicorn or a managed Python hosting service (Railway, Render, Fly.io)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your fork: `git push origin feature/your-feature`
5. Open a Pull Request against `main`

Please ensure your code follows the existing patterns — async FastAPI services, Pydantic v2 models, and typed React components.

---

<div align="center">

Built at a hackathon with too much caffeine and genuine belief that athlete investment should be transparent, data-driven, and accessible to everyone.

**SportFolio** — *Where Performance Meets Portfolio.*

</div>
