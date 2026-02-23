"""
PlayerMatch model — matches the Cricsheet schema exactly.

One document per (player × match).  All match-level data lives inside ``stats``.

Top-level fields: _id, player_id, match_id, date, stats, ingested_at
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

from app.models.common import BaseDocument, PyObjectId


# ---------- CRUD models ----------

class PlayerMatchCreate(BaseModel):
    """Create a player-match record.

    ``stats`` is the single flexible dict that holds **all** match data:
    competition info, batting_stats, bowling_stats, marketplace metrics, etc.
    """
    player_id: PyObjectId
    match_id: Optional[str] = None
    date: Optional[str] = None           # "YYYY-MM-DD"
    stats: Dict[str, Any] = Field(default_factory=dict)
    ingested_at: Optional[datetime] = None

    model_config = {"extra": "allow"}


class PlayerMatchUpdate(BaseModel):
    """Partial update — only touch ``stats`` and/or top-level meta."""
    match_id: Optional[str] = None
    date: Optional[str] = None
    stats: Optional[Dict[str, Any]] = None

    model_config = {"extra": "allow"}


class PlayerMatchPublic(BaseModel):
    id: PyObjectId = Field(alias="_id")
    player_id: PyObjectId
    match_id: Optional[str] = None
    date: Optional[str] = None
    stats: Dict[str, Any] = Field(default_factory=dict)
    ingested_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


class PlayerMatchInDB(BaseDocument):
    player_id: PyObjectId
    match_id: Optional[str] = None
    date: Optional[str] = None           # "YYYY-MM-DD"
    stats: Dict[str, Any] = Field(default_factory=dict)
    ingested_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
