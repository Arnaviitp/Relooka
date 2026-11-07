const Listing = require('./listing.model');
const User = require('../users/user.model');
const hubService = require('../hubs/hub.service');
const AppError = require('../../core/utils/AppError');
const { storageAdapter } = require('../../core/adapters/storage.adapter');

class ListingService {
  async createListing(lenderId, data) {
    const lender = await User.findById(lenderId);
    if (!lender) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!lender.capabilities.includes('lender')) {
      throw new AppError('You must enable the "lender" capability to list clothing', 403, 'LENDER_CAPABILITY_REQUIRED');
    }

    // Media constraints validation
    if (data.photos && data.photos.length > 6) {
      throw new AppError('A maximum of 6 photos is permitted per listing', 400, 'TOO_MANY_PHOTOS');
    }

    // Assign nearest partner laundry hub
    const hub = await hubService.findAvailableHub(data.pickupAddress?.pincode);

    const listing = new Listing({
      ...data,
      lenderId,
      assignedHubId: hub ? hub._id : null,
      status: 'pending_verification'
    });

    await listing.save();
    return listing;
  }

  async uploadMediaFiles(files) {
    const result = {
      photos: [],
      video: null
    };

    if (files.photos && Array.isArray(files.photos)) {
      if (files.photos.length > 6) {
        throw new AppError('Maximum 6 photos allowed', 400, 'MAX_PHOTOS_EXCEEDED');
      }
      for (const file of files.photos) {
        const saved = await storageAdapter.saveFile({
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          folder: 'listings/photos'
        });
        result.photos.push(saved.url);
      }
    }

    if (files.video && files.video[0]) {
      const vid = files.video[0];
      // Cap video size to 25MB
      if (vid.size > 25 * 1024 * 1024) {
        throw new AppError('Video file exceeds maximum allowed size of 25MB', 400, 'VIDEO_TOO_LARGE');
      }
      const saved = await storageAdapter.saveFile({
        buffer: vid.buffer,
        originalname: vid.originalname,
        mimetype: vid.mimetype,
        folder: 'listings/videos'
      });
      result.video = saved.url;
    }

    return result;
  }

  async getListings({
    category,
    occasion,
    minRent,
    maxRent,
    city,
    search,
    status = 'active',
    page = 1,
    limit = 20
  } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (occasion) filter.occasionTags = occasion;
    if (city) filter['pickupAddress.city'] = new RegExp(city, 'i');
    if (minRent || maxRent) {
      filter.dailyRent = {};
      if (minRent) filter.dailyRent.$gte = Number(minRent);
      if (maxRent) filter.dailyRent.$lte = Number(maxRent);
    }
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') }
      ];
    }

    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const [total, listings] = await Promise.all([
      Listing.countDocuments(filter),
      Listing.find(filter)
        .populate('lenderId', 'name tier feedbackScoreAverage')
        .populate('assignedHubId', 'name partnerLaundryName city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(100, Math.max(1, limit)))
    ]);

    return {
      listings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getListingById(id) {
    const listing = await Listing.findById(id)
      .populate('lenderId', 'name tier feedbackScoreAverage loopWearScore')
      .populate('assignedHubId', 'name partnerLaundryName address city pincode contactPhone');

    if (!listing) {
      throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }
    return listing;
  }

  async getLenderListings(lenderId) {
    return Listing.find({ lenderId }).sort({ createdAt: -1 });
  }

  /**
   * Rule 10: Listing goes live only after verification AND both QC checks
   */
  async verifyListing(listingId, adminId) {
    const listing = await Listing.findById(listingId);
    if (!listing) {
      throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }

    listing.isVerified = true;
    listing.verifiedAt = new Date();
    this._checkAndActivate(listing);
    await listing.save();
    return listing;
  }

  async recordQC(listingId, qcType, { passed, notes, inspectorId }) {
    if (!['qc1', 'qc2'].includes(qcType)) {
      throw new AppError('Invalid QC type. Expected "qc1" or "qc2"', 400, 'INVALID_QC_TYPE');
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }

    listing[qcType] = {
      passed: !!passed,
      checkedBy: inspectorId,
      checkedAt: new Date(),
      notes: notes || `${qcType.toUpperCase()} inspection recorded`
    };

    this._checkAndActivate(listing);
    await listing.save();
    return listing;
  }

  _checkAndActivate(listing) {
    if (listing.isVerified && listing.qc1?.passed && listing.qc2?.passed) {
      listing.status = 'active';
    }
  }
}

module.exports = new ListingService();

