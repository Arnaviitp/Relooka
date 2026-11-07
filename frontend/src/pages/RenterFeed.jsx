import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import { Search, Filter, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function RenterFeed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const initialOccasion = searchParams.get('occasion') || 'all';
  const initialCategory = searchParams.get('category') || 'all';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedOccasion, setSelectedOccasion] = useState(initialOccasion);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        let endpoint = '/listings?status=active';
        if (selectedCategory !== 'all') endpoint += `&category=${selectedCategory}`;
        if (selectedOccasion !== 'all') endpoint += `&occasion=${selectedOccasion}`;
        if (searchQuery) endpoint += `&search=${encodeURIComponent(searchQuery)}`;

        const res = await api.get(endpoint);
        if (res.success && res.data) {
          let items = res.data;
          if (sortBy === 'price_asc') items.sort((a, b) => a.dailyRent - b.dailyRent);
          if (sortBy === 'price_desc') items.sort((a, b) => b.dailyRent - a.dailyRent);
          setListings(items);
        }
      } catch (_) {}
      setLoading(false);
    }

    fetchListings();
  }, [selectedCategory, selectedOccasion, searchQuery, sortBy]);

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'clothes', label: 'Dresses & Lehengas' },
    { id: 'suits', label: 'Suits & Tuxedos' },
    { id: 'shirts', label: 'Shirts & Kurtas' },
    { id: 'pants', label: 'Pants & Trousers' },
    { id: 'watches', label: 'Luxury Watches' }
  ];

  const occasions = [
    { id: 'all', label: 'All Occasions' },
    { id: 'wedding', label: 'Wedding Gala' },
    { id: 'date_night', label: 'Date Night' },
    { id: 'prom_night', label: 'Prom & Formals' },
    { id: 'casual', label: 'Casual Chic' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Feed Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
            LoopWear Closet Feed
          </div>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-slate-900">
            Rent Designer Wear
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Inspected by local partner laundry hubs. Delivered with registered ID check & OTP.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Sabyasachi, Raymond..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Occasion Tags & Sort bar */}
        <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
          <div className="flex flex-wrap gap-2 items-center text-xs">
            <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Occasion:
            </span>
            {occasions.map((occ) => (
              <button
                key={occ.id}
                onClick={() => setSelectedOccasion(occ.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                  selectedOccasion === occ.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {occ.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-xs focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[3/4] bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-900 text-base">No Outfits Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find items matching this combination. Try clearing your filters or search terms.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedOccasion('all');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-emerald-600 hover:underline"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ProductCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
