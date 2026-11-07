import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

export default function HubDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Return QC form state
  const [qcResult, setQcResult] = useState('match');
  const [damageAmount, setDamageAmount] = useState('');
  const [qcNotes, setQcNotes] = useState('');

  const fetchHubOrders = async () => {
    try {
      const res = await api.get('/orders/me');
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchHubOrders();
  }, []);

  const handleQC1 = async (orderId) => {
    setActionLoading(orderId);
    try {
      await api.post(`/orders/${orderId}/qc1`, { passed: true, notes: 'Physical pickup inspection cleared' });
      await fetchHubOrders();
    } catch (err) {
      alert(err.message);
    }
    setActionLoading(null);
  };

  const handleQC2 = async (orderId) => {
    setActionLoading(orderId);
    try {
      await api.post(`/orders/${orderId}/qc2`, { passed: true, notes: 'Hub deep intake QC passed' });
      await fetchHubOrders();
    } catch (err) {
      alert(err.message);
    }
    setActionLoading(null);
  };

  const handleOutboundWash = async (orderId) => {
    setActionLoading(orderId);
    try {
      await api.post(`/orders/${orderId}/hub-wash-outbound`, { notes: 'Eco-friendly sanitized wash completed' });
      await fetchHubOrders();
    } catch (err) {
      alert(err.message);
    }
    setActionLoading(null);
  };

  const handleDispatchRenter = async (orderId) => {
    setActionLoading(orderId);
    try {
      await api.post(`/orders/${orderId}/dispatch-renter`, { notes: 'Dispatched to delivery agent' });
      await fetchHubOrders();
    } catch (err) {
      alert(err.message);
    }
    setActionLoading(null);
  };

  const submitReturnQC = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await api.post(`/orders/${selectedOrder._id}/return-qc`, {
        result: qcResult,
        damageAmount: qcResult === 'mismatch' ? Number(damageAmount) : 0,
        notes: qcNotes
      });
      setSelectedOrder(null);
      setDamageAmount('');
      setQcNotes('');
      await fetchHubOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReturnWash = async (orderId) => {
    setActionLoading(orderId);
    try {
      await api.post(`/orders/${orderId}/hub-wash-return`, { notes: 'Return wash completed' });
      await fetchHubOrders();
    } catch (err) {
      alert(err.message);
    }
    setActionLoading(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
          Operations Terminal
        </div>
        <h1 className="font-serif-luxury text-3xl font-bold text-slate-900">
          Partner Laundry Hub Console
        </h1>
        <p className="text-sm text-slate-600">
          Quality Control (QC1 & QC2), Sanitization Washing, and Return Damage Assessment.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            <span>Active Laundry Queue</span>
          </h2>
          <span className="text-xs font-semibold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
            {orders.length} Total Processed
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading hub operations...</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No items in laundry hub queue.</div>
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
                    Deposit Held: ₹{ord.depositLedger?.holdAmount || ord.pricing?.securityDepositAmount}
                  </div>
                </div>

                {/* Hub Actions Based on State */}
                <div className="flex flex-wrap items-center gap-2">
                  {ord.status === 'LENDER_SUBMITTED' && (
                    <button
                      onClick={() => handleQC1(ord._id)}
                      disabled={actionLoading === ord._id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      Clear QC1 (Pickup Check)
                    </button>
                  )}

                  {ord.status === 'QC1_PASSED' && (
                    <button
                      onClick={() => handleQC2(ord._id)}
                      disabled={actionLoading === ord._id}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      Perform QC2 (Hub Intake Deep Check)
                    </button>
                  )}

                  {ord.status === 'QC2_PASSED' && (
                    <button
                      onClick={() => handleOutboundWash(ord._id)}
                      disabled={actionLoading === ord._id}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      Complete Outbound Eco-Sanitization
                    </button>
                  )}

                  {ord.status === 'HUB_WASHING_OUTBOUND' && (
                    <button
                      onClick={() => handleDispatchRenter(ord._id)}
                      disabled={actionLoading === ord._id}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      Dispatch with Delivery Agent
                    </button>
                  )}

                  {ord.status === 'RETURN_PICKUP' && (
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      Record Return QC (Match/Mismatch)
                    </button>
                  )}

                  {ord.status === 'RETURN_QC' && (
                    <button
                      onClick={() => handleReturnWash(ord._id)}
                      disabled={actionLoading === ord._id}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      Complete Return Post-Rental Wash
                    </button>
                  )}

                  <a
                    href={`/orders/${ord._id}`}
                    className="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
                  >
                    View Timeline
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return QC Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div>
              <h3 className="font-serif-luxury text-xl font-bold text-slate-900">
                Return Quality Inspection
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Order {selectedOrder.orderNumber} · Held Deposit: ₹{selectedOrder.depositLedger?.holdAmount}
              </p>
            </div>

            <form onSubmit={submitReturnQC} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Condition Comparison
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => setQcResult('match')}
                    className={`cursor-pointer p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                      qcResult === 'match'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Match (Pristine)</span>
                  </label>

                  <label
                    onClick={() => setQcResult('mismatch')}
                    className={`cursor-pointer p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                      qcResult === 'mismatch'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Mismatch (Damaged)</span>
                  </label>
                </div>
              </div>

              {qcResult === 'mismatch' && (
                <div>
                  <label className="block text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
                    Damage Deduction Amount (INR)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={selectedOrder.depositLedger?.holdAmount || 10000}
                    value={damageAmount}
                    onChange={(e) => setDamageAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 text-sm font-semibold text-rose-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Deducted from deposit ledger; remaining balance is released to renter.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Inspection Notes
                </label>
                <textarea
                  rows={2}
                  required
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  placeholder="Record seam condition, fabric notes, or stain details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
                >
                  Submit Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
