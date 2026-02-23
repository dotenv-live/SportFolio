import { Link } from 'react-router';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { calculatePortfolioValue, calculateTotalROI } from '../data/types';
import { PortfolioSkeleton } from '../components/skeletons';
import { useHoldings, useTransactions, usePlayers, useNotifications } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Search, Eye, EyeOff, BarChart3, Clock, CheckCircle, XCircle, ArrowUpDown, Bell } from 'lucide-react';
import { Sparkline } from '../components/Sparkline';
import { BottomNavigation } from '../components/BottomNavigation';

type SortOption = 'name' | 'value' | 'returns' | 'invested';

export default function Portfolio() {
  const { data: investments = [], isLoading: loadingHoldings } = useHoldings();
  const { data: athletes = [], isLoading: loadingAthletes } = usePlayers();
  const { data: orders = [] } = useTransactions(athletes);
  const { data: notifications = [] } = useNotifications();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('holdings');
  const [hideValues, setHideValues] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('value');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Calculate portfolio metrics
  const portfolioValue = calculatePortfolioValue(investments);
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalROI = calculateTotalROI(investments);
  const totalGain = portfolioValue - totalInvested;

  // Sort holdings
  const getSortedInvestments = () => {
    const sorted = [...investments];
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.athleteName.localeCompare(b.athleteName));
      case 'value':
        return sorted.sort((a, b) => b.currentValue - a.currentValue);
      case 'returns':
        return sorted.sort((a, b) => b.roi - a.roi);
      case 'invested':
        return sorted.sort((a, b) => b.investedAmount - a.investedAmount);
      default:
        return sorted;
    }
  };

  const sortedInvestments = getSortedInvestments();

  const getSortLabel = () => {
    switch (sortBy) {
      case 'name':
        return 'Name (A-Z)';
      case 'value':
        return 'Current value';
      case 'returns':
        return 'Returns (%)';
      case 'invested':
        return 'Invested amount';
      default:
        return 'Current value';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-base">Sports Folio</span>
          <div className="flex items-center gap-2">
            <Link to="/marketplace">
              <button className="w-8 h-8 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </button>
            </Link>
            <Link to="/investor">
              <button className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-semibold text-sm">
                {(user?.name ?? 'U').charAt(0)}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex gap-6 border-b border-white/[0.08]">
          {['Holdings', 'Positions', 'Orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-3 text-sm font-medium transition-colors relative ${
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

      {/* Holdings Tab Content */}
      {activeTab === 'holdings' && (
        loadingHoldings || loadingAthletes ? <PortfolioSkeleton /> : (
        <>
          {/* Portfolio Summary Card */}
          <div className="px-4 py-4">
            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">
                    Holdings ({investments.length})
                  </div>
                  <div className="text-3xl font-bold mb-2">
                    {hideValues ? '• • • • •' : `₹${portfolioValue.toLocaleString()}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setHideValues(!hideValues)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {hideValues ? (
                      <EyeOff className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                  <Link to="/analytics">
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors">
                      <BarChart3 className="w-4 h-4 text-neutral-400" />
                    </button>
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Total returns</span>
                  <span className={`text-sm font-medium ${totalGain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {hideValues ? '• • • • •' : (
                      <>
                        {totalGain >= 0 ? '+' : ''}₹{Math.abs(totalGain).toLocaleString()} ({totalROI.toFixed(2)}%)
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Invested</span>
                  <span className="text-sm font-medium">
                    {hideValues ? '• • • • •' : `₹${totalInvested.toLocaleString()}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="px-4 py-2 flex items-center justify-between">
            <button 
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="text-sm text-neutral-400 flex items-center gap-1 hover:text-white transition-colors"
            >
              <span className="border-b border-dashed border-neutral-600">Sort</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <span className="text-sm text-neutral-400">
              {getSortLabel()}
            </span>
          </div>

          {/* Sort Menu */}
          <AnimatePresence>
            {showSortMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSortMenu(false)}
                  className="fixed inset-0 bg-black/60 z-40"
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/[0.08] rounded-t-3xl z-50 p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-bold">Sort by</h3>
                  </div>
                  <div className="space-y-2">
                    {[
                      { key: 'value' as SortOption, label: 'Current value' },
                      { key: 'returns' as SortOption, label: 'Returns (%)' },
                      { key: 'invested' as SortOption, label: 'Invested amount' },
                      { key: 'name' as SortOption, label: 'Name (A-Z)' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        onClick={() => {
                          setSortBy(option.key);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                          sortBy === option.key
                            ? 'bg-white/10 text-white'
                            : 'hover:bg-white/5 text-neutral-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Holdings List */}
          <div className="px-4 pb-4">
            <div className="space-y-0">
              {sortedInvestments.map((investment) => {
                const athlete = athletes.find((a) => a.id === investment.athleteId);
                const isGain = investment.roi >= 0;
                const gainLoss = investment.currentValue - investment.investedAmount;

                return (
                  <Link key={investment.id} to={`/athlete/${investment.athleteId}`}>
                    <div className="py-3 border-b border-white/[0.05] active:bg-white/[0.02] transition-colors">
                      <div className="flex items-center justify-between">
                        {/* Left: Name & Units */}
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-0.5">{investment.athleteName}</div>
                          <div className="text-xs text-neutral-500">
                            {hideValues ? '• • • • •' : `${investment.units} shares`}
                          </div>
                        </div>

                        {/* Center: Sparkline */}
                        <div className="flex-shrink-0 mx-4">
                          {athlete?.priceHistory && (
                            <Sparkline
                              data={athlete.priceHistory}
                              color={isGain ? '#10b981' : '#ef4444'}
                              width={70}
                              height={28}
                            />
                          )}
                        </div>

                        {/* Right: Value & Gain/Loss */}
                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-sm mb-0.5">
                            {hideValues ? '• • • • •' : `₹${investment.currentValue.toLocaleString()}`}
                          </div>
                          <div className={`text-xs font-medium ${isGain ? 'text-emerald-500' : 'text-red-500'}`}>
                            {hideValues ? '• • • • •' : `${isGain ? '+' : ''}₹${Math.abs(gainLoss).toLocaleString()}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
        )
      )}

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <div className="px-4 py-12 text-center">
          <div className="text-neutral-500 text-sm">No open positions</div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="px-4 py-4">
          <div className="space-y-0">
            {orders.map((order) => {
              const isBuy = order.type === 'BUY';
              const athlete = athletes.find((a) => a.id === order.athleteId);
              const orderDate = new Date(order.timestamp);
              const formattedDate = orderDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={order.id} className="py-3 border-b border-white/[0.05]">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{order.athleteName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          isBuy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {order.type}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {formattedDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        {order.status === 'Completed' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        {order.status === 'Pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                        {order.status === 'Failed' && <XCircle className="w-4 h-4 text-red-500" />}
                        <span className={`text-xs font-medium ${
                          order.status === 'Completed' ? 'text-emerald-500' :
                          order.status === 'Pending' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">{order.units} units @ ₹{order.pricePerUnit.toFixed(2)}</span>
                    <span className="font-medium">₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}