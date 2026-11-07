const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    lenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    category: {
      type: String,
      enum: ['clothes', 'pants', 'shirts', 'suits', 'watches'],
      required: true,
      index: true
    },
    occasionTags: {
      type: [String],
      enum: ['prom_night', 'date_night', 'wedding', 'casual'],
      default: ['casual'],
      index: true
    },
    brand: {
      type: String,
      trim: true,
      default: 'Designer / Artisanal'
    },
    size: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      trim: true,
      default: 'Multi'
    },
    condition: {
      type: String,
      enum: ['brand_new', 'like_new', 'gently_used'],
      default: 'like_new'
    },
    retailPrice: {
      type: Number,
      required: true,
      min: 0
    },
    dailyRent: {
      type: Number,
      required: true,
      min: 1
    },
    // Media constraints: up to 6 photos + 1 short video
    photos: {
      type: [String],
      validate: [
        function (val) {
          return val.length <= 6;
        },
        'A listing can have at most 6 photos'
      ],
      default: []
    },
    video: {
      type: String,
      default: null
    },
    // Status machine for listing
    // Goes live only after verification AND both QC checks
    status: {
      type: String,
      enum: ['draft', 'pending_verification', 'active', 'rented', 'inactive'],
      default: 'draft',
      index: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    // Initial onboarding QC checks
    qc1: {
      passed: { type: Boolean, default: false },
      checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      checkedAt: { type: Date },
      notes: { type: String }
    },
    qc2: {
      passed: { type: Boolean, default: false },
      checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      checkedAt: { type: Date },
      notes: { type: String }
    },
    pickupAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true }
    },
    assignedHubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
      default: null
    }
  },
  {
    timestamps: true
  }
);

listingSchema.index({ category: 1, occasionTags: 1, status: 1 });
listingSchema.index({ dailyRent: 1 });

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;

