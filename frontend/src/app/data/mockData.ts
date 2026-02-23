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
  priceChange24h: number; // Added for trading platform feel
  imageUrl: string;
  isWatchlisted?: boolean; // For watchlist feature
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
  priceHistory?: number[]; // For sparkline charts
  matchHistory?: {
    date: string;
    opponent: string;
    price: number;
    performance: string;
    priceChange: number;
  }[]; // Price changes per match
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

export const mockAthletes: Athlete[] = [
  {
    id: '1',
    name: 'Arjun Sharma',
    sport: 'Cricket',
    role: 'Batsman',
    age: 22,
    riskTier: 'Medium',
    unitsAvailable: 500,
    pricePerUnit: 200,
    totalRaise: 100000,
    fundsRaised: 65000,
    revenueShare: 10,
    duration: 5,
    returnCap: 3,
    performanceScore: 85,
    growthRate: 12.5,
    priceChange24h: 2.5,
    imageUrl: 'https://images.unsplash.com/photo-1707549617870-e311a2274cd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBjcmlja2V0JTIwcGxheWVyJTIwbWFsZSUyMGF0aGxldGV8ZW58MXx8fHwxNzcxODQxMTYxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    isWatchlisted: true,
    stats: {
      matches: 45,
      runs: 2340,
      strikeRate: 142.5,
      average: 52.0,
    },
    recentMatches: [
      { date: '2026-02-20', opponent: 'Mumbai Indians', performance: '78 runs off 52 balls', runs: 78 },
      { date: '2026-02-15', opponent: 'Chennai Super Kings', performance: '45 runs off 38 balls', runs: 45 },
      { date: '2026-02-10', opponent: 'Royal Challengers', performance: '92 runs off 61 balls', runs: 92 },
      { date: '2026-02-05', opponent: 'Delhi Capitals', performance: '34 runs off 28 balls', runs: 34 },
      { date: '2026-01-30', opponent: 'Kolkata Knight Riders', performance: '105 runs off 68 balls', runs: 105 },
    ],
    upcomingMatches: [
      { date: '2026-03-05', opponent: 'Punjab Kings', venue: 'Mumbai', tournament: 'Indian Premier League' },
      { date: '2026-03-10', opponent: 'Rajasthan Royals', venue: 'Chennai', tournament: 'Indian Premier League' },
    ],
    priceHistory: [192, 195, 193, 197, 199, 202, 198, 200, 204, 207, 205, 208, 210],
    matchHistory: [
      { date: '2026-02-20', opponent: 'Mumbai Indians', price: 200, performance: '78 runs off 52 balls', priceChange: 2.5 },
      { date: '2026-02-15', opponent: 'Chennai Super Kings', price: 200, performance: '45 runs off 38 balls', priceChange: 2.5 },
      { date: '2026-02-10', opponent: 'Royal Challengers', price: 200, performance: '92 runs off 61 balls', priceChange: 2.5 },
      { date: '2026-02-05', opponent: 'Delhi Capitals', price: 200, performance: '34 runs off 28 balls', priceChange: 2.5 },
      { date: '2026-01-30', opponent: 'Kolkata Knight Riders', price: 200, performance: '105 runs off 68 balls', priceChange: 2.5 },
    ],
  },
  {
    id: '2',
    name: 'Priya Nair',
    sport: 'Cricket',
    role: 'All-rounder',
    age: 20,
    riskTier: 'High',
    unitsAvailable: 750,
    pricePerUnit: 150,
    totalRaise: 112500,
    fundsRaised: 42000,
    revenueShare: 12,
    duration: 5,
    returnCap: 3,
    performanceScore: 78,
    growthRate: 18.3,
    priceChange24h: -1.5,
    imageUrl: 'https://images.unsplash.com/photo-1546525848-3ce03ca516f6?w=400&h=400&fit=crop',
    stats: {
      matches: 32,
      runs: 890,
      wickets: 28,
      strikeRate: 128.4,
      average: 34.5,
    },
    recentMatches: [
      { date: '2026-02-18', opponent: 'Punjab Kings', performance: '45 runs, 2 wickets', runs: 45, wickets: 2 },
      { date: '2026-02-12', opponent: 'Rajasthan Royals', performance: '38 runs, 1 wicket', runs: 38, wickets: 1 },
      { date: '2026-02-08', opponent: 'Gujarat Titans', performance: '67 runs, 3 wickets', runs: 67, wickets: 3 },
      { date: '2026-02-03', opponent: 'Sunrisers Hyderabad', performance: '29 runs, 2 wickets', runs: 29, wickets: 2 },
      { date: '2026-01-28', opponent: 'Lucknow Super Giants', performance: '52 runs, 1 wicket', runs: 52, wickets: 1 },
    ],
    upcomingMatches: [
      { date: '2026-03-15', opponent: 'Mumbai Indians', venue: 'Chennai', tournament: 'Indian Premier League' },
      { date: '2026-03-20', opponent: 'Chennai Super Kings', venue: 'Mumbai', tournament: 'Indian Premier League' },
    ],
    priceHistory: [155, 153, 151, 148, 147, 145, 144, 143, 142, 141, 140, 139, 141],
    matchHistory: [
      { date: '2026-02-18', opponent: 'Punjab Kings', price: 150, performance: '45 runs, 2 wickets', priceChange: -1.5 },
      { date: '2026-02-12', opponent: 'Rajasthan Royals', price: 150, performance: '38 runs, 1 wicket', priceChange: -1.5 },
      { date: '2026-02-08', opponent: 'Gujarat Titans', price: 150, performance: '67 runs, 3 wickets', priceChange: -1.5 },
      { date: '2026-02-03', opponent: 'Sunrisers Hyderabad', price: 150, performance: '29 runs, 2 wickets', priceChange: -1.5 },
      { date: '2026-01-28', opponent: 'Lucknow Super Giants', price: 150, performance: '52 runs, 1 wicket', priceChange: -1.5 },
    ],
  },
  {
    id: '3',
    name: 'Rohan Verma',
    sport: 'Cricket',
    role: 'Bowler',
    age: 24,
    riskTier: 'Low',
    unitsAvailable: 400,
    pricePerUnit: 250,
    totalRaise: 100000,
    fundsRaised: 88000,
    revenueShare: 8,
    duration: 4,
    returnCap: 2.5,
    performanceScore: 92,
    growthRate: 8.7,
    priceChange24h: 1.0,
    imageUrl: 'https://images.unsplash.com/photo-1720799359504-102495aec122?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB5b3VuZyUyMG1hbGUlMjBhdGhsZXRlJTIwc3BvcnRzfGVufDF8fHx8MTc3MTg0MTE2MXww&ixlib=rb-4.1.0&q=80&w=1080',
    stats: {
      matches: 58,
      wickets: 87,
      strikeRate: 18.5,
      average: 22.3,
    },
    recentMatches: [
      { date: '2026-02-19', opponent: 'Mumbai Indians', performance: '4 wickets for 28 runs', wickets: 4 },
      { date: '2026-02-14', opponent: 'Chennai Super Kings', performance: '2 wickets for 35 runs', wickets: 2 },
      { date: '2026-02-09', opponent: 'Royal Challengers', performance: '3 wickets for 31 runs', wickets: 3 },
      { date: '2026-02-04', opponent: 'Delhi Capitals', performance: '1 wicket for 42 runs', wickets: 1 },
      { date: '2026-01-29', opponent: 'Kolkata Knight Riders', performance: '5 wickets for 24 runs', wickets: 5 },
    ],
    upcomingMatches: [
      { date: '2026-03-25', opponent: 'Punjab Kings', venue: 'Chennai', tournament: 'Indian Premier League' },
      { date: '2026-03-30', opponent: 'Rajasthan Royals', venue: 'Mumbai', tournament: 'Indian Premier League' },
    ],
    priceHistory: [243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 250, 249, 251],
    matchHistory: [
      { date: '2026-02-19', opponent: 'Mumbai Indians', price: 250, performance: '4 wickets for 28 runs', priceChange: 1.0 },
      { date: '2026-02-14', opponent: 'Chennai Super Kings', price: 250, performance: '2 wickets for 35 runs', priceChange: 1.0 },
      { date: '2026-02-09', opponent: 'Royal Challengers', price: 250, performance: '3 wickets for 31 runs', priceChange: 1.0 },
      { date: '2026-02-04', opponent: 'Delhi Capitals', price: 250, performance: '1 wicket for 42 runs', priceChange: 1.0 },
      { date: '2026-01-29', opponent: 'Kolkata Knight Riders', price: 250, performance: '5 wickets for 24 runs', priceChange: 1.0 },
    ],
  },
  {
    id: '4',
    name: 'Kavya Patel',
    sport: 'Cricket',
    role: 'Wicket-keeper Batsman',
    age: 21,
    riskTier: 'Medium',
    unitsAvailable: 600,
    pricePerUnit: 180,
    totalRaise: 108000,
    fundsRaised: 54000,
    revenueShare: 10,
    duration: 5,
    returnCap: 3,
    performanceScore: 81,
    growthRate: 15.2,
    priceChange24h: 0.5,
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
    stats: {
      matches: 38,
      runs: 1560,
      strikeRate: 135.8,
      average: 41.0,
    },
    recentMatches: [
      { date: '2026-02-17', opponent: 'Rajasthan Royals', performance: '62 runs off 48 balls', runs: 62 },
      { date: '2026-02-11', opponent: 'Gujarat Titans', performance: '38 runs off 32 balls', runs: 38 },
      { date: '2026-02-07', opponent: 'Sunrisers Hyderabad', performance: '71 runs off 54 balls', runs: 71 },
      { date: '2026-02-02', opponent: 'Lucknow Super Giants', performance: '45 runs off 36 balls', runs: 45 },
      { date: '2026-01-27', opponent: 'Punjab Kings', performance: '88 runs off 62 balls', runs: 88 },
    ],
    upcomingMatches: [
      { date: '2026-04-05', opponent: 'Mumbai Indians', venue: 'Chennai', tournament: 'Indian Premier League' },
      { date: '2026-04-10', opponent: 'Chennai Super Kings', venue: 'Mumbai', tournament: 'Indian Premier League' },
    ],
    priceHistory: [173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 180, 179, 181],
    matchHistory: [
      { date: '2026-02-17', opponent: 'Rajasthan Royals', price: 180, performance: '62 runs off 48 balls', priceChange: 0.5 },
      { date: '2026-02-11', opponent: 'Gujarat Titans', price: 180, performance: '38 runs off 32 balls', priceChange: 0.5 },
      { date: '2026-02-07', opponent: 'Sunrisers Hyderabad', price: 180, performance: '71 runs off 54 balls', priceChange: 0.5 },
      { date: '2026-02-02', opponent: 'Lucknow Super Giants', price: 180, performance: '45 runs off 36 balls', priceChange: 0.5 },
      { date: '2026-01-27', opponent: 'Punjab Kings', price: 180, performance: '88 runs off 62 balls', priceChange: 0.5 },
    ],
  },
  {
    id: '5',
    name: 'Vikram Singh',
    sport: 'Cricket',
    role: 'Batsman',
    age: 19,
    riskTier: 'High',
    unitsAvailable: 800,
    pricePerUnit: 125,
    totalRaise: 100000,
    fundsRaised: 31250,
    revenueShare: 15,
    duration: 6,
    returnCap: 4,
    performanceScore: 72,
    growthRate: 22.8,
    priceChange24h: -2.0,
    imageUrl: 'https://images.unsplash.com/photo-1667839412541-f7cafaa94319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBtYWxlJTIwY3JpY2tldGVyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxODQxMTYxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    stats: {
      matches: 24,
      runs: 980,
      strikeRate: 148.2,
      average: 40.8,
    },
    recentMatches: [
      { date: '2026-02-16', opponent: 'Delhi Capitals', performance: '56 runs off 38 balls', runs: 56 },
      { date: '2026-02-10', opponent: 'Kolkata Knight Riders', performance: '34 runs off 28 balls', runs: 34 },
      { date: '2026-02-06', opponent: 'Mumbai Indians', performance: '78 runs off 52 balls', runs: 78 },
      { date: '2026-02-01', opponent: 'Chennai Super Kings', performance: '23 runs off 18 balls', runs: 23 },
      { date: '2026-01-26', opponent: 'Royal Challengers', performance: '91 runs off 61 balls', runs: 91 },
    ],
    upcomingMatches: [
      { date: '2026-04-15', opponent: 'Punjab Kings', venue: 'Chennai', tournament: 'Indian Premier League' },
      { date: '2026-04-20', opponent: 'Rajasthan Royals', venue: 'Mumbai', tournament: 'Indian Premier League' },
    ],
    priceHistory: [132, 130, 128, 125, 122, 120, 118, 116, 114, 112, 110, 108, 108],
    matchHistory: [
      { date: '2026-02-16', opponent: 'Delhi Capitals', price: 125, performance: '56 runs off 38 balls', priceChange: -2.0 },
      { date: '2026-02-10', opponent: 'Kolkata Knight Riders', price: 125, performance: '34 runs off 28 balls', priceChange: -2.0 },
      { date: '2026-02-06', opponent: 'Mumbai Indians', price: 125, performance: '78 runs off 52 balls', priceChange: -2.0 },
      { date: '2026-02-01', opponent: 'Chennai Super Kings', price: 125, performance: '23 runs off 18 balls', priceChange: -2.0 },
      { date: '2026-01-26', opponent: 'Royal Challengers', price: 125, performance: '91 runs off 61 balls', priceChange: -2.0 },
    ],
  },
  {
    id: '6',
    name: 'Ananya Reddy',
    sport: 'Cricket',
    role: 'Bowler',
    age: 23,
    riskTier: 'Medium',
    unitsAvailable: 550,
    pricePerUnit: 190,
    totalRaise: 104500,
    fundsRaised: 62700,
    revenueShare: 9,
    duration: 5,
    returnCap: 3,
    performanceScore: 86,
    growthRate: 11.4,
    priceChange24h: 0.8,
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    stats: {
      matches: 42,
      wickets: 64,
      strikeRate: 20.2,
      average: 24.5,
    },
    recentMatches: [
      { date: '2026-02-18', opponent: 'Sunrisers Hyderabad', performance: '3 wickets for 32 runs', wickets: 3 },
      { date: '2026-02-13', opponent: 'Lucknow Super Giants', performance: '2 wickets for 28 runs', wickets: 2 },
      { date: '2026-02-08', opponent: 'Punjab Kings', performance: '4 wickets for 35 runs', wickets: 4 },
      { date: '2026-02-03', opponent: 'Rajasthan Royals', performance: '1 wicket for 38 runs', wickets: 1 },
      { date: '2026-01-28', opponent: 'Gujarat Titans', performance: '3 wickets for 29 runs', wickets: 3 },
    ],
    upcomingMatches: [
      { date: '2026-05-05', opponent: 'Mumbai Indians', venue: 'Chennai', tournament: 'Indian Premier League' },
      { date: '2026-05-10', opponent: 'Chennai Super Kings', venue: 'Mumbai', tournament: 'Indian Premier League' },
    ],
    priceHistory: [183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 190, 189, 191],
    matchHistory: [
      { date: '2026-02-18', opponent: 'Sunrisers Hyderabad', price: 190, performance: '3 wickets for 32 runs', priceChange: 0.8 },
      { date: '2026-02-13', opponent: 'Lucknow Super Giants', price: 190, performance: '2 wickets for 28 runs', priceChange: 0.8 },
      { date: '2026-02-08', opponent: 'Punjab Kings', price: 190, performance: '4 wickets for 35 runs', priceChange: 0.8 },
      { date: '2026-02-03', opponent: 'Rajasthan Royals', price: 190, performance: '1 wicket for 38 runs', priceChange: 0.8 },
      { date: '2026-01-28', opponent: 'Gujarat Titans', price: 190, performance: '3 wickets for 29 runs', priceChange: 0.8 },
    ],
  },
];

