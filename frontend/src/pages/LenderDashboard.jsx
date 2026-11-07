import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud,
  DollarSign,
  Package,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function LenderDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLenderData() {
      try {
        const [listingsRes, ordersRes] = await Promise.all([
          api.get('/listings/me/listings'),
          api.get('/orders/me?role=lender')
        ]);
        if (listingsRes.success) setListings(listingsRes.data);
        if (ordersRes.success) setOrders(ordersRes.data);
      } catch (_) {}
      setLoading(false);
    }
    loadLenderData();
  }, []);

  const totalEarnings = orders
    .filter(o => o.status === 'CLOSED')
    .reduce((sum, o) => sum + (o.pricing?.lenderPayout || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
            Lender Closet Console
          </div>
          <h1 className="font-serif-luxury text-3xl font-bold text-slate-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-600">
            Manage your listed outfits, monitor hub quality inspections, and track payouts.
          </p>
        </div>

        <Link
          to="/lender/upload"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-sm transition"
        >
          <UploadCloud className="w-4 h-4" />
          <span>List New Outfit</span>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-medium">Total Listings</div>
          <div className="text-2xl font-bold text-slate-900">{listings.length}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-medium">Active Rentals</div>
          <div className="text-2xl font-bold text-emerald-700">
            {orders.filter(o => o.status !== 'CLOSED' && o.status !== 'CANCELLED').length}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-medium">Net Realized Earnings</div>
          <div className="text-2xl font-bold text-slate-900">₹{totalEarnings}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-medium">Feedback Rating</div>
          <div className="text-2xl font-bold text-amber-600 flex items-center gap-1">
            <span>{user?.feedbackScoreAverage || 5.0}</span>
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Active Lender Listings */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-slate-900 text-lg">My Closet Inventory</h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Loading inventory...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-800">No outfits listed yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start earning circular income from luxury garments hanging idle in your wardrobe.
            </p>
            <Link
              to="/lender/upload"
              className="inline-block mt-2 text-xs font-bold text-emerald-600 hover:underline"
            >
              List your first outfit →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <div
                key={item._id}
                className="rounded-2xl border border-slate-200 p-4 flex gap-4 bg-slate-50/50 hover:bg-white transition"
              >
                <img
                  src={item.photos?.[0] || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200'}
                  alt=""
                  className="w-20 h-24 rounded-xl object-cover"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase mb-1 ${
                      item.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'rented'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">{item.title}</h4>
                    <div className="text-xs text-slate-500">₹{item.dailyRent}/day · Size {item.size}</div>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    QC Status: {item.qc1?.passed && item.qc2?.passed ? '✓ Cleared' : 'Pending Intake'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders as Lender */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 text-lg">Rental Orders on My Outfits</h2>
        {orders.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No active rental orders yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((ord) => (
              <div key={ord._id} className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-slate-500 font-semibold">{ord.orderNumber}</div>
                  <div className="text-sm font-semibold text-slate-900">{ord.listingId?.title}</div>
                  <div className="text-xs text-emerald-700 font-medium">Estimated Payout: ₹{ord.pricing?.lenderPayout}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                    {ord.status}
                  </span>
                  <Link
                    to={`/orders/${ord._id}`}
                    className="p-2 text-slate-400 hover:text-emerald-600 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
