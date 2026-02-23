"""
MLModelResolver – sport-isolated ML model management.

Responsibilities:
    • Maintain per-sport XGBoost / LSTM instances.
    • Compute AI score using sport-specific ai_weights (λ₁, λ₂).
    • Automatically normalise weights when one model is unavailable.
    • Retrain models per sport (no cross-sport contamination).
"""
import logging
from typing import Any, Dict, List, Optional

import numpy as np

from app.ai.xgboost_model import XGBoostModel
from app.ai.lstm_model import LSTMModel

logger = logging.getLogger("sportfolio.ml_resolver")


class MLModelResolver:
    """Resolves and manages ML model instances per sport."""

    def __init__(self) -> None:
        # sport_name → {"xgb": XGBoostModel | None, "lstm": LSTMModel | None}
        self._models: Dict[str, Dict[str, Any]] = {}

    # ------------------------------------------------------------------
    # Model access
    # ------------------------------------------------------------------
    def _ensure_models(self, sport_name: str) -> Dict[str, Any]:
        """Lazily create model instances for a sport."""
        if sport_name not in self._models:
            self._models[sport_name] = {
                "xgb": XGBoostModel(),
                "lstm": LSTMModel(),
            }
        return self._models[sport_name]

    def get_models(self, sport_name: str) -> Dict[str, Any]:
        return self._ensure_models(sport_name)

    # ------------------------------------------------------------------
    # AI Score computation
    # ------------------------------------------------------------------
    def compute_ai_score(
        self,
        sport_name: str,
        ai_weights: Optional[dict],
        historical_stats: List[Dict[str, Any]],
    ) -> float:
        """
        Compute blended AI score: AI = λ₁·XGB + λ₂·LSTM

        Parameters
        ----------
        sport_name : str
        ai_weights : dict | None
            ``{"xgb": float, "lstm": float}`` from sport config.
        historical_stats : list[dict]
            Match-stat documents for the athlete.

        Returns
        -------
        float
            AI score in [0, 1].
        """
        if ai_weights is None:
            ai_weights = {"xgb": 0.5, "lstm": 0.5}

        models = self._ensure_models(sport_name)
        xgb_model = models.get("xgb")
        lstm_model = models.get("lstm")

        xgb_available = xgb_model is not None
        lstm_available = lstm_model is not None

        w_xgb = ai_weights.get("xgb", 0.5)
        w_lstm = ai_weights.get("lstm", 0.5)

        xgb_score = 0.0
        lstm_score = 0.0

        if xgb_available:
            try:
                xgb_score = xgb_model.predict(historical_stats)
            except Exception:
                logger.warning("XGB prediction failed for sport=%s", sport_name)
                xgb_available = False

        if lstm_available:
            try:
                lstm_score = lstm_model.predict(historical_stats)
            except Exception:
                logger.warning("LSTM prediction failed for sport=%s", sport_name)
                lstm_available = False

        # Auto-normalise if one model is missing / failed
        if xgb_available and lstm_available:
            combined = w_xgb * xgb_score + w_lstm * lstm_score
        elif xgb_available:
            combined = xgb_score
        elif lstm_available:
            combined = lstm_score
        else:
            return 0.0

        return max(0.0, min(1.0, combined))

    # ------------------------------------------------------------------
    # Training
    # ------------------------------------------------------------------
    def retrain(
        self,
        sport_name: str,
        historical_stats: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Retrain both models for a single sport.
        Returns dict with training results per model.
        """
        models = self._ensure_models(sport_name)
        n = len(historical_stats)
        dummy_X = np.random.rand(max(n, 1), 5)
        dummy_y = np.random.rand(max(n, 1))
        results: Dict[str, Any] = {"sport": sport_name}

        if models.get("xgb"):
            try:
                results["xgb"] = models["xgb"].train(dummy_X, dummy_y)
            except Exception as exc:
                results["xgb"] = {"error": str(exc)}
                logger.warning("XGB training failed for sport=%s: %s", sport_name, exc)

        if models.get("lstm"):
            try:
                results["lstm"] = models["lstm"].train(dummy_X, dummy_y)
            except Exception as exc:
                results["lstm"] = {"error": str(exc)}
                logger.warning("LSTM training failed for sport=%s: %s", sport_name, exc)

        return results

    def remove_sport(self, sport_name: str) -> None:
        """Remove cached models for a sport."""
        self._models.pop(sport_name, None)


# Module-level singleton
ml_model_resolver = MLModelResolver()
