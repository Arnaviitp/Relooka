import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(emailOrPhone, password);
      // Route based on role
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'hub_staff') navigate('/hub');
      else if (data.user.role === 'delivery_agent') navigate('/delivery');
      else navigate('/feed');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, pwd) => {
    setEmailOrPhone(email);
    setPassword(pwd);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto text-xl shadow-md">
          LW
        </div>
        <h2 className="font-serif-luxury text-3xl font-bold text-slate-900">
          Sign in to LoopWear
        </h2>
        <p className="text-sm text-slate-600">
          Access your rentals, lending closet, and account tier
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email or Registered Phone
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="name@example.com or +919876543210"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials for evaluators */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
              Quick 1-Click Demo Profiles
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('admin1@loopwear.in', 'AdminPassword123!')}
                className="p-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 font-medium text-left"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('anita@example.com', 'Password123!')}
                className="p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-medium text-left"
              >
                Verified Lender
              </button>
              <button
                type="button"
                onClick={() => fillDemo('ramesh@hub.in', 'StaffPassword123!')}
                className="p-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 font-medium text-left"
              >
                Hub Staff (Laundry)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('vikram@delivery.in', 'Password123!')}
                className="p-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 font-medium text-left"
              >
                Delivery Agent
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              New to Closet Circle?{' '}
              <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

