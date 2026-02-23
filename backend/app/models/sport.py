"""
Sport configuration model – defines per-sport metric structures,
normalization strategies, hybrid blend factor (phi), and AI blend weights.
"""
from datetime import datetime
from typing import List

from pydantic import BaseModel, Field, field_validator

from app.models.common import BaseDocument, PyObjectId


class MetricDefinition(BaseModel):
    """Single metric within a sport configuration."""
    key: str
    weight: float = Field(ge=0.0, le=1.0)
    normalization: str = "minmax"  # minmax | zscore | log

    @field_validator("normalization")
    @classmethod
    def validate_normalization(cls, v: str) -> str:
        allowed = {"minmax", "zscore", "log"}
        if v not in allowed:
            raise ValueError(f"normalization must be one of {allowed}")
        return v


class AIWeights(BaseModel):
    """Blend weights for XGBoost and LSTM models."""
    xgb: float = Field(default=0.5, ge=0.0, le=1.0)
    lstm: float = Field(default=0.5, ge=0.0, le=1.0)


class SportBase(BaseModel):
    name: str
    metrics: List[MetricDefinition]
    phi: float = Field(default=0.0, ge=0.0, le=1.0, description="Hybrid blend factor")
    ai_weights: AIWeights = Field(default_factory=AIWeights)


class SportCreate(SportBase):
    @field_validator("metrics")
    @classmethod
    def validate_metric_weights(cls, v: List[MetricDefinition]) -> List[MetricDefinition]:
        if not v:
            raise ValueError("At least one metric is required")
        total = sum(m.weight for m in v)
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"Metric weights must sum to 1.0, got {total:.4f}")
        return v

    @field_validator("ai_weights")
    @classmethod
    def validate_ai_weights(cls, v: AIWeights) -> AIWeights:
        total = v.xgb + v.lstm
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"AI weights must sum to 1.0, got {total:.4f}")
        return v


class SportUpdate(BaseModel):
    name: str | None = None
    metrics: List[MetricDefinition] | None = None
    phi: float | None = Field(default=None, ge=0.0, le=1.0)
    ai_weights: AIWeights | None = None

    @field_validator("metrics")
    @classmethod
    def validate_metric_weights(cls, v: List[MetricDefinition] | None) -> List[MetricDefinition] | None:
        if v is None:
            return v
        if not v:
            raise ValueError("At least one metric is required")
        total = sum(m.weight for m in v)
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"Metric weights must sum to 1.0, got {total:.4f}")
        return v

    @field_validator("ai_weights")
    @classmethod
    def validate_ai_weights(cls, v: AIWeights | None) -> AIWeights | None:
        if v is None:
            return v
        total = v.xgb + v.lstm
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"AI weights must sum to 1.0, got {total:.4f}")
        return v


class SportPublic(SportBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime


class SportInDB(BaseDocument):
    name: str
    metrics: List[MetricDefinition]
    phi: float = 0.0
    ai_weights: AIWeights = Field(default_factory=AIWeights)
    created_at: datetime = Field(default_factory=datetime.utcnow)
