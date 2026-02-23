import { useState } from 'react';
import { Link } from 'react-router';
import { Input } from '../components/ui/input';
import { mockAthletes, mockNotifications } from '../data/mockData';
import { Search, TrendingUp, TrendingDown, Bell } from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';

interface AthleteMarketplaceProps {
  hideHeader?: boolean;
}

export default function AthleteMarketplace({ hideHeader = false }: AthleteMarketplaceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const unreadNotifications = mockNotifications.filter(n => !n.read).length;

  const filteredAthletes = mockAthletes.filter((athlete) =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Curated sections
  const topGainers = [...mockAthletes]
    .sort((a, b) => b.priceChange24h - a.priceChange24h)
    .slice(0, 6);

  const topLosers = [...mockAthletes]
    .sort((a, b) => a.priceChange24h - b.priceChange24h)
    .slice(0, 6);

  const topPerformers = [...mockAthletes]
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 6);

  const highGrowthPotential = mockAthletes
    .filter(a => a.riskTier === 'High')
    .slice(0, 6);

  const stableInvestments = mockAthletes
    .filter(a => a.riskTier === 'Low')
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      {!hideHeader && (
        <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08]">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-base">Explore</span>
            <div className="flex items-center gap-2">
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

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="Search athletes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#1a1a1a] border-0 h-10 text-sm placeholder:text-neutral-600"
              />
            </div>
          </div>
        </div>
      )}

      {searchTerm ? (
        /* Search Results */
        <div className="px-4 py-4">
          <h2 className="text-sm font-semibold mb-3 text-neutral-400">
            {filteredAthletes.length} {filteredAthletes.length === 1 ? 'Result' : 'Results'}
          </h2>
          {filteredAthletes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500">No athletes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredAthletes.map((athlete) => (
                <AthleteCard key={athlete.id} athlete={athlete} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Curated Sections */
        <div className="py-4">
          {/* Trending Athletes */}
          <HorizontalSection title="Trending Athletes" athletes={topGainers} />

          {/* Top Gainers */}
          <HorizontalSection title="Top Gainers" athletes={topGainers} />

          {/* Top Performance */}
          <HorizontalSection title="Top Performance" athletes={topPerformers} />

          {/* High Growth Potential */}
          <HorizontalSection title="High Growth Potential" athletes={highGrowthPotential} />

          {/* Stable Investments */}
          <HorizontalSection title="Stable Investments" athletes={stableInvestments} />

          {/* Top Losers */}
          <HorizontalSection title="Top Losers" athletes={topLosers} />
        </div>
      )}

      <BottomNavigation currentPage="marketplace" />
    </div>
  );
}

// Horizontal Scrolling Section
function HorizontalSection({ title, athletes }: { title: string; athletes: any[] }) {
  return (
    <div className="mb-6">
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <button className="text-xs text-neutral-500">View all →</button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
        {athletes.map((athlete) => (
          <AthleteCard key={athlete.id} athlete={athlete} />
        ))}
      </div>
    </div>
  );
}

// Athlete Card Component
function AthleteCard({ athlete }: { athlete: any }) {
  const isGain = athlete.priceChange24h >= 0;
  const changeColor = isGain ? 'text-emerald-500' : 'text-red-500';

  return (
    <Link to={`/athlete/${athlete.id}`}>
      <div className="w-[140px] bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-3 hover:border-white/[0.15] transition-colors flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#1a1a1a] border border-white/[0.08]">
            <img
              src={athlete.imageUrl}
              alt={athlete.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{athlete.name}</div>
          </div>
        </div>
        <div className="mb-1">
          <div className="text-base font-bold">₹{athlete.pricePerUnit.toFixed(2)}</div>
        </div>
        <div className={`text-xs font-medium ${changeColor}`}>
          {isGain ? '+' : ''}{athlete.priceChange24h}%
        </div>
      </div>
    </Link>
  );
}