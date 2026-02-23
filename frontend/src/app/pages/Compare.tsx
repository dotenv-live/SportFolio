import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { usePlayers } from '../hooks/useApi';
import { ArrowLeft, X, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { Sparkline } from '../components/Sparkline';

export default function Compare() {
  const [searchParams] = useSearchParams();
  const athleteIds = searchParams.get('ids')?.split(',') || [];
  const { data: allAthletes = [] } = usePlayers();
  
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>(athleteIds);
  const [showAddModal, setShowAddModal] = useState(false);

  const athletes = selectedAthletes
    .map(id => allAthletes.find(a => a.id === id))
    .filter(Boolean) as typeof allAthletes;

  const handleAddAthlete = (athleteId: string) => {
    if (selectedAthletes.length < 3 && !selectedAthletes.includes(athleteId)) {
      setSelectedAthletes([...selectedAthletes, athleteId]);
      setShowAddModal(false);
    }
  };

  const handleRemoveAthlete = (athleteId: string) => {
    setSelectedAthletes(selectedAthletes.filter(id => id !== athleteId));
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/marketplace">
            <button className="w-8 h-8 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="font-bold text-base">Compare Athletes</h1>
          <div className="w-8" />
        </div>
      </div>

      {/* Empty State */}
      {athletes.length === 0 && (
        <div className="px-4 py-20 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-neutral-600" />
          </div>
          <h3 className="text-lg font-bold mb-2">No Athletes Selected</h3>
          <p className="text-sm text-neutral-500 mb-6">
            Add athletes to compare their stats and performance
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-500 text-black font-semibold px-6 py-3 rounded-xl"
          >
            Select Athletes
          </button>
        </div>
      )}

      {/* Comparison View */}
      {athletes.length > 0 && (
        <div className="px-4 py-4">
          {/* Selected Athletes Cards */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {athletes.map((athlete) => {
              const isGain = athlete.priceChange24h >= 0;
              
              return (
                <div key={athlete.id} className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4 relative">
                  <button
                    onClick={() => handleRemoveAthlete(athlete.id)}
                    className="absolute top-3 right-3 w-7 h-7 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                      <img src={athlete.imageUrl} alt={athlete.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base mb-1">{athlete.name}</h3>
                      <p className="text-xs text-neutral-500">{athlete.role} • {athlete.age} years</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="font-bold text-lg">₹{athlete.pricePerUnit.toFixed(2)}</div>
                        <div className={`flex items-center gap-1 text-xs font-medium ${
                          isGain ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isGain ? '+' : ''}{athlete.priceChange24h}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sparkline */}
                  {athlete.priceHistory && (
                    <div className="mb-4">
                      <Sparkline
                        data={athlete.priceHistory}
                        color={isGain ? '#10b981' : '#ef4444'}
                        width={window.innerWidth - 64}
                        height={60}
                      />
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-xs text-neutral-500 mb-1">Performance</div>
                      <div className="font-bold text-sm">{athlete.performanceScore}/100</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-neutral-500 mb-1">Risk</div>
                      <div className={`font-bold text-sm ${
                        athlete.riskTier === 'Low' ? 'text-emerald-500' :
                        athlete.riskTier === 'Medium' ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {athlete.riskTier}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-neutral-500 mb-1">Growth</div>
                      <div className="font-bold text-sm text-emerald-500">+{athlete.growthRate}%</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add More Button */}
            {athletes.length < 3 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="border-2 border-dashed border-white/[0.08] hover:border-white/[0.16] rounded-2xl p-6 text-center transition-colors"
              >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-neutral-500" />
                </div>
                <div className="text-sm font-medium text-neutral-500">
                  Add Athlete to Compare
                </div>
                <div className="text-xs text-neutral-600 mt-1">
                  Compare up to 3 athletes
                </div>
              </button>
            )}
          </div>

          {/* Detailed Comparison Table */}
          {athletes.length >= 2 && (
            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
              <h3 className="text-sm font-semibold mb-4">Detailed Comparison</h3>
              
              <div className="space-y-4">
                {/* Price Comparison */}
                <div>
                  <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Current Price</div>
                  <div className="space-y-2">
                    {athletes.map(athlete => (
                      <div key={athlete.id} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                        <span className="text-sm font-medium">{athlete.name}</span>
                        <span className="text-sm font-bold">₹{athlete.pricePerUnit.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contract Terms */}
                <div>
                  <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Revenue Share</div>
                  <div className="space-y-2">
                    {athletes.map(athlete => (
                      <div key={athlete.id} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                        <span className="text-sm font-medium">{athlete.name}</span>
                        <span className="text-sm font-bold">{athlete.revenueShare}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contract Duration */}
                <div>
                  <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Duration</div>
                  <div className="space-y-2">
                    {athletes.map(athlete => (
                      <div key={athlete.id} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                        <span className="text-sm font-medium">{athlete.name}</span>
                        <span className="text-sm font-bold">{athlete.duration} years</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Return Cap */}
                <div>
                  <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Return Cap</div>
                  <div className="space-y-2">
                    {athletes.map(athlete => (
                      <div key={athlete.id} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                        <span className="text-sm font-medium">{athlete.name}</span>
                        <span className="text-sm font-bold">{athlete.returnCap}x</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Units Available</div>
                  <div className="space-y-2">
                    {athletes.map(athlete => (
                      <div key={athlete.id} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                        <span className="text-sm font-medium">{athlete.name}</span>
                        <span className="text-sm font-bold">{athlete.unitsAvailable}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Career Stats</div>
                  <div className="space-y-2">
                    {athletes.map(athlete => (
                      <div key={athlete.id} className="py-2 border-b border-white/[0.05] last:border-0">
                        <div className="text-sm font-medium mb-2">{athlete.name}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-neutral-500">Matches: </span>
                            <span className="font-semibold">{athlete.stats.matches}</span>
                          </div>
                          {athlete.stats.runs && (
                            <div>
                              <span className="text-neutral-500">Runs: </span>
                              <span className="font-semibold">{athlete.stats.runs}</span>
                            </div>
                          )}
                          {athlete.stats.wickets && (
                            <div>
                              <span className="text-neutral-500">Wickets: </span>
                              <span className="font-semibold">{athlete.stats.wickets}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-neutral-500">Average: </span>
                            <span className="font-semibold">{athlete.stats.average}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">S/R: </span>
                            <span className="font-semibold">{athlete.stats.strikeRate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Athlete Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-[#0a0a0a] border-t border-white/[0.08] rounded-t-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/[0.08] px-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Select Athlete</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-4 py-4 space-y-2">
              {allAthletes
                .filter(athlete => !selectedAthletes.includes(athlete.id))
                .map(athlete => (
                  <button
                    key={athlete.id}
                    onClick={() => handleAddAthlete(athlete.id)}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/[0.08] rounded-xl p-3 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                        <img src={athlete.imageUrl} alt={athlete.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-0.5">{athlete.name}</h4>
                        <p className="text-xs text-neutral-500">{athlete.role} • ₹{athlete.pricePerUnit.toFixed(2)}</p>
                      </div>
                      <Plus className="w-5 h-5 text-neutral-500" />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
