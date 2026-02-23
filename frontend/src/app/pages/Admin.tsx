import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { 
  Users, TrendingUp, DollarSign, Activity, 
  Search, Bell, Settings, LogOut, UserCheck,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle
} from 'lucide-react';
import { AdminSkeleton } from '../components/skeletons';
import { usePlayers, useHoldings, useTransactions } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: athletes = [], isLoading: loadingAth } = usePlayers();
  const { data: investments = [], isLoading: loadingInv } = useHoldings();
  const { data: orders = [], isLoading: loadingOrd } = useTransactions(athletes);
  const { user } = useAuth();

  // Calculate platform metrics
  const isLoading = loadingAth || loadingInv || loadingOrd;
  const totalUsers = 1247; // Mock data
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalRevenue = totalInvestments * 0.01; // 1% platform fee
  const activeAthletes = athletes.filter(a => a.unitsAvailable > 0).length;
  const totalTransactions = orders.length;
  
  // Recent activity
  const recentActivity = [
    {
      id: 1,
      type: 'investment',
      user: 'Rajesh Kumar',
      action: 'bought 50 units of',
      athlete: 'Virat Kohli',
      amount: 25000,
      timestamp: '2 min ago',
      status: 'completed'
    },
    {
      id: 2,
      type: 'withdrawal',
      user: 'Priya Sharma',
      action: 'withdrew',
      amount: 15000,
      timestamp: '15 min ago',
      status: 'pending'
    },
    {
      id: 3,
      type: 'athlete',
      user: 'Admin',
      action: 'approved athlete',
      athlete: 'Shubman Gill',
      timestamp: '1 hour ago',
      status: 'completed'
    },
    {
      id: 4,
      type: 'investment',
      user: 'Amit Patel',
      action: 'sold 30 units of',
      athlete: 'Rohit Sharma',
      amount: 18000,
      timestamp: '2 hours ago',
      status: 'completed'
    },
  ];

  // Platform statistics for charts
  const weeklyStats = [
    { day: 'Mon', investments: 125000, users: 45 },
    { day: 'Tue', investments: 142000, users: 52 },
    { day: 'Wed', investments: 138000, users: 48 },
    { day: 'Thu', investments: 165000, users: 61 },
    { day: 'Fri', investments: 178000, users: 68 },
    { day: 'Sat', investments: 152000, users: 54 },
    { day: 'Sun', investments: 134000, users: 43 },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Admin Panel</h1>
            <p className="text-xs text-neutral-500">AGE Platform Management</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link to="/investor">
              <button className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex gap-6 border-b border-white/[0.08] overflow-x-auto">
          {['Overview', 'Athletes', 'Users', 'Transactions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.toLowerCase()
                  ? 'text-white'
                  : 'text-neutral-500'
              }`}
            >
              {tab}
              {activeTab === tab.toLowerCase() && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        isLoading ? <AdminSkeleton /> : (
        <div className="px-4 py-4 space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{totalUsers.toLocaleString()}</div>
              <div className="text-xs text-neutral-500 mb-2">Total Users</div>
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <ArrowUpRight className="w-3 h-3" />
                <span>+12.5% this week</span>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">₹{(totalInvestments / 1000).toFixed(0)}k</div>
              <div className="text-xs text-neutral-500 mb-2">Total Investments</div>
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <ArrowUpRight className="w-3 h-3" />
                <span>+8.3% this week</span>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">₹{(totalRevenue / 1000).toFixed(1)}k</div>
              <div className="text-xs text-neutral-500 mb-2">Platform Revenue</div>
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <ArrowUpRight className="w-3 h-3" />
                <span>+15.2% this week</span>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{activeAthletes}</div>
              <div className="text-xs text-neutral-500 mb-2">Active Athletes</div>
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <ArrowUpRight className="w-3 h-3" />
                <span>+3 this month</span>
              </div>
            </div>
          </div>

          {/* Weekly Performance Chart */}
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-4">Weekly Performance</h3>
            <div className="space-y-2">
              {weeklyStats.map((stat) => (
                <div key={stat.day} className="flex items-center gap-3">
                  <div className="w-10 text-xs text-neutral-500">{stat.day}</div>
                  <div className="flex-1">
                    <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500/50 to-emerald-500/20"
                        style={{ width: `${(stat.investments / 180000) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs font-medium w-16 text-right">
                    ₹{(stat.investments / 1000).toFixed(0)}k
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Recent Activity</h3>
              <button className="text-xs text-neutral-500 hover:text-white transition-colors">
                View all
              </button>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-white/[0.05] last:border-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'investment' ? 'bg-emerald-500/10' :
                    activity.type === 'withdrawal' ? 'bg-yellow-500/10' :
                    'bg-blue-500/10'
                  }`}>
                    {activity.type === 'investment' ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : activity.type === 'withdrawal' ? (
                      <DollarSign className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm mb-1">
                      <span className="font-medium">{activity.user}</span>{' '}
                      <span className="text-neutral-500">{activity.action}</span>{' '}
                      {activity.athlete && <span className="font-medium">{activity.athlete}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>{activity.timestamp}</span>
                      {activity.status === 'completed' && (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                  {activity.amount && (
                    <div className="text-sm font-semibold">
                      ₹{activity.amount.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/admin/athletes/add">
                <button className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-sm font-medium py-3 rounded-xl transition-colors">
                  Add Athlete
                </button>
              </Link>
              <Link to="/admin/users">
                <button className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-sm font-medium py-3 rounded-xl transition-colors">
                  Manage Users
                </button>
              </Link>
              <Link to="/admin/transactions">
                <button className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 text-sm font-medium py-3 rounded-xl transition-colors">
                  View Transactions
                </button>
              </Link>
              <Link to="/admin/settings">
                <button className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-sm font-medium py-3 rounded-xl transition-colors">
                  Platform Settings
                </button>
              </Link>
            </div>
          </div>
        </div>
        )
      )}

      {/* Athletes Tab */}
      {activeTab === 'athletes' && (
        <div className="px-4 py-4 space-y-4">
          {/* Search and Filter */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search athletes..."
                className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/[0.16]"
              />
            </div>
            <button className="bg-emerald-500 text-black font-semibold px-4 py-3 rounded-xl text-sm whitespace-nowrap">
              + Add New
            </button>
          </div>

          {/* Athletes List */}
          <div className="space-y-2">
            {athletes.map((athlete) => (
              <div key={athlete.id} className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                    <img src={athlete.imageUrl} alt={athlete.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">{athlete.name}</h4>
                        <p className="text-xs text-neutral-500">{athlete.role} • {athlete.sport}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-neutral-500">Price</div>
                        <div className="font-semibold">₹{athlete.pricePerUnit.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Available</div>
                        <div className="font-semibold">{athlete.unitsAvailable}</div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Score</div>
                        <div className="font-semibold">{athlete.performanceScore}/100</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
                  <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium py-2 rounded-lg transition-colors">
                    Suspend
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="px-4 py-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/[0.16]"
            />
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3 text-center">
              <div className="text-2xl font-bold mb-1">1,247</div>
              <div className="text-xs text-neutral-500">Total</div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-500 mb-1">1,198</div>
              <div className="text-xs text-neutral-500">Verified</div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-yellow-500 mb-1">49</div>
              <div className="text-xs text-neutral-500">Pending</div>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-2">
            {[
              { name: 'Rajesh Kumar', email: 'rajesh.k@email.com', invested: 125000, status: 'verified' },
              { name: 'Priya Sharma', email: 'priya.s@email.com', invested: 89000, status: 'verified' },
              { name: 'Amit Patel', email: 'amit.p@email.com', invested: 156000, status: 'pending' },
              { name: 'Sneha Reddy', email: 'sneha.r@email.com', invested: 67000, status: 'verified' },
            ].map((user, index) => (
              <div key={index} className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{user.name}</h4>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    user.status === 'verified' 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {user.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-neutral-500 mb-1">Total Invested</div>
                    <div className="font-semibold">₹{user.invested.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 mb-1">Joined</div>
                    <div className="font-semibold">Jan 2025</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
                  <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                    View Portfolio
                  </button>
                  <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="px-4 py-4 space-y-4">
          {/* Transaction Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
              <div className="text-xs text-neutral-500 mb-2">Total Volume</div>
              <div className="text-2xl font-bold">₹{(totalInvestments / 1000).toFixed(0)}k</div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
              <div className="text-xs text-neutral-500 mb-2">Transactions</div>
              <div className="text-2xl font-bold">{totalTransactions}</div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-2">
            {orders.map((order) => {
              const isBuy = order.type === 'BUY';
              return (
                <div key={order.id} className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{order.athleteName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          isBuy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {order.type}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {order.units} units @ ₹{order.pricePerUnit.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm mb-1">
                        ₹{order.totalAmount.toLocaleString()}
                      </div>
                      <span className={`text-xs ${
                        order.status === 'Completed' ? 'text-emerald-500' :
                        order.status === 'Pending' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {new Date(order.timestamp).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/[0.08] px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-around">
          <Link to="/admin" className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] text-white font-medium">Admin</span>
          </Link>
          <Link to="/marketplace" className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-neutral-500" />
            </div>
            <span className="text-[10px] text-neutral-500">Explore</span>
          </Link>
          <Link to="/portfolio" className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-[10px] text-neutral-500">Holdings</span>
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