export const mockInvestments: Investment[] = [
  {
    id: 'inv-1',
    athleteId: '1',
    athleteName: 'Arjun Sharma',
    units: 50,
    investedAmount: 10000,
    currentValue: 12500,
    roi: 25.0,
    purchaseDate: '2025-11-15',
    revenueEarned: 450,
  },
  {
    id: 'inv-2',
    athleteId: '3',
    athleteName: 'Rohan Verma',
    units: 30,
    investedAmount: 7500,
    currentValue: 8250,
    roi: 10.0,
    purchaseDate: '2025-12-01',
    revenueEarned: 320,
  },
  {
    id: 'inv-3',
    athleteId: '6',
    athleteName: 'Ananya Reddy',
    units: 40,
    investedAmount: 7600,
    currentValue: 9120,
    roi: 20.0,
    purchaseDate: '2026-01-10',
    revenueEarned: 280,
  },
];

export const mockUser: User = {
  id: '1',
  name: 'Rahul Kumar',
  email: 'rahul@example.com',
  role: 'investor',
  walletBalance: 125000,
  joinedAt: '2025-12-15',
};

// Helper function to calculate portfolio value
export function calculatePortfolioValue(investments: Investment[]): number {
  return investments.reduce((total, inv) => total + inv.currentValue, 0);
}

