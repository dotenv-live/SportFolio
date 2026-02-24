import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayer, useBuy, useSell } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, TrendingUp, TrendingDown, X, Info, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

type OrderType = 'limit' | 'market' | 'stop-loss';
type OrderSide = 'buy' | 'sell';

export default function Trading() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: athlete } = usePlayer(id);

  const buyMutation = useBuy();
  const sellMutation = useSell();

  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [units, setUnits] = useState(10);
  const [limitPrice, setLimitPrice] = useState(athlete?.pricePerUnit.toFixed(2) || '');
  const [stopPrice, setStopPrice] = useState('');
  const [validityDays, setValidityDays] = useState(7);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!athlete) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-xl font-bold mb-4">Athlete not found</h1>
          <Link to="/marketplace">
            <Button className="bg-white text-black hover:bg-neutral-200">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = athlete.pricePerUnit;
  const estimatedCost = units * (orderType === 'market' ? currentPrice : parseFloat(limitPrice || '0'));
  const platformFee = estimatedCost * 0.01;
  const totalPayable = estimatedCost + platformFee;

  const handlePlaceOrder = () => {
    // Validation
    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast.error('Please enter a valid limit price');
      return;
    }

    if (orderType === 'stop-loss' && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      toast.error('Please enter a valid stop price');
      return;
    }

    if (units <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmOrder = async () => {
    setIsProcessing(true);
    try {
      if (orderSide === 'buy') {
        await buyMutation.mutateAsync({ playerId: athlete!.id, shares: units });
      } else {
        await sellMutation.mutateAsync({ playerId: athlete!.id, shares: units });
      }
      setIsProcessing(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowConfirmation(false);
        navigate(`/athlete/${athlete!.id}`);
      }, 2000);
    } catch (err: any) {
      setIsProcessing(false);
      toast.error(err?.response?.data?.detail || err.message || 'Order failed');
      setShowConfirmation(false);
    }
  };

  const getOrderTypeDescription = () => {
    switch (orderType) {
      case 'market':
        return 'Execute immediately at current market price';
      case 'limit':
        return 'Execute when price reaches your specified limit';
      case 'stop-loss':
        return 'Automatically sell when price falls to protect your investment';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/athlete/${athlete.id}`}>
              <button className="w-8 h-8 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="font-bold text-base">Advanced Trading</h1>
              <p className="text-xs text-neutral-500">{athlete.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Athlete Info */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/[0.08]">
            <img src={athlete.imageUrl} alt={athlete.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold mb-0.5">{athlete.name}</div>
            <div className="text-xs text-neutral-500">{athlete.role} • {athlete.sport}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">₹{currentPrice.toFixed(2)}</div>
            <div className={`text-xs ${athlete.priceChange24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {athlete.priceChange24h >= 0 ? '+' : ''}{athlete.priceChange24h}%
            </div>
          </div>
        </div>
      </div>

      {/* Buy/Sell Toggle */}
      <div className="px-4 py-4">
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-1 grid grid-cols-2 gap-1">
          <button
            onClick={() => setOrderSide('buy')}
            className={`py-3 rounded-lg font-semibold text-sm transition-colors ${
              orderSide === 'buy'
                ? 'bg-emerald-500 text-black'
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setOrderSide('sell')}
            className={`py-3 rounded-lg font-semibold text-sm transition-colors ${
              orderSide === 'sell'
                ? 'bg-red-500 text-white'
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            Sell
          </button>
        </div>
      </div>

      {/* Order Type Selection */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <label className="text-sm font-semibold mb-3 block">Order Type</label>
        <div className="space-y-2">
          {/* Market Order */}
          <button
            onClick={() => setOrderType('market')}
            className={`w-full p-4 rounded-xl border-2 transition-colors ${
              orderType === 'market'
                ? 'bg-emerald-500/10 border-emerald-500'
                : 'bg-[#0a0a0a] border-white/[0.08] hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="text-left">
                <div className="font-semibold text-sm mb-1">Market Order</div>
                <div className="text-xs text-neutral-500">Execute immediately at current price</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                orderType === 'market' ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'
              }`}>
                {orderType === 'market' && <div className="w-2 h-2 bg-black rounded-full" />}
              </div>
            </div>
          </button>

          {/* Limit Order */}
          <button
            onClick={() => setOrderType('limit')}
            className={`w-full p-4 rounded-xl border-2 transition-colors ${
              orderType === 'limit'
                ? 'bg-emerald-500/10 border-emerald-500'
                : 'bg-[#0a0a0a] border-white/[0.08] hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="text-left">
                <div className="font-semibold text-sm mb-1">Limit Order</div>
                <div className="text-xs text-neutral-500">Set your own price to {orderSide}</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                orderType === 'limit' ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'
              }`}>
                {orderType === 'limit' && <div className="w-2 h-2 bg-black rounded-full" />}
              </div>
            </div>
          </button>

          {/* Stop-Loss Order (only for sell) */}
          {orderSide === 'sell' && (
            <button
              onClick={() => setOrderType('stop-loss')}
              className={`w-full p-4 rounded-xl border-2 transition-colors ${
                orderType === 'stop-loss'
                  ? 'bg-red-500/10 border-red-500'
                  : 'bg-[#0a0a0a] border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="text-left">
                  <div className="font-semibold text-sm mb-1">Stop-Loss Order</div>
                  <div className="text-xs text-neutral-500">Protect your investment from losses</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  orderType === 'stop-loss' ? 'border-red-500 bg-red-500' : 'border-white/20'
                }`}>
                  {orderType === 'stop-loss' && <div className="w-2 h-2 bg-black rounded-full" />}
                </div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Order Details */}
      <div className="px-4 py-4 space-y-4">
        {/* Quantity */}
        <div>
          <label className="text-sm font-semibold mb-2 block">Quantity (Units)</label>
          <input
            type="number"
            value={units}
            onChange={(e) => setUnits(parseInt(e.target.value) || 0)}
            className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
            placeholder="Enter units"
          />
        </div>

        {/* Limit Price */}
        {orderType === 'limit' && (
          <div>
            <label className="text-sm font-semibold mb-2 block">Limit Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="Enter limit price"
            />
            <div className="mt-2 flex items-start gap-2 text-xs text-neutral-500">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Your order will execute when the price reaches ₹{limitPrice || '0.00'}. 
                Current market price: ₹{currentPrice.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Stop Price */}
        {orderType === 'stop-loss' && (
          <div>
            <label className="text-sm font-semibold mb-2 block">Stop Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
              placeholder="Enter stop price"
            />
            <div className="mt-2 flex items-start gap-2 text-xs text-neutral-500">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Your position will automatically sell if the price drops to ₹{stopPrice || '0.00'}. 
                This helps limit your losses.
              </span>
            </div>
          </div>
        )}

        {/* Validity Period - Only for limit and stop-loss */}
        {orderType !== 'market' && (
          <div>
            <label className="text-sm font-semibold mb-2 block">Validity</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setValidityDays(days)}
                  className={`py-3 rounded-lg text-sm font-medium transition-colors ${
                    validityDays === days
                      ? 'bg-emerald-500 text-black'
                      : 'bg-[#0a0a0a] border border-white/[0.08] text-neutral-400 hover:text-white'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="px-4 py-4">
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold mb-3">Order Summary</h3>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Order Type</span>
            <span className="font-medium capitalize">{orderType.replace('-', ' ')}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Quantity</span>
            <span className="font-medium">{units} units</span>
          </div>

          {orderType === 'limit' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Limit Price</span>
              <span className="font-medium">₹{limitPrice || '0.00'}</span>
            </div>
          )}

          {orderType === 'stop-loss' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Stop Price</span>
              <span className="font-medium">₹{stopPrice || '0.00'}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Estimated Cost</span>
            <span className="font-medium">₹{estimatedCost.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Platform Fee (1%)</span>
            <span className="font-medium">₹{platformFee.toFixed(2)}</span>
          </div>

          <div className="border-t border-white/[0.08] pt-3 flex items-center justify-between">
            <span className="font-semibold">Total Payable</span>
            <span className="font-bold text-lg">₹{totalPayable.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/[0.08] px-4 py-4">
        <Button
          onClick={handlePlaceOrder}
          className={`w-full font-semibold py-6 rounded-xl ${
            orderSide === 'buy'
              ? 'bg-emerald-500 text-black hover:bg-emerald-400'
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          Place {orderSide === 'buy' ? 'Buy' : 'Sell'} Order
        </Button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmation(false)}
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
                    <h3 className="text-lg font-bold">Confirm Order</h3>
                    <button
                      onClick={() => setShowConfirmation(false)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">Athlete</span>
                      <span className="font-medium">{athlete.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">Order Type</span>
                      <span className="font-medium capitalize">{orderType.replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">Side</span>
                      <span className={`font-medium ${orderSide === 'buy' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {orderSide.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">Quantity</span>
                      <span className="font-medium">{units} units</span>
                    </div>
                    {orderType === 'limit' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-400">Limit Price</span>
                        <span className="font-medium">₹{limitPrice}</span>
                      </div>
                    )}
                    {orderType === 'stop-loss' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-400">Stop Price</span>
                        <span className="font-medium">₹{stopPrice}</span>
                      </div>
                    )}
                    {orderType !== 'market' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-400">Validity</span>
                        <span className="font-medium">{validityDays} days</span>
                      </div>
                    )}
                    <div className="border-t border-white/[0.08] pt-3 flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-lg">₹{totalPayable.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <Info className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-500">
                      {orderType === 'market' && `This order will execute immediately at the current market price.`}
                      {orderType === 'limit' && `This order will only execute if the price reaches ₹${limitPrice}.`}
                      {orderType === 'stop-loss' && `This order will automatically sell your position if the price drops to ₹${stopPrice}.`}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowConfirmation(false)}
                      className="flex-1 bg-white/5 text-white font-semibold py-6 rounded-xl hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmOrder}
                      disabled={isProcessing}
                      className={`flex-1 font-semibold py-6 rounded-xl ${
                        orderSide === 'buy'
                          ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 border-2 rounded-full animate-spin ${
                            orderSide === 'buy' 
                              ? 'border-black/30 border-t-black' 
                              : 'border-white/30 border-t-white'
                          }`} />
                          Processing...
                        </div>
                      ) : (
                        'Confirm Order'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    orderSide === 'buy' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  }`}>
                    <CheckCircle className={`w-8 h-8 ${orderSide === 'buy' ? 'text-emerald-500' : 'text-red-500'}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Order Placed!</h3>
                  <p className="text-neutral-400 mb-6">
                    Your {orderType} order for {units} units of {athlete.name} has been placed successfully.
                  </p>
                  <Button
                    onClick={() => navigate(`/athlete/${athlete.id}`)}
                    className={`w-full font-semibold py-6 rounded-xl ${
                      orderSide === 'buy'
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    Done
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
