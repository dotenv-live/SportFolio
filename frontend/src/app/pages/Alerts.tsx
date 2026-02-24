import { useState } from 'react';
import { Link } from 'react-router';
import { usePlayers, usePriceAlerts } from '../hooks/useApi';
import { ArrowLeft, Bell, Plus, TrendingUp, TrendingDown, X, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface AlertsProps {
  hideHeader?: boolean;
}

export default function Alerts({ hideHeader = false }: AlertsProps) {
  const { data: initialAlerts = [] } = usePriceAlerts();
  const { data: allAthletes = [] } = usePlayers();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below' | 'change'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [changePercent, setChangePercent] = useState('');

  const activeAlerts = alerts.filter(a => a.isActive);
  const triggeredAlerts = alerts.filter(a => !a.isActive && a.triggeredAt);

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast.success('Alert deleted');
  };

  const handleCreateAlert = () => {
    if (!selectedAthlete) {
      toast.error('Please select an athlete');
      return;
    }

    if (alertCondition !== 'change' && !targetPrice) {
      toast.error('Please enter a target price');
      return;
    }

    if (alertCondition === 'change' && !changePercent) {
      toast.error('Please enter a percentage');
      return;
    }

    const athlete = allAthletes.find(a => a.id === selectedAthlete);
    if (!athlete) return;

    const newAlert = {
      id: `alert-${Date.now()}`,
      athleteId: athlete.id,
      athleteName: athlete.name,
      athleteImage: athlete.imageUrl,
      condition: alertCondition,
      targetPrice: alertCondition !== 'change' ? parseFloat(targetPrice) : undefined,
      changePercent: alertCondition === 'change' ? parseFloat(changePercent) : undefined,
      currentPrice: athlete.pricePerUnit,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setAlerts([newAlert, ...alerts]);
    setShowCreateModal(false);
    setSelectedAthlete('');
    setTargetPrice('');
    setChangePercent('');
    toast.success('Alert created successfully');
  };

  const formatCondition = (alert: typeof alerts[0]) => {
    if (alert.condition === 'above') {
      return `When price goes above ₹${alert.targetPrice}`;
    } else if (alert.condition === 'below') {
      return `When price goes below ₹${alert.targetPrice}`;
    } else {
      return `When price changes by ${alert.changePercent}%`;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      {!hideHeader && (
        <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <button className="w-8 h-8 flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div>
                <h1 className="font-bold text-base">Price Alerts</h1>
                <p className="text-xs text-neutral-500">{activeAlerts.length} active</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-500 text-black px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </div>
        </div>
      )}

      {/* Header Section when hideHeader is true */}
      {hideHeader && (
        <div className="px-4 py-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-lg mb-1">Price Alerts</h1>
              <p className="text-sm text-neutral-500">{activeAlerts.length} active alerts</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-500 text-black px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="px-4 py-4">
          <h2 className="text-sm font-semibold mb-3">Active Alerts</h2>
          <div className="space-y-3">
            {activeAlerts.map((alert) => {
              const priceGap = alert.targetPrice 
                ? alert.targetPrice - alert.currentPrice 
                : 0;
              const isAboveTarget = priceGap < 0;

              return (
                <div
                  key={alert.id}
                  className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                      <img src={alert.athleteImage} alt={alert.athleteName} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-0.5">{alert.athleteName}</h3>
                          <p className="text-xs text-neutral-500">
                            {formatCondition(alert)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="ml-2 w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-neutral-500" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-neutral-500 mb-0.5">Current Price</div>
                          <div className="font-bold text-sm">₹{alert.currentPrice.toFixed(2)}</div>
                        </div>

                        {alert.condition !== 'change' && alert.targetPrice && (
                          <div className="text-right">
                            <div className="text-xs text-neutral-500 mb-0.5">
                              {Math.abs(priceGap).toFixed(2)} away
                            </div>
                            <div className={`text-xs font-medium ${
                              alert.condition === 'above' 
                                ? (isAboveTarget ? 'text-emerald-500' : 'text-neutral-400')
                                : (isAboveTarget ? 'text-neutral-400' : 'text-red-500')
                            }`}>
                              {alert.condition === 'above' ? (
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  Target: ₹{alert.targetPrice}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <TrendingDown className="w-3 h-3" />
                                  Target: {alert.targetPrice}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="px-4 py-4 border-t border-white/[0.08]">
          <h2 className="text-sm font-semibold mb-3 text-neutral-500">Recently Triggered</h2>
          <div className="space-y-3">
            {triggeredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4 opacity-60"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                    <img src={alert.athleteImage} alt={alert.athleteName} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-0.5">{alert.athleteName}</h3>
                        <p className="text-xs text-neutral-500">
                          {formatCondition(alert)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="ml-2 w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-neutral-500" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded">
                        Triggered
                      </span>
                      <span className="text-xs text-neutral-600">
                        {alert.triggeredAt && new Date(alert.triggeredAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeAlerts.length === 0 && triggeredAlerts.length === 0 && (
        <div className="px-4 py-20 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-neutral-600" />
          </div>
          <h3 className="text-lg font-bold mb-2">No Price Alerts</h3>
          <p className="text-sm text-neutral-500 mb-6">
            Create alerts to get notified when athlete prices hit your targets
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-500 text-black font-semibold px-6 py-3 rounded-xl"
          >
            Create Your First Alert
          </button>
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-[#0a0a0a] border-t border-white/[0.08] rounded-t-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/[0.08] px-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Create Price Alert</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-4 py-6 space-y-6">
              {/* Select Athlete */}
              <div>
                <label className="text-sm font-semibold mb-3 block">Select Athlete</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allAthletes.map((athlete) => (
                    <button
                      key={athlete.id}
                      onClick={() => setSelectedAthlete(athlete.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        selectedAthlete === athlete.id
                          ? 'bg-emerald-500/20 border-2 border-emerald-500'
                          : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                        <img src={athlete.imageUrl} alt={athlete.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold">{athlete.name}</div>
                        <div className="text-xs text-neutral-500">₹{athlete.pricePerUnit.toFixed(2)}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Alert Condition */}
              <div>
                <label className="text-sm font-semibold mb-3 block">Alert Condition</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'above', label: 'Above', icon: TrendingUp },
                    { value: 'below', label: 'Below', icon: TrendingDown },
                    { value: 'change', label: 'Change %', icon: Bell },
                  ].map((condition) => {
                    const Icon = condition.icon;
                    return (
                      <button
                        key={condition.value}
                        onClick={() => setAlertCondition(condition.value as any)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                          alertCondition === condition.value
                            ? 'bg-emerald-500/20 border-2 border-emerald-500'
                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{condition.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Value */}
              {alertCondition !== 'change' ? (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Target Price (₹)</label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="Enter target price"
                    className="w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Change Percentage (%)</label>
                  <input
                    type="number"
                    value={changePercent}
                    onChange={(e) => setChangePercent(e.target.value)}
                    placeholder="e.g., 5 for 5% change"
                    className="w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={handleCreateAlert}
                className="w-full bg-emerald-500 text-black font-semibold py-4 rounded-xl hover:bg-emerald-600 transition-colors"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}