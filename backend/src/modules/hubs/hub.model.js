const mongoose = require('mongoose');

const hubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    partnerLaundryName: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true,
      index: true
    },
    pincode: {
      type: String,
      required: true,
      index: true
    },
    contactPhone: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    capacities: {
      maxDailyItems: { type: Number, default: 50 },
      currentLoad: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

const Hub = mongoose.model('Hub', hubSchema);

module.exports = Hub;

