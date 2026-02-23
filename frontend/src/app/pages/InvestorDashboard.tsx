import { Link } from 'react-router';
import { mockInvestments, mockUser, calculatePortfolioValue, calculateTotalROI, mockAthletes } from '../data/mockData';
import { TrendingUp, Eye, ChevronRight, Plus, Menu, Search } from 'lucide-react';
import { Sparkline } from '../components/Sparkline';

export default function InvestorDashboard() {
  const portfolioValue = calculatePortfolioValue(mockInvestments);
  const totalInvested = mockInvestments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalROI = calculateTotalROI(mockInvestments);
  const totalGain = portfolioValue - totalInvested;

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

      {/* Portfolio Value */}
      <div className="px-4 py-6 border-b border-white/[0.08]">
        <div className="text-sm text-neutral-500 mb-2">Portfolio Value</div>
        <div className="text-4xl font-bold mb-1">₹{portfolioValue.toLocaleString()}</div>
        <div className="flex items-center gap-2">
          <div className={`text-sm font-medium ${totalGain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {totalGain >= 0 ? '+' : ''}₹{Math.abs(totalGain).toLocaleString()}
          </div>
          <div className="text-sm text-neutral-500">
            ({totalGain >= 0 ? '+' : ''}{totalROI.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
            <div className="text-xs text-neutral-500 mb-1">Invested</div>
            <div className="text-base font-semibold">₹{totalInvested.toLocaleString()}</div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
            <div className="text-xs text-neutral-500 mb-1">Holdings</div>
            <div className="text-base font-semibold">{mockInvestments.length}</div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
            <div className="text-xs text-neutral-500 mb-1">Revenue</div>
            <div className="text-base font-semibold text-emerald-500">
              ₹{mockInvestments.reduce((sum, inv) => sum + inv.revenueEarned, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Holdings</h2>
          <Link to="/portfolio">
            <button className="text-xs text-neutral-500 flex items-center gap-1">
              View all
              <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>

        <div className="space-y-0">
          {mockInvestments.map((investment) => {
            const athlete = mockAthletes.find((a) => a.id === investment.athleteId);
            const isGain = investment.roi >= 0;

            return (
              <Link key={investment.id} to={`/athlete/${investment.athleteId}`}>
                <div className="flex items-center justify-between py-3 border-b border-white/[0.05] active:bg-[#1a1a1a]/50 transition-colors">
                  {/* Left: Logo & Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1a1a1a] border border-white/[0.08] flex-shrink-0">
                      {athlete && (
                        <img
                          src={athlete.imageUrl}
                          alt={athlete.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{investment.athleteName}</div>
                      <div className="text-xs text-neutral-500">{investment.units} units</div>
                    </div>
                  </div>

                  {/* Center: Sparkline */}
                  <div className="flex-shrink-0 mx-3">
                    {athlete?.priceHistory && (
                      <Sparkline
                        data={athlete.priceHistory}
                        color={isGain ? '#10b981' : '#ef4444'}
                        width={60}
                        height={24}
                      />
                    )}
                  </div>

                  {/* Right: Value & Change */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-sm">₹{investment.currentValue.toLocaleString()}</div>
                    <div className={`text-xs font-medium ${isGain ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isGain ? '+' : ''}{investment.roi.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Trending Athletes */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Trending Athletes</h2>
          <Link to="/marketplace">
            <button className="text-xs text-neutral-500 flex items-center gap-1">
              View all
              <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {mockAthletes
            .filter((a) => Math.abs(a.priceChange24h) > 1)
            .slice(0, 4)
            .map((athlete) => {
              const isGain = athlete.priceChange24h >= 0;

              return (
                <Link key={athlete.id} to={`/athlete/${athlete.id}`}>
                  <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3 hover:border-white/[0.15] transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#1a1a1a] border border-white/[0.08]">
                        <img
                          src={athlete.imageUrl}
                          alt={athlete.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{athlete.name}</div>
                      </div>
                    </div>
                    <div className="mb-1">
                      <div className="text-base font-semibold">₹{athlete.pricePerUnit.toFixed(2)}</div>
                    </div>
                    <div className={`text-xs font-medium ${isGain ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isGain ? '+' : ''}{athlete.priceChange24h}%
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/[0.08] px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-around">
          <Link to="/dashboard" className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-[10px] text-white font-medium">Home</span>
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