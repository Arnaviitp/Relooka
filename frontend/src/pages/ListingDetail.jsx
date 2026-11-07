import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TierBadge from '../components/TierBadge';
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Check,
  Tag,
  Star,
  Info,
  ArrowRight
} from 'lucide-react';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const [rentalDays, setRentalDays] = useState(3);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    async function loadItem() {
      try {
        const res = await api.get(`/listings/${id}`);
        if (res.success && res.data) {
          setListing(res.data);
        }
      } catch (_) {}
      setLoading(false);
    }
    loadItem();
  }, [id]);

  useEffect(() => {
    async function fetchQuote() {
      if (!listing) return;
      setQuoteLoading(true);
      try {
        const res = await api.post('/pricing/quote', {
          dailyRent: listing.dailyRent,
          retailPrice: listing.retailPrice,
          rentalDays,
          renterTier: user?.tier || 'Silver'
        });
        if (res.success && res.data) {
          setQuote(res.data);
        }
      } catch (_) {}
      setQuoteLoading(false);
    }
    fetchQuote();
  }, [listing, rentalDays, user]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading outfit details...
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Outfit not found</h2>
        <Link to="/feed" className="text-emerald-600 font-semibold hover:underline">
          Return to browse feed
        </Link>
      </div>
    );
  }

  const photos = listing.photos && listing.photos.length > 0
    ? listing.photos
    : ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&auto=format&fit=crop&q=80'];

  const allMedia = [...photos.map(p => ({ type: 'image', url: p }))];
  if (listing.video) {
    allMedia.push({ type: 'video', url: listing.video });
  }

  const activeMedia = allMedia[activeMediaIndex] || allMedia[0];

  const handleBook = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/checkout/${listing._id}?days=${rentalDays}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Gallery & Video */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[3/4] w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative">
            {activeMedia.type === 'video' ? (
              <video
                src={activeMedia.url}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={activeMedia.url}
                alt={listing.title}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80';
                }}
              />
            )}

            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
              Size {listing.size}
            </div>
          </div>

          {/* Thumbnails */}
          {allMedia.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allMedia.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                    activeMediaIndex === idx ? 'border-emerald-600 scale-95' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  {m.type === 'video' ? (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
                      VIDEO
                    </div>
                  ) : (
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Partner Laundry Hub Guarantee */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-2 mt-6">
            <div className="flex items-center gap-2 font-semibold text-amber-950">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>Certified Partner Laundry Hub Routing</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Processed through <strong>{listing.assignedHubId?.partnerLaundryName || 'Local Partner Laundry Hub'}</strong> in {listing.assignedHubId?.city || 'Mumbai'}.
              Inspected through dual quality checks (QC1 & QC2) and sterilized using eco-dry wash before handover.
            </p>
          </div>
        </div>

        {/* Right: Item Details & Pricing Box */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
              {listing.brand || 'Bespoke Designer'}
            </div>
            <h1 className="font-serif-luxury text-3xl font-bold text-slate-900 leading-tight">
              {listing.title}
            </h1>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
              <span>Category: <strong className="capitalize">{listing.category}</strong></span>
              <span>•</span>
              <span>Condition: <strong className="capitalize">{listing.condition?.replace('_', ' ')}</strong></span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800">Description</div>
            <p className="leading-relaxed">{listing.description}</p>
          </div>

          {/* Lender Bio & Tier Badge */}
          {listing.lenderId && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                  {listing.lenderId.name?.charAt(0) || 'L'}
                </div>
                <div>
                  <div className="text-xs text-slate-400">Lender</div>
                  <div className="text-sm font-semibold text-slate-900">{listing.lenderId.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-amber-600 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{listing.lenderId.feedbackScoreAverage || 5.0} Rating</span>
                  </div>
                </div>
              </div>
              <TierBadge tier={listing.lenderId.tier || 'Silver'} />
            </div>
          )}

          {/* Pricing Quote Calculator */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-5">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Daily Rate</span>
                <div className="text-2xl font-bold text-slate-900">
                  ₹{listing.dailyRent}
                  <span className="text-xs font-normal text-slate-500"> /day</span>
                </div>
              </div>

              {quote?.itemRent.durationDiscountPercent > 0 && (
                <div className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {quote.itemRent.durationDiscountPercent}% Multi-day Discount
                </div>
              )}
            </div>

            {/* Rental Duration Options */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Rental Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { days: 3, label: '3 Days' },
                  { days: 7, label: '7 Days (-10%)' },
                  { days: 14, label: '14 Days (-20%)' },
                  { days: 30, label: '30 Days (-35%)' }
                ].map((d) => (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => setRentalDays(d.days)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition ${
                      rentalDays === d.days
                        ? 'bg-slate-900 text-white font-semibold shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CFO Pricing Breakdown Breakdown */}
            {quote && (
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Net Rent ({rentalDays} days)</span>
                  <span className="font-semibold text-slate-900">₹{quote.itemRent.netRent}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <span>Refundable Deposit Hold</span>
                    {quote.securityDeposit.tierReductionPercent > 0 && (
                      <span className="text-[10px] text-emerald-600">
                        ({quote.securityDeposit.tierReductionPercent}% {user?.tier} discount)
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-slate-900">
                    ₹{quote.securityDeposit.payableDeposit}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Hub Sanitization & Dry Clean</span>
                  <span className="text-slate-900">₹{quote.fees.laundryFee}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Hub Logistics & Delivery</span>
                  <span className="text-slate-900">₹{quote.fees.deliveryFee}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee</span>
                  <span className="text-slate-900">₹{quote.fees.platformFee}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-slate-900">Total Payable</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-emerald-700">₹{quote.totalRenterPayable}</span>
                    <div className="text-[10px] text-slate-400">Includes refundable ₹{quote.securityDeposit.payableDeposit} deposit</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={quoteLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
