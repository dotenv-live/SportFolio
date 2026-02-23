import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AdminSkeleton } from '../components/skeletons';
import { usePlayers } from '../hooks/useApi';
import { Shield, Users, TrendingUp, AlertCircle, CheckCircle, XCircle, Search, Menu } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: athletes = [], isLoading } = usePlayers();
  const allAthletes = athletes;

  // Mock pending approvals
  const pendingAthletes = [
    {
      id: 'pending-1',
      name: 'Karan Mehta',
      sport: 'Cricket',
      role: 'Bowler',
      age: 23,
      requestedRaise: 120000,
      submittedDate: '2026-02-20',
    },
    {
      id: 'pending-2',
      name: 'Sneha Iyer',
      sport: 'Cricket',
      role: 'All-rounder',
      age: 21,
      requestedRaise: 95000,
      submittedDate: '2026-02-18',
    },
  ];

  // Mock flagged transactions
  const flaggedTransactions = [
    {
      id: 'flag-1',
      investor: 'Suspicious User 1',
      athlete: 'Arjun Sharma',
      amount: 50000,
      reason: 'Large transaction from new account',
      date: '2026-02-22',
    },
  ];

  const handleApprove = (name: string) => {
    toast.success(`Approved ${name}`, {
      description: 'Athlete has been approved and listed on the platform',
    });
  };

  const handleReject = (name: string) => {
    toast.error(`Rejected ${name}`, {
      description: 'Application has been declined',
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-base">Sports Folio Admin</span>
          <Link to="/">
            <button className="text-neutral-500">
              <Menu className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>

      {isLoading ? <AdminSkeleton /> : (<>
      {/* Stats Grid */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <h2 className="text-sm font-semibold mb-3">Overview</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
            <div className="text-xs text-neutral-500 mb-1">Total Athletes</div>
            <div className="text-2xl font-bold">{allAthletes.length}</div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
            <div className="text-xs text-neutral-500 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-500">{pendingAthletes.length}</div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
            <div className="text-xs text-neutral-500 mb-1">Total Raised</div>
            <div className="text-2xl font-bold">₹4.2L</div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
            <div className="text-xs text-neutral-500 mb-1">Flagged</div>
            <div className="text-2xl font-bold text-red-500">{flaggedTransactions.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4">
        <Tabs defaultValue="approvals" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#0a0a0a] border border-white/[0.08] h-11 mb-4">
            <TabsTrigger 
              value="approvals" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-neutral-500 text-xs"
            >
              Approvals
            </TabsTrigger>
            <TabsTrigger 
              value="athletes" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-neutral-500 text-xs"
            >
              Athletes
            </TabsTrigger>
            <TabsTrigger 
              value="fraud" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-neutral-500 text-xs"
            >
              Fraud
            </TabsTrigger>
            <TabsTrigger 
              value="pricing" 
              className="data-[state=active]:bg-white data-[state=active]:text-black text-neutral-500 text-xs"
            >
              Pricing
            </TabsTrigger>
          </TabsList>

          {/* Approvals Tab */}
          <TabsContent value="approvals">
            <div className="space-y-3">
              {pendingAthletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-base font-bold mb-0.5">{athlete.name}</h4>
                      <p className="text-xs text-neutral-500">
                        {athlete.role} • {athlete.sport} • {athlete.age} years
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        Submitted {athlete.submittedDate}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-500">
                      Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 bg-black/50 rounded-lg">
                      <div className="text-xs text-neutral-500 mb-0.5">Requested</div>
                      <div className="text-sm font-semibold">
                        ₹{(athlete.requestedRaise / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <div className="p-2 bg-black/50 rounded-lg">
                      <div className="text-xs text-neutral-500 mb-0.5">KYC Status</div>
                      <div className="text-sm font-semibold text-emerald-500">Complete</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(athlete.name)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-2 rounded-lg text-sm transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(athlete.name)}
                      className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 font-medium py-2 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}

              {pendingAthletes.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">No pending approvals</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Athletes Tab */}
          <TabsContent value="athletes">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Search athletes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#1a1a1a] border-white/[0.08] text-white placeholder:text-neutral-600 h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              {allAthletes
                .filter((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((athlete) => (
                  <div
                    key={athlete.id}
                    className="flex items-center justify-between py-3 border-b border-white/[0.05]"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={athlete.imageUrl}
                        alt={athlete.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium">{athlete.name}</div>
                        <div className="text-xs text-neutral-500">
                          {athlete.role} • {athlete.sport}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        ₹{(athlete.fundsRaised / 1000).toFixed(0)}k
                      </div>
                      <div className={`text-xs ${
                        athlete.riskTier === 'Low' ? 'text-emerald-500' :
                        athlete.riskTier === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {athlete.riskTier}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          {/* Fraud Detection Tab */}
          <TabsContent value="fraud">
            <div className="space-y-3">
              {flaggedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-red-500/5 border border-red-500/20 rounded-xl p-4"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold mb-1">Suspicious Activity</h4>
                      <p className="text-xs text-neutral-400 mb-1">
                        {transaction.investor} → {transaction.athlete}
                      </p>
                      <p className="text-xs text-neutral-600">{transaction.date}</p>
                    </div>
                    <div className="text-base font-bold text-red-500">
                      ₹{(transaction.amount / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <div className="p-2 bg-black/30 rounded-lg mb-3">
                    <div className="text-xs text-neutral-500 mb-0.5">Reason</div>
                    <div className="text-xs">{transaction.reason}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-2 rounded-lg text-sm">
                      Approve
                    </button>
                    <button className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 font-medium py-2 rounded-lg text-sm">
                      Block
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4">
              <h4 className="text-sm font-bold mb-3">Pricing Algorithm</h4>
              <div className="font-mono text-xs text-emerald-500 bg-black/50 p-3 rounded-lg mb-4">
                Price = (Performance × Growth × Risk)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/50 rounded-lg">
                  <div className="text-xs text-neutral-500 mb-1">Performance</div>
                  <div className="text-base font-bold">85%</div>
                </div>
                <div className="p-3 bg-black/50 rounded-lg">
                  <div className="text-xs text-neutral-500 mb-1">Sentiment</div>
                  <div className="text-base font-bold">15%</div>
                </div>
                <div className="p-3 bg-black/50 rounded-lg col-span-2">
                  <div className="text-xs text-neutral-500 mb-1">Update Frequency</div>
                  <div className="text-base font-bold">Weekly</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white/[0.02] border border-white/[0.08] rounded-lg">
                <p className="text-xs text-neutral-500">
                  ℹ️ Pricing adjustments require admin approval
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/[0.08] px-4 py-3 safe-area-bottom">
        <Link to="/">
          <button className="w-full bg-white hover:bg-neutral-200 text-black font-semibold py-3 rounded-xl transition-colors">
            Back to Home
          </button>
        </Link>
      </div>
      </>)}
    </div>
  );
}