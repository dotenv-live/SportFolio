"""
Player model – merged from Athlete (marketplace) and Player (Cricsheet).

Contains marketplace trading fields (shares, pricing, performance) AND
Cricsheet career stats broken down by competition format.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.common import BaseDocument, PyObjectId


# ---------- Cricsheet sub-schemas ----------

class BattingStats(BaseModel):
    """Career or per-format batting statistics."""
    innings: int = 0
    not_outs: int = 0
    runs: int = 0
    balls_faced: int = 0
    fours: int = 0
    sixes: int = 0
    fifties: int = 0
    hundreds: int = 0
    highest: int = 0
    average: Optional[float] = None
    strike_rate: Optional[float] = None


class BowlingStats(BaseModel):
    """Career or per-format bowling statistics."""
    innings: int = 0
    balls: int = 0
    overs_bowled: str = "0.0"
    runs: int = 0
    wickets: int = 0
    wides: int = 0
    no_balls: int = 0
    five_fors: int = 0
    best_innings: Optional[str] = None
    economy: Optional[float] = None
    average: Optional[float] = None
    strike_rate: Optional[float] = None


class FormatStats(BaseModel):
    """Stats for a single competition format (e.g. IPL, T20I, Tests)."""
    label: str
    matches: int = 0
    batting: BattingStats = Field(default_factory=BattingStats)
    bowling: BowlingStats = Field(default_factory=BowlingStats)


class RegisterInfo(BaseModel):
    """Cricsheet register metadata."""
    name: str
    unique_name: str


# ---------- CRUD models ----------

class PlayerCreate(BaseModel):
    """Fields required to create a new player (marketplace + optional Cricsheet)."""
    # Marketplace fields
    name: str
    sport: str
    total_shares: float
    base_value: float
    alpha: float
    beta: float
    gamma: float
    performance_score: float = 0.0
    ai_score: float = 0.0
    # Cricsheet fields (optional – populated by ingestion pipeline)
    cricsheet_id: Optional[str] = None
    register_info: Optional[RegisterInfo] = None
    career_stats: Dict[str, FormatStats] = Field(default_factory=dict)
    competitions: List[str] = Field(default_factory=list)
    total_matches: int = 0


class PlayerUpdate(BaseModel):
    """All fields optional for partial updates."""
    # Marketplace fields
    name: Optional[str] = None
    sport: Optional[str] = None
    total_shares: Optional[float] = None
    base_value: Optional[float] = None
    alpha: Optional[float] = None
    beta: Optional[float] = None
    gamma: Optional[float] = None
    performance_score: Optional[float] = None
    ai_score: Optional[float] = None
    fundamental_value: Optional[float] = None
    current_price: Optional[float] = None
    liquidity_pool_balance: Optional[float] = None
    circulating_shares: Optional[float] = None
    # Cricsheet fields
    cricsheet_id: Optional[str] = None
    register_info: Optional[RegisterInfo] = None
    career_stats: Optional[Dict[str, FormatStats]] = None
    competitions: Optional[List[str]] = None
    total_matches: Optional[int] = None
    last_updated: Optional[datetime] = None


class PlayerPublic(BaseModel):
    id: PyObjectId = Field(alias="_id")
    # Marketplace fields
    name: str
    sport: str
    total_shares: float
    base_value: float
    alpha: float
    beta: float
    gamma: float
    performance_score: float
    ai_score: float
    fundamental_value: float
    current_price: float
    liquidity_pool_balance: float
    circulating_shares: float
    buy_volume: float
    sell_volume: float
    created_at: datetime
    # Cricsheet fields
    cricsheet_id: Optional[str] = None
    register_info: Optional[RegisterInfo] = None
    career_stats: Dict[str, Any] = Field(default_factory=dict)
    competitions: List[str] = Field(default_factory=list)
    total_matches: int = 0
    last_updated: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


class PlayerInDB(BaseDocument):
    # Marketplace fields
    name: str
    sport: str
    total_shares: float
    base_value: float
    alpha: float
    beta: float
    gamma: float
    performance_score: float = 0.0
    ai_score: float = 0.0
    fundamental_value: float = 0.0
    current_price: float = 0.0
    liquidity_pool_balance: float = 0.0
    circulating_shares: float = 0.0
    buy_volume: float = 0.0
    sell_volume: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Cricsheet fields
    cricsheet_id: Optional[str] = None
    register_info: Optional[RegisterInfo] = None
    career_stats: Dict[str, FormatStats] = Field(default_factory=dict)
    competitions: List[str] = Field(default_factory=list)
    total_matches: int = 0
    last_updated: Optional[datetime] = None
