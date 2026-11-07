import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TierBadge from '../components/TierBadge';
import {
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  FileText,
  User
} from 'lucide-react';

export default function Profile() {
  const { user, refreshUser, toggleCapability } = useAuth();
  const [tierInfo, setTierInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // ID submission state
  const [idType, setIdType] = useState('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [nameAsPrinted, setNameAsPrinted] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [idSubmitting, setIdSubmitting] = useState(false);
  const [idMessage, setIdMessage] = useState('');
  const [idError, setIdError] = useState('');

  useEffect(() => {
    async function loadTier() {
      try {
        const res = await api.get('/users/me/tier');
        if (res.success && res.data) {
          setTierInfo(res.data);
        }
      } catch (_) {}
      setLoading(false);
    }
    loadTier();
  }, [user]);

  const handleCapabilityToggle = async (cap) => {
    if (!user) return;
    const current = user.capabilities || ['renter'];
    const next = current.includes(cap)
      ? (current.length > 1 ? current.filter(c => c !== cap) : current)
      : [...current, cap];
    await toggleCapability(next);
  };

  const handleIdSubmit = async (e) => {
    e.preventDefault();
    if (!consentGiven) {
      setIdError('You must explicitly provide consent for regulatory ID verification');
      return;
    }

    setIdSubmitting(true);
    setIdMessage('');
    setIdError('');

    try {
      const res = await api.post('/users/me/id-verification', {
        idType,
        idNumber,
        nameAsPrinted,
        consentGiven: true
      });
      if (res.success) {
        setIdMessage('ID successfully submitted for manual admin review. Full numbers and photos were not stored.');
        setIdNumber('');
        setNameAsPrinted('');
        await refreshUser();
      }
    } catch (err) {
      setIdError(err.message || 'Submission failed');
    } finally {
      setIdSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xl flex items-center justify-center shadow-md">
            {user.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-slate-900">
              {user.name}
            </h1>
            <p className="text-xs text-slate-500">
              {user.email} · {user.phone}
            </p>
          </div>
        </div>

        <TierBadge tier={user.tier || 'Silver'} size="md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Capabilities & Government ID Verification */}
        <div className="md:col-span-6 space-y-6">
          {/* Capabilities Set Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Account Capabilities</h3>
              <p className="text-xs text-slate-500">
                Rule 5: One account = capabilities set, not an exclusive role. You can hold both.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <label
                onClick={() => handleCapabilityToggle('renter')}
                className={`cursor-pointer p-3.5 rounded-xl border font-semibold flex items-center justify-between transition ${
                  user.capabilities?.includes('renter')
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span>Renter Mode</span>
                <input
                  type="checkbox"
                  checked={user.capabilities?.includes('renter')}
                  readOnly
                  className="rounded text-emerald-600"
                />
              </label>

              <label
                onClick={() => handleCapabilityToggle('lender')}
                className={`cursor-pointer p-3.5 rounded-xl border font-semibold flex items-center justify-between transition ${
                  user.capabilities?.includes('lender')
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span>Lender Mode</span>
                <input
                  type="checkbox"
                  checked={user.capabilities?.includes('lender')}
                  readOnly
                  className="rounded text-emerald-600"
                />
              </label>
            </div>
          </div>

          {/* Government ID Verification (Rule 7) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Government ID Verification</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aadhaar, Voter Card, or Ration Card (Encrypted & Masked)
                </p>
              </div>

              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                user.idVerification?.status === 'verified'
                  ? 'bg-emerald-100 text-emerald-800'
                  : user.idVerification?.status === 'pending_review'
                  ? 'bg-amber-100 text-amber-800'
                  : user.idVerification?.status === 'rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {user.idVerification?.status?.replace('_', ' ') || 'Not Submitted'}
              </span>
            </div>

            {user.idVerification?.status === 'verified' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Government ID Verified</span>
                </div>
                <div>ID Type: <strong className="capitalize">{user.idVerification?.idType}</strong></div>
                <div>Masked Reference: <strong className="font-mono">{user.idVerification?.maskedRef}</strong></div>
                <div>Printed Name: <strong>{user.idVerification?.nameAsPrinted}</strong></div>
              </div>
            ) : user.idVerification?.status === 'pending_review' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Review Pending by Operations Team</span>
                </div>
                <div>Masked Reference: <strong className="font-mono">{user.idVerification?.maskedRef}</strong></div>
                <p className="text-[11px] text-amber-700 mt-1">Our team typically reviews within 2-4 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleIdSubmit} className="space-y-4 pt-2">
                {idError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{idError}</span>
                  </div>
                )}
                {idMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs">
                    {idMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    ID Document Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="voter_card">Voter ID Card</option>
                    <option value="ration_card">Ration Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Card Reference Number
                  </label>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 12-digit Aadhaar or Voter ID"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Privacy Guarantee: Only the last 4 digits are retained (e.g. XXXX9012). Full numbers are never saved.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Name as Printed on Card
                  </label>
                  <input
                    type="text"
                    required
                    value={nameAsPrinted}
                    onChange={(e) => setNameAsPrinted(e.target.value)}
                    placeholder="Full name as printed"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                {/* Consent Checkbox */}
                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="rounded text-emerald-600 mt-0.5"
                  />
                  <span>
                    I consent to government ID verification for peer-to-peer clothing rental.
                    I acknowledge that LoopWear stores only masked references (max last 4 characters) and encrypts sensitive fields at rest using AES-256.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={idSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {idSubmitting ? 'Encrypting & Submitting...' : 'Submit for Verification'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: RFM Tier Engine Breakdown & Benefits */}
        <div className="md:col-span-6 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <span>LoopWear RFM Loyalty Tier</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Formula: Recency × Frequency × Monetary × LoopWear Score
                </p>
              </div>

              <TierBadge tier={tierInfo?.tier || 'Silver'} />
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400">Composite Score</div>
                <div className="text-xl font-bold text-slate-900">{tierInfo?.tierScore || 0}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400">LoopWear Score</div>
                <div className="text-xl font-bold text-purple-700">{tierInfo?.loopWearScore || 3.0}/5.0</div>
              </div>
            </div>

            {/* Current Tier Benefits */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-xs space-y-2">
              <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Your {tierInfo?.tier} Tier Privileges</span>
              </div>
              <ul className="space-y-1.5 text-emerald-900">
                <li>• <strong>{tierInfo?.benefits?.platformFeeDiscountPercent || 0}%</strong> discount on renter platform fees</li>
                <li>• <strong>{tierInfo?.benefits?.depositReductionPercent || 0}%</strong> reduction on security deposit holds</li>
                <li>• Priority Customer Support: <strong>{tierInfo?.benefits?.priorityCustomerSupport ? 'Included' : 'Silver Tier'}</strong></li>
                <li>• Priority Listing Boost: <strong>{tierInfo?.benefits?.priorityListingBoost ? 'Active' : 'Silver Tier'}</strong></li>
              </ul>
            </div>

            {/* Tier History Log */}
            {tierInfo?.history?.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-700">Tier History Log:</div>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {tierInfo.history.map((h, i) => (
                    <div key={i} className="text-[11px] p-2 rounded-lg bg-slate-50 flex justify-between text-slate-600">
                      <span>{h.tier} (Score: {h.score}) - {h.reason}</span>
                      <span className="text-slate-400">{new Date(h.changedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
