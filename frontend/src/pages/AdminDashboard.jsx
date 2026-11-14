import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Users,
  Search,
  AlertCircle,
  Bell,
  Check,
  ScanFace
} from 'lucide-react';

export default function AdminDashboard() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Nightly recompute state
  const [recomputeResult, setRecomputeResult] = useState(null);
  const [recomputing, setRecomputing] = useState(false);

  // LoopWear Score executive override
  const [targetUserId, setTargetUserId] = useState('');
  const [newScore, setNewScore] = useState(4.5);
  const [scoreMessage, setScoreMessage] = useState('');

  // In-app notifications state
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  const loadPendingReviews = async () => {
    try {
      const res = await api.get('/users/admin/id-reviews');
      if (res.success && res.data) {
        setReviews(res.data);
      }
    } catch (_) {}
    setLoading(false);
  };

  const loadNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await api.get('/notifications');
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (_) {}
    setLoadingNotifs(false);
  };

  useEffect(() => {
    loadPendingReviews();
    loadNotifications();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await api.post(`/users/admin/id-reviews/${userId}`, { decision: 'approved' });
      await loadPendingReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectingId) return;

    try {
      await api.post(`/users/admin/id-reviews/${rejectingId}`, {
        decision: 'rejected',
        rejectionReason: rejectionReason || 'Details could not be verified'
      });
      setRejectingId(null);
      setRejectionReason('');
      await loadPendingReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  const triggerNightlyTierJob = async () => {
    setRecomputing(true);
    try {
      const res = await api.post('/tiers/nightly-recompute', {});
      if (res.success) {
        setRecomputeResult(res.data);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setRecomputing(false);
    }
  };

  const handleUpdateLoopWearScore = async (e) => {
    e.preventDefault();
    setScoreMessage('');
    try {
      const res = await api.patch(`/users/admin/${targetUserId}/loopwear-score`, {
        score: Number(newScore)
      });
      if (res.success) {
        setScoreMessage(`Score successfully updated to ${res.data.loopWearScore} for ${res.data.name}`);
        setTargetUserId('');
      }
    } catch (err) {
      setScoreMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-1">
          Executive Operations Console
        </div>
        <h1 className="font-serif-luxury text-3xl font-bold text-slate-900">
          Admin Governance & Tier Control
        </h1>
        <p className="text-sm text-slate-600">
          Manual ID review queue, executive LoopWear scoring, and automated nightly tier calculation.
        </p>
      </div>

      {/* Manual ID Review Queue (Mandated by Zero-Budget Architecture) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span>Government ID Verification Review Queue</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Zero-Budget Mandate: IDs are reviewed in-house. Full ID numbers & photos are NEVER stored; only masked references and printed names appear here.
            </p>
          </div>
          <span className="text-xs font-semibold bg-purple-50 text-purple-800 px-3 py-1 rounded-full border border-purple-200">
            {reviews.length} Pending
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading review queue...</div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No pending ID submissions.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((r) => (
              <div key={r.userId} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900">{r.name}</span>
                    <span className="text-xs text-slate-500 font-mono">({r.email})</span>
                    {r.agentVerdict && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        r.agentVerdict === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.agentVerdict === 'MANUAL_REVIEW'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        <ScanFace className="w-3 h-3" />
                        <span>AI Agent: {r.agentVerdict}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                    <span>ID Type: <strong className="capitalize">{r.idType}</strong></span>
                    <span>•</span>
                    <span>Masked Ref: <strong className="font-mono text-emerald-700">{r.maskedRef}</strong></span>
                    <span>•</span>
                    <span>Name as Printed: <strong>{r.nameAsPrinted || 'N/A'}</strong></span>
                    {r.reasonCode && (
                      <>
                        <span>•</span>
                        <span className="text-amber-700 font-mono">Reason: {r.reasonCode}</span>
                      </>
                    )}
                  </div>
                  {r.checksSummary && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                      <span>Doc OCR: <strong>{r.checksSummary.document_readability || 'PASSED'}</strong></span>
                      <span>•</span>
                      <span>Face Quality: <strong>{r.checksSummary.face_quality || 'PASSED'}</strong></span>
                      <span>•</span>
                      <span>Liveness PAD: <strong>{r.checksSummary.liveness || 'PASSED'}</strong></span>
                      <span>•</span>
                      <span>SFace Match: <strong>{r.checksSummary.face_match || 'PASSED'}</strong></span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(r.userId)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve ID</span>
                  </button>

                  <button
                    onClick={() => setRejectingId(r.userId)}
                    className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two Column: Nightly Cron Trigger & Executive LoopWear Scoring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Nightly Tier Recompute */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                <span>Nightly Tier Engine Cron</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Idempotent runner recalculating RFM scores across all users. Triggerable locally or via free GitHub Actions scheduler.
              </p>
            </div>
          </div>

          <button
            onClick={triggerNightlyTierJob}
            disabled={recomputing}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl text-xs shadow-md transition disabled:opacity-50"
          >
            {recomputing ? 'Recomputing Tiers...' : 'Trigger Nightly Tier Job Now'}
          </button>

          {recomputeResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
              <div className="font-semibold">Recomputation Complete:</div>
              <div>Processed Users: {recomputeResult.processedCount}</div>
              <div>Tier Upgrades: {recomputeResult.upgradesCount}</div>
            </div>
          )}
        </div>

        {/* Executive LoopWear Score Overrides */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>Executive LoopWear Score Input</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Rule 9: Executives enter the qualitative LoopWear score (1.0 - 5.0) which is blended with peer feedback for composite RFM tiers.
            </p>
          </div>

          {scoreMessage && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800">
              {scoreMessage}
            </div>
          )}

          <form onSubmit={handleUpdateLoopWearScore} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target User ID
              </label>
              <input
                type="text"
                required
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="User Mongo ObjectId"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                LoopWear Executive Score (1.0 to 5.0)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                required
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md transition"
            >
              Update Score
            </button>
          </form>
        </div>
      </div>

      {/* In-App Notifications List (Rule M6 / Screen 9) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              <span>In-App System Notifications</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Zero-Budget Mandate: In-app notification queue is the primary channel, with swappable FCM push adapter as fallback.
            </p>
          </div>
          <button
            onClick={loadNotifications}
            className="text-xs text-emerald-700 hover:underline font-semibold flex items-center gap-1"
          >
            <span>Refresh</span>
          </button>
        </div>

        {loadingNotifs ? (
          <div className="py-10 text-center text-slate-400 text-sm">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No system notifications yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`p-4 flex items-start justify-between gap-4 transition ${
                  n.isRead ? 'bg-white opacity-70' : 'bg-emerald-50/30'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    )}
                    <span className="font-semibold text-xs text-slate-900">{n.title}</span>
                    <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {n.type || 'SYSTEM'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                  <div className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={async () => {
                      try {
                        await api.patch(`/notifications/${n._id}/read`, {});
                        setNotifications((prev) =>
                          prev.map((item) =>
                            item._id === n._id ? { ...item, isRead: true } : item
                          )
                        );
                      } catch (_) {}
                    }}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-serif-luxury text-xl font-bold text-slate-900">
              Reject Verification Submission
            </h3>
            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Rejection Reason
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Printed name does not match registered account name..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

