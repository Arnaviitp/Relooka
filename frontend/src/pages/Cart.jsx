import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  UploadCloud,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
  Package,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('renting'); // 'renting' | 'listed'

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users/me/cart');
      if (res.success && res.data) {
        setCartData(res.data);
        // Default to 'listed' if user has listings and no rentals
        if (res.data.itemsIAmRenting?.length === 0 && res.data.activeListings?.length > 0) {
          setActiveTab('listed');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load your cart overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Live in Catalog</span>;
      case 'rented':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">Rented Out</span>;
      case 'pending_qc':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Hub QC Check</span>;
      case 'draft':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">Draft / Pending</span>;
    }
  };

  const getOrderStateBadge = (status) => {
    if (status === 'IN_USE') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">In Use</span>;
    }
    if (status === 'OUT_FOR_DELIVERY_RENTER') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">Out for Delivery</span>;
    }
    if (status === 'CLOSED') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">Completed</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">{status.replace(/_/g, ' ')}</span>;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Failed to load closet cart</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={fetchCart}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { activeListings = [], itemsIAmRenting = [], summary = {} } = cartData || {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-widest font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Capability-Aware Closet Cart
        </span>
        <h1 className="font-serif-luxury text-3xl font-bold text-slate-900 mt-2">
          My Closet & Rentals
        </h1>
        <p className="text-sm text-slate-600">
          Track items you have listed to earn rental income, and outfits you are currently renting.
        </p>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Items I Listed</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary.activeListingsCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">In your wardrobe</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Rented Out</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.itemsRentedOutCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Generating revenue</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Active Rentals</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{summary.itemsRentingCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">With you or in transit</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Deposit in Escrow</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">₹{summary.totalDepositHeld || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Refundable deposit held</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('renting')}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'renting'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Items I Am Renting</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
            {itemsIAmRenting.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('listed')}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'listed'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Items I Have Listed</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
            {activeListings.length}
          </span>
        </button>
      </div>

      {/* Tab Content: Items I Am Renting */}
      {activeTab === 'renting' && (
        <div className="space-y-4">
          {itemsIAmRenting.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif-luxury text-xl font-bold text-slate-900">
                  No Active Rentals Right Now
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Browse authenticated luxury lehengas, suits, and dresses verified by our partner laundry hubs.
                </p>
              </div>
              <button
                onClick={() => navigate('/feed')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2"
              >
                <span>Browse Outfits</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {itemsIAmRenting.map((order) => {
                const listing = order.listingId || {};
                const coverPhoto = listing.photos?.[0] || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&auto=format&fit=crop&q=60';
                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={coverPhoto}
                        alt={listing.title || 'Outfit'}
                        className="w-20 h-24 object-cover rounded-xl border border-slate-200 shadow-xs"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {listing.brand || 'Designer'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500 font-mono">
                            Order {order.orderNumber || order.orderCode}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 text-base">
                          {listing.title || 'Luxury Garment'}
                        </h4>
                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                          <span>Size: <strong>{listing.size || 'M'}</strong></span>
                          <span>•</span>
                          <span>Duration: <strong>{order.rentalDays} Days</strong></span>
                          <span>•</span>
                          <span>Deposit: <strong>₹{order.depositLedger?.heldAmount || order.pricing?.securityDepositAmount}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Current Stage
                        </div>
                        <div className="mt-1">{getOrderStateBadge(order.status)}</div>
                      </div>

                      <Link
                        to={`/orders/${order._id}`}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition text-center flex items-center justify-center gap-1.5"
                      >
                        <span>Live State Tracker</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Items I Have Listed */}
      {activeTab === 'listed' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Your garments listed on LoopWear. Every item routes through partner laundry hubs for sanitization & verification.
            </p>
            {user?.capabilities?.includes('lender') && (
              <button
                onClick={() => navigate('/lender/upload')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>List New Outfit</span>
              </button>
            )}
          </div>

          {activeListings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mx-auto">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif-luxury text-xl font-bold text-slate-900">
                  No Outfits Listed Yet
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Monetize your unused designer wardrobe! LoopWear takes care of doorstep pickup, hub dry-cleaning, QC, and insured security deposits.
                </p>
              </div>
              <button
                onClick={() => navigate('/lender/upload')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>List an Outfit</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeListings.map((item) => {
                const coverPhoto = item.photos?.[0] || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&auto=format&fit=crop&q=60';
                return (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-48 overflow-hidden bg-slate-100">
                        <img
                          src={coverPhoto}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(item.status)}
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {item.brand || 'Bespoke'}
                          </span>
                          <span className="text-xs text-slate-500 uppercase">{item.category}</span>
                        </div>
                        <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                          <span>Daily Rent:</span>
                          <strong className="text-emerald-700 text-sm">₹{item.dailyRent}/day</strong>
                        </div>
                        {item.assignedHubId && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Hub: {item.assignedHubId.partnerLaundryName || item.assignedHubId.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <Link
                        to={`/listings/${item._id}`}
                        className="w-full block py-2 text-center text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-700"
                      >
                        View Public Listing
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