// Helper function to calculate total ROI
export function calculateTotalROI(investments: Investment[]): number {
  const totalInvested = investments.reduce((total, inv) => total + inv.investedAmount, 0);
  const totalCurrent = investments.reduce((total, inv) => total + inv.currentValue, 0);
  return totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;
}

// Helper function to get risk color
export function getRiskColor(risk: string): string {
  switch (risk) {
    case 'Low':
      return '#2EFF7A';
    case 'Medium':
      return '#FFB800';
    case 'High':
      return '#FF4C4C';
    default:
      return '#8B949E';
  }
}

// Mock orders data
export const mockOrders: Order[] = [
  {
    id: 'ord-1',
    athleteId: '1',
    athleteName: 'Arjun Sharma',
    type: 'BUY',
    units: 50,
    pricePerUnit: 200,
    totalAmount: 10000,
    fee: 100,
    status: 'Completed',
    timestamp: '2026-02-22T14:30:00Z',
    orderId: 'AGE202602220001',
  },
  {
    id: 'ord-2',
    athleteId: '3',
    athleteName: 'Rohan Verma',
    type: 'BUY',
    units: 30,
    pricePerUnit: 250,
    totalAmount: 7500,
    fee: 75,
    status: 'Completed',
    timestamp: '2026-02-21T10:15:00Z',
    orderId: 'AGE202602210001',
  },
  {
    id: 'ord-3',
    athleteId: '2',
    athleteName: 'Priya Nair',
    type: 'SELL',
    units: 20,
    pricePerUnit: 150,
    totalAmount: 3000,
    fee: 15,
    status: 'Completed',
    timestamp: '2026-02-20T16:45:00Z',
    orderId: 'AGE202602200001',
  },
  {
    id: 'ord-4',
    athleteId: '6',
    athleteName: 'Ananya Reddy',
    type: 'BUY',
    units: 40,
    pricePerUnit: 190,
    totalAmount: 7600,
    fee: 76,
    status: 'Completed',
    timestamp: '2026-02-19T11:20:00Z',
    orderId: 'AGE202602190001',
  },
  {
    id: 'ord-5',
    athleteId: '4',
    athleteName: 'Kavya Patel',
    type: 'BUY',
    units: 25,
    pricePerUnit: 180,
    totalAmount: 4500,
    fee: 45,
    status: 'Pending',
    timestamp: '2026-02-23T09:00:00Z',
    orderId: 'AGE202602230001',
  },
  {
    id: 'ord-6',
    athleteId: '5',
    athleteName: 'Vikram Singh',
    type: 'BUY',
    units: 15,
    pricePerUnit: 125,
    totalAmount: 1875,
    fee: 18.75,
    status: 'Failed',
    timestamp: '2026-02-18T13:30:00Z',
    orderId: 'AGE202602180001',
  },
];

