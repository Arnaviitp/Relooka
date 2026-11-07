import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import {
  Sparkles,
  ShieldCheck,
  Building2,
  Truck,
  RotateCcw,
  CheckCircle2,
  Award,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await api.get('/listings?limit=4&status=active');
        if (res.success && res.data) {
          setFeaturedListings(res.data);
        }
      } catch (_) {}
      setLoading(false);
    }
    loadFeatured();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Future of Circular Luxury Fashion in India</span>
              </div>

              <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.15]">
                Wear iconic designer outfits. <br />
                <span className="text-emerald-700 italic">Zero waste. Zero guilt.</span>
              </h1>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
                LoopWear connects personal closets with luxury lovers. Rent verified designer lehengas,
                bandhgalas, tuxedos, and suits routed exclusively through certified local laundry hubs.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/feed"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
                >
                  <span>Explore Outfits</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/lender/upload"
                  className="bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3.5 rounded-xl border border-slate-300 shadow-sm transition"
                >
                  List Your Closet
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dual Quality Checks (QC1 & QC2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Secure Deposit Ledger</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified Recipient Handover</span>
                </div>
              </div>
            </div>

            {/* Visual Collage */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5] bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&auto=format&fit=crop&q=80"
                  alt="Designer Ethnic Wear"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                    Wedding Gala Season
                  </div>
                  <h3 className="font-serif-luxury text-xl font-bold">Handcrafted Silk Ensembles</h3>
                  <p className="text-xs text-slate-300 mt-1">Starting from ₹1,200/day · Insured Deposit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How LoopWear Operates (The Partner Hub Model) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Engineered Trust Architecture
          </div>
          <h2 className="font-serif-luxury text-3xl font-bold text-slate-900">
            How LoopWear Operates Without Warehouses
          </h2>
          <p className="text-sm text-slate-600">
            We do not operate expensive central warehouses and never allow risky direct deliveries. Every item routes through local partner dry-cleaning hubs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Lender Submits</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lender lists outfit with declared condition (washed/unwashed). Pickup agent collects the item directly from the lender's door.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Hub QC & Sanitization</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Certified local laundry partner performs QC1 (pickup) and QC2 (intake) inspections, followed by an eco-friendly sanitization wash.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-semibold text-slate-900 text-base">ID Check & OTP Handover</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Delivery agent verifies the recipient's government ID and validates a secure one-time passcode before handing over the garment.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Return QC & Deposit Release</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upon return, the hub verifies garment condition. Match releases deposit in full; any mismatch automatically deducts damage and refunds balance.
            </p>
          </div>
        </div>
      </section>

      {/* Occasions Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Curated Collections</div>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-slate-900">Rent for Every Occasion</h2>
          </div>
          <Link to="/feed" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: 'Wedding Gala',
              tag: 'wedding',
              img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
              desc: 'Lehengas & Sherwanis'
            },
            {
              title: 'Date Night',
              tag: 'date_night',
              img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
              desc: 'Cocktail & Evening Dresses'
            },
            {
              title: 'Prom & Formals',
              tag: 'prom_night',
              img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
              desc: 'Tuxedos & Bespoke Suits'
            },
            {
              title: 'Designer Casuals',
              tag: 'casual',
              img: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&auto=format&fit=crop&q=80',
              desc: 'Shirts, Pants & Watches'
            }
          ].map((item, idx) => (
            <Link
              key={idx}
              to={`/feed?occasion=${item.tag}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-200 shadow-sm"
            >
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-4 text-white">
                <h3 className="font-semibold text-base">{item.title}</h3>
                <p className="text-xs text-slate-300">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Outfits Feed Preview */}
      {featuredListings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Fresh In The Circle</div>
              <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-slate-900">Featured Listings</h2>
            </div>
            <Link to="/feed" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              <span>Explore All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredListings.map(listing => (
              <ProductCard key={listing._id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Tier Benefits & LoopWear RFM Score Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-emerald-950 rounded-3xl p-8 lg:p-12 text-white shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Award className="w-4 h-4" />
                <span>Transparent RFM Loyalty Engine</span>
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold leading-tight">
                Unlock Gold, Platinum & Diamond Tiers
              </h2>
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                Every rental and listing recomputes your LoopWear score based on Recency, Frequency, Spend, and two-way peer feedback. Enjoy up to 35% platform fee discounts and 40% security deposit reductions.
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <Link
                to="/profile"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg transition"
              >
                Check Your Tier Status
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
