"""
SportFolio Backend – AI-powered Athlete Revenue Share Marketplace.

Entry point for the FastAPI application.
"""
import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.rate_limit import get_limiter
from app.db.mongo import connect_to_mongo, close_mongo_connection, mongodb
from app.db.indexes import create_indexes
from app.tasks.scheduler import start_scheduler, stop_scheduler

# Route imports
from app.api.routes.auth import router as auth_router
from app.api.routes.athletes import router as athletes_router
from app.api.routes.trading import router as trading_router
from app.api.routes.portfolio import router as portfolio_router
from app.api.routes.income import router as income_router
from app.api.routes.match_stats import router as match_stats_router
from app.api.routes.admin import router as admin_router
from app.api.routes.sports import router as sports_router
from app.services.sport_config import sport_config_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sportfolio")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("🚀 Starting SportFolio backend …")
    connect_to_mongo()
    assert mongodb.db is not None
    await create_indexes(mongodb.db)
    await sport_config_service.ensure_defaults(mongodb.db)
    start_scheduler()
    yield
    stop_scheduler()
    close_mongo_connection()
    logger.info("🛑 SportFolio backend stopped.")


settings = get_settings()
limiter = get_limiter()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="AI-powered Athlete Revenue Share Marketplace API",
    lifespan=lifespan,
)

# ---------- Middleware ----------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Global exception handler ----------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ---------- Routers ----------
app.include_router(auth_router, prefix="/api/v1")
app.include_router(athletes_router, prefix="/api/v1")
app.include_router(trading_router, prefix="/api/v1")
app.include_router(portfolio_router, prefix="/api/v1")
app.include_router(income_router, prefix="/api/v1")
app.include_router(match_stats_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(sports_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.app_name}
