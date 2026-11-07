import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Repeat
} from 'lucide-react';

export default function Navbar() {
  const { user, activeCapability, switchActiveCapability, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isLender = user?.capabilities?.includes('lender');
  const isRenter = user?.capabilities?.includes('renter');

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
                LW
              </div>
              <div className="flex flex-col">
                <span className="font-serif-luxury text-xl font-bold tracking-tight text-slate-900 leading-none">
                  LoopWear
                </span>
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">
                  Closet Circle
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/feed"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-slate-50 transition"
              >
                Browse Outfits
              </Link>

              {user && (
                <>
                  <Link
                    to="/orders"
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-slate-50 transition"
                  >
                    My Rentals
                  </Link>

                  {isLender && (
                    <Link
                      to="/lender/dashboard"
                      className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-slate-50 transition"
                    >
                      Lender Closet
                    </Link>
                  )}
                </>
              )}

              {/* Restricted account links */}
              {user?.role === 'hub_staff' && (
                <Link
                  to="/hub"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition flex items-center gap-1.5"
                >
                  <Building2 className="w-4 h-4" /> Hub Operations
                </Link>
              )}

              {user?.role === 'delivery_agent' && (
                <Link
                  to="/delivery"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" /> Handover Portal
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Admin Console
                </Link>
              )}
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {/* Capability Switcher if user has both capabilities */}
                {isLender && isRenter && (
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      onClick={() => switchActiveCapability('renter')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        activeCapability === 'renter'
                          ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Renting
                    </button>
                    <button
                      onClick={() => switchActiveCapability('lender')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        activeCapability === 'lender'
                          ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Lending
                    </button>
                  </div>
                )}

                {/* Tier Badge */}
                <Link to="/profile">
                  <TierBadge tier={user.tier || 'Silver'} />
                </Link>

                {/* Upload Button for Lenders */}
                {isLender && (
                  <Link
                    to="/lender/upload"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3.5 py-1.5 rounded-xl shadow-sm transition"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>List Outfit</span>
                  </Link>
                )}

                {/* Profile & Logout */}
                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-emerald-600 transition"
                    title="Account Profile & ID Verification"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-emerald-600 transition px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition"
                >
                  Join LoopWear
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
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
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/feed"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700"
          >
            Browse Outfits
          </Link>
          {user ? (
            <>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-700"
              >
                My Rentals
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-700"
              >
                Profile & ID Verification
              </Link>
              {isLender && (
                <Link
                  to="/lender/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-slate-700"
                >
                  Lender Dashboard
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

