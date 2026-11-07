import React from 'react';
import { ShieldCheck, HeartHandshake, Leaf, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                LW
              </div>
              <span className="font-serif-luxury text-xl font-bold text-white tracking-tight">
                LoopWear <span className="text-emerald-500 font-sans text-xs uppercase">Closet Circle</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              India's circular fashion ecosystem. Peer-to-peer luxury and occasion wear rentals routed safely
              through local partner laundry hubs with professional QC, eco-sanitization, and secure deposit ledgers.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-emerald-400" /> 100% Circular</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Insured Deposit Ledger</span>
              <span className="inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> AES-256 ID Privacy</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Occasions</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/feed?occasion=wedding" className="hover:text-emerald-400 transition">Wedding Gala</a></li>
              <li><a href="/feed?occasion=date_night" className="hover:text-emerald-400 transition">Date Night</a></li>
              <li><a href="/feed?occasion=prom_night" className="hover:text-emerald-400 transition">Prom & Cocktails</a></li>
              <li><a href="/feed?occasion=casual" className="hover:text-emerald-400 transition">Designer Casuals</a></li>
            </ul>
          </div>

          {/* Operations & Hubs */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Ecosystem</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-slate-400">Partner Laundry Hubs</span></li>
              <li><span className="text-slate-400">Two-Way Handover OTP</span></li>
              <li><span className="text-slate-400">RFM Tier Engine</span></li>
              <li><span className="text-slate-400">Zero Direct Delivery</span></li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer & Regulatory Consent Notice */}
        <div className="pt-6 border-t border-slate-800 text-xs text-slate-500 leading-relaxed space-y-2">
          <p>
            <strong>Legal & Identity Compliance Notice:</strong> LoopWear complies with Indian IT Act and digital privacy standards.
            Full Aadhaar, voter, and ration card numbers and document photos are NEVER stored or logged.
            Only government ID type, masked references (maximum last 4 characters), and name as printed are retained for verification.
            Sensitive fields are encrypted at rest using AES-256-GCM. Legal counsel must confirm ID storage and consent language before production release.
          </p>
          <div className="flex flex-col sm:flex-row justify-between items-center pt-2 text-slate-500">
            <p>© {new Date().getFullYear()} LoopWear (Closet Circle). Zero-Budget Engineering Architecture.</p>
            <p className="text-[11px] text-emerald-500">Open-source & Permanent Free Tier Powered</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

