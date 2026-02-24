"""
WebSocket connection manager for real-time price updates.

Usage:
    from app.core.ws_manager import ws_manager

    # In a route: await ws_manager.broadcast_price_update(player_id, price_data)
    # In the WS endpoint: ws_manager.connect / disconnect / run loop
"""
import asyncio
import json
import logging
from typing import Dict, Set

from fastapi import WebSocket

logger = logging.getLogger("sportfolio.ws")


class ConnectionManager:
    """Manages WebSocket connections per player channel."""

    def __init__(self):
        # player_id (str) → set of connected websockets
        self._channels: Dict[str, Set[WebSocket]] = {}
        # global subscribers (receive ALL player price updates)
        self._global: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket, player_id: str | None = None):
        await ws.accept()
        if player_id:
            self._channels.setdefault(player_id, set()).add(ws)
        else:
            self._global.add(ws)
        logger.info("WS connected: player=%s total=%d", player_id or "global", self._count())

    def disconnect(self, ws: WebSocket, player_id: str | None = None):
        if player_id:
            ch = self._channels.get(player_id)
            if ch:
                ch.discard(ws)
                if not ch:
                    del self._channels[player_id]
        else:
            self._global.discard(ws)
        logger.info("WS disconnected: player=%s", player_id or "global")

    async def broadcast_price_update(self, player_id: str, data: dict):
        """Send price update to all subscribers of a specific player + global."""
        message = json.dumps({"type": "price_update", "playerId": player_id, **data})
        targets = list(self._channels.get(player_id, set())) + list(self._global)
        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception:
                # Stale connection; will be cleaned on next disconnect
                pass

    async def broadcast_trade(self, player_id: str, data: dict):
        """Send trade event to all subscribers."""
        message = json.dumps({"type": "trade", "playerId": player_id, **data})
        targets = list(self._channels.get(player_id, set())) + list(self._global)
        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception:
                pass

    def _count(self) -> int:
        return sum(len(s) for s in self._channels.values()) + len(self._global)


ws_manager = ConnectionManager()
