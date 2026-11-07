import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { UploadCloud, Image as ImageIcon, Video, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LenderUpload() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'clothes',
    occasionTags: ['wedding'],
    brand: '',
    size: 'M',
    color: '',
    condition: 'like_new',
    retailPrice: '',
    dailyRent: '',
    pickupAddress: {
      street: '',
      city: 'Mumbai',
      pincode: '400050'
    }
  });

  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 6) {
      setError('You can upload a maximum of 6 photos');
      return;
    }
    const newPhotos = [...photos, ...files].slice(0, 6);
    setPhotos(newPhotos);

    // Previews
    const previews = newPhotos.map(f => URL.createObjectURL(f));
    setPhotoPreviews(previews);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setError('Video size must be less than 25MB');
        return;
      }
      setVideo(file);
    }
  };

  const toggleOccasion = (occ) => {
    setFormData(prev => {
      const current = prev.occasionTags;
      const next = current.includes(occ)
        ? (current.length > 1 ? current.filter(o => o !== occ) : current)
        : [...current, occ];
      return { ...prev, occasionTags: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.length === 0) {
      setError('Please add at least 1 photo of the outfit');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 1. Upload files
      const uploadData = new FormData();
      photos.forEach(p => uploadData.append('photos', p));
      if (video) uploadData.append('video', video);

      const mediaRes = await api.post('/listings/upload', uploadData);
      const uploadedUrls = mediaRes.data?.photos || [];
      const videoUrl = mediaRes.data?.video || null;

      // 2. Create Listing
      const createRes = await api.post('/listings', {
        ...formData,
        retailPrice: Number(formData.retailPrice),
        dailyRent: Number(formData.dailyRent),
        photos: uploadedUrls,
        video: videoUrl
      });

      if (createRes.success) {
        navigate('/lender/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to list outfit');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
          Lender Monetization Portal
        </div>
        <h1 className="font-serif-luxury text-3xl font-bold text-slate-900">
          List an Outfit in the Circle
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Upload up to 6 high-res photos and an optional 30s video. Listings go live once verified by our team and laundry hub.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        {/* Photos & Video Uploader */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Outfit Media (Up to 6 Photos + 1 Video)
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {photoPreviews.map((url, idx) => (
              <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}

            {photos.length < 6 && (
              <label className="cursor-pointer aspect-[3/4] rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-600 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-emerald-600 transition bg-slate-50">
                <ImageIcon className="w-6 h-6" />
                <span className="text-xs font-medium">Add Photo ({photos.length}/6)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Short Video Clip (Max 25MB, Optional)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="text-xs text-slate-600"
            />
            {video && <span className="text-xs text-emerald-600 ml-2 font-medium">✓ Video selected</span>}
          </div>
        </div>

        {/* Basic Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Outfit Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Sabyasachi Heritage Silk Anarkali"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description & Styling Notes
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Delicate zardozi work, dry-cleaned only, perfect for wedding sangeet..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
            >
              <option value="clothes">Dresses & Lehengas</option>
              <option value="suits">Suits & Tuxedos</option>
              <option value="shirts">Shirts & Kurtas</option>
              <option value="pants">Pants & Trousers</option>
              <option value="watches">Luxury Watches</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Designer / Brand
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="e.g. Manyavar, Tarun Tahiliani"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Size
            </label>
            <input
              type="text"
              required
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              placeholder="e.g. S, M, L, 40R"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Color
            </label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="e.g. Midnight Blue"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
        </div>

        {/* Occasions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Occasion Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {['wedding', 'date_night', 'prom_night', 'casual'].map((occ) => (
              <button
                type="button"
                key={occ}
                onClick={() => toggleOccasion(occ)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  formData.occasionTags.includes(occ)
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {occ.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Estimated Retail Value (INR)
            </label>
            <input
              type="number"
              required
              min={100}
              value={formData.retailPrice}
              onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
              placeholder="e.g. 25000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <p className="text-[10px] text-slate-400 mt-1">Used to determine security deposit hold</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Daily Rent Price (INR)
            </label>
            <input
              type="number"
              required
              min={10}
              value={formData.dailyRent}
              onChange={(e) => setFormData({ ...formData, dailyRent: e.target.value })}
              placeholder="e.g. 1500"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900"
            />
            <p className="text-[10px] text-slate-400 mt-1">Lender receives 85% net payout</p>
          </div>
        </div>

        {/* Pickup Location */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Lender Pickup Location (Routed to nearest Partner Hub)
          </label>
          <input
            type="text"
            required
            value={formData.pickupAddress.street}
            onChange={(e) => setFormData({
              ...formData,
              pickupAddress: { ...formData.pickupAddress, street: e.target.value }
            })}
            placeholder="Street address for agent pickup"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={formData.pickupAddress.city}
              onChange={(e) => setFormData({
                ...formData,
                pickupAddress: { ...formData.pickupAddress, city: e.target.value }
              })}
              placeholder="City"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <input
              type="text"
              required
              value={formData.pickupAddress.pincode}
              onChange={(e) => setFormData({
                ...formData,
                pickupAddress: { ...formData.pickupAddress, pincode: e.target.value }
              })}
              placeholder="Pincode"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <UploadCloud className="w-5 h-5" />
          <span>{uploading ? 'Uploading Outfit...' : 'Publish to Closet Circle'}</span>
        </button>
      </form>
    </div>
  );
}
