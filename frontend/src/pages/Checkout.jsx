import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, CreditCard, Lock, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Checkout() {
  const { listingId } = useParams();
  const [searchParams] = useSearchParams();
  const rentalDays = parseInt(searchParams.get('days') || '3', 10);

  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: 'Mumbai',
    pincode: '400050'
  });

  useEffect(() => {
    async function loadData() {
      try {
        const itemRes = await api.get(`/listings/${listingId}`);
        if (itemRes.success) {
          setListing(itemRes.data);
          const quoteRes = await api.post('/pricing/quote', {
            dailyRent: itemRes.data.dailyRent,
            retailPrice: itemRes.data.retailPrice,
            rentalDays,
            renterTier: user?.tier || 'Silver'
          });
          if (quoteRes.success) {
            setQuote(quoteRes.data);
          }
        }
      } catch (err) {
        setError('Failed to load checkout details');
      }
      setLoading(false);
    }
    loadData();
  }, [listingId, rentalDays, user]);

  const handlePayAndCreateOrder = async (e) => {
    e.preventDefault();
    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.pincode) {
      setError('Please provide a complete delivery address');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Create Order
      const createRes = await api.post('/orders', {
        listingId,
        rentalDays,
        deliveryAddress
      });

      if (!createRes.success) {
        throw new Error(createRes.message || 'Order creation failed');
      }

      const orderId = createRes.data.order._id;
      const gatewayOrderId = createRes.data.paymentIntent.gatewayOrderId;

      // 2. Simulate Payment Confirmation (Mock Gateway)
      const payRes = await api.post(`/orders/${orderId}/confirm-payment`, {
        paymentId: `pay_mock_${Date.now()}`,
        gatewayOrderId
      });

      if (payRes.success) {
        navigate(`/orders/${orderId}`);
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Preparing checkout...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-serif-luxury text-3xl font-bold text-slate-900 mb-6">
        Secure Rental Checkout
      </h1>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: Address & Payment Details */}
        <form onSubmit={handlePayAndCreateOrder} className="md:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <span>1. Delivery Destination</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Street Address & Apartment
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress.street}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                  placeholder="e.g. 402 Palm Breeze, Linking Road"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress.pincode}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>2. Payment Gateway</span>
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
                Mock / Test Mode
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Zero-Budget Built-in MockGateway</span>
              </div>
              <p>
                As mandated by LoopWear rules, tests and demos use the built-in Mock Gateway. No real card or bank credentials are required. Clicking Pay simulates instant payment and escrow hold.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {submitting ? 'Processing Payment...' : `Confirm & Pay ₹${quote?.totalRenterPayable || '...'}`}
            </button>
          </div>
        </form>

        {/* Right: Order Summary */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 text-base">Order Summary</h3>

            {listing && (
              <div className="flex gap-4 pb-4 border-b border-slate-100">
                <img
                  src={listing.photos?.[0] || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300'}
                  alt=""
                  className="w-16 h-20 rounded-xl object-cover"
                />
                <div>
                  <div className="text-xs text-emerald-600 font-semibold">{listing.brand}</div>
                  <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{listing.title}</h4>
                  <div className="text-xs text-slate-500 mt-1">Size: {listing.size} · {rentalDays} Days Rental</div>
                </div>
              </div>
            )}

            {/* Line items */}
            {quote && (
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Net Rent</span>
                  <span className="font-semibold text-slate-900">₹{quote.itemRent.netRent}</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Deposit Hold (Refundable)</span>
                  <span className="font-semibold text-slate-900">₹{quote.securityDeposit.payableDeposit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hub Sanitization Fee</span>
                  <span>₹{quote.fees.laundryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hub Logistics & Delivery</span>
                  <span>₹{quote.fees.deliveryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span>₹{quote.fees.platformFee}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                  <span>Total Charged</span>
                  <span className="text-xl text-emerald-700">₹{quote.totalRenterPayable}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

