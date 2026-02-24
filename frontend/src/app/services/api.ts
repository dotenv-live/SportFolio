import axios from 'axios';
import type { Athlete, Investment, User, Order, Notification, PriceAlert } from '../data/types';

// ─── Axios Instance ──────────────────────────────────────────────────
// If VITE_API_URL is set to a remote URL, use it directly (bypassing Vite proxy)
// Otherwise use the relative path which will be proxied by Vite dev server
const getBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const basePath = import.meta.env.VITE_API_BASE_PATH || '/api/v1';

  // If API URL is remote (starts with http/https), use full URL
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    return `${apiUrl}${basePath}`;
  }

  // Otherwise use relative path for Vite proxy
  return basePath;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler – clear token on expiry
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sf_token');
      // Don't force-redirect; let AuthContext handle it
    }
    return Promise.reject(err);
  },
);

// ─── Backend → Frontend Adapters ─────────────────────────────────────

// Default athlete images keyed by rough index for visual variety
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1707549617870-e311a2274cd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  'https://images.unsplash.com/photo-1546525848-3ce03ca516f6?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1720799359504-102495aec122?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1667839412541-f7cafaa94319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
];

function getRiskTier(performanceScore: number): 'Low' | 'Medium' | 'High' {
  if (performanceScore >= 0.7) return 'Low';
  if (performanceScore >= 0.4) return 'Medium';
  return 'High';
}

