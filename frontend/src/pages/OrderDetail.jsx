import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  Building2,
  AlertTriangle,
  Star,
  FileText,
  User,
  ArrowRight,
  Send
} from 'lucide-react';

const STATE_STEPS = [
  'CREATED',
  'CONFIRMED',
  'LENDER_SUBMITTED',
  'QC1_PASSED',
  'QC2_PASSED',
  'HUB_WASHING_OUTBOUND',
  'OUT_FOR_DELIVERY_RENTER',
  'DELIVERED_TO_RENTER',
  'IN_USE',
  'RETURN_PICKUP',
  'RETURN_QC',
  'HUB_WASHING_RETURN',
  'DELIVERED_TO_LENDER',
  'CLOSED'
];

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lender submit modal state
  const [showLenderSubmit, setShowLenderSubmit] = useState(false);
  const [submitCondition, setSubmitCondition] = useState('washed');

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [ratings, setRatings] = useState({
    itemAccuracy: 5,
    itemCondition: 5,
    lenderConduct: 5,
    returnCondition: 5,
    renterConduct: 5,
    comment: ''
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      const [orderRes, feedRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get(`/feedback/orders/${id}`).catch(() => ({ data: [] }))
      ]);
      if (orderRes.success) setOrder(orderRes.data);
      if (feedRes.success) setFeedbacks(feedRes.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handleLenderSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/orders/${id}/lender-submit`, {
        condition: submitCondition,
        notes: 'Handed over by lender'
      });
      setShowLenderSubmit(false);
      await fetchOrderDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkInUse = async () => {
    try {
      await api.post(`/orders/${id}/mark-in-use`, {});
      await fetchOrderDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCloseOrder = async () => {
    try {
      await api.post(`/orders/${id}/close`, {});
      await fetchOrderDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    try {
      await api.post(`/feedback/orders/${id}`, ratings);
      setShowFeedbackModal(false);
      await fetchOrderDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-400">Loading order state machine...</div>;
  if (!order) return <div className="py-20 text-center text-slate-500">Order not found</div>;

  const isRenter = String(order.renterId?._id) === String(user?._id);
  const isLender = String(order.lenderId?._id) === String(user?._id);
  const currentIndex = STATE_STEPS.indexOf(order.status);
  const hasSubmittedFeedback = feedbacks.some(f => String(f.reviewerId?._id) === String(user?._id));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-slate-900">
              Order {order.orderNumber}
            </h1>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {order.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rental Item: <strong>{order.listingId?.title}</strong> · {order.rentalDays} Days Rental
          </p>
        </div>

        {/* Dynamic Context Actions */}
        <div className="flex items-center gap-2">
          {isLender && order.status === 'CONFIRMED' && (
            <button
              onClick={() => setShowLenderSubmit(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md transition"
            >
              Handover Outfit to Agent
            </button>
          )}

          {isRenter && order.status === 'DELIVERED_TO_RENTER' && (
            <button
              onClick={handleMarkInUse}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-md transition"
            >
              Confirm Outfit In-Use
            </button>
          )}

          {(user?.role === 'admin' || user?.role === 'hub_staff') && order.status === 'DELIVERED_TO_LENDER' && (
            <button
              onClick={handleCloseOrder}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs shadow-md transition"
            >
              Resolve Deposit & Close Order
            </button>
          )}

          {order.status === 'CLOSED' && !hasSubmittedFeedback && (isRenter || isLender) && (
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Star className="w-4 h-4 fill-slate-950" />
              <span>Leave Two-Way Feedback</span>
            </button>
          )}
        </div>
      </div>

      {/* 14-Step State Machine Timeline */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Explicit Item Lifecycle State Machine
        </h2>

        <div className="overflow-x-auto pb-4 scrollbar-none">
          <div className="flex items-center min-w-[900px] gap-2">
            {STATE_STEPS.map((st, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div key={st} className="flex-1 flex flex-col items-center text-center relative group">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition ${
                      isPast
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-amber-500 border-amber-600 text-white ring-4 ring-amber-100 animate-pulse'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[9px] mt-1.5 font-semibold uppercase tracking-tight max-w-[70px] truncate ${
                      isCurrent ? 'text-amber-700 font-bold' : isPast ? 'text-emerald-800' : 'text-slate-400'
                    }`}
                    title={st}
                  >
                    {st.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Deposit Ledger & Handover Details */}
        <div className="lg:col-span-6 space-y-6">
          {/* Deposit Ledger Card (Rule 3) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Security Deposit Ledger</span>
              </h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                order.depositLedger?.status === 'RELEASED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : order.depositLedger?.status === 'PARTIALLY_REFUNDED'
                  ? 'bg-amber-100 text-amber-800'
                  : order.depositLedger?.status === 'HELD'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {order.depositLedger?.status || 'PENDING'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400">Total Held Amount</div>
                <div className="text-base font-bold text-slate-900">
                  ₹{order.depositLedger?.holdAmount || order.pricing?.securityDepositAmount}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400">Released to Renter</div>
                <div className="text-base font-bold text-emerald-700">
                  ₹{order.depositLedger?.releasedAmount || 0}
                </div>
              </div>
            </div>

            {/* Deductions from Return QC mismatch */}
            {order.depositLedger?.deductions?.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-xs font-semibold text-rose-700">Damage Deductions:</div>
                {order.depositLedger.deductions.map((d, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs flex justify-between">
                    <span>{d.reason}</span>
                    <strong className="text-rose-800">-₹{d.amount}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Handover Details (Rule 4) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <span>Handover & Government ID Verification</span>
            </h3>

            {isRenter && order.handover?.devOtp && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
                <div className="font-semibold text-emerald-900">Your Handover OTP (Show to Delivery Agent):</div>
                <div className="font-mono text-xl font-bold tracking-widest text-emerald-800">
                  {order.handover.devOtp}
                </div>
              </div>
            )}

            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>ID Presenter Recorded:</span>
                <strong className="capitalize">{order.handover?.presentedBy || 'Pending delivery'}</strong>
              </div>
              {order.handover?.representativeName && (
                <div className="flex justify-between">
                  <span>Representative Name:</span>
                  <strong>{order.handover.representativeName}</strong>
                </div>
              )}
              {order.handover?.idType && (
                <div className="flex justify-between">
                  <span>Government ID Checked:</span>
                  <strong className="capitalize">{order.handover.idType} ({order.handover.idMaskedRef})</strong>
                </div>
              )}
              {order.handover?.verifiedAt && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Handover Cleared:</span>
                  <span>{new Date(order.handover.verifiedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Immutable Audit Event Logs */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-700" />
              <span>Immutable Audit Event Trail</span>
            </h3>
            <p className="text-xs text-slate-400">
              Rule 1 Mandate: Timestamped, append-only logs recording the actor on every transition.
            </p>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
              {order.eventLogs?.map((log, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    <span className="font-mono text-emerald-700">{log.fromState}</span> →{' '}
                    <span className="font-mono text-emerald-700 font-bold">{log.toState}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Actor Role: <strong className="capitalize">{log.actorRole}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lender Submit Modal */}
      {showLenderSubmit && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-serif-luxury text-xl font-bold text-slate-900">
              Declare Outfit Condition
            </h3>
            <p className="text-xs text-slate-600">
              Rule 1: Lender must declare whether the garment is handed over washed or unwashed.
            </p>
            <form onSubmit={handleLenderSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSubmitCondition('washed')}
                  className={`py-3 rounded-xl border text-xs font-semibold ${
                    submitCondition === 'washed' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200'
                  }`}
                >
                  Washed & Ready
                </button>
                <button
                  type="button"
                  onClick={() => setSubmitCondition('unwashed')}
                  className={`py-3 rounded-xl border text-xs font-semibold ${
                    submitCondition === 'unwashed' ? 'border-amber-600 bg-amber-50 text-amber-800' : 'border-slate-200'
                  }`}
                >
                  Unwashed (Hub Cleans)
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLenderSubmit(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Confirm Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Two-Way Feedback Modal (Rule 8) */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div>
              <h3 className="font-serif-luxury text-xl font-bold text-slate-900">
                Two-Way Rental Feedback
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Your feedback directly impacts LoopWear RFM tier calculations. (1-5 per dimension)
              </p>
            </div>

            <form onSubmit={submitFeedback} className="space-y-4">
              {isRenter ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Item Accuracy (1 to 5)</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={ratings.itemAccuracy}
                      onChange={(e) => setRatings({ ...ratings, itemAccuracy: e.target.value })}
                      className="w-full"
                    />
                    <div className="text-right text-xs font-bold text-emerald-700">{ratings.itemAccuracy}/5</div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Item Condition (1 to 5)</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={ratings.itemCondition}
                      onChange={(e) => setRatings({ ...ratings, itemCondition: e.target.value })}
                      className="w-full"
                    />
                    <div className="text-right text-xs font-bold text-emerald-700">{ratings.itemCondition}/5</div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Lender Conduct (1 to 5)</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={ratings.lenderConduct}
                      onChange={(e) => setRatings({ ...ratings, lenderConduct: e.target.value })}
                      className="w-full"
                    />
                    <div className="text-right text-xs font-bold text-emerald-700">{ratings.lenderConduct}/5</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Return Condition (1 to 5)</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={ratings.returnCondition}
                      onChange={(e) => setRatings({ ...ratings, returnCondition: e.target.value })}
                      className="w-full"
                    />
                    <div className="text-right text-xs font-bold text-emerald-700">{ratings.returnCondition}/5</div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Renter Conduct (1 to 5)</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={ratings.renterConduct}
                      onChange={(e) => setRatings({ ...ratings, renterConduct: e.target.value })}
                      className="w-full"
                    />
                    <div className="text-right text-xs font-bold text-emerald-700">{ratings.renterConduct}/5</div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Comment (Optional)</label>
                <textarea
                  rows={2}
                  value={ratings.comment}
                  onChange={(e) => setRatings({ ...ratings, comment: e.target.value })}
                  placeholder="Share details about the rental experience..."
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 py-2 border rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

