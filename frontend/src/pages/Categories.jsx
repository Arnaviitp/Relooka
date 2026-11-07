import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Crown,
  PartyPopper,
  Wine,
  Sun,
  Shirt,
  Watch,
  Scissors,
  ArrowRight,
  Flame,
  Tag,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const OCCASIONS = [
  {
    id: 'wedding',
    title: 'Wedding & Sangeet',
    collection: 'The Royal Heritage Collection',
    description: 'Regal bridal lehengas, intricately embroidered sherwanis, and silk kurtas.',
    accent: 'from-amber-600/90 to-rose-700/90',
    badge: 'High Demand',
    badgeColor: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
    itemCount: '24+ Curated Outfits',
    icon: Crown
  },
  {
    id: 'prom_night',
    title: 'Red Carpet & Prom',
    collection: 'Black-Tie Gala Extravaganza',
    description: 'Floor-length designer gowns, architectural corsets, and tuxedo ensembles.',
    accent: 'from-purple-900/90 to-indigo-800/90',
    badge: 'Trending',
    badgeColor: 'bg-purple-400/20 text-purple-200 border-purple-400/30',
    itemCount: '18+ Designer Pieces',
    icon: Sparkles
  },
  {
    id: 'date_night',
    title: 'Cocktail & Date Night',
    collection: 'Sunset Lounge & Chic Elegance',
    description: 'Tailored blazer dresses, velvet smoking jackets, and cocktail silhouettes.',
    accent: 'from-rose-900/90 to-amber-900/90',
    badge: 'Weekend Special',
    badgeColor: 'bg-rose-400/20 text-rose-200 border-rose-400/30',
    itemCount: '15+ Modern Silhouettes',
    icon: Wine
  },
  {
    id: 'casual',
    title: 'Resort & Casual Luxe',
    collection: 'Weekend Getaway & Brunch',
    description: 'Premium Italian linen co-ords, lightweight vacation shirts, and relaxed chic.',
    accent: 'from-teal-800/90 to-emerald-950/90',
    badge: 'Everyday Luxury',
    badgeColor: 'bg-teal-400/20 text-teal-200 border-teal-400/30',
    itemCount: '12+ Breezy Sets',
    icon: Sun
  }
];

const ITEM_TYPES = [
  {
    category: 'suits',
    label: 'Suits & Tuxedos',
    description: '3-Piece bespoke suits, Italian tuxedos, and tailored evening blazers.',
    icon: Scissors,
    tag: 'Formal Luxury'
  },
  {
    category: 'clothes',
    label: 'Dresses & Lehengas',
    description: 'Grand festive couture, bridal outfits, and high-fashion statement gowns.',
    icon: Sparkles,
    tag: 'Ethnic & Western'
  },
  {
    category: 'shirts',
    label: 'Designer Shirts',
    description: 'Pure silk button-downs, embroidered bandhgalas, and luxury linen shirts.',
    icon: Shirt,
    tag: 'Versatile Fits'
  },
  {
    category: 'pants',
    label: 'Tailored Trousers',
    description: 'Pleated dress trousers, silk blend dhoti pants, and bespoke bottoms.',
    icon: Scissors,
    tag: 'Smart Tailoring'
  },
  {
    category: 'watches',
    label: 'Luxury Timepieces',
    description: 'Classic chronographs and minimalist dress watches to complete the look.',
    icon: Watch,
    tag: 'Finishing Touch'
  }
];

export default function Categories() {
  const navigate = useNavigate();

  const handleOccasionClick = (occasionId) => {
    navigate(`/feed?occasion=${occasionId}`);
  };

  const handleCategoryClick = (categoryKey) => {
    navigate(`/feed?category=${categoryKey}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-widest font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Curated Catalog
        </span>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Explore by Occasion & Category
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Peer-to-peer verified luxury garments inspected by partner laundry hubs. Rent your next iconic look for a fraction of retail.
        </p>
      </div>

      {/* Occasion Promo Tiles */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Occasion Collections</span>
            </h2>
            <p className="text-xs text-slate-500">
              Curated ensembles matched to weddings, galas, celebrations, and weekends.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {OCCASIONS.map((occ) => {
            const IconComponent = occ.icon;
            return (
              <div
                key={occ.id}
                onClick={() => handleOccasionClick(occ.id)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl bg-slate-900 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-800"
              >
                {/* Background Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${occ.accent} opacity-80 group-hover:opacity-95 transition-opacity`}
                />

                {/* Subtle Decorative Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

                <div className="relative p-6 h-72 flex flex-col justify-between text-white z-10">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border backdrop-blur-sm ${occ.badgeColor}`}
                      >
                        {occ.badge}
                      </span>
                      <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-[11px] font-medium text-white/80">{occ.collection}</div>
                    <h3 className="font-serif-luxury text-xl font-bold tracking-tight text-white leading-tight">
                      {occ.title}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-white/85 line-clamp-2 leading-relaxed">
                      {occ.description}
                    </p>
                    <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs font-semibold">
                      <span className="text-white/80">{occ.itemCount}</span>
                      <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-white">
                        <span>Browse</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Item-Type Filters */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shirt className="w-5 h-5 text-emerald-600" />
            <span>Browse by Garment Type</span>
          </h2>
          <p className="text-xs text-slate-500">
            Filter our authenticated closet by specific wardrobe categories.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ITEM_TYPES.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.category}
                onClick={() => handleCategoryClick(item.category)}
                className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition text-left flex flex-col justify-between h-44 hover:bg-emerald-50/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                    {item.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600 group-hover:text-emerald-700">
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Visible Slot for Future Offers (Charter Mandate) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-6 sm:p-8 border border-emerald-800/40 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Future Promotional Offer Slot · Upgrade when funded</span>
            </div>
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight">
              Diwali Festive Early-Bird Pass: Zero Security Deposit
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Charter Slot Reserved: Book upcoming luxury bridal lehengas, sherwanis, and bespoke tuxedos with zero security deposit hold for Aadhaar-verified users.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                100% Free Platform Fee on first rental
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Complimentary Hub Express Dry-Cleaning
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Doorstep ID Verification Handover
              </span>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/feed')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>Explore All Outfits</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Background decorative glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>
    </div>
  );
}
