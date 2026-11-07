import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import TierBadge from '../components/TierBadge';
import {
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
  CreditCard,
  User,
  Mail,
  Phone,
  Clock,
  ArrowRight,
  AlertCircle,
  FileText,
  BadgeCheck,
  CheckCircle2,
  Receipt
} from 'lucide-react';

export default function Info() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users/me/info');
      if (res.success && res.data) {
        setInfo(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load member profile info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const handleCopyId = () => {
    if (!info?.loopwear_id) return;
    navigator.clipboard.writeText(info.loopwear_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-10 bg-slate-200 rounded-lg w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
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
        <h2 className="text-lg font-bold text-slate-900">Unable to load account info</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={fetchUserInfo}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    loopwear_id,
    tier = {},
    loopwearScore = 3.0,
    accountDetails = {},
    pastTransactions = [],
    maskedSavedPaymentDetails = {}
  } = info || {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner: Member ID & Status */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Authenticated Member
            </span>
            <span className="text-xs text-slate-400">
              Joined {accountDetails.createdAt ? new Date(accountDetails.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '2026'}
            </span>
          </div>

          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight">
            {accountDetails.name}
          </h1>

          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <span className="text-xs text-slate-300 font-medium">LoopWear ID:</span>
              <span className="font-mono font-bold text-sm tracking-wider text-emerald-300">
                {loopwear_id}
              </span>
              <button
                onClick={handleCopyId}
                className="p-1 hover:text-emerald-400 transition"
                title="Copy LoopWear ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <TierBadge tier={tier.current || 'Silver'} size="md" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link
            to="/profile"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition text-center"
          >
            Update Capabilities & ID
          </Link>
          <Link
            to="/cart"
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition text-center"
          >
            View Closet & Cart
          </Link>
        </div>
      </div>

      {/* 3 Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Tier & Active Benefits */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Loyalty Tier Status</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              Score: {tier.score || 0} pts
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Current Tier:</span>
              <span className="font-bold text-slate-900">{tier.current}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Platform Fee Discount:</span>
              <strong className="text-emerald-700">
                {tier.benefits?.platformFeeDiscountPercent || 0}% Off
              </strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Deposit Reduction:</span>
              <strong className="text-emerald-700">
                {tier.benefits?.depositReductionPercent || 0}% Off
              </strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Priority Hub Dry-Cleaning:</span>
              <span className="font-semibold text-slate-800">
                {tier.benefits?.prioritySupport ? 'Enabled' : 'Standard'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: LoopWear Executive Score */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span>LoopWear Score</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Rule 9
            </span>
          </div>

          <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-center space-y-2">
            <div className="text-4xl font-extrabold text-purple-900">
              {Number(loopwearScore).toFixed(1)}
              <span className="text-sm font-normal text-purple-400"> / 5.0</span>
            </div>
            <p className="text-[11px] text-purple-700 max-w-xs mx-auto">
              Executive trust score blended with peer feedback for composite RFM tier calculations.
            </p>
          </div>
        </div>

        {/* Card 3: Masked Saved Payment Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>Saved Payment Details</span>
            </h3>
            {maskedSavedPaymentDetails.isDefault && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Default
              </span>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Method:</span>
              <span className="font-semibold text-slate-900">
                {maskedSavedPaymentDetails.type || 'UPI AutoPay'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Masked Handle:</span>
              <span className="font-mono font-bold text-slate-800">
                {maskedSavedPaymentDetails.handle || 'user***@okhdfcbank'}
              </span>
            </div>
            <div className="pt-1 text-[11px] text-slate-400">
              Zero-Budget Mandate: Card numbers are never stored locally. Refunds & deposit releases route through test mock gateway.
            </div>
          </div>
        </div>
      </div>

      {/* Account Details & Verification Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-slate-700" />
          <span>Account Verification & Capabilities</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-slate-400">Registered Email</div>
            <div className="font-semibold text-slate-900 truncate">{accountDetails.email}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>OTP Verified</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-slate-400">Registered Phone</div>
            <div className="font-semibold text-slate-900 font-mono">{accountDetails.phone}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>OTP Verified</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-slate-400">Account Capabilities</div>
            <div className="font-semibold text-slate-900 capitalize">
              {accountDetails.capabilities?.join(', ') || 'Renter'}
            </div>
            <div className="text-[11px] text-slate-500">Rule 5 Multi-role</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-slate-400">Government ID Status</div>
            <div className="font-semibold capitalize text-slate-900">
              {accountDetails.idVerificationStatus || 'Unverified'}
            </div>
            <div className="text-[11px] text-purple-700 font-medium">
              Manual Admin Review
            </div>
          </div>
        </div>
      </div>

      {/* Past Transactions Ledger */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-slate-700" />
              <span>Past Transactions & Escrow History</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Completed rental transactions with immutable deposit hold, release, and deduction records.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
            {pastTransactions.length} Completed
          </span>
        </div>

        {pastTransactions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
            No completed transactions yet. Completed rentals with resolved security deposits will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Order Code</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Deposit Escrow</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastTransactions.map((tx) => (
                  <tr key={tx.orderId} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {tx.orderCode}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        tx.role === 'renter' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {tx.role === 'renter' ? 'Rented' : 'Lent Out'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      ₹{tx.totalAmount}
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          tx.depositStatus === 'RELEASED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.depositStatus === 'PARTIALLY_REFUNDED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {tx.depositStatus || 'RESOLVED'}
                        </span>
                        {tx.depositReleased > 0 && (
                          <div className="text-[10px] text-emerald-700">
                            Released: ₹{tx.depositReleased}
                          </div>
                        )}
                        {tx.depositDeducted > 0 && (
                          <div className="text-[10px] text-rose-700 font-semibold">
                            Deducted: -₹{tx.depositDeducted}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/orders/${tx.orderId}`}
                        className="text-emerald-700 hover:underline font-semibold"
                      >
                        View Order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
