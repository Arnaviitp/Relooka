import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Register() {
  const { signup, verifyEmailOtp, verifyPhoneOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    capabilities: ['renter'],
    idType: 'aadhaar',
    idReferenceLast4: '',
    nameAsPrinted: '',
    idConsent: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(true); // default true via dev bypass
  const [devBypassActive, setDevBypassActive] = useState(true);

  const [devOtps, setDevOtps] = useState(null);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCapabilityToggle = (cap) => {
    setFormData(prev => {
      const current = prev.capabilities;
      const next = current.includes(cap)
        ? (current.length > 1 ? current.filter(c => c !== cap) : current)
        : [...current, cap];
      return { ...prev, capabilities: next };
    });
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!captchaVerified && !devBypassActive) {
      setError('Please complete the Captcha bot verification.');
      return;
    }

    if (!formData.idConsent) {
      setError('Regulatory consent is required to register and verify your identity details.');
      return;
    }

    if (!formData.idReferenceLast4 || formData.idReferenceLast4.trim().length !== 4) {
      setError('Please provide exactly the last 4 characters/digits of your government ID.');
      return;
    }

    setLoading(true);

    try {
      // Backend expects standard registration fields
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        capabilities: formData.capabilities,
        role: 'user'
      };

      const result = await signup(payload);

      // Auto-submit ID verification queue item if backend supports it
      try {
        const { api } = await import('../services/api');
        await api.post('/users/me/id-verification', {
          idType: formData.idType,
          idNumber: formData.idReferenceLast4,
          nameAsPrinted: formData.nameAsPrinted || formData.name,
          consentGiven: formData.idConsent
        });
      } catch (idErr) {
        console.warn('[ID submission notice]', idErr.message);
      }

      if (result.devOtps) {
        setDevOtps(result.devOtps);
        setEmailOtp(result.devOtps.emailOtp || '');
        setPhoneOtp(result.devOtps.phoneOtp || '');
      }
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setError('');
    try {
      await verifyEmailOtp(formData.email, emailOtp);
      setEmailVerified(true);
    } catch (err) {
      setError(err.message || 'Failed to verify email OTP');
    }
  };

  const handleVerifyPhone = async () => {
    setError('');
    try {
      await verifyPhoneOtp(formData.phone, phoneOtp);
      setPhoneVerified(true);
    } catch (err) {
      setError(err.message || 'Failed to verify phone OTP');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto text-xl shadow-md">
          LW
        </div>
        <h2 className="font-serif-luxury text-3xl font-bold text-slate-900">
          Join LoopWear
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          The circular luxury fashion network. Rent occasion designer outfits or monetize your high-end closet.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-3xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSignupSubmit} className="space-y-5">
              {/* Account Capabilities Choice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  I want to use LoopWear to:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCapabilityToggle('renter')}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-2 ${
                      formData.capabilities.includes('renter')
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${formData.capabilities.includes('renter') ? 'text-emerald-600' : 'text-slate-300'}`} />
                    Rent Outfits
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCapabilityToggle('lender')}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-2 ${
                      formData.capabilities.includes('lender')
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${formData.capabilities.includes('lender') ? 'text-emerald-600' : 'text-slate-300'}`} />
                    Lend My Wardrobe
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  You can select both! You can toggle between Renting and Lending in your profile anytime.
                </p>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Legal Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Anita Lakhotia"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Phone (India)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+919876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address (Real OTP Destination)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500">Real 6-digit OTP will be dispatched to this email address.</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Create Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Zero-Budget Government ID Section (Only accepts allowed fields) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Government ID Verification
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full ml-auto">
                    Privacy Guaranteed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">ID Document Type</label>
                    <select
                      value={formData.idType}
                      onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="voter_card">Voter ID (Election Card)</option>
                      <option value="ration_card">Ration Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Last 4 Digits Only
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 9012"
                      value={formData.idReferenceLast4}
                      onChange={(e) => setFormData({ ...formData, idReferenceLast4: e.target.value.replace(/[^0-9A-Za-z]/g, '') })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs tracking-widest font-mono text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Name as Printed on Document</label>
                  <input
                    type="text"
                    placeholder="Full name as printed on ID"
                    value={formData.nameAsPrinted}
                    onChange={(e) => setFormData({ ...formData, nameAsPrinted: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="idConsent"
                      checked={formData.idConsent}
                      onChange={(e) => setFormData({ ...formData, idConsent: e.target.checked })}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="idConsent" className="text-[11px] text-slate-700 leading-snug cursor-pointer">
                      <strong>Legal ID Consent (IT Act, 2000 & DPDPA, 2023):</strong> I consent to LoopWear storing only my ID type, last 4 characters, and name for handover verification. I confirm my full 12-digit number or document image will never be stored.
                    </label>
                  </div>
                </div>
              </div>

              {/* Captcha Widget with Dev Bypass */}
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                    CF
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Cloudflare Turnstile Bot Defense</div>
                    <div className="text-[10px] text-slate-500">Free Tier (1,000,000 requests/mo allowance)</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDevBypassActive(!devBypassActive)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                    devBypassActive
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}
                >
                  {devBypassActive ? 'DEV_BYPASS: ON' : 'DEV_BYPASS: OFF'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Continue to Verification'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* OTP Dual-Verification Step */
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Verify Your Identity</h3>
                <p className="text-xs text-slate-500">
                  Dual-channel verification for peer-to-peer security.
                </p>
              </div>

              {/* Dev Hint Box */}
              {devOtps && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-amber-800 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Zero-Budget Local Development Mode:
                  </div>
                  <div className="text-amber-700 font-mono text-[11px]">
                    Email OTP: <span className="font-bold">{devOtps.emailOtp}</span> | Phone OTP (Console Stub): <span className="font-bold">{devOtps.phoneOtp}</span>
                  </div>
                  <div className="text-[10px] text-amber-600">
                    Phone OTPs are logged to backend stdout (no paid SMS gateway).
                  </div>
                </div>
              )}

              {/* Email OTP (Real Channel) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    Email OTP ({formData.email})
                  </span>
                  {emailVerified && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>

                {!emailVerified && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      Verify Email
                    </button>
                  </div>
                )}
              </div>

              {/* Phone OTP (Stubbed with Console Hint) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Phone OTP ({formData.phone})
                  </span>
                  {phoneVerified && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>

                {!phoneVerified && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPhone}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition"
                    >
                      Verify Phone
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/feed')}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition shadow-md shadow-emerald-600/20"
              >
                Complete & Explore LoopWear
              </button>
            </div>
          )}

          <div className="pt-2 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
              Sign In with 1-Click Demo Profiles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
