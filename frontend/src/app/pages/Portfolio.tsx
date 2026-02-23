import { Link } from 'react-router';
import { useState } from 'react';
import { mockInvestments, mockAthletes, mockUser, calculatePortfolioValue, calculateTotalROI } from '../data/mockData';
import { TrendingUp, Search, Eye, BarChart3, MoreVertical } from 'lucide-react';
import { Sparkline } from '../components/Sparkline';

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState('holdings');
  
  // Calculate portfolio metrics
  const portfolioValue = calculatePortfolioValue(mockInvestments);
  const totalInvested = mockInvestments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalROI = calculateTotalROI(mockInvestments);
  const totalGain = portfolioValue - totalInvested;
  const oneDayReturns = -2340; // Mock 1-day returns

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
                {mockUser.name.charAt(0)}
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
        <>
          {/* Portfolio Summary Card */}
          <div className="px-4 py-4">
            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">
                    Holdings ({mockInvestments.length})
                  </div>
                  <div className="text-3xl font-bold mb-2">₹{portfolioValue.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors">
                    <Eye className="w-4 h-4 text-neutral-400" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors">
                    <BarChart3 className="w-4 h-4 text-neutral-400" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">1D returns</span>
                  <span className={`text-sm font-medium ${oneDayReturns >= 0 ? 'text-red-500' : 'text-red-500'}`}>
                    {oneDayReturns >= 0 ? '-' : '-'}₹{Math.abs(oneDayReturns).toLocaleString()} ({(oneDayReturns / portfolioValue * 100).toFixed(2)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Total returns</span>
                  <span className={`text-sm font-medium ${totalGain >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {totalGain >= 0 ? '-' : ''}₹{Math.abs(totalGain).toLocaleString()} ({totalROI.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Invested</span>
                  <span className="text-sm font-medium">₹{totalInvested.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="px-4 py-2 flex items-center justify-between">
            <button className="text-sm text-neutral-400 flex items-center gap-1">
              <span className="border-b border-dashed border-neutral-600">Sort</span>
            </button>
            <button className="text-sm text-neutral-400 flex items-center gap-1">
              <span className="border-b border-dashed border-neutral-600">Current (invested)</span>
            </button>
          </div>

          {/* Holdings List */}
          <div className="px-4 pb-4">
            <div className="space-y-0">
              {mockInvestments.map((investment) => {
                const athlete = mockAthletes.find((a) => a.id === investment.athleteId);
                const isGain = investment.roi >= 0;
                const gainLoss = investment.currentValue - investment.investedAmount;

                return (
                  <Link key={investment.id} to={`/athlete/${investment.athleteId}`}>
                    <div className="py-3 border-b border-white/[0.05] active:bg-white/[0.02] transition-colors">
                      <div className="flex items-center justify-between">
                        {/* Left: Name & Units */}
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-0.5">{investment.athleteName}</div>
                          <div className="text-xs text-neutral-500">{investment.units} shares</div>
                        </div>

                        {/* Center: Sparkline */}
                        <div className="flex-shrink-0 mx-4">
                          {athlete?.priceHistory && (
                            <Sparkline
                              data={athlete.priceHistory}
                              color={isGain ? '#ef4444' : '#10b981'}
                              width={70}
                              height={28}
                            />
                          )}
                        </div>

                        {/* Right: Value & Gain/Loss */}
                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-sm mb-0.5">
                            ₹{investment.currentValue.toLocaleString()}
                          </div>
                          <div className={`text-xs font-medium ${isGain ? 'text-emerald-500' : 'text-red-500'}`}>
                            ({isGain ? '+' : ''}₹{Math.abs(gainLoss).toLocaleString()})
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
      )}

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <div className="px-4 py-12 text-center">
          <div className="text-neutral-500 text-sm">No open positions</div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="px-4 py-12 text-center">
          <div className="text-neutral-500 text-sm">No recent orders</div>
        </div>
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