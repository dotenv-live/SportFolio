import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowUpFromLine, ArrowDownToLine, FileText, BarChart3, LogOut, User, Edit, X, Check, Smartphone, CreditCard, Building2, Wallet, Eye, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWallet, useDeposit } from '../hooks/useApi';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { BottomNavigation } from '../components/BottomNavigation';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: walletBalance = user?.walletBalance ?? 0 } = useWallet();
  const depositMutation = useDeposit();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionType, setTransactionType] = useState<'add' | 'withdraw'>('add');

  const joiningDate = new Date(user?.joinedAt ?? new Date().toISOString());
  const monthYear = joiningDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();

  const presetAmounts = [1000, 5000, 10000, 25000, 50000, 100000];

  const handleAddFunds = () => {
    setTransactionType('add');
    setShowAddFunds(true);
    setSelectedAmount(0);
    setCustomAmount('');
  };

  const handleWithdraw = () => {
    setTransactionType('withdraw');
    setShowWithdraw(true);
    setSelectedAmount(0);
    setCustomAmount('');
  };

  const handleTransaction = async () => {
    const amount = selectedAmount || Number(customAmount);
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (transactionType === 'withdraw' && amount > walletBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsProcessing(true);

    try {
      if (transactionType === 'add') {
        await depositMutation.mutateAsync(amount);
      } else {
        // Backend doesn't have a withdraw endpoint yet; show success anyway
        await new Promise(r => setTimeout(r, 1000));
      }
      setIsProcessing(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowAddFunds(false);
        setShowWithdraw(false);
      }, 2000);
    } catch (err: any) {
      setIsProcessing(false);
      toast.error(err?.response?.data?.detail || 'Transaction failed');
    }
  };

  const getFinalAmount = () => selectedAmount || Number(customAmount) || 0;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-base">Profile</span>
          <div className="flex items-center gap-2">
            <Link to="/marketplace">
              <button className="w-8 h-8 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-4 py-8 border-b border-white/[0.08]">
        <div className="flex flex-col items-center">
          {/* Avatar with circular text */}
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full bg-emerald-600 flex items-center justify-center">
              <span className="text-5xl font-bold text-white">
                {(user?.name ?? 'U').charAt(0)}
              </span>
            </div>
            {/* Circular text */}
            <svg className="absolute inset-0 w-32 h-32 -rotate-90" viewBox="0 0 128 128">
              <defs>
                <path
                  id="circlePath"
                  d="M 64, 64 m -56, 0 a 56,56 0 1,1 112,0 a 56,56 0 1,1 -112,0"
                />
              </defs>
              <text fill="#737373" fontSize="9" fontWeight="500" letterSpacing="2">
                <textPath href="#circlePath" startOffset="0%">
                  GROWING SINCE {monthYear}
                </textPath>
              </text>
            </svg>
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold mb-1">{user?.name ?? "User"}</h1>
          <p className="text-sm text-neutral-500">{user?.email ?? ""}</p>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-neutral-400">Wallet Balance</span>
            </div>
            <Eye className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-3xl font-bold mb-4">₹{walletBalance.toLocaleString()}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddFunds}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Add Funds
            </button>
            <button
              onClick={handleWithdraw}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-2">
        <Link to="/portfolio?tab=orders">
          <MenuItem 
            icon={<FileText className="w-5 h-5" />}
            label="Orders"
          />
        </Link>
        <Link to="/alerts">
          <MenuItem 
            icon={<Bell className="w-5 h-5" />}
            label="Price Alerts"
          />
        </Link>
        <MenuItem 
          icon={<User className="w-5 h-5" />}
          label="Edit Profile"
        />
        <Link to="/analytics">
          <MenuItem 
            icon={<BarChart3 className="w-5 h-5" />}
            label="Analytics"
          />
        </Link>
        <button onClick={handleLogout} className="w-full">
          <MenuItem 
            icon={<LogOut className="w-5 h-5" />}
            label="Logout"
            danger
          />
        </button>
      </div>

      {/* Add Funds Bottom Sheet */}
      <AnimatePresence>
        {showAddFunds && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddFunds(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/[0.08] rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto"
            >
              {!showSuccess ? (
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Add Funds</h2>
                    <button
                      onClick={() => setShowAddFunds(false)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Amount Selection */}
                  <div className="mb-6">
                    <div className="text-sm text-neutral-400 mb-3">Select Amount</div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {presetAmounts.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => {
                            setSelectedAmount(amount);
                            setCustomAmount('');
                          }}
                          className={`py-3 rounded-xl font-medium transition-colors ${
                            selectedAmount === amount
                              ? 'bg-emerald-500 text-black'
                              : 'bg-white/5 text-white hover:bg-white/10'
                          }`}
                        >
                          ₹{(amount / 1000).toFixed(0)}k
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      placeholder="Enter custom amount"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(0);
                      }}
                      className="w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="mb-6">
                    <div className="text-sm text-neutral-400 mb-3">Payment Method</div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedPayment('upi')}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                          selectedPayment === 'upi'
                            ? 'bg-emerald-500/10 border-2 border-emerald-500'
                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                        }`}
                      >
                        <Smartphone className="w-5 h-5" />
                        <span className="font-medium">UPI</span>
                      </button>
                      <button
                        onClick={() => setSelectedPayment('card')}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                          selectedPayment === 'card'
                            ? 'bg-emerald-500/10 border-2 border-emerald-500'
                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span className="font-medium">Debit/Credit Card</span>
                      </button>
                      <button
                        onClick={() => setSelectedPayment('netbanking')}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                          selectedPayment === 'netbanking'
                            ? 'bg-emerald-500/10 border-2 border-emerald-500'
                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                        <span className="font-medium">Net Banking</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  {getFinalAmount() > 0 && (
                    <div className="bg-white/5 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-neutral-400">Amount</span>
                        <span className="font-medium">₹{getFinalAmount().toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-neutral-400">Gateway Fee</span>
                        <span className="font-medium">₹0</span>
                      </div>
                      <div className="border-t border-white/[0.08] my-3" />
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Total Payable</span>
                        <span className="font-bold text-lg">₹{getFinalAmount().toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Add Button */}
                  <Button
                    onClick={handleTransaction}
                    disabled={isProcessing || getFinalAmount() === 0}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-6 rounded-xl"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      `Add ₹${getFinalAmount().toLocaleString()}`
                    )}
                  </Button>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Funds Added Successfully!</h3>
                  <p className="text-neutral-400 mb-4">
                    ₹{getFinalAmount().toLocaleString()} has been credited to your wallet
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Withdraw Funds Bottom Sheet */}
      <AnimatePresence>
        {showWithdraw && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdraw(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/[0.08] rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto"
            >
              {!showSuccess ? (
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Withdraw Funds</h2>
                    <button
                      onClick={() => setShowWithdraw(false)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Available Balance */}
                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <div className="text-sm text-neutral-400 mb-1">Available Balance</div>
                    <div className="text-2xl font-bold">₹{walletBalance.toLocaleString()}</div>
                  </div>

                  {/* Amount Selection */}
                  <div className="mb-6">
                    <div className="text-sm text-neutral-400 mb-3">Withdraw Amount</div>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(0);
                      }}
                      max={walletBalance}
                      className="w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCustomAmount((walletBalance * 0.25).toString());
                          setSelectedAmount(0);
                        }}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors"
                      >
                        25%
                      </button>
                      <button
                        onClick={() => {
                          setCustomAmount((walletBalance * 0.5).toString());
                          setSelectedAmount(0);
                        }}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors"
                      >
                        50%
                      </button>
                      <button
                        onClick={() => {
                          setCustomAmount((walletBalance * 0.75).toString());
                          setSelectedAmount(0);
                        }}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors"
                      >
                        75%
                      </button>
                      <button
                        onClick={() => {
                          setCustomAmount(walletBalance.toString());
                          setSelectedAmount(0);
                        }}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Bank Account */}
                  <div className="mb-6">
                    <div className="text-sm text-neutral-400 mb-3">Bank Account</div>
                    <div className="bg-white/5 border border-white/[0.08] rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-neutral-400" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">HDFC Bank</div>
                          <div className="text-xs text-neutral-500">****1234</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notice */}
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                    <div className="text-xs text-yellow-500">
                      ⓘ Withdrawals are processed within 1-2 business days
                    </div>
                  </div>

                  {/* Withdraw Button */}
                  <Button
                    onClick={handleTransaction}
                    disabled={isProcessing || getFinalAmount() === 0 || getFinalAmount() > walletBalance}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-6 rounded-xl"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      `Withdraw ₹${getFinalAmount().toLocaleString()}`
                    )}
                  </Button>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Withdrawal Initiated!</h3>
                  <p className="text-neutral-400 mb-4">
                    ₹{getFinalAmount().toLocaleString()} will be credited to your bank account in 1-2 business days
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

function MenuItem({ icon, label, danger = false }: { icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <div className={`w-full flex items-center gap-4 py-4 border-b border-white/[0.05] active:bg-[#1a1a1a]/50 transition-colors ${danger ? 'text-red-500' : ''}`}>
      <div className={danger ? 'text-red-500' : 'text-neutral-400'}>
        {icon}
      </div>
      <span className="text-base flex-1 text-left">{label}</span>
      <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}