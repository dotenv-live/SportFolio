/**
 * Shared type definitions for the frontend.
 * Extracted from mockData so the app can use types without importing mock values.
 */

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
  };
  recentMatches: {
    date: string;
    opponent: string;
    performance: string;
    runs?: number;
    wickets?: number;
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
  currentValue: number;
  roi: number;
  purchaseDate: string;
  revenueEarned: number;
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
