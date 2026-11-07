import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Truck,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Package
} from 'lucide-react';

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Handover form state
  const [presentedBy, setPresentedBy] = useState('renter');
  const [representativeName, setRepresentativeName] = useState('');
  const [idType, setIdType] = useState('aadhaar');
  const [idMaskedRef, setIdMaskedRef] = useState('');
  const [otpEntered, setOtpEntered] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/me');
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReturnPickup = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/return-pickup`, { notes: 'Collected return package from renter' });
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeliverToLender = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/deliver-lender`, { notes: 'Handed back safely to lender' });
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const submitHandover = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post(`/orders/${selectedOrder._id}/handover`, {
        otpEntered,
        presentedBy,
        representativeName: presentedBy === 'representative' ? representativeName : undefined,
        idType,
        idMaskedRef: idMaskedRef.startsWith('XXXX') ? idMaskedRef : `XXXX${idMaskedRef.slice(-4)}`
      });

      if (res.success) {
        setSelectedOrder(null);
        setOtpEntered('');
        setIdMaskedRef('');
        setRepresentativeName('');
        await fetchOrders();
      }
    } catch (err) {
      setError(err.message || 'Handover verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
          Field Logistics Console
        </div>
        <h1 className="font-serif-luxury text-3xl font-bold text-slate-900">
          Delivery & Handover Verification Portal
        </h1>
        <p className="text-sm text-slate-600">
          Rule 4 Binding Mandate: Orders cannot become delivered without registered ID inspection & recipient OTP verification.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <span>Active Deliveries</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading deliveries...</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No active delivery assignments.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((ord) => (
              <div key={ord._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{ord.orderNumber}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {ord.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900">{ord.listingId?.title}</h4>
                  <div className="text-xs text-slate-500">
                    Destination: {ord.deliveryAddress?.street}, {ord.deliveryAddress?.city} ({ord.deliveryAddress?.pincode})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {ord.status === 'OUT_FOR_DELIVERY_RENTER' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setError('');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Verify ID & Confirm Handover</span>
                    </button>
                  )}

                  {ord.status === 'IN_USE' && (
                    <button
                      onClick={() => handleReturnPickup(ord._id)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      Collect Return from Renter
                    </button>
                  )}

                  {ord.status === 'HUB_WASHING_RETURN' && (
                    <button
                      onClick={() => handleDeliverToLender(ord._id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      Deliver Back to Lender
                    </button>
                  )}

                  <a
                    href={`/orders/${ord._id}`}
                    className="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
                  >
                    View Details
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mandatory Handover ID & OTP Verification Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Rule 4 Verification Gate</span>
              </div>
              <h3 className="font-serif-luxury text-2xl font-bold text-slate-900">
                Confirm Handover to Recipient
              </h3>
              <p className="text-xs text-slate-600">
                Check government ID against registered profile details and enter recipient's 6-digit OTP.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submitHandover} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  ID Presented By
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPresentedBy('renter')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      presentedBy === 'renter'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Registered Renter
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresentedBy('representative')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      presentedBy === 'representative'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Representative / Family
                  </button>
                </div>
              </div>

              {presentedBy === 'representative' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Representative Name & Relation
                  </label>
                  <input
                    type="text"
                    required
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    placeholder="e.g. Priya Sharma (Sister)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Government ID Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="voter_card">Voter Card</option>
                    <option value="ration_card">Ration Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Last 4 Digits of ID
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={idMaskedRef}
                    onChange={(e) => setIdMaskedRef(e.target.value)}
                    placeholder="e.g. 9012"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Recipient Handover OTP (6 Digits)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpEntered}
                    onChange={(e) => setOtpEntered(e.target.value)}
                    placeholder="Enter recipient OTP"
                    className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-300 text-sm font-mono tracking-widest font-bold"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Verifying...' : 'Complete Drop-off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
