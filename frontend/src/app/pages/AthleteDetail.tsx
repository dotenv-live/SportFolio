import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { mockAthletes, mockUser, mockInvestments } from '../data/mockData';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Plus, ChevronDown, ChevronUp, Calendar, Info, X, Check, Star, Share2, Users, BookOpen, BarChart3, AlertCircle, Bell } from 'lucide-react';
import { ResponsiveContainer, Area, AreaChart, Tooltip, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
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
  const userInvestment = mockInvestments.find((inv) => inv.athleteId === id);
  const hasShares = !!userInvestment;

  const [units, setUnits] = useState(10);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartRange, setChartRange] = useState('20M');
  const [showBuySheet, setShowBuySheet] = useState(false);
  const [showSellSheet, setShowSellSheet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');

  // Collapsible sections state
  const [performanceExpanded, setPerformanceExpanded] = useState(true);
  const [fundamentalsExpanded, setFundamentalsExpanded] = useState(true);
  const [contractExpanded, setContractExpanded] = useState(true);

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
  const platformFee = totalCost * 0.01; // 1% platform fee
  const totalPayable = totalCost + platformFee;

  // Calculate season high/low
  const seasonHigh = Math.max(...(athlete.priceHistory || []));
  const seasonLow = Math.min(...(athlete.priceHistory || []));
  const lastMatch = athlete.recentMatches[0];
  const nextMatch = athlete.upcomingMatches?.[0];

  // Filter chart data based on match range
  const getFilteredChartData = () => {
    if (!athlete.matchHistory) return [];
    const data = athlete.matchHistory;
    if (chartRange === 'ALL') return data;
    if (chartRange === '1M') return data.slice(-1);
    if (chartRange === '5M') return data.slice(-5);
    if (chartRange === '20M') return data.slice(-20);
    return data;
  };

  const filteredChartData = getFilteredChartData();

  const handleBuyClick = () => {
    setTransactionType('buy');
    setShowBuySheet(true);
    setUnits(10);
  };

  const handleSellClick = () => {
    setTransactionType('sell');
    setShowSellSheet(true);
    setUnits(Math.min(10, userInvestment?.units || 10));
  };

  const handleTransaction = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setShowBuySheet(false);
        setShowSellSheet(false);
        navigate('/portfolio');
      }, 2000);
    }, 1500);
  };

  const handleToggleWatchlist = () => {
    athlete.isWatchlisted = !athlete.isWatchlisted;
    toast.success(
      athlete.isWatchlisted 
        ? `${athlete.name} added to watchlist` 
        : `${athlete.name} removed from watchlist`
    );
  };

  const handleCompare = () => {
    navigate(`/compare?ids=${athlete.id}`);
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleWatchlist}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"
            >
              <Star className={`w-5 h-5 ${athlete.isWatchlisted ? 'text-yellow-500 fill-yellow-500' : 'text-neutral-400'}`} />
            </button>
            <button
              onClick={handleCompare}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors text-neutral-400"
            >
              <TrendingUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Price Header */}
      <div className="px-4 py-6">
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

      {/* Performance Chart */}
      <div className="px-4 pb-4">
        <div className="h-64 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredChartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isGain ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={isGain ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isGain ? '#10b981' : '#ef4444'}
                strokeWidth={2.5}
                fill="url(#priceGradient)"
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Range Filters - Below Chart */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {['1M', '5M', '20M', 'ALL'].map((range) => (
            <button
              key={range}
              onClick={() => setChartRange(range)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                chartRange === range
                  ? 'bg-white text-black'
                  : 'bg-transparent text-neutral-500 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs - Below Chart */}
      <div className="px-4 pt-2 border-b border-white/[0.08]">
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
          {/* Performance Section */}
          <div className="px-4 py-4 border-b border-white/[0.08]">
            <button 
              onClick={() => setPerformanceExpanded(!performanceExpanded)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="text-sm font-semibold">Performance</h3>
              {performanceExpanded ? (
                <ChevronUp className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              )}
            </button>
            {performanceExpanded && (
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
            )}
          </div>

          {/* Fundamentals */}
          <div className="px-4 py-4 border-b border-white/[0.08]">
            <button 
              onClick={() => setFundamentalsExpanded(!fundamentalsExpanded)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="text-sm font-semibold">Fundamentals</h3>
              {fundamentalsExpanded ? (
                <ChevronUp className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              )}
            </button>
            
            {fundamentalsExpanded && (
              <div className="space-y-4">
                {/* T20 Format */}
                <div>
                  <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">T20 Format</div>
                  <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-neutral-500">Matches</div>
                        <div className="text-sm font-semibold">45</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Runs</div>
                        <div className="text-sm font-semibold">1,250</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Average</div>
                        <div className="text-sm font-semibold">32.5</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Strike Rate</div>
                        <div className="text-sm font-semibold">145.2</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Highest Score</div>
                        <div className="text-sm font-semibold">89*</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">50s/100s</div>
                        <div className="text-sm font-semibold">8/0</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ODI Format */}
                <div>
                  <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">ODI Format</div>
                  <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-neutral-500">Matches</div>
                        <div className="text-sm font-semibold">32</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Runs</div>
                        <div className="text-sm font-semibold">1,560</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Average</div>
                        <div className="text-sm font-semibold">48.7</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Strike Rate</div>
                        <div className="text-sm font-semibold">92.3</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Highest Score</div>
                        <div className="text-sm font-semibold">127</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">50s/100s</div>
                        <div className="text-sm font-semibold">12/3</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Format */}
                <div>
                  <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Test Format</div>
                  <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-neutral-500">Matches</div>
                        <div className="text-sm font-semibold">18</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Runs</div>
                        <div className="text-sm font-semibold">980</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Average</div>
                        <div className="text-sm font-semibold">42.6</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Strike Rate</div>
                        <div className="text-sm font-semibold">56.8</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Highest Score</div>
                        <div className="text-sm font-semibold">156</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">50s/100s</div>
                        <div className="text-sm font-semibold">5/2</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* About Section */}
          <div className="px-4 py-4 border-b border-white/[0.08]">
            <h3 className="text-sm font-semibold mb-3">About</h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-3">
              {athlete.name} is a promising {athlete.role.toLowerCase()} representing India in international cricket. 
              Known for exceptional skills and consistent performance, {athlete.name.split(' ')[0]} has shown tremendous 
              potential in recent matches with a {athlete.performanceScore}/100 performance score.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-lg p-3">
                <div className="text-xs text-neutral-500 mb-1">Age</div>
                <div className="text-sm font-semibold">24 years</div>
              </div>
              <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-lg p-3">
                <div className="text-xs text-neutral-500 mb-1">Batting</div>
                <div className="text-sm font-semibold">Right-hand</div>
              </div>
            </div>
          </div>

          {/* Contract Terms */}
          <div className="px-4 py-4">
            <button 
              onClick={() => setContractExpanded(!contractExpanded)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="text-sm font-semibold">Contract Terms</h3>
              {contractExpanded ? (
                <ChevronUp className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              )}
            </button>
            {contractExpanded && (
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
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-neutral-500">Risk Tier</span>
                  <span className={`text-sm font-medium ${
                    athlete.riskTier === 'Low' ? 'text-emerald-500' :
                    athlete.riskTier === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {athlete.riskTier}
                  </span>
                </div>
              </div>
            )}
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

      {/* Buy/Sell Buttons - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/[0.08] px-4 py-4 safe-area-bottom">
        {/* Advanced Trading Link */}
        <Link 
          to={`/trading/${athlete.id}`}
          className="block text-center text-sm text-emerald-500 font-medium mb-3 hover:text-emerald-400"
        >
          Advanced Trading →
        </Link>
        
        {hasShares ? (
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSellClick}
              className="flex-1 bg-red-500 text-white font-semibold py-6 rounded-xl hover:bg-red-600"
            >
              Sell
            </Button>
            <Button
              onClick={handleBuyClick}
              className="flex-1 bg-emerald-500 text-black font-semibold py-6 rounded-xl hover:bg-emerald-400"
            >
              Buy
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleBuyClick}
            className="w-full bg-emerald-500 text-black font-semibold py-6 rounded-xl hover:bg-emerald-400"
          >
            Buy Now
          </Button>
        )}
      </div>

      {/* Buy Sheet */}
      <AnimatePresence>
        {showBuySheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBuySheet(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/[0.08] rounded-t-3xl z-50 p-6"
            >
              {!showSuccess ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">Buy {athlete.name}</h3>
                    <button
                      onClick={() => setShowBuySheet(false)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="mb-6">
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

                  <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">Platform Fee (1%)</span>
                      <span className="font-medium">₹{platformFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/[0.08] pt-2 flex items-center justify-between">
                      <span className="font-semibold">Total Payable</span>
                      <span className="font-bold text-lg">₹{totalPayable.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleTransaction}
                    disabled={isProcessing}
                    className="w-full bg-emerald-500 text-black font-semibold py-6 rounded-xl hover:bg-emerald-400"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      `Buy ${units} Units`
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Purchase Successful!</h3>
                  <p className="text-neutral-400 mb-6">
                    You bought {units} units of {athlete.name}
                  </p>
                  <Button
                    onClick={() => navigate('/portfolio')}
                    className="w-full bg-emerald-500 text-black font-semibold py-6 rounded-xl hover:bg-emerald-400"
                  >
                    View Portfolio
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sell Sheet */}
      <AnimatePresence>
        {showSellSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSellSheet(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/[0.08] rounded-t-3xl z-50 p-6"
            >
              {!showSuccess ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">Sell {athlete.name}</h3>
                    <button
                      onClick={() => setShowSellSheet(false)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-6">
                    <div className="text-xs text-yellow-500">
                      You own {userInvestment?.units} units worth ₹{userInvestment?.currentValue.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-500">Units to sell</span>
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
                        <div className="text-xs text-neutral-500">You'll receive</div>
                      </div>
                      <button
                        onClick={() => setUnits(Math.min((userInvestment?.units || 10), units + 1))}
                        className="w-10 h-10 flex items-center justify-center border border-white/[0.08] rounded-lg active:bg-[#1a1a1a]"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">Platform Fee (1%)</span>
                      <span className="font-medium">₹{platformFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/[0.08] pt-2 flex items-center justify-between">
                      <span className="font-semibold">You'll Receive</span>
                      <span className="font-bold text-lg">₹{(totalCost - platformFee).toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleTransaction}
                    disabled={isProcessing}
                    className="w-full bg-red-500 text-white font-semibold py-6 rounded-xl hover:bg-red-600"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      `Sell ${units} Units`
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Sold Successfully!</h3>
                  <p className="text-neutral-400 mb-6">
                    You sold {units} units of {athlete.name}
                  </p>
                  <Button
                    onClick={() => navigate('/portfolio')}
                    className="w-full bg-red-500 text-white font-semibold py-6 rounded-xl hover:bg-red-600"
                  >
                    View Portfolio
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}