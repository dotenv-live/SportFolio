import { Link } from 'react-router';
import { useState } from 'react';
import { calculatePortfolioValue, calculateTotalROI } from '../data/types';
import { AnalyticsSkeleton } from '../components/skeletons';
import { useHoldings, useTransactions, usePlayers } from '../hooks/useApi';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('20M');
  const { data: investments = [], isLoading: loadingInv } = useHoldings();
  const { data: athletes = [], isLoading: loadingAth } = usePlayers();
  const { data: orders = [] } = useTransactions(athletes);

  const isLoading = loadingInv || loadingAth;
  
  const portfolioValue = calculatePortfolioValue(investments);
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalROI = calculateTotalROI(investments);
  const totalGain = portfolioValue - totalInvested;
  const totalRevenue = investments.reduce((sum, inv) => sum + inv.revenueEarned, 0);

  // Portfolio growth data (match-based)
  const portfolioGrowthData = [
    { match: 1, value: 25100 },
    { match: 3, value: 26200 },
    { match: 5, value: 25800 },
    { match: 7, value: 27100 },
    { match: 9, value: 26900 },
    { match: 11, value: 27800 },
    { match: 13, value: 28400 },
    { match: 15, value: 28100 },
    { match: 17, value: 29200 },
    { match: 20, value: 29870 },
  ];

  // Holdings performance
  const holdingsPerformance = investments.map((inv) => ({
    name: inv.athleteName.split(' ')[0],
    roi: inv.roi,
    value: inv.currentValue,
  })).sort((a, b) => b.roi - a.roi);

  // Revenue tracking
  const revenueData = [
    { match: 1, revenue: 0 },
    { match: 5, revenue: 120 },
    { match: 10, revenue: 450 },
    { match: 15, revenue: 890 },
    { match: 20, revenue: 1280 },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white/[0.15] rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs text-neutral-400 mb-1">Match {label}</p>
          <p className="text-sm font-semibold text-white">
            ₹{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomRevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white/[0.15] rounded-lg px-3 py-2 shadow-xl">
          <p className="text-xs text-neutral-400 mb-1">Match {label}</p>
          <p className="text-sm font-semibold text-emerald-500">
            +₹{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/portfolio">
            <button className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <span className="font-semibold text-base">Analytics</span>
        </div>
      </div>

      {isLoading ? <AnalyticsSkeleton /> : (
      <>
      {/* Portfolio Overview */}
      <div className="px-4 py-6">
        <div className="mb-2 text-xs text-neutral-500 uppercase tracking-wider">Portfolio Value</div>
        <div className="flex items-end gap-3 mb-6">
          <div className="text-4xl font-bold">₹{portfolioValue.toLocaleString()}</div>
          <div className={`flex items-center gap-1 mb-1 ${totalGain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {totalGain >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            <span className="text-lg font-semibold">
              {totalGain >= 0 ? '+' : ''}{totalROI.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
            <div className="text-xs text-neutral-500 mb-1">Invested</div>
            <div className="text-base font-bold">₹{(totalInvested / 1000).toFixed(0)}k</div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
            <div className="text-xs text-neutral-500 mb-1">Revenue</div>
            <div className="text-base font-bold text-emerald-500">₹{(totalRevenue / 1000).toFixed(1)}k</div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
            <div className="text-xs text-neutral-500 mb-1">Holdings</div>
            <div className="text-base font-bold">{investments.length}</div>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-1">
          {['1M', '5M', '20M', 'ALL'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                timeRange === range
                  ? 'bg-white text-black'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Growth Chart */}
      <div className="px-4 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Portfolio Growth</h3>
          <div className="text-xs text-neutral-500">Last 20 matches</div>
        </div>
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4 overflow-hidden">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={portfolioGrowthData}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis 
                dataKey="match" 
                stroke="#666" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdings Performance */}
      <div className="px-4 pb-6">
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Top Holdings</h3>
        </div>
        <div className="space-y-2">
          {holdingsPerformance.slice(0, 5).map((holding, index) => {
            const isGain = holding.roi >= 0;
            return (
              <div 
                key={holding.name}
                className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-neutral-500">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-0.5">{holding.name}</div>
                    <div className="text-xs text-neutral-500">₹{holding.value.toLocaleString()}</div>
                  </div>
                </div>
                <div className={`text-right ${isGain ? 'text-emerald-500' : 'text-red-500'}`}>
                  <div className="text-base font-bold">
                    {isGain ? '+' : ''}{holding.roi.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Earned Chart */}
      <div className="px-4 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Revenue Earned</h3>
          <div className="text-xs text-emerald-500 font-semibold">+₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4 overflow-hidden">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis 
                dataKey="match" 
                stroke="#666" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip content={<CustomRevenueTooltip />} cursor={{ stroke: '#333', strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="px-4 pb-6">
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Performance Breakdown</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Best Performer */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <div className="text-xs text-emerald-500 mb-2 uppercase tracking-wider font-semibold">Best</div>
            <div className="text-base font-bold mb-1">Arjun Sharma</div>
            <div className="text-2xl font-bold text-emerald-500">+25.0%</div>
          </div>

          {/* Worst Performer */}
          <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-xl p-4">
            <div className="text-xs text-red-500 mb-2 uppercase tracking-wider font-semibold">Worst</div>
            <div className="text-base font-bold mb-1">Priya Nair</div>
            <div className="text-2xl font-bold text-red-500">-15.0%</div>
          </div>

          {/* Avg ROI */}
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
            <div className="text-xs text-neutral-500 mb-2">Average ROI</div>
            <div className={`text-2xl font-bold ${totalROI >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {totalROI >= 0 ? '+' : ''}{totalROI.toFixed(1)}%
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
            <div className="text-xs text-neutral-500 mb-2">Total Orders</div>
            <div className="text-2xl font-bold">{orders.length}</div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="px-4 pb-6">
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Recent Activity</h3>
        </div>
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl divide-y divide-white/[0.05]">
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium mb-1">Buy Orders</div>
              <div className="text-xs text-neutral-500">Last 30 days</div>
            </div>
            <div className="text-2xl font-bold text-emerald-500">
              {orders.filter(o => o.type === 'BUY').length}
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium mb-1">Sell Orders</div>
              <div className="text-xs text-neutral-500">Last 30 days</div>
            </div>
            <div className="text-2xl font-bold text-red-500">
              {orders.filter(o => o.type === 'SELL').length}
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium mb-1">Success Rate</div>
              <div className="text-xs text-neutral-500">Completed orders</div>
            </div>
            <div className="text-2xl font-bold">
              {((orders.filter(o => o.status === 'Completed').length / orders.length) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/[0.08] px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-around">
          <Link to="/dashboard" className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-[10px] text-neutral-500">Home</span>
          </Link>
          <Link to="/marketplace" className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-neutral-500" />
            </div>
            <span className="text-[10px] text-neutral-500">Explore</span>
          </Link>
          <Link to="/portfolio" className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-[10px] text-white font-medium">Holdings</span>
          </Link>
          <Link to="/investor" className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-[10px] text-neutral-500">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
