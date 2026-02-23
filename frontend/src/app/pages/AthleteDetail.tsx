import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { mockAthletes } from '../data/mockData';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Plus, ChevronDown, Calendar, Info } from 'lucide-react';
import { ResponsiveContainer, Area, AreaChart, Tooltip, XAxis } from 'recharts';
import { toast } from 'sonner';

// Custom Tooltip Component for Match-based Chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-lg p-3 shadow-lg backdrop-blur-sm">
        <div className="text-xs text-neutral-500 mb-1">{data.opponent}</div>
        <div className="text-2xl font-bold mb-1">₹{data.price.toFixed(2)}</div>
        <div className={`text-xs font-medium ${data.priceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {data.priceChange >= 0 ? '+' : ''}{data.priceChange}%
        </div>
        <div className="text-xs text-neutral-500 mt-1">{data.performance}</div>
      </div>
    );
  }
  return null;
};

export default function AthleteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const athlete = mockAthletes.find((a) => a.id === id);
  const [units, setUnits] = useState(10);
  const [activeTab, setActiveTab] = useState('overview');

  if (!athlete) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-4">Athlete not found</h1>
          <Link to="/marketplace">
            <Button className="bg-white text-black hover:bg-neutral-200">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const lastMatchChange = athlete.priceChange24h;
  const isGain = lastMatchChange >= 0;
  const totalCost = units * athlete.pricePerUnit;

  // Calculate season high/low
  const seasonHigh = Math.max(...(athlete.priceHistory || []));
  const seasonLow = Math.min(...(athlete.priceHistory || []));
  const lastMatch = athlete.recentMatches[0];
  const nextMatch = athlete.upcomingMatches?.[0];

  const handlePurchase = () => {
    toast.success(`Order placed: ${units} units of ${athlete.name}`, {
      description: `Total: ₹${totalCost.toLocaleString()}`,
    });
    setTimeout(() => navigate('/portfolio'), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/marketplace">
            <button className="w-8 h-8 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <button className="text-sm text-neutral-400">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Price Header */}
      <div className="px-4 py-6 border-b border-white/[0.08]">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/[0.08]">
            <img
              src={athlete.imageUrl}
              alt={athlete.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-0.5">{athlete.name}</h1>
            <div className="text-sm text-neutral-500">
              {athlete.role} • {athlete.sport}
            </div>
          </div>
        </div>

        <div className="mb-2">
          <div className="text-4xl font-bold mb-1">₹{athlete.pricePerUnit.toFixed(2)}</div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-sm font-medium ${isGain ? 'text-emerald-500' : 'text-red-500'}`}>
              {isGain ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isGain ? '+' : ''}₹{Math.abs(athlete.pricePerUnit * lastMatchChange / 100).toFixed(2)} ({isGain ? '+' : ''}{lastMatchChange}%)
            </div>
            <div className="text-xs text-neutral-500">Last match</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-1 border-b border-white/[0.08]">
        <div className="flex gap-6">
          {['Overview', 'Matches', 'News'].map((tab) => (
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Performance Chart */}
          <div className="px-4 py-4 border-b border-white/[0.08]">
            <div className="h-52">
              <ResponsiveContainer width="100%" height={208}>
                <AreaChart data={athlete.matchHistory || []}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isGain ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={isGain ? '#10b981' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#525252" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).getDate().toString()}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isGain ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                    animationDuration={300}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Section */}
          <div className="px-4 py-4 border-b border-white/[0.08]">
            <button className="w-full flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                Performance
                <Info className="w-4 h-4 text-neutral-500" />
              </h3>
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            </button>
            <div className="grid grid-cols-2 gap-y-3">
              <div>
                <div className="text-xs text-neutral-500">Season low</div>
                <div className="text-base font-semibold">{seasonLow.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500">Season high</div>
                <div className="text-base font-semibold">{seasonHigh.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Last match</div>
                <div className="text-base font-semibold">{lastMatch?.date}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500">Next match</div>
                <div className="text-base font-semibold">{nextMatch?.date || 'TBA'}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Units traded</div>
                <div className="text-base font-semibold">{((athlete.totalRaise - (athlete.unitsAvailable * athlete.pricePerUnit)) / athlete.pricePerUnit).toFixed(0)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500">Market cap</div>
                <div className="text-base font-semibold">₹{(athlete.totalRaise / 1000).toFixed(0)}k</div>
              </div>
            </div>
          </div>

          {/* Fundamentals */}
          <div className="px-4 py-4 border-b border-white/[0.08]">
            <button className="w-full flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                Fundamentals
                <Info className="w-4 h-4 text-neutral-500" />
              </h3>
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            </button>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Total Matches</span>
                <span className="text-sm font-medium">{athlete.stats.matches}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Performance</span>
                <span className="text-sm font-medium">{athlete.performanceScore}/100</span>
              </div>
              {athlete.stats.runs !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Total Runs</span>
                  <span className="text-sm font-medium">{athlete.stats.runs}</span>
                </div>
              )}
              {athlete.stats.wickets !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Total Wickets</span>
                  <span className="text-sm font-medium">{athlete.stats.wickets}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Strike Rate</span>
                <span className="text-sm font-medium">{athlete.stats.strikeRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Average</span>
                <span className="text-sm font-medium">{athlete.stats.average}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Revenue Share</span>
                <span className="text-sm font-medium text-emerald-500">{athlete.revenueShare}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Risk Tier</span>
                <span className={`text-sm font-medium ${
                  athlete.riskTier === 'Low' ? 'text-emerald-500' :
                  athlete.riskTier === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {athlete.riskTier}
                </span>
              </div>
            </div>
          </div>

          {/* Contract Terms */}
          <div className="px-4 py-4">
            <h3 className="text-sm font-semibold mb-3">Contract Terms</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-neutral-500">Revenue Share</span>
                <span className="text-sm font-medium">{athlete.revenueShare}%</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-neutral-500">Duration</span>
                <span className="text-sm font-medium">{athlete.duration} years</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-neutral-500">Return Cap</span>
                <span className="text-sm font-medium">{athlete.returnCap}x</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <>
          {/* Upcoming Matches */}
          <div className="px-4 py-4 border-b border-white/[0.08]">
            <h3 className="text-sm font-semibold mb-3">Upcoming Matches</h3>
            <div className="space-y-3">
              {athlete.upcomingMatches && athlete.upcomingMatches.length > 0 ? (
                athlete.upcomingMatches.map((match, index) => (
                  <div key={index} className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold mb-1">{athlete.name} vs {match.opponent}</div>
                        <div className="text-xs text-neutral-500">{match.tournament}</div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded text-xs text-emerald-500">
                        <Calendar className="w-3 h-3" />
                        {match.date}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {match.venue}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-neutral-500">
                  No upcoming matches scheduled
                </div>
              )}
            </div>
          </div>

          {/* Previous Matches */}
          <div className="px-4 py-4">
            <h3 className="text-sm font-semibold mb-3">Previous Matches</h3>
            <div className="space-y-0">
              {athlete.recentMatches.map((match, index) => {
                const matchData = athlete.matchHistory?.[index];
                const matchChange = matchData?.priceChange || 0;
                const isMatchGain = matchChange >= 0;

                return (
                  <div key={index} className="border-b border-white/[0.05] py-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">{match.opponent}</div>
                        <div className="text-xs text-neutral-500">{match.date}</div>
                      </div>
                      <div className={`text-right ${isMatchGain ? 'text-emerald-500' : 'text-red-500'}`}>
                        <div className="text-sm font-semibold">
                          {isMatchGain ? '+' : ''}{matchChange}%
                        </div>
                        <div className="text-xs">
                          ₹{matchData?.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-neutral-400">{match.performance}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* News Tab */}
      {activeTab === 'news' && (
        <div className="px-4 py-12 text-center">
          <div className="text-neutral-500 text-sm">No recent news</div>
        </div>
      )}

      {/* Buy Section - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/[0.08] px-4 py-4 safe-area-bottom">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Units</span>
            <span className="text-sm font-medium">{units} units</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUnits(Math.max(1, units - 1))}
              className="w-10 h-10 flex items-center justify-center border border-white/[0.08] rounded-lg active:bg-[#1a1a1a]"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold">₹{totalCost.toLocaleString()}</div>
              <div className="text-xs text-neutral-500">Total cost</div>
            </div>
            <button
              onClick={() => setUnits(units + 1)}
              className="w-10 h-10 flex items-center justify-center border border-white/[0.08] rounded-lg active:bg-[#1a1a1a]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <Button
          onClick={handlePurchase}
          className="w-full bg-emerald-500 text-black font-semibold py-6 rounded-xl hover:bg-emerald-400"
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}