// Notification types
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

// Price Alert types
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

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'alert',
    title: 'Price Alert Triggered',
    message: 'Arjun Sharma reached your target price of ₹205',
    timestamp: '2026-02-23T10:30:00Z',
    read: false,
    athleteId: '1',
    athleteName: 'Arjun Sharma',
  },
  {
    id: 'notif-2',
    type: 'transaction',
    title: 'Transaction Successful',
    message: 'You bought 50 units of Arjun Sharma at ₹200/unit',
    timestamp: '2026-02-22T14:30:00Z',
    read: false,
    athleteId: '1',
    athleteName: 'Arjun Sharma',
  },
  {
    id: 'notif-3',
    type: 'update',
    title: 'Match Performance Update',
    message: 'Rohan Verma took 4 wickets in today\'s match vs Mumbai Indians',
    timestamp: '2026-02-22T18:45:00Z',
    read: true,
    athleteId: '3',
    athleteName: 'Rohan Verma',
  },
  {
    id: 'notif-4',
    type: 'alert',
    title: 'Price Drop Alert',
    message: 'Priya Nair dropped 5% - Now at ₹150',
    timestamp: '2026-02-21T16:20:00Z',
    read: true,
    athleteId: '2',
    athleteName: 'Priya Nair',
  },
  {
    id: 'notif-5',
    type: 'system',
    title: 'New Feature Available',
    message: 'Compare up to 3 athletes side-by-side with our new comparison tool!',
    timestamp: '2026-02-21T09:00:00Z',
    read: true,
  },
  {
    id: 'notif-6',
    type: 'update',
    title: 'Upcoming Match',
    message: 'Arjun Sharma plays against Punjab Kings tomorrow at Mumbai',
    timestamp: '2026-02-20T20:00:00Z',
    read: true,
    athleteId: '1',
    athleteName: 'Arjun Sharma',
  },
  {
    id: 'notif-7',
    type: 'transaction',
    title: 'Revenue Credited',
    message: 'You earned ₹280 from Arjun Sharma\'s recent endorsements',
    timestamp: '2026-02-20T12:00:00Z',
    read: true,
    athleteId: '1',
    athleteName: 'Arjun Sharma',
  },
  {
    id: 'notif-8',
    type: 'alert',
    title: 'Watchlist Update',
    message: 'Kavya Patel in your watchlist gained 3.5% today',
    timestamp: '2026-02-19T17:30:00Z',
    read: true,
    athleteId: '4',
    athleteName: 'Kavya Patel',
  },
  {
    id: 'notif-9',
    type: 'system',
    title: 'Maintenance Notice',
    message: 'Platform will be under maintenance on Feb 25, 2AM - 4AM IST',
    timestamp: '2026-02-19T10:00:00Z',
    read: true,
  },
  {
    id: 'notif-10',
    type: 'update',
    title: 'Season Milestone',
    message: 'Rohan Verma reached 100 career wickets in T20!',
    timestamp: '2026-02-18T15:45:00Z',
    read: true,
    athleteId: '3',
    athleteName: 'Rohan Verma',
  },
];

