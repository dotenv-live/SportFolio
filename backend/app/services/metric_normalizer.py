"""
MetricNormalizer – dynamic normalization strategies for sport-specific metrics.

Supported strategies:
    - minmax : (value - min) / (max - min)  → [0, 1]
    - zscore : z-score mapped to [0, 1] via linear clipping
    - log    : log(1 + |value|) / log(1 + max)  → [0, 1]

All outputs are clipped to [0, 1] for safe downstream usage.
"""
import math
from typing import Any, Dict, List, Optional


def resolve_dotpath(data: Dict[str, Any], path: str) -> Any:
    """Resolve a dot-separated key path against a nested dict.

    Examples
    --------
    >>> resolve_dotpath({"batting_stats": {"runs": 42}}, "batting_stats.runs")
    42
    >>> resolve_dotpath({"score": 0.8}, "score")
    0.8
    >>> resolve_dotpath({}, "batting_stats.runs") is None
    True
    """
    parts = path.split(".")
    current: Any = data
    for part in parts:
        if isinstance(current, dict):
            current = current.get(part)
        else:
            return None
        if current is None:
            return None
    return current


def safe_float(value: Any) -> float:
    """Convert *value* to float; return 0.0 on failure."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


class MetricNormalizer:
    """Stateless normalizer – call class methods directly."""

    @staticmethod
    def normalize(
        value: float,
        strategy: str = "minmax",
        historical_values: Optional[List[float]] = None,
    ) -> float:
        """
        Normalize *value* using the given strategy.

        Parameters
        ----------
        value : float
            Raw metric value.
        strategy : str
            One of ``minmax``, ``zscore``, ``log``.
        historical_values : list[float] | None
            Historical observations for the same metric (used to derive
            min/max, mean/std). If ``None`` the value is clipped to [0, 1].
        """
        if strategy == "minmax":
            return MetricNormalizer._minmax(value, historical_values)
        if strategy == "zscore":
            return MetricNormalizer._zscore(value, historical_values)
        if strategy == "log":
            return MetricNormalizer._log(value, historical_values)
        # Unknown strategy – safe fallback
        return max(0.0, min(1.0, value))

    # ------------------------------------------------------------------
    # Private strategy implementations
    # ------------------------------------------------------------------
    @staticmethod
    def _minmax(value: float, historical: Optional[List[float]]) -> float:
        if not historical:
            return max(0.0, min(1.0, value))
        min_v = min(historical)
        max_v = max(historical)
        denom = max_v - min_v
        if denom <= 0:
            # All values identical – return 0.5 (neutral)
            return 0.5
        normalized = (value - min_v) / denom
        return max(0.0, min(1.0, normalized))

    @staticmethod
    def _zscore(value: float, historical: Optional[List[float]]) -> float:
        if not historical or len(historical) < 2:
            return max(0.0, min(1.0, value))
        n = len(historical)
        mean = sum(historical) / n
        variance = sum((x - mean) ** 2 for x in historical) / n
        std = math.sqrt(variance) if variance > 0 else 0.0
        if std == 0:
            return 0.5
        z = (value - mean) / std
        # Map z ∈ [-3, 3] → [0, 1] linearly
        return max(0.0, min(1.0, 0.5 + z / 6.0))

    @staticmethod
    def _log(value: float, historical: Optional[List[float]]) -> float:
        max_v = max(historical) if historical else abs(value)
        if max_v <= 0:
            max_v = 1.0
        denom = math.log(1.0 + max_v)
        if denom <= 0:
            return 0.0
        normalized = math.log(1.0 + abs(value)) / denom
        return max(0.0, min(1.0, normalized))
