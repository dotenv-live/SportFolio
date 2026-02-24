"""
XGBoost model placeholder for player performance prediction.

In production, replace with a trained XGBoost model loaded from disk.
"""
import numpy as np
from typing import Any, Dict, List


class XGBoostModel:
    """Placeholder XGBoost model for predicting player performance."""

    def __init__(self) -> None:
        self.version = "mock-xgb-1"
        self._model = None  # In production: load from .pkl / .json
        self._feature_names: List[str] = [
            "goals", "assists", "minutes_played",
            "win_rate", "consistency_score",
        ]

    @staticmethod
    def _flatten(d: Dict[str, Any], prefix: str = "") -> Dict[str, float]:
        """Recursively flatten nested dicts into dot-path → float pairs."""
        flat: Dict[str, float] = {}
        for k, v in d.items():
            key = f"{prefix}{k}" if not prefix else f"{prefix}.{k}"
            if isinstance(v, dict):
                flat.update(XGBoostModel._flatten(v, key))
            else:
                try:
                    flat[key] = float(v)
                except (ValueError, TypeError):
                    pass
        return flat

    def predict(self, historical_stats: List[Dict[str, Any]]) -> float:
        """
        Return a normalised score in [0, 1].
        Accepts a list of match-stat dicts (sorted most-recent first).
        In production, run actual XGBoost inference.
        """
        if not historical_stats:
            return 0.5
        # Compute per-match magnitude, weight recent matches more heavily
        match_magnitudes: List[float] = []
        for match in historical_stats:
            stats = match.get("stats", match)
            flat = self._flatten(stats)
            total = sum(abs(v) for v in flat.values()) if flat else 0.0
            match_magnitudes.append(total)
        if not match_magnitudes or max(match_magnitudes) == 0:
            return 0.5
        # Normalise each match magnitude against the best match
        peak = max(match_magnitudes)
        scores = [m / (peak + 1e-9) for m in match_magnitudes]
        # Exponential recency weighting (index 0 = most recent)
        weights = [0.9 ** i for i in range(len(scores))]
        weighted_score = sum(s * w for s, w in zip(scores, weights)) / sum(weights)
        return float(np.clip(weighted_score, 0, 1))

    def train(self, X: np.ndarray, y: np.ndarray) -> dict:
        """Placeholder training pipeline. Returns dummy metrics."""
        return {
            "model": "xgboost",
            "status": "trained",
            "samples": int(X.shape[0]) if X.ndim > 0 else 0,
            "mock": True,
        }