// Mock Price Alerts
export const mockPriceAlerts: PriceAlert[] = [
  {
    id: 'alert-1',
    athleteId: '1',
    athleteName: 'Arjun Sharma',
    athleteImage: 'https://images.unsplash.com/photo-1707549617870-e311a2274cd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBjcmlja2V0JTIwcGxheWVyJTIwbWFsZSUyMGF0aGxldGV8ZW58MXx8fHwxNzcxODQxMTYxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    condition: 'above',
    targetPrice: 210,
    currentPrice: 205,
    isActive: true,
    createdAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'alert-2',
    athleteId: '2',
    athleteName: 'Priya Nair',
    athleteImage: 'https://images.unsplash.com/photo-1546525848-3ce03ca516f6?w=400&h=400&fit=crop',
    condition: 'below',
    targetPrice: 140,
    currentPrice: 150,
    isActive: true,
    createdAt: '2026-02-19T14:30:00Z',
  },
  {
    id: 'alert-3',
    athleteId: '3',
    athleteName: 'Rohan Verma',
    athleteImage: 'https://images.unsplash.com/photo-1720799359504-102495aec122?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB5b3VuZyUyMG1hbGUlMjBhdGhsZXRlJTIwc3BvcnRzfGVufDF8fHx8MTc3MTg0MTE2MXww&ixlib=rb-4.1.0&q=80&w=1080',
    condition: 'change',
    changePercent: 5,
    currentPrice: 250,
    isActive: true,
    createdAt: '2026-02-18T09:00:00Z',
  },
  {
    id: 'alert-4',
    athleteId: '4',
    athleteName: 'Kavya Patel',
    athleteImage: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=400&fit=crop',
    condition: 'above',
    targetPrice: 185,
    currentPrice: 180,
    isActive: false,
    createdAt: '2026-02-15T11:20:00Z',
    triggeredAt: '2026-02-16T14:30:00Z',
  },
];