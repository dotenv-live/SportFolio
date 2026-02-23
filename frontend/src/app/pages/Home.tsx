import { useState } from 'react';
import { Link } from 'react-router';
import { usePlayers, useHoldings, useNotifications } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { calculatePortfolioValue, calculateTotalROI } from '../data/types';
import { DashboardSkeleton } from '../components/skeletons';
import { Bell, Search, TrendingUp, ChevronRight } from 'lucide-react';
import { Sparkline } from '../components/Sparkline';
import { Input } from '../components/ui/input';
import AthleteMarketplace from './AthleteMarketplace';
import Watchlist from './Watchlist';
import Alerts from './Alerts';
import { BottomNavigation } from '../components/BottomNavigation';

type Tab = 'dashboard' | 'explore' | 'watchlist' | 'alerts';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { data: notifications = [] } = useNotifications();
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'explore', label: 'Explore' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'alerts', label: 'Alerts' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with Tab Navigation */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08]">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-base">Sports Folio</span>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </button>
            <Link to="/notifications">
              <button className="w-8 h-8 flex items-center justify-center relative">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            </Link>
            <Link to="/investor">
              <button className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-semibold text-sm">
                R
              </button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-0 overflow-x-auto scrollbar-hide px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-neutral-500'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pb-20">
        {activeTab === 'dashboard' && <DashboardContent />}
        {activeTab === 'explore' && <ExploreContent />}
        {activeTab === 'watchlist' && <WatchlistContent />}
        {activeTab === 'alerts' && <AlertsContent />}
      </div>

      <BottomNavigation currentPage="home" />
    </div>
  );
}

// Dashboard Content (without header - already in Home)
function DashboardContent() {
  const { data: investments, isLoading: loadingInv } = useHoldings();
  const { data: athletes, isLoading: loadingAth } = usePlayers();
  const { user } = useAuth();

  if (loadingInv || loadingAth || !investments || !athletes) return <DashboardSkeleton />;

  const portfolioValue = calculatePortfolioValue(investments);
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalROI = calculateTotalROI(investments);
  const totalGain = portfolioValue - totalInvested;

  return (
    <div>
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
            <div className="text-base font-semibold">{investments.length}</div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
            <div className="text-xs text-neutral-500 mb-1">Revenue</div>
            <div className="text-base font-semibold text-emerald-500">
              ₹{investments.reduce((sum, inv) => sum + inv.revenueEarned, 0).toLocaleString()}
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
          {investments.map((investment) => {
            const athlete = athletes.find((a) => a.id === investment.athleteId);
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
          {athletes
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
    </div>
  );
}

// Explore Content (without header)
function ExploreContent() {
  return (
    <div>
      <AthleteMarketplace hideHeader />
    </div>
  );
}

// Watchlist Content (without header)
function WatchlistContent() {
  return (
    <div>
      <Watchlist hideHeader />
    </div>
  );
}

// Alerts Content (without header)
function AlertsContent() {
  return (
    <div>
      <Alerts hideHeader />
    </div>
  );
}