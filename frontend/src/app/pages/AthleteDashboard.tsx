import { Link } from 'react-router';
import { Settings, Bell, TrendingUp, Calendar, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts';

export default function AthleteDashboard() {
  // Mock athlete data (simulating logged-in athlete as Arjun Sharma)
  const athleteData = {
    name: 'Arjun Sharma',
    sport: 'Cricket',
    role: 'Batsman',
    totalRaise: 100000,
    fundsRaised: 65000,
    unitsSold: 325,
    revenueShare: 10,
    duration: 5,
    activeInvestors: 28,
    nextPayoutDate: 'Mar 15, 2026',
    upcomingRevenue: 15000,
    deductionAmount: 1500,
  };

  const fundingProgress = (athleteData.fundsRaised / athleteData.totalRaise) * 100;

  // Mock revenue timeline
  const revenueTimeline = [
    { month: 'Sep', earnings: 12000, deduction: 1200 },
    { month: 'Oct', earnings: 14500, deduction: 1450 },
    { month: 'Nov', earnings: 13800, deduction: 1380 },
    { month: 'Dec', earnings: 16200, deduction: 1620 },
    { month: 'Jan', earnings: 15600, deduction: 1560 },
    { month: 'Feb', earnings: 18400, deduction: 1840 },
  ];

  // Mock investor list
  const topInvestors = [
    { name: 'Rahul Kumar', units: 50, invested: 10000 },
    { name: 'Priya Singh', units: 40, invested: 8000 },
    { name: 'Amit Patel', units: 35, invested: 7000 },
    { name: 'Neha Sharma', units: 30, invested: 6000 },
    { name: 'Vijay Reddy', units: 25, invested: 5000 },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-base">Sports Folio</span>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></div>
            </button>
            <button className="w-8 h-8 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-4 py-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-2xl font-bold text-white">
              {athleteData.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-0.5">{athleteData.name}</h1>
            <div className="text-sm text-neutral-400">{athleteData.role} • {athleteData.sport}</div>
          </div>
          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <span className="text-xs text-emerald-500 font-medium">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-400">Campaign Performance</h2>
          <span className="text-xs text-emerald-500">{fundingProgress.toFixed(0)}% funded</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
              style={{ width: `${fundingProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">₹{(athleteData.fundsRaised / 1000).toFixed(0)}k raised</span>
            <span className="text-neutral-500">₹{(athleteData.totalRaise / 1000).toFixed(0)}k goal</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Users className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Investors</span>
            </div>
            <div className="text-xl font-bold">{athleteData.activeInvestors}</div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Units</span>
            </div>
            <div className="text-xl font-bold">{athleteData.unitsSold}</div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Duration</span>
            </div>
            <div className="text-xl font-bold">{athleteData.duration}y</div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="px-4 py-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-400">Revenue Overview</h2>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-neutral-500">Earnings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-neutral-500">Share</span>
            </div>
          </div>
        </div>
        
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-lg p-4">
          <div className="h-40 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTimeline}>
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="deductionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  stroke="#404040" 
                  style={{ fontSize: '10px' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#earningsGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="deduction"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fill="url(#deductionGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/50 rounded-lg p-2.5">
              <div className="text-[10px] text-neutral-500 mb-1">Last Month</div>
              <div className="text-base font-bold text-emerald-500">₹{(revenueTimeline[revenueTimeline.length - 1].earnings / 1000).toFixed(1)}k</div>
            </div>
            <div className="bg-black/50 rounded-lg p-2.5">
              <div className="text-[10px] text-neutral-500 mb-1">Share Paid</div>
              <div className="text-base font-bold text-red-500">₹{(revenueTimeline[revenueTimeline.length - 1].deduction / 1000).toFixed(1)}k</div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Payout */}
      <div className="px-4 py-4 border-t border-white/[0.08]">
        <h2 className="text-sm font-medium text-neutral-400 mb-3">Next Payout</h2>
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-medium">Revenue Deduction</div>
                <div className="text-xs text-neutral-500">{athleteData.nextPayoutDate}</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/[0.05]">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wide mb-1.5">Expected</div>
              <div className="text-lg font-bold text-emerald-500">₹{(athleteData.upcomingRevenue / 1000).toFixed(1)}k</div>
            </div>
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/[0.05]">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wide mb-1.5">To Investors</div>
              <div className="text-lg font-bold text-red-400">-₹{(athleteData.deductionAmount / 1000).toFixed(1)}k</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Investors */}
      <div className="px-4 py-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-400">Top Investors</h2>
          <button className="text-xs text-emerald-500">View All</button>
        </div>
        <div className="space-y-0">
          {topInvestors.map((investor, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-white/[0.05]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/[0.08] flex items-center justify-center">
                  <span className="text-xs font-semibold text-neutral-400">#{index + 1}</span>
                </div>
                <div>
                  <div className="text-sm font-medium">{investor.name}</div>
                  <div className="text-xs text-neutral-500">{investor.units} units</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">₹{(investor.invested / 1000).toFixed(1)}k</div>
                <div className="text-xs text-neutral-500">{((investor.invested / athleteData.fundsRaised) * 100).toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contract Details */}
      <div className="px-4 py-4 border-t border-white/[0.08] pb-24">
        <h2 className="text-sm font-medium text-neutral-400 mb-3">Contract Terms</h2>
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-lg divide-y divide-white/[0.05]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-neutral-400">Revenue Share</span>
            <span className="text-sm font-semibold">{athleteData.revenueShare}%</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-neutral-400">Contract Duration</span>
            <span className="text-sm font-semibold">{athleteData.duration} years</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-neutral-400">Total Goal</span>
            <span className="text-sm font-semibold">₹{(athleteData.totalRaise / 1000).toFixed(0)}k</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-neutral-400">Status</span>
            <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-500 font-medium">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/[0.08] px-4 py-3 safe-area-bottom">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex-1">
            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/[0.08] text-white font-medium py-3 rounded-lg transition-colors text-sm">
              Back to Home
            </button>
          </Link>
          <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition-colors text-sm">
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}