/** Map backend player document → frontend Athlete interface */
export function adaptPlayer(p: any, index = 0): Athlete {
  const ps = p.performance_score ?? 0;
  const price = p.current_price ?? p.fundamental_value ?? 0;
  const totalShares = p.total_shares ?? 0;
  const circulating = p.circulating_shares ?? 0;
  const buyVol = p.buy_volume ?? 0;
  const sellVol = p.sell_volume ?? 0;

  // Derive price change from base_value vs current_price
  const baseVal = p.fundamental_value ?? price;
  const priceChange24h = baseVal
    ? Number((((price - baseVal) / baseVal) * 100).toFixed(2))
    : 0;

  // Build career stats → simplified stats object
  const career = p.career_stats ?? {};
  const sportName = (p.sport ?? 'Cricket').toLowerCase();

  let role = 'Athlete';
  let stats: Athlete['stats'] = {
    matches: p.total_matches ?? 0,
    strikeRate: 0,
    average: 0,
  };
  let swimmingCareerStats: Record<string, any> | undefined = undefined;
  let wrestlingCareerStats: Record<string, any> | undefined = undefined;

  if (sportName === 'swimming') {
    // Swimming-specific adaptation
    const events = Object.values(career) as any[];
    const totalRaces = events.reduce((sum: number, e: any) => sum + (e?.races ?? 0), 0);
    const totalMedals = events.reduce((sum: number, e: any) => {
      const m = e?.medals ?? {};
      return sum + (m.gold ?? 0) + (m.silver ?? 0) + (m.bronze ?? 0);
    }, 0);
    const bestFina = events.reduce((best: number, e: any) => {
      const fp = e?.personal_best?.fina_points ?? 0;
      return Math.max(best, fp);
    }, 0);

    const firstEvent = events[0];
    if (firstEvent?.label) {
      const label = firstEvent.label.toLowerCase();
      if (label.includes('freestyle')) role = 'Freestyle';
      else if (label.includes('backstroke')) role = 'Backstroke';
      else if (label.includes('butterfly')) role = 'Butterfly';
      else if (label.includes('breaststroke')) role = 'Breaststroke';
      else if (label.includes('medley')) role = 'Medley';
      else role = 'Swimmer';
    } else {
      role = 'Swimmer';
    }

    stats = {
      matches: p.total_matches ?? totalRaces,
      strikeRate: 0,
      average: 0,
      totalRaces,
      totalMedals,
      bestFinaPoints: bestFina,
    };

    swimmingCareerStats = career;
  } else if (sportName === 'wrestling') {
    // Wrestling-specific adaptation
    const weightClasses = Object.values(career) as any[];
    const totalBouts = weightClasses.reduce((sum: number, wc: any) => sum + (wc?.matches ?? 0), 0);
    const totalMedals = weightClasses.reduce((sum: number, wc: any) => {
      const m = wc?.medals ?? {};
      return sum + (m.gold ?? 0) + (m.silver ?? 0) + (m.bronze ?? 0);
    }, 0);
    const totalGold = weightClasses.reduce((sum: number, wc: any) => sum + (wc?.medals?.gold ?? 0), 0);
    const winRate = totalBouts > 0 ? Math.round((totalGold / totalBouts) * 100) : 0;

    // Derive role from weight-class labels
    const firstWc = weightClasses[0];
    if (firstWc?.label) {
      const label = firstWc.label.toLowerCase();
      if (label.includes('freestyle')) role = 'Freestyle';
      else if (label.includes('greco')) role = 'Greco-Roman';
      else role = 'Wrestler';
    } else {
      role = 'Wrestler';
    }

    stats = {
      matches: p.total_matches ?? totalBouts,
      strikeRate: 0,
      average: 0,
      totalBouts,
      totalWrestlingMedals: totalMedals,
      winRate,
    };

    wrestlingCareerStats = career;
  } else {
    // Cricket (default) adaptation
    const firstFormat = Object.values(career)[0] as any;
    const batting = firstFormat?.batting ?? {};
    const bowling = firstFormat?.bowling ?? {};

    role = batting.matches ? (bowling.wickets ? 'All-rounder' : 'Batsman') : 'Bowler';

    stats = {
      matches: p.total_matches ?? batting.matches ?? bowling.matches ?? 0,
      runs: batting.runs ?? undefined,
      wickets: bowling.wickets ?? undefined,
      strikeRate: batting.strike_rate ?? bowling.strike_rate ?? 0,
      average: batting.average ?? bowling.average ?? 0,
    };
  }

  return {
    id: p._id,
    name: p.name,
    sport: p.sport ?? 'Cricket',
    role,
    age: 0, // not tracked in backend
    riskTier: getRiskTier(ps),
    unitsAvailable: Math.max(0, totalShares - circulating),
    pricePerUnit: price,
    totalRaise: totalShares * (p.fundamental_value ?? price),
    fundsRaised: circulating * price,
    revenueShare: 10,
    duration: 5,
    returnCap: 3,
    performanceScore: Math.round(ps * 100),
    growthRate: (p.growth_score ?? 0) * 100,
    priceChange24h,
    imageUrl: DEFAULT_IMAGES[index % DEFAULT_IMAGES.length],
    isWatchlisted: false,
    stats,
    careerStats: career,
    swimmingCareerStats,
    wrestlingCareerStats,
    recentMatches: [],   // populated lazily via player-matches
    upcomingMatches: [],  // not in backend
    priceHistory: [],     // populated lazily via price-history
    matchHistory: [],     // populated lazily via player-matches
  };
}

/** Map backend holding doc → frontend Investment interface */
export function adaptHolding(h: any): Investment {
  // market_value is now calculated with exit price on backend
  const currentValue = h.market_value ?? (h.shares_owned ?? 0) * (h.exit_price ?? h.current_price ?? 0);
  // Use invested_amount from backend (calculated from transactions)
  const investedAmount = h.invested_amount ?? 0;
  const roi = investedAmount > 0 ? ((currentValue - investedAmount) / investedAmount) * 100 : 0;

  return {
    id: h._id,
    athleteId: h.player_id,
    athleteName: h.player_name ?? '',
    units: h.shares_owned ?? 0,
    investedAmount,
    currentValue, // Valued at exit price
    roi,
    purchaseDate: h.last_accrual_timestamp ?? new Date().toISOString(),
    revenueEarned: h.accrued_dividend ?? 0,
    markPrice: h.current_price,
    exitPrice: h.exit_price,
  };
}

