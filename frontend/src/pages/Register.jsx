import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Phone, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

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
    role: 'user'
  });

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
        ? (current.length > 1 ? current.filter(c => c !== cap) : current) // keep at least 1
        : [...current, cap];
      return { ...prev, capabilities: next };
    });
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signup(formData);
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
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto text-xl shadow-md">
          LW
        </div>
        <h2 className="font-serif-luxury text-3xl font-bold text-slate-900">
          Join LoopWear
        </h2>
        <p className="text-sm text-slate-600">
          The circular luxury fashion network for lenders and renters in India
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-3xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Aanya Sharma"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address (Real OTP Destination)
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="aanya@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number (India)
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+919876543210"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm"
                />
              </div>

              {/* Capabilities Set Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Account Capabilities (You can hold both!)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => handleCapabilityToggle('renter')}
                    className={`cursor-pointer p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                      formData.capabilities.includes('renter')
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Renter (Rent outfits)</span>
                    <input
                      type="checkbox"
                      checked={formData.capabilities.includes('renter')}
                      readOnly
                      className="rounded text-emerald-600"
                    />
                  </label>

                  <label
                    onClick={() => handleCapabilityToggle('lender')}
                    className={`cursor-pointer p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                      formData.capabilities.includes('lender')
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Lender (List closet)</span>
                    <input
                      type="checkbox"
                      checked={formData.capabilities.includes('lender')}
                      readOnly
                      className="rounded text-emerald-600"
                    />
                  </label>
                </div>
              </div>

              {/* Captcha bypass pill */}
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cloudflare Turnstile Verified (Dev Bypass Active)</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-semibold text-slate-900 text-lg">Verify Your Identity</h3>
                <p className="text-xs text-slate-600">
                  We sent verification passcodes to your email and phone.
                </p>
              </div>

              {devOtps && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <div className="font-semibold">Dev Auto-fill OTPs:</div>
                  <div>Email OTP: <code className="bg-amber-100 px-1 rounded">{devOtps.emailOtp}</code></div>
                  <div>Phone OTP (Console Stub): <code className="bg-amber-100 px-1 rounded">{devOtps.phoneOtp}</code></div>
                </div>
              )}

              {/* Email OTP Verification */}
              <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>1. Email Verification Code</span>
                  {emailVerified && <span className="text-emerald-600">✓ Verified</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    disabled={emailVerified}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={emailVerified || emailOtp.length !== 6}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              </div>

              {/* Phone OTP Verification */}
              <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>2. Mobile SMS Verification Code</span>
                  {phoneVerified && <span className="text-emerald-600">✓ Verified</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    disabled={phoneVerified}
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPhone}
                    disabled={phoneVerified || phoneOtp.length !== 6}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/feed')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl shadow-md transition text-sm"
              >
                Continue to LoopWear
              </button>
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

