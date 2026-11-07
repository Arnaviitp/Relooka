const pricingService = require('./pricing.service');
const { successResponse } = require('../../core/utils/response');

class PricingController {
  async calculateQuote(req, res, next) {
    try {
      const { dailyRent, retailPrice, rentalDays, renterTier, lenderTier } = req.body;
      const quote = pricingService.calculateRentalQuote({
        dailyRent: Number(dailyRent),
        retailPrice: retailPrice ? Number(retailPrice) : undefined,
        rentalDays: rentalDays ? Number(rentalDays) : 3,
        renterTier: renterTier || (req.user ? req.user.tier : 'Silver'),
        lenderTier
      });
      return successResponse(res, quote, 'Rental quote calculated successfully');
    } catch (err) {
      next(err);
    }
  }

  async getConfig(req, res, next) {
    try {
      const config = pricingService.getConfig();
      return successResponse(res, config, 'Current pricing parameters retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PricingController();
