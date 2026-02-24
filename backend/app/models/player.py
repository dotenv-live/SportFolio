"""
Player model – merged from Athlete (marketplace) and Player (sport data).

Contains marketplace trading fields (shares, pricing, performance) AND
career stats broken down by competition format / event.
Supports multiple sports: Cricket, Swimming, etc.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.common import BaseDocument, PyObjectId


# ---------- Cricket sub-schemas ----------

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


# ---------- Swimming sub-schemas ----------

class SwimmingPersonalBest(BaseModel):
    """Personal best performance for a swimming event."""
    time: str = "0.00"
    time_ms: int = 0
    date: Optional[str] = None
    meet_name: Optional[str] = None
    fina_points: int = 0


class SwimmingMedals(BaseModel):
    """Medal tally for a swimming event."""
    gold: int = 0
    silver: int = 0
    bronze: int = 0


class SwimmingEventStats(BaseModel):
    """Stats for a single swimming event (e.g. 100m Freestyle LCM)."""
    label: str
    races: int = 0
    personal_best: SwimmingPersonalBest = Field(default_factory=SwimmingPersonalBest)
    medals: SwimmingMedals = Field(default_factory=SwimmingMedals)


# ---------- Wrestling sub-schemas ----------

class WrestlingMedals(BaseModel):
    """Medal tally for a wrestling weight class."""
    gold: int = 0
    silver: int = 0
    bronze: int = 0


class WrestlingWeightClassStats(BaseModel):
    """Stats for a single wrestling weight class (e.g. Men's 65kg Freestyle)."""
    label: str
    matches: int = 0
    medals: WrestlingMedals = Field(default_factory=WrestlingMedals)


# ---------- Common sub-schemas ----------

class RegisterInfo(BaseModel):
    """Register metadata (works for any sport)."""
    name: str
    unique_name: str


# ---------- CRUD models ----------

class PlayerCreate(BaseModel):
    """Fields required to create a new player (marketplace + optional sport data)."""
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
    # Sport data fields (optional – populated by ingestion pipeline)
    cricsheet_id: Optional[str] = None
    register_info: Optional[RegisterInfo] = None
    career_stats: Dict[str, Any] = Field(default_factory=dict)
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
    # Sport data fields
    cricsheet_id: Optional[str] = None
    register_info: Optional[RegisterInfo] = None
    career_stats: Optional[Dict[str, Any]] = None
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
    # Sport data fields
    cricsheet_id: Optional[str] = None
    register_info: Optional[RegisterInfo] = None
    career_stats: Dict[str, Any] = Field(default_factory=dict)
    competitions: List[str] = Field(default_factory=list)
    total_matches: int = 0
    last_updated: Optional[datetime] = None
