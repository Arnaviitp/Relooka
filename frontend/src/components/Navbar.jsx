import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TierBadge from './TierBadge';
import {
  ShoppingBag,
  UploadCloud,
  Layers,
  Truck,
  Building2,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Repeat,
  Sparkles,
  Star,
  Info as InfoIcon,
  LayoutGrid
} from 'lucide-react';

export default function Navbar() {
  const { user, activeCapability, switchActiveCapability, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isLender = user?.capabilities?.includes('lender');
  const isRenter = user?.capabilities?.includes('renter');

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
                RLK
              </div>
              <div className="flex flex-col">
                <span className="font-serif-luxury text-xl font-bold tracking-tight text-slate-900 leading-none">
                  Relooka
                </span>
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">
                  Closet Circle
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links: Lender, Renter, Categories, Cart, Feedback, Info */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Renter Link */}
              <Link
                to="/feed"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive('/feed')
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-50'
                }`}
              >
                Renter
              </Link>

              {/* Lender Link (Capability-Aware) */}
              <Link
                to={isLender ? '/lender/dashboard' : '/profile'}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  isActive('/lender/dashboard')
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-50'
                }`}
                title={isLender ? 'Lender Closet & Earnings' : 'Activate Lender Mode in Profile'}
              >
                <span>Lender</span>
                {!isLender && user && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                    Join
                  </span>
                )}
              </Link>

              {/* Categories Link */}
              <Link
                to="/categories"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  isActive('/categories')
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-50'
                }`}
              >
                <span>Categories</span>
              </Link>

              {/* Cart Link (Items listed + renting) */}
              {user && (
                <Link
                  to="/cart"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    isActive('/cart')
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Cart</span>
                </Link>
              )}

              {/* Feedback Link */}
              {user && (
                <Link
                  to="/feedback"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    isActive('/feedback')
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Feedback</span>
                </Link>
              )}

              {/* Info Link */}
              {user && (
                <Link
                  to="/info"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    isActive('/info')
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Info</span>
                </Link>
              )}

              {/* Restricted account links */}
              {user?.role === 'hub_staff' && (
                <Link
                  to="/hub"
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition flex items-center gap-1"
                >
                  <Building2 className="w-3.5 h-3.5" /> Hub Ops
                </Link>
              )}

              {user?.role === 'delivery_agent' && (
                <Link
                  to="/delivery"
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition flex items-center gap-1"
                >
                  <Truck className="w-3.5 h-3.5" /> Handover
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <>
                {/* Capability Switcher if user has both capabilities */}
                {isLender && isRenter && (
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                    <button
                      onClick={() => switchActiveCapability('renter')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                        activeCapability === 'renter'
                          ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Renting
                    </button>
                    <button
                      onClick={() => switchActiveCapability('lender')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                        activeCapability === 'lender'
                          ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Lending
                    </button>
                  </div>
                )}

                {/* Tier Badge */}
                <Link to="/info">
                  <TierBadge tier={user.tier || 'Silver'} />
                </Link>

                {/* Upload Button for Lenders */}
                {isLender && (
                  <Link
                    to="/lender/upload"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>List Outfit</span>
                  </Link>
                )}

                {/* Profile & Logout */}
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-emerald-600 transition"
                    title="Account Profile & Capabilities"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-medium text-slate-700 hover:text-emerald-600 transition px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-xs transition"
                >
                  Join LoopWear
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/feed"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
          >
            Renter (Browse Outfits)
          </Link>
          <Link
            to={isLender ? '/lender/dashboard' : '/profile'}
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
          >
            Lender {isLender ? '(Wardrobe & Earnings)' : '(Activate in Profile)'}
          </Link>
          <Link
            to="/categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
          >
            Categories & Occasions
          </Link>

          {user ? (
            <>
              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
              >
                Closet Cart (Listed & Renting)
              </Link>
              <Link
                to="/feedback"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
              >
                Two-Way Feedback
              </Link>
              <Link
                to="/info"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
              >
                Account Info & Tier
              </Link>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
              >
                Live Orders
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
              >
                Capabilities & ID Verification
              </Link>
              {isLender && (
                <Link
                  to="/lender/upload"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-semibold text-emerald-700"
                >
                  + List an Outfit
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-purple-700"
                >
                  Admin Console
                </Link>
              )}
              {user.role === 'hub_staff' && (
                <Link
                  to="/hub"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-amber-700"
                >
                  Hub Operations
                </Link>
              )}
              {user.role === 'delivery_agent' && (
                <Link
                  to="/delivery"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-blue-700"
                >
                  Handover Portal
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="block w-full text-left py-2 text-sm font-medium text-rose-600"
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg"
              >
                Join LoopWear
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
