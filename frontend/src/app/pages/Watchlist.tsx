import { useState } from 'react';
import { Link } from 'react-router';
import { usePlayers, useNotifications } from '../hooks/useApi';
import { ArrowLeft, TrendingUp, TrendingDown, Star, Bell, Plus, X, Search } from 'lucide-react';
import { Sparkline } from '../components/Sparkline';
import { BottomNavigation } from '../components/BottomNavigation';
import { toast } from 'sonner';

interface WatchlistProps {
  hideHeader?: boolean;
}

export default function Watchlist({ hideHeader = false }: WatchlistProps) {
  const { data: allAthletes = [] } = usePlayers();
  const [watchlistedAthletes, setWatchlistedAthletes] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Initialize watchlist from athlete data (ones marked as watchlisted)
  if (!initialized && allAthletes.length > 0) {
    setWatchlistedAthletes(allAthletes.filter(a => a.isWatchlisted).map(a => a.id));
    setInitialized(true);
  }

  const watchlistData = allAthletes.filter(a => watchlistedAthletes.includes(a.id));

  const [searchQuery, setSearchQuery] = useState('');

  // Filter by search query
  const filteredAthletes = watchlistData.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveFromWatchlist = (athleteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWatchlistedAthletes(watchlistedAthletes.filter(id => id !== athleteId));
    toast.success('Removed from watchlist');
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      {!hideHeader && (
        <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-bold text-lg">Watchlist</h1>
              <p className="text-xs text-neutral-500">{watchlistData.length} athletes</p>
            </div>
            <Link to="/marketplace">
              <button className="text-sm text-emerald-500 font-medium">
                + Add More
              </button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search watchlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/[0.16]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Watchlist Content */}
      <div className="px-4 py-4">
        {filteredAthletes.length === 0 ? (
          <div className="text-center py-20">
            {searchQuery ? (
              <>
                <div className="text-neutral-500 mb-2">No results found</div>
                <div className="text-sm text-neutral-600">Try different search terms</div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-neutral-600" />
                </div>
                <div className="text-neutral-500 mb-2">Your watchlist is empty</div>
                <div className="text-sm text-neutral-600 mb-6">
                  Add athletes to track their performance
                </div>
                <Link to="/marketplace">
                  <button className="bg-emerald-500 text-black font-semibold px-6 py-3 rounded-xl">
                    Explore Athletes
                  </button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-0">
            {filteredAthletes.map((athlete) => {
              const isGain = athlete.priceChange24h >= 0;

              return (
                <Link key={athlete.id} to={`/athlete/${athlete.id}`}>
                  <div className="py-4 border-b border-white/[0.05] active:bg-white/[0.02] transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Athlete Image */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                        <img
                          src={athlete.imageUrl}
                          alt={athlete.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Athlete Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm mb-0.5">{athlete.name}</h3>
                            <p className="text-xs text-neutral-500">
                              {athlete.role} • Score: {athlete.performanceScore}/100
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleRemoveFromWatchlist(athlete.id, e)}
                            className="ml-2 flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          </button>
                        </div>

                        <div className="flex items-end justify-between mt-2">
                          {/* Price & Change */}
                          <div>
                            <div className="font-bold text-base mb-0.5">
                              ₹{athlete.pricePerUnit.toFixed(2)}
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium ${
                              isGain ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                              {isGain ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {isGain ? '+' : ''}{athlete.priceChange24h}%
                            </div>
                          </div>

                          {/* Sparkline */}
                          <div className="flex-shrink-0">
                            {athlete.priceHistory && (
                              <Sparkline
                                data={athlete.priceHistory}
                                color={isGain ? '#10b981' : '#ef4444'}
                                width={80}
                                height={32}
                              />
                            )}
                          </div>
                        </div>

                        {/* Risk Badge */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            athlete.riskTier === 'Low' ? 'bg-emerald-500/10 text-emerald-500' :
                            athlete.riskTier === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {athlete.riskTier} Risk
                          </span>
                          <span className="text-xs text-neutral-500">
                            {athlete.unitsAvailable} units available
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation unreadNotifications={unreadNotifications} />
    </div>
  );
}