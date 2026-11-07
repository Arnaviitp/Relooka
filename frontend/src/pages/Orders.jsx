import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Package, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await api.get(`/orders/me?role=${filterRole}`);
        if (res.success && res.data) {
          setOrders(res.data);
        }
      } catch (_) {}
      setLoading(false);
    }
    loadOrders();
  }, [filterRole]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif-luxury text-3xl font-bold text-slate-900">
            Rental Orders
          </h1>
          <p className="text-sm text-slate-600">
            Track live state machine transitions, view deposit ledger, and submit two-way feedback.
          </p>
        </div>

        {/* Role Filter */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterRole === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilterRole('renter')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterRole === 'renter' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
            }`}
          >
            As Renter
          </button>
          <button
            onClick={() => setFilterRole('lender')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterRole === 'lender' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
            }`}
          >
            As Lender
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-semibold text-slate-900 text-base">No Orders Found</h3>
          <p className="text-xs text-slate-500">You don't have any rental transactions in this view yet.</p>
          <Link to="/feed" className="inline-block text-xs font-bold text-emerald-600 hover:underline">
            Browse outfits now →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <Link
              key={ord._id}
              to={`/orders/${ord._id}`}
              className="block bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-600 transition"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={ord.listingId?.photos?.[0] || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200'}
                    alt=""
                    className="w-16 h-20 rounded-xl object-cover"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{ord.orderNumber}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {ord.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">{ord.listingId?.title}</h3>
                    <div className="text-xs text-slate-500">
                      Total: ₹{ord.pricing?.totalAmount} (Deposit Held: ₹{ord.depositLedger?.holdAmount})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <span>View State Machine & Logs</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

