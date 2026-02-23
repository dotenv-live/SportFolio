import { useState } from 'react';
import { Link } from 'react-router';
import { Input } from '../components/ui/input';
import { mockAthletes } from '../data/mockData';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Sparkline } from '../components/Sparkline';

export default function AthleteMarketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('explore');
  const [showSearch, setShowSearch] = useState(false);

  const filteredAthletes = mockAthletes.filter((athlete) =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08]">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-base">Sports Folio</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className="w-8 h-8 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </button>
            <Link to="/investor">
              <button className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-semibold text-sm">
                R
              </button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.08]">
          {['Explore', 'Holdings', 'Orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
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

      {/* Search - Only show when search icon is clicked */}
      {showSearch && (
        <div className="px-4 py-3 sticky top-[97px] bg-black/95 backdrop-blur-sm z-40 border-b border-white/[0.08]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="Search athletes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#1a1a1a] border-0 h-10 text-sm placeholder:text-neutral-600"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <h2 className="text-sm font-medium mb-3">Recently viewed</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {filteredAthletes.slice(0, 5).map((athlete) => (
            <Link key={athlete.id} to={`/athlete/${athlete.id}`}>
              <div className="flex flex-col items-center gap-1.5 min-w-[68px]">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/[0.08]">
                  <img
                    src={athlete.imageUrl}
                    alt={athlete.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-medium truncate w-16">{athlete.name.split(' ')[0]}</div>
                  <div className={`text-[10px] ${athlete.priceChange24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {athlete.priceChange24h >= 0 ? '+' : ''}{athlete.priceChange24h}%
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div className="px-4 py-4">
        <h2 className="text-sm font-medium mb-3">Top Performers</h2>
        <div className="space-y-0">
          {filteredAthletes.map((athlete) => {
            const isGain = athlete.priceChange24h >= 0;
            const changeColor = isGain ? 'text-emerald-500' : 'text-red-500';

            return (
              <Link key={athlete.id} to={`/athlete/${athlete.id}`}>
                <div className="flex items-center justify-between py-3 border-b border-white/[0.05] active:bg-[#1a1a1a]/50 transition-colors">
                  {/* Left: Logo & Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1a1a1a] border border-white/[0.08] flex-shrink-0">
                      <img
                        src={athlete.imageUrl}
                        alt={athlete.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{athlete.name}</div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                        <span>{athlete.role}</span>
                        {athlete.performanceScore > 85 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                            In news
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Sparkline */}
                  <div className="flex-shrink-0 mx-3">
                    {athlete.priceHistory && (
                      <Sparkline
                        data={athlete.priceHistory}
                        color={isGain ? '#10b981' : '#ef4444'}
                        width={60}
                        height={24}
                      />
                    )}
                  </div>

                  {/* Right: Price & Change */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-sm">₹{athlete.pricePerUnit.toFixed(2)}</div>
                    <div className={`text-xs font-medium ${changeColor}`}>
                      {isGain ? '+' : ''}₹{Math.abs(athlete.pricePerUnit * athlete.priceChange24h / 100).toFixed(2)} ({isGain ? '+' : ''}{athlete.priceChange24h}%)
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Featured Section */}
      <div className="px-4 py-4 border-t border-white/[0.08]">
        <h2 className="text-sm font-medium mb-3">High Growth Potential</h2>
        <div className="grid grid-cols-2 gap-3">
          {filteredAthletes
            .filter((a) => a.riskTier === 'High')
            .slice(0, 4)
            .map((athlete) => (
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
                  <div className={`text-xs font-medium ${athlete.priceChange24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {athlete.priceChange24h >= 0 ? '+' : ''}₹{Math.abs(athlete.pricePerUnit * athlete.priceChange24h / 100).toFixed(2)} ({athlete.growthRate}%)
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>

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
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] text-white font-medium">Explore</span>
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

      {/* Bottom spacing for navigation */}
      <div className="h-20" />
    </div>
  );
}