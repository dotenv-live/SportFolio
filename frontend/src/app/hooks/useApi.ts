import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  playersApi,
  portfolioApi,
  tradingApi,
  playerMatchesApi,
  adaptTransaction,
} from '../services/api';
import type { Athlete, Investment, Order } from '../data/types';

// ─── Players ─────────────────────────────────────────────────────────

export function usePlayers(sport?: string) {
  return useQuery<Athlete[]>({
    queryKey: ['players', sport],
    queryFn: () => playersApi.list(sport),
    staleTime: 30_000,
  });
}

export function usePlayer(id: string | undefined) {
  return useQuery<Athlete | null>({
    queryKey: ['player', id],
    queryFn: async () => {
      if (!id) return null;
      const player = await playersApi.get(id);
      // Enrich with price history AND build matchHistory for the chart
      try {
        const rawPrices = await playersApi.priceHistoryRaw(id);
        if (rawPrices.length) {
          player.priceHistory = rawPrices.map((d) => d.price);
          // Build matchHistory so the AreaChart gets actual varying prices
          player.matchHistory = rawPrices.map((d, i) => {
            const prev = i > 0 ? rawPrices[i - 1].price : d.price;
            const pctChange = prev ? ((d.price - prev) / prev) * 100 : 0;
            return {
              date: d.timestamp?.split('T')[0] ?? '',
              opponent: '',
              price: d.price,
              performance: '',
              priceChange: Math.round(pctChange * 100) / 100,
            };
          });
        }
      } catch {
        /* price history not critical */
      }
      // Enrich with recent matches
      try {
        const matches = await playerMatchesApi.list(id, 0, 10);
        player.recentMatches = matches.map((m: any) => ({
          date: m.date ?? '',
          opponent: m.stats?.opponent ?? m.stats?.competition_label ?? m.stats?.opponent_name ?? '',
          performance: m.stats?.performance ??
            (m.stats?.performance?.time ? `${m.stats.performance.time} - Rank ${m.stats.performance.rank}` : ''),
          runs: m.stats?.runs,
          wickets: m.stats?.wickets,
          // Swimming-specific fields
          event: m.stats?.event,
          time: m.stats?.performance?.time,
          rank: m.stats?.performance?.rank,
          fina_points: m.stats?.performance?.fina_points,
          // Wrestling-specific fields
          match_type: m.stats?.match_type,
          opponent_name: m.stats?.opponent_name,
          result: m.stats?.performance?.result,
          technical_points_scored: m.stats?.performance?.technical_points_scored,
          technical_points_conceded: m.stats?.performance?.technical_points_conceded,
          status: m.stats?.performance?.status,
        }));
      } catch {
        /* matches not critical */
      }
      return player;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function usePriceHistory(playerId: string | undefined, limit = 100) {
  return useQuery<number[]>({
    queryKey: ['priceHistory', playerId, limit],
    queryFn: () => playersApi.priceHistory(playerId!, limit),
    enabled: !!playerId,
    staleTime: 60_000,
  });
}

// ─── Portfolio ───────────────────────────────────────────────────────

export function useHoldings() {
  return useQuery<Investment[]>({
    queryKey: ['holdings'],
    queryFn: portfolioApi.holdings,
    staleTime: 15_000,
  });
}

export function useTransactions(athletes: Athlete[] = []) {
  return useQuery<Order[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const raw = await portfolioApi.transactions();
      return raw.map((t: any) => adaptTransaction(t, athletes));
    },
    staleTime: 15_000,
  });
}

export function useWallet() {
  return useQuery<number>({
    queryKey: ['wallet'],
    queryFn: portfolioApi.wallet,
    staleTime: 10_000,
  });
}

export function useDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => portfolioApi.deposit(amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

// ─── Trading ─────────────────────────────────────────────────────────

export function useBuy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playerId, shares }: { playerId: string; shares: number }) =>
      tradingApi.buy(playerId, shares),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holdings'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useSell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playerId, shares }: { playerId: string; shares: number }) =>
      tradingApi.sell(playerId, shares),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holdings'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

// ─── Notifications & Alerts (local/mock – no backend endpoints) ─────

export function useNotifications() {
  // Backend doesn't have a notifications endpoint yet.
  // Return empty array; will be swapped for real API later.
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => [] as import('../data/types').Notification[],
    staleTime: Infinity,
  });
}

export function usePriceAlerts() {
  return useQuery({
    queryKey: ['priceAlerts'],
    queryFn: async () => [] as import('../data/types').PriceAlert[],
    staleTime: Infinity,
  });
}
