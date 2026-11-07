import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Star,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  User,
  ShoppingBag
} from 'lucide-react';

function StarRating({ label, value, onChange, description }) {
  const [hover, setHover] = useState(0);

  const getLabel = (val) => {
    switch (val) {
      case 5: return 'Exceptional (5/5)';
      case 4: return 'Very Good (4/5)';
      case 3: return 'Acceptable (3/5)';
      case 2: return 'Below Expectations (2/5)';
      case 1: return 'Poor (1/5)';
      default: return 'Select Rating';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="font-medium text-emerald-700">{getLabel(hover || value)}</span>
      </div>
      {description && <p className="text-[11px] text-slate-500">{description}</p>}
      <div className="flex items-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hover || value)
                  ? 'fill-amber-400 text-amber-500'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Feedback() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [closedOrders, setClosedOrders] = useState([]);
  const [feedbacksMap, setFeedbacksMap] = useState({});
  const [tierInfo, setTierInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active order modal to submit feedback
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Form ratings
  const [itemAccuracy, setItemAccuracy] = useState(5);
  const [itemCondition, setItemCondition] = useState(5);
  const [lenderConduct, setLenderConduct] = useState(5);
  const [returnCondition, setReturnCondition] = useState(5);
  const [renterConduct, setRenterConduct] = useState(5);
  const [comment, setComment] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, tierRes] = await Promise.all([
        api.get('/orders/me'),
        api.get('/users/me/tier').catch(() => ({ success: false }))
      ]);

      if (tierRes.success && tierRes.data) {
        setTierInfo(tierRes.data);
      }

      if (ordersRes.success && ordersRes.data) {
        const allOrders = ordersRes.data;
        const closed = allOrders.filter(o => o.status === 'CLOSED');
        setOrders(allOrders);
        setClosedOrders(closed);

        // Fetch feedback for all closed orders
        const map = {};
        await Promise.all(
          closed.map(async (ord) => {
            try {
              const fbRes = await api.get(`/feedback/orders/${ord._id}`);
              if (fbRes.success && fbRes.data) {
                map[ord._id] = fbRes.data;
              }
            } catch (_) {}
          })
        );
        setFeedbacksMap(map);
      }
    } catch (err) {
      setError(err.message || 'Failed to load feedback records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openRatingModal = (order) => {
    setSelectedOrder(order);
    setItemAccuracy(5);
    setItemCondition(5);
    setLenderConduct(5);
    setReturnCondition(5);
    setRenterConduct(5);
    setComment('');
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const isRenter = String(selectedOrder.renterId?._id || selectedOrder.renterId) === String(user?._id);

    const payload = isRenter
      ? { itemAccuracy, itemCondition, lenderConduct, comment }
      : { returnCondition, renterConduct, comment };

    try {
      const res = await api.post(`/feedback/orders/${selectedOrder._id}`, payload);
      if (res.success) {
        setSubmitSuccess('Feedback submitted successfully! Thank you for maintaining community trust.');
        // Update local map
        setFeedbacksMap((prev) => ({
          ...prev,
          [selectedOrder._id]: [...(prev[selectedOrder._id] || []), res.data]
        }));
        setTimeout(() => {
          setSelectedOrder(null);
          loadData();
        }, 1200);
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
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
        <h2 className="text-lg font-bold text-slate-900">Unable to load feedback</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Split closed orders into pending user feedback and completed
  const pendingOrders = closedOrders.filter((ord) => {
    const list = feedbacksMap[ord._id] || [];
    const hasRated = list.some(
      (f) => String(f.reviewerId?._id || f.reviewerId) === String(user?._id)
    );
    return !hasRated;
  });

  const ratedOrders = closedOrders.filter((ord) => {
    const list = feedbacksMap[ord._id] || [];
    const hasRated = list.some(
      (f) => String(f.reviewerId?._id || f.reviewerId) === String(user?._id)
    );
    return hasRated;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-widest font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Rule 8 Mandate
        </span>
        <h1 className="font-serif-luxury text-3xl font-bold text-slate-900 mt-2">
          Two-Way Community Feedback
        </h1>
        <p className="text-sm text-slate-600">
          Both renters and lenders rate closed orders across objective condition and conduct dimensions.
          Peer feedback is directly aggregated by the RFM Tier Engine to calculate user loyalty scores and platform discounts.
        </p>
      </div>

      {/* Community Score Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Your LoopWear Reputation Score
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-extrabold text-white">
              {(tierInfo?.feedbackScoreAverage || 5.0).toFixed(1)}
            </span>
            <span className="text-slate-400 text-sm">/ 5.0</span>
            <div className="flex text-amber-400 ml-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(tierInfo?.feedbackScoreAverage || 5.0)
                      ? 'fill-amber-400'
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-lg">
            Based on {tierInfo?.feedbackCount || 0} authenticated reviews from peer rentals. Maintain a 4.5+ score to unlock reduced security deposits and lower platform fees.
          </p>
        </div>

        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-xs space-y-1.5 w-full md:w-auto">
          <div className="text-slate-300 font-medium">Eligible Closed Orders:</div>
          <div className="text-lg font-bold text-white">{closedOrders.length} Completed</div>
          <div className="text-emerald-400 font-semibold">{pendingOrders.length} Pending Review</div>
        </div>
      </div>

      {/* Pending Reviews Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Orders Awaiting Your Rating ({pendingOrders.length})</span>
          </h2>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-semibold text-slate-900 text-sm">All caught up!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You have submitted feedback for all completed rental orders. New orders will appear here once returned and closed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOrders.map((ord) => {
              const isRenter = String(ord.renterId?._id || ord.renterId) === String(user?._id);
              const listing = ord.listingId || {};
              return (
                <div
                  key={ord._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-300 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400">Order {ord.orderNumber || ord.orderCode}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                        isRenter ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {isRenter ? 'You were Renter' : 'You were Lender'}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-900 text-base">
                      {listing.title || 'Designer Garment'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Rental closed on {new Date(ord.updatedAt || ord.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => openRatingModal(ord)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Star className="w-4 h-4 fill-slate-950" />
                    <span>Rate {isRenter ? 'Lender & Outfit' : 'Renter Return'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Submitted Reviews History */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <span>Completed Reviews History ({ratedOrders.length})</span>
        </h2>

        {ratedOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm text-xs text-slate-400">
            No completed reviews yet.
          </div>
        ) : (
          <div className="space-y-4">
            {ratedOrders.map((ord) => {
              const fbs = feedbacksMap[ord._id] || [];
              const myFeedback = fbs.find(
                (f) => String(f.reviewerId?._id || f.reviewerId) === String(user?._id)
              );
              const peerFeedback = fbs.find(
                (f) => String(f.reviewerId?._id || f.reviewerId) !== String(user?._id)
              );

              return (
                <div
                  key={ord._id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {ord.listingId?.title || 'Rental Item'}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Order #{ord.orderNumber || ord.orderCode} · Closed on{' '}
                        {new Date(ord.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Link
                      to={`/orders/${ord._id}`}
                      className="text-xs text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>View Order</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* My Submitted Feedback */}
                    {myFeedback && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">Your Feedback Given</span>
                          <span className="font-bold text-amber-700">
                            ★ {myFeedback.averageScore?.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-slate-600 space-y-1 text-[11px]">
                          {myFeedback.reviewerRole === 'renter' ? (
                            <>
                              <div>Accuracy: {myFeedback.itemAccuracy}/5 · Condition: {myFeedback.itemCondition}/5</div>
                              <div>Lender Conduct: {myFeedback.lenderConduct}/5</div>
                            </>
                          ) : (
                            <>
                              <div>Return Condition: {myFeedback.returnCondition}/5</div>
                              <div>Renter Conduct: {myFeedback.renterConduct}/5</div>
                            </>
                          )}
                          {myFeedback.comment && (
                            <p className="italic text-slate-700 mt-2 bg-white p-2 rounded-lg border border-slate-200">
                              "{myFeedback.comment}"
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Peer Feedback Received */}
                    {peerFeedback ? (
                      <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-emerald-900">
                            Feedback From {peerFeedback.reviewerId?.name || 'Counterparty'}
                          </span>
                          <span className="font-bold text-emerald-700">
                            ★ {peerFeedback.averageScore?.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-slate-600 space-y-1 text-[11px]">
                          {peerFeedback.comment ? (
                            <p className="italic text-slate-800 bg-white p-2 rounded-lg border border-emerald-100">
                              "{peerFeedback.comment}"
                            </p>
                          ) : (
                            <div className="text-slate-400">No written comment provided.</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 flex items-center justify-center">
                        Waiting for peer to submit rating...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Feedback Submission Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                Two-Way Peer Review
              </span>
              <h3 className="font-serif-luxury text-2xl font-bold text-slate-900">
                Rate Order #{selectedOrder.orderNumber || selectedOrder.orderCode}
              </h3>
              <p className="text-xs text-slate-500">
                Item: <strong>{selectedOrder.listingId?.title}</strong>
              </p>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                {submitSuccess}
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="space-y-5">
              {String(selectedOrder.renterId?._id || selectedOrder.renterId) === String(user?._id) ? (
                // Renter rating dimensions
                <>
                  <StarRating
                    label="Item Accuracy"
                    description="Did the item match photos, size, and brand description?"
                    value={itemAccuracy}
                    onChange={setItemAccuracy}
                  />

                  <StarRating
                    label="Item Condition & Cleanliness"
                    description="Was the outfit clean, sanitized, and in wearable state?"
                    value={itemCondition}
                    onChange={setItemCondition}
                  />

                  <StarRating
                    label="Lender Conduct & Handover"
                    description="Promptness and communication from the wardrobe lender"
                    value={lenderConduct}
                    onChange={setLenderConduct}
                  />
                </>
              ) : (
                // Lender rating dimensions
                <>
                  <StarRating
                    label="Return Condition"
                    description="Was the outfit returned clean without tears, stains, or damage?"
                    value={returnCondition}
                    onChange={setReturnCondition}
                  />

                  <StarRating
                    label="Renter Conduct"
                    description="Promptness during pickup and communication"
                    value={renterConduct}
                    onChange={setRenterConduct}
                  />
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Optional Comments
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about the fit, experience, or condition..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  disabled={submitting}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Rating</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
