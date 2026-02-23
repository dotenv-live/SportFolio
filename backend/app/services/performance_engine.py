"""
HybridPerformanceService – computes sport-dynamic actual score (A).

Formulas
--------
A_formula  = Σ θ_k · normalize(M_k)          (sport-specific weighted metrics)
A          = (1 − φ) · A_formula + φ · A_ML   (hybrid blend)

Where:
    θ_k   : metric weight from sport config
    M_k   : raw metric value from latest match stats
    φ     : hybrid blend factor from sport config
    A_ML  : ML-predicted score (ai_score on player doc)

Fallbacks:
    • No sport config  → raw ``actual_score`` from stats (backward compat)
    • No ML available  → φ is ignored, A = A_formula
    • Missing metrics  → treated as 0
"""
import logging
from typing import Any, Dict, List, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.metric_normalizer import MetricNormalizer, resolve_dotpath, safe_float
from app.services.sport_config import sport_config_service

logger = logging.getLogger("sportfolio.performance")


class HybridPerformanceService:
    """Computes the sport-dynamic actual performance score (A)."""

    async def compute_actual_score(
        self,
        db: AsyncIOMotorDatabase,
        player_doc: dict,
        latest_stat: Optional[dict],
        ai_score: float,
    ) -> float:
        """
        Compute the hybrid actual performance score.

        Parameters
        ----------
        db : AsyncIOMotorDatabase
        player_doc : dict
            Full player document (must contain ``sport``).
        latest_stat : dict | None
            Most recent match-stat document for the player.
        ai_score : float
            Pre-computed AI score (from player doc or MLModelResolver).

        Returns
        -------
        float
            Actual score A in [0, 1].
        """
        sport_name = player_doc.get("sport", "")
        sport_config = await sport_config_service.get_by_name(db, sport_name)

        # ------ Fallback: no sport config → legacy behaviour ------
        if sport_config is None:
            return self._legacy_actual_score(latest_stat)

        stats = latest_stat.get("stats", {}) if latest_stat else {}
        metrics_defs: List[dict] = sport_config.get("metrics", [])

        if not metrics_defs:
            return self._legacy_actual_score(latest_stat)

        # Gather historical values per metric for normalization context
        player_id = player_doc["_id"]
        historical = await self._gather_historical(db, player_id, metrics_defs)

        # ---- Compute A_formula ----
        a_formula = 0.0
        for m in metrics_defs:
            key = m["key"]
            weight = m.get("weight", 0.0)
            norm_strategy = m.get("normalization", "minmax")
            raw_value = safe_float(resolve_dotpath(stats, key))
            hist_values = historical.get(key, [])
            normalized = MetricNormalizer.normalize(raw_value, norm_strategy, hist_values)
            a_formula += weight * normalized

        a_formula = max(0.0, min(1.0, a_formula))

        # ---- Hybrid blend ----
        phi: float = sport_config.get("phi", 0.0)
        if phi > 0 and ai_score > 0:
            return max(0.0, min(1.0, (1.0 - phi) * a_formula + phi * ai_score))

        return a_formula

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _legacy_actual_score(latest_stat: Optional[dict]) -> float:
        """Backward-compatible: read raw actual_score from stats."""
        if latest_stat and latest_stat.get("stats"):
            s = latest_stat["stats"]
            return float(s.get("actual_score", s.get("score", 0.5)))
        return 0.5

    @staticmethod
    def _safe_float(value: Any) -> float:
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0

    @staticmethod
    async def _gather_historical(
        db: AsyncIOMotorDatabase,
        player_id: ObjectId,
        metrics_defs: List[dict],
    ) -> Dict[str, List[float]]:
        """
        Collect historical metric values for each metric key.
        Used for normalization context (min/max, mean/std).
        Limits to last 50 matches for performance.
        """
        keys = {m["key"] for m in metrics_defs}
        result: Dict[str, List[float]] = {k: [] for k in keys}
        cursor = (
            db.player_matches.find({"player_id": player_id})
            .sort("date", -1)
            .limit(50)
        )
        async for doc in cursor:
            stats = doc.get("stats", {})
            for key in keys:
                val = resolve_dotpath(stats, key)
                if val is not None:
                    try:
                        result[key].append(float(val))
                    except (ValueError, TypeError):
                        pass
        return result


# Module-level singleton
hybrid_performance_service = HybridPerformanceService()
