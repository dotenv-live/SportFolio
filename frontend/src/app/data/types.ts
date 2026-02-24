/**
 * Shared type definitions for the frontend.
 * Extracted from mockData so the app can use types without importing mock values.
 */

export interface SwimmingEventStat {
  label: string;
  races: number;
  personal_best: {
    time: string;
    time_ms: number;
    date?: string;
    meet_name?: string;
    fina_points: number;
  };
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

export interface WrestlingWeightClassStat {
  label: string;
  matches: number;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

export interface Athlete {
  id: string;
  name: string;
  sport: string;
  role: string;
  age: number;
  riskTier: 'Low' | 'Medium' | 'High';
  unitsAvailable: number;
  pricePerUnit: number;
  totalRaise: number;
  fundsRaised: number;
  revenueShare: number;
  duration: number;
  returnCap: number;
  performanceScore: number;
  growthRate: number;
  priceChange24h: number;
  imageUrl: string;
  isWatchlisted?: boolean;
  stats: {
    matches: number;
    runs?: number;
    wickets?: number;
    strikeRate: number;
    average: number;
    // Swimming stats
    totalRaces?: number;
    totalMedals?: number;
    bestFinaPoints?: number;
    // Wrestling stats
    totalBouts?: number;
    totalWrestlingMedals?: number;
    winRate?: number;
  };
  // Raw career stats from backend (sport-generic)
  careerStats?: Record<string, any>;
  // Typed sport-specific career stats
  swimmingCareerStats?: Record<string, SwimmingEventStat>;
  wrestlingCareerStats?: Record<string, WrestlingWeightClassStat>;
  recentMatches: {
    date: string;
    opponent: string;
    performance: string;
    runs?: number;
    wickets?: number;
    // Swimming match fields
    event?: string;
    time?: string;
    rank?: number;
    fina_points?: number;
    // Wrestling match fields
    match_type?: string;
    opponent_name?: string;
    result?: string;
    technical_points_scored?: number;
    technical_points_conceded?: number;
    status?: string;
  }[];
  upcomingMatches: {
    date: string;
    opponent: string;
    venue: string;
    tournament: string;
  }[];
  priceHistory?: number[];
  matchHistory?: {
    date: string;
    opponent: string;
    price: number;
    performance: string;
    priceChange: number;
  }[];
}

export interface Investment {
  id: string;
  athleteId: string;
  athleteName: string;
  units: number;
  investedAmount: number;
  currentValue: number; // Valued at exit price
  roi: number;
  purchaseDate: string;
  revenueEarned: number;
  markPrice?: number; // Last traded price (mark-to-market)
  exitPrice?: number; // Price accounting for exit spread
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'investor' | 'athlete' | 'admin';
  walletBalance: number;
  joinedAt: string;
}

export interface Order {
  id: string;
  athleteId: string;
  athleteName: string;
  type: 'BUY' | 'SELL';
  units: number;
  pricePerUnit: number;
  totalAmount: number;
  fee: number;
  status: 'Completed' | 'Pending' | 'Failed';
  timestamp: string;
  orderId: string;
}

export interface Notification {
  id: string;
  type: 'transaction' | 'alert' | 'update' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  athleteId?: string;
  athleteName?: string;
  icon?: string;
}

export interface PriceAlert {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteImage: string;
  condition: 'above' | 'below' | 'change';
  targetPrice?: number;
  changePercent?: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

// ─── Helper functions ────────────────────────────────────────────────

export function calculatePortfolioValue(investments: Investment[]): number {
  return investments.reduce((total, inv) => total + inv.currentValue, 0);
}

export function calculateTotalROI(investments: Investment[]): number {
  const totalInvested = investments.reduce((total, inv) => total + inv.investedAmount, 0);
  const totalCurrent = investments.reduce((total, inv) => total + inv.currentValue, 0);
  return totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;
}
