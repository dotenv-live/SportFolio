"""
AI Predictor – combines XGBoost and LSTM outputs into a single AI Score.

The AI Score is a weighted combination:
    AI_Score = w_xgb * XGB_score + w_lstm * LSTM_score

Both weights are configurable and default to 0.5 each.
"""
from typing import Any, Dict, List

from app.ai.xgboost_model import XGBoostModel
from app.ai.lstm_model import LSTMModel


class AIPredictor:
    """Facade that aggregates sub-model predictions."""

    def __init__(
        self,
        weight_xgb: float = 0.5,
        weight_lstm: float = 0.5,
    ) -> None:
        self.xgb = XGBoostModel()
        self.lstm = LSTMModel()
        self.weight_xgb = weight_xgb
        self.weight_lstm = weight_lstm

    def compute_ai_score(
        self,
        historical_stats: List[Dict[str, Any]],
    ) -> float:
        """
        Return normalised AI score in [0, 1].
        """
        xgb_score = self.xgb.predict(historical_stats)
        lstm_score = self.lstm.predict(historical_stats)
        combined = self.weight_xgb * xgb_score + self.weight_lstm * lstm_score
        return max(0.0, min(1.0, combined))

    def retrain(
        self,
        historical_stats: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Trigger retraining of both models.
        In production, convert historical_stats → X, y for each model.
        """
        import numpy as np
        n = len(historical_stats)
        dummy_X = np.random.rand(max(n, 1), 5)
        dummy_y = np.random.rand(max(n, 1))
        xgb_result = self.xgb.train(dummy_X, dummy_y)
        lstm_result = self.lstm.train(dummy_X, dummy_y)
        return {"xgboost": xgb_result, "lstm": lstm_result}


# Module-level singleton
ai_predictor = AIPredictor()