/** Map backend transaction doc → frontend Order interface */
export function adaptTransaction(t: any, athletes: Athlete[] = []): Order {
  const player = athletes.find((a) => a.id === t.player_id);
  const total = (t.shares ?? 0) * (t.price ?? 0);
  return {
    id: t._id,
    athleteId: t.player_id,
    athleteName: player?.name ?? t.player_id,
    type: (t.type === 'buy' ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
    units: t.shares ?? 0,
    pricePerUnit: t.price ?? 0,
    totalAmount: total,
    fee: total * 0.01,
    status: 'Completed',
    timestamp: t.timestamp,
    orderId: `SF${new Date(t.timestamp).getTime()}`,
  };
}

/** Map backend user doc → frontend User interface */
export function adaptUser(u: any): User {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role ?? 'investor',
    walletBalance: u.wallet_balance ?? 0,
    joinedAt: u.created_at ?? new Date().toISOString(),
  };
}

// ─── Auth API ────────────────────────────────────────────────────────

export const authApi = {
  async register(name: string, email: string, password: string) {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data as { access_token: string; token_type: string };
  },

  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    return data as { access_token: string; token_type: string };
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return adaptUser(data);
  },
};

// ─── Players API ─────────────────────────────────────────────────────

export const playersApi = {
  async list(sport?: string, skip = 0, limit = 50): Promise<Athlete[]> {
    const params: any = { skip, limit };
    if (sport) params.sport = sport;
    const { data } = await api.get('/players/', { params });
    return (data as any[]).map((p, i) => adaptPlayer(p, i));
  },

  async get(id: string): Promise<Athlete> {
    const { data } = await api.get(`/players/${id}`);
    return adaptPlayer(data);
  },

  async priceHistoryRaw(id: string, limit = 100): Promise<{ price: number; timestamp: string }[]> {
    const { data } = await api.get(`/players/${id}/price-history`, {
      params: { limit },
    });
    return (data as any[]).map((d: any) => ({
      price: d.price,
      timestamp: d.timestamp,
    }));
  },

  async priceHistory(id: string, limit = 100): Promise<number[]> {
    const raw = await this.priceHistoryRaw(id, limit);
    return raw.map((d) => d.price);
  },
};

// ─── Trading API ─────────────────────────────────────────────────────

export const tradingApi = {
  async buy(playerId: string, shares: number) {
    const { data } = await api.post('/trade/buy', {
      player_id: playerId,
      shares,
    });
    return data;
  },

  async sell(playerId: string, shares: number) {
    const { data } = await api.post('/trade/sell', {
      player_id: playerId,
      shares,
    });
    return data;
  },
};

// ─── Portfolio API ───────────────────────────────────────────────────

export const portfolioApi = {
  async holdings(): Promise<Investment[]> {
    const { data } = await api.get('/portfolio/holdings');
    return (data as any[]).map(adaptHolding);
  },

  async transactions(): Promise<any[]> {
    const { data } = await api.get('/portfolio/transactions');
    return data as any[];
  },

  async wallet(): Promise<number> {
    const { data } = await api.get('/portfolio/wallet');
    return data.wallet_balance;
  },

  async deposit(amount: number) {
    const { data } = await api.post('/portfolio/wallet/deposit', null, {
      params: { amount },
    });
    return data as { deposited: number; new_balance: number };
  },
};

// ─── Player Matches API ──────────────────────────────────────────────

export const playerMatchesApi = {
  async list(playerId?: string, skip = 0, limit = 20) {
    const params: any = { skip, limit };
    if (playerId) params.player_id = playerId;
    const { data } = await api.get('/player-matches/', { params });
    return data as any[];
  },
};

// ─── Admin API ───────────────────────────────────────────────────────

export const adminApi = {
  async recalculateAll() {
    const { data } = await api.post('/admin/price/recalculate-all');
    return data;
  },
  async accrueAllDividends() {
    const { data } = await api.post('/admin/dividends/accrue-all');
    return data;
  },
  async retrainAI() {
    const { data } = await api.post('/admin/ai/retrain');
    return data;
  },
  async liquidityAudit() {
    const { data } = await api.post('/admin/liquidity/audit');
    return data;
  },
};

export default api;
