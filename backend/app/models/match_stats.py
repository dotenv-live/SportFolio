from datetime import datetime
from typing import Any, Dict

from pydantic import BaseModel, Field

from app.models.common import BaseDocument, PyObjectId


class MatchStatsBase(BaseModel):
    athlete_id: PyObjectId
    match_date: datetime
    stats: Dict[str, Any]
    manually_updated: bool = False

    model_config = {"extra": "allow"}


class MatchStatsCreate(MatchStatsBase):
    pass


class MatchStatsUpdate(BaseModel):
    match_date: datetime | None = None
    stats: Dict[str, Any] | None = None
    manually_updated: bool | None = None

    model_config = {"extra": "allow"}


class MatchStatsPublic(MatchStatsBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime


class MatchStatsInDB(BaseDocument):
    athlete_id: PyObjectId
    match_date: datetime
    stats: Dict[str, Any]
    manually_updated: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
