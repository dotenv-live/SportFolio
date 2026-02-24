"""
SportConfigService – manages sport configuration documents with in-memory caching.

Handles CRUD for the ``sports`` collection and provides fast lookups
by sport name for use by the performance engine and ML resolver.
"""
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger("sportfolio.sport_config")

# Cache time-to-live in seconds
_CACHE_TTL = 300  # 5 minutes


class SportConfigService:
    """Singleton service for sport configuration access."""

    def __init__(self) -> None:
        self._cache_by_name: Dict[str, dict] = {}
        self._cache_by_id: Dict[str, dict] = {}
        self._cache_ts: float = 0.0

    # ------------------------------------------------------------------
    # Cache helpers
    # ------------------------------------------------------------------
    def _is_cache_valid(self) -> bool:
        return bool(self._cache_by_name) and (time.time() - self._cache_ts) < _CACHE_TTL

    def invalidate_cache(self) -> None:
        self._cache_by_name.clear()
        self._cache_by_id.clear()
        self._cache_ts = 0.0

    async def _refresh_cache(self, db: AsyncIOMotorDatabase) -> None:
        by_name: Dict[str, dict] = {}
        by_id: Dict[str, dict] = {}
        async for doc in db.sports.find():
            by_name[doc["name"]] = doc
            by_id[str(doc["_id"])] = doc
        self._cache_by_name = by_name
        self._cache_by_id = by_id
        self._cache_ts = time.time()

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------
    async def get_by_name(self, db: AsyncIOMotorDatabase, sport_name: str) -> Optional[dict]:
        """Return sport config dict by sport name (cached)."""
        if not self._is_cache_valid():
            await self._refresh_cache(db)
        return self._cache_by_name.get(sport_name)

    async def get_by_id(self, db: AsyncIOMotorDatabase, sport_id: str | ObjectId) -> Optional[dict]:
        """Return sport config dict by document _id (cached)."""
        if not self._is_cache_valid():
            await self._refresh_cache(db)
        return self._cache_by_id.get(str(sport_id))

    async def get_all(self, db: AsyncIOMotorDatabase) -> List[dict]:
        """Return all sport configs."""
        if not self._is_cache_valid():
            await self._refresh_cache(db)
        return list(self._cache_by_name.values())

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------
    async def create(self, db: AsyncIOMotorDatabase, data: dict) -> dict:
        """Insert a new sport configuration. Returns the inserted document."""
        existing = await db.sports.find_one({"name": data["name"]})
        if existing:
            raise ValueError(f"Sport '{data['name']}' already exists")

        doc = {
            **data,
            "created_at": datetime.now(timezone.utc),
        }
        result = await db.sports.insert_one(doc)
        doc["_id"] = result.inserted_id
        self.invalidate_cache()
        return doc

    async def update(
        self,
        db: AsyncIOMotorDatabase,
        sport_id: str | ObjectId,
        data: dict,
    ) -> dict:
        """Update sport config fields. Returns updated document."""
        if isinstance(sport_id, str):
            sport_id = ObjectId(sport_id)

        result = await db.sports.update_one({"_id": sport_id}, {"$set": data})
        if result.matched_count == 0:
            raise ValueError("Sport config not found")
        self.invalidate_cache()
        doc = await db.sports.find_one({"_id": sport_id})
        return doc  # type: ignore[return-value]

    async def delete(self, db: AsyncIOMotorDatabase, sport_id: str | ObjectId) -> bool:
        """Delete a sport config."""
        if isinstance(sport_id, str):
            sport_id = ObjectId(sport_id)
        result = await db.sports.delete_one({"_id": sport_id})
        self.invalidate_cache()
        return result.deleted_count > 0

    # ------------------------------------------------------------------
    # Default sport creation (backward compatibility)
    # ------------------------------------------------------------------
    async def ensure_defaults(self, db: AsyncIOMotorDatabase) -> None:
        """Create default sport configs if the collection is empty."""
        count = await db.sports.count_documents({})
        if count > 0:
            return

        logger.info("No sport configs found – seeding defaults …")
        for sport_data in _DEFAULT_SPORTS:
            try:
                await self.create(db, sport_data)
                logger.info("  Created default config: %s", sport_data["name"])
            except ValueError:
                pass  # already exists
        logger.info("Default sport configs seeded.")


# Module-level singleton
sport_config_service = SportConfigService()


# ------------------------------------------------------------------
# Default sport configurations
# ------------------------------------------------------------------
_DEFAULT_SPORTS: List[Dict[str, Any]] = [
    {
        "name": "Cricket",
        "metrics": [
            # Batting metrics
            {"key": "batting_stats.runs", "weight": 0.15, "normalization": "minmax"},
            {"key": "batting_stats.strike_rate", "weight": 0.08, "normalization": "minmax"},
            {"key": "batting_stats.fours", "weight": 0.04, "normalization": "minmax"},
            {"key": "batting_stats.sixes", "weight": 0.04, "normalization": "minmax"},
            {"key": "batting_stats.balls_faced", "weight": 0.04, "normalization": "minmax"},
            # Bowling metrics
            {"key": "bowling_stats.wickets", "weight": 0.15, "normalization": "minmax"},
            {"key": "bowling_stats.economy", "weight": 0.10, "normalization": "minmax"},
            {"key": "bowling_stats.runs_conceded", "weight": 0.08, "normalization": "minmax"},
            {"key": "bowling_stats.overs", "weight": 0.05, "normalization": "minmax"},
            {"key": "bowling_stats.wides", "weight": 0.02, "normalization": "minmax"},
            {"key": "bowling_stats.no_balls", "weight": 0.02, "normalization": "minmax"},
            # Match context
            {"key": "outcome.winner", "weight": 0.15, "normalization": "minmax"},
            {"key": "batting_stats.not_out", "weight": 0.08, "normalization": "minmax"},
        ],
        "phi": 0.3,
        "ai_weights": {"xgb": 0.6, "lstm": 0.4},
    },
    {
        "name": "Swimming",
        "metrics": [
            # Primary performance metrics
            {"key": "performance.fina_points", "weight": 0.35, "normalization": "minmax"},
            {"key": "performance.time_ms", "weight": 0.25, "normalization": "minmax"},
            {"key": "performance.rank", "weight": 0.20, "normalization": "minmax"},
            {"key": "performance.reaction_time", "weight": 0.10, "normalization": "minmax"},
            # Match context
            {"key": "match_type", "weight": 0.10, "normalization": "minmax"},
        ],
        "phi": 0.25,
        "ai_weights": {"xgb": 0.55, "lstm": 0.45},
    },
    {
        "name": "Wrestling",
        "metrics": [
            # Bout performance metrics
            {"key": "performance.result", "weight": 0.30, "normalization": "minmax"},
            {"key": "performance.technical_points_scored", "weight": 0.25, "normalization": "minmax"},
            {"key": "performance.technical_points_conceded", "weight": 0.20, "normalization": "minmax"},
            # Match context
            {"key": "match_type", "weight": 0.15, "normalization": "minmax"},
            {"key": "performance.status", "weight": 0.10, "normalization": "minmax"},
        ],
        "phi": 0.35,
        "ai_weights": {"xgb": 0.65, "lstm": 0.35},
    },
]
