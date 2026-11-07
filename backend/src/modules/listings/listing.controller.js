const { z } = require('zod');
const listingService = require('./listing.service');
const { successResponse } = require('../../core/utils/response');

const createListingSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  category: z.enum(['clothes', 'pants', 'shirts', 'suits', 'watches']),
  occasionTags: z.array(z.enum(['prom_night', 'date_night', 'wedding', 'casual'])).min(1),
  brand: z.string().optional(),
  size: z.string().min(1),
  color: z.string().optional(),
  condition: z.enum(['brand_new', 'like_new', 'gently_used']).optional(),
  retailPrice: z.coerce.number().positive(),
  dailyRent: z.coerce.number().positive(),
  photos: z.array(z.string()).max(6).optional(),
  video: z.string().optional().nullable(),
  pickupAddress: z.object({
    street: z.string().min(3),
    city: z.string().min(2),
    pincode: z.string().min(6)
  })
});

class ListingController {
  async createListing(req, res, next) {
    try {
      const validated = createListingSchema.parse(req.body);
      const listing = await listingService.createListing(req.user.id, validated);
      return successResponse(res, listing, 'Listing created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async uploadMedia(req, res, next) {
    try {
      const media = await listingService.uploadMediaFiles(req.files || {});
      return successResponse(res, media, 'Media uploaded successfully');
    } catch (err) {
      next(err);
    }
  }

  async getListings(req, res, next) {
    try {
      const { category, occasion, minRent, maxRent, city, search, status, page, limit } = req.query;
      const result = await listingService.getListings({
        category,
        occasion,
        minRent,
        maxRent,
        city,
        search,
        status,
        page,
        limit
      });
      return successResponse(res, result.listings, 'Listings retrieved', 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async getListingById(req, res, next) {
    try {
      const listing = await listingService.getListingById(req.params.id);
      return successResponse(res, listing, 'Listing retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getMyListings(req, res, next) {
    try {
      const listings = await listingService.getLenderListings(req.user.id);
      return successResponse(res, listings, 'My listings retrieved');
    } catch (err) {
      next(err);
    }
  }

  async verifyListing(req, res, next) {
    try {
      const listing = await listingService.verifyListing(req.params.id, req.user.id);
      return successResponse(res, listing, 'Listing verification recorded');
    } catch (err) {
      next(err);
    }
  }

  async recordQC(req, res, next) {
    try {
      const { qcType } = req.params; // 'qc1' | 'qc2'
      const { passed, notes } = req.body;
      const listing = await listingService.recordQC(req.params.id, qcType, {
        passed,
        notes,
        inspectorId: req.user.id
      });
      return successResponse(res, listing, `${qcType.toUpperCase()} inspection recorded`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ListingController();

