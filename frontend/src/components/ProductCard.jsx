import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Tag } from 'lucide-react';
import TierBadge from './TierBadge';

export default function ProductCard({ listing }) {
  const photo = listing.photos && listing.photos.length > 0
    ? listing.photos[0]
    : 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80';

  const occasionLabel = {
    wedding: 'Wedding Gala',
    date_night: 'Date Night',
    prom_night: 'Prom Night',
    casual: 'Designer Casual'
  }[listing.occasionTags?.[0]] || 'Special Occasion';

  return (
    <Link
      to={`/listings/${listing._id}`}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition duration-200 flex flex-col"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden">
        <img
          src={photo}
          alt={listing.title}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80';
          }}
        />

        {/* Occasion Pill */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
          <Tag className="w-3 h-3 text-emerald-600" />
          <span>{occasionLabel}</span>
        </div>

        {/* Size Badge */}
        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded-lg shadow-sm">
          {listing.size}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            {listing.brand || 'Bespoke Designer'}
          </div>
          <h3 className="font-medium text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-700 transition">
            {listing.title}
          </h3>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Rental Price</div>
            <div className="text-base font-bold text-slate-900">
              ₹{listing.dailyRent}
              <span className="text-xs font-normal text-slate-500"> /day</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400">Deposit Hold</div>
            <div className="text-xs font-semibold text-slate-700">
              ₹{Math.round(listing.retailPrice * 0.3)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

