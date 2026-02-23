/**
 * WebSocket hook for real-time price updates.
 *
 * Connects to the backend WS endpoint and patches React Query cache
 * whenever a price_update or trade event arrives.
 *
 * Usage:
 *   // Global (all players) — call once in App or a layout component
 *   useGlobalPriceSocket();
 *
 *   // Per-player — call on the detail page
 *   usePlayerPriceSocket(playerId);
 */
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Athlete } from '../data/types';

// ─── Helpers ─────────────────────────────────────────────────────────

/** Resolve the WS URL respecting the Vite dev proxy. */
function wsUrl(path: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}${path}`;
}

interface PriceUpdateMsg {
  type: 'price_update';
  playerId: string;
  price: number;
  fundamentalValue?: number;
}

interface TradeMsg {
  type: 'trade';
  playerId: string;
  tradeType: 'buy' | 'sell';
  shares: number;
  price: number;
}

type WSMessage = PriceUpdateMsg | TradeMsg;

// ─── Core reconnecting socket ────────────────────────────────────────

function useReconnectingSocket(
  url: string,
  onMessage: (msg: WSMessage) => void,
  enabled = true,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!enabled) return;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retriesRef.current = 0;
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as WSMessage;
          onMessageRef.current(data);
        } catch {
          /* ignore malformed messages */
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Exponential back-off: 1s, 2s, 4s … max 30s
        const delay = Math.min(1000 * 2 ** retriesRef.current, 30_000);
        retriesRef.current += 1;
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      /* will retry via onclose */
    }
  }, [url, enabled]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);
}

// ─── Cache updaters ──────────────────────────────────────────────────

function usePriceMessageHandler() {
  const qc = useQueryClient();

  return useCallback(
    (msg: WSMessage) => {
      if (msg.type === 'price_update') {
        const { playerId, price } = msg;

        // 1. Patch pricePerUnit on the players list for instant UI feedback
        qc.setQueriesData<Athlete[]>(
          { queryKey: ['players'] },
          (old) =>
            old?.map((p) =>
              p.id === playerId ? { ...p, pricePerUnit: price } : p,
            ),
        );

        // 2. Patch pricePerUnit on the single player cache
        qc.setQueriesData<Athlete | null>(
          { queryKey: ['player', playerId] },
          (old) => (old ? { ...old, pricePerUnit: price } : old),
        );

        // 3. Invalidate full data queries so chart & history refetch cleanly
        qc.invalidateQueries({ queryKey: ['player', playerId] });
        qc.invalidateQueries({ queryKey: ['priceHistory', playerId] });
        qc.invalidateQueries({ queryKey: ['holdings'] });
      }

      if (msg.type === 'trade') {
        // A trade happened — refresh wallet & transactions
        qc.invalidateQueries({ queryKey: ['wallet'] });
        qc.invalidateQueries({ queryKey: ['transactions'] });
      }
    },
    [qc],
  );
}

// ─── Public hooks ────────────────────────────────────────────────────

/** Subscribe to ALL player price updates (global feed). */
export function useGlobalPriceSocket() {
  const handler = usePriceMessageHandler();
  useReconnectingSocket(wsUrl('/ws/prices'), handler);
}

/** Subscribe to price updates for a single player. */
export function usePlayerPriceSocket(playerId: string | undefined) {
  const handler = usePriceMessageHandler();
  useReconnectingSocket(
    wsUrl(`/ws/prices/${playerId}`),
    handler,
    !!playerId,
  );
}
