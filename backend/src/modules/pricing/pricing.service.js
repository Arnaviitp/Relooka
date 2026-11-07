const defaultPricingConfig = require('../../core/config/pricing.config');
const tierConfig = require('../../core/config/tiers.config');

class PricingService {
  constructor(config = defaultPricingConfig) {
    this.config = config;
  }

  /**
   * Calculate rental quote and fee breakdown for an item
   * @param {Object} params
   * @param {number} params.dailyRent - Base rent per day in INR
   * @param {number} params.retailPrice - Estimated retail value of item in INR
   * @param {number} params.rentalDays - Duration in days (min 1)
   * @param {string} [params.renterTier='Silver'] - Renter's tier (Silver, Gold, Platinum, Diamond)
   * @param {string} [params.lenderTier='Silver'] - Lender's tier
   */
  calculateRentalQuote({ dailyRent, retailPrice, rentalDays = 3, renterTier = 'Silver', lenderTier = 'Silver' }) {
    const days = Math.max(1, parseInt(rentalDays, 10));
    const baseDaily = Number(dailyRent);
    const retail = Number(retailPrice || baseDaily * 10);

    // 1. Base rent calculation
    let grossRent = baseDaily * days;

    // 2. Check for multi-day rental discount from CFO config
    let durationDiscountPercent = 0;
    const applicableDiscounts = this.config.rentalDayDiscounts
      .filter(d => days >= d.minDays)
      .sort((a, b) => b.minDays - a.minDays);

    if (applicableDiscounts.length > 0) {
      durationDiscountPercent = applicableDiscounts[0].discountPercent;
    }

    const durationDiscountAmount = Math.round((grossRent * durationDiscountPercent) / 100);
    const netRent = grossRent - durationDiscountAmount;

    // 3. Security deposit calculation from CFO config
    const rawDeposit = Math.round((retail * this.config.securityDepositPercent) / 100);
    let cappedDeposit = Math.min(
      this.config.maxSecurityDeposit,
      Math.max(this.config.minSecurityDeposit, rawDeposit)
    );

    // Apply renter tier deposit reduction benefit
    const renterBenefits = tierConfig.tierBenefits[renterTier] || tierConfig.tierBenefits.Silver;
    const depositReductionPercent = renterBenefits.depositReductionPercent || 0;
    const depositDiscount = Math.round((cappedDeposit * depositReductionPercent) / 100);
    const finalSecurityDeposit = cappedDeposit - depositDiscount;

    // 4. Operational fees
    const laundryFee = this.config.laundryFee;
    const deliveryFee = this.config.deliveryFee;

    // 5. Platform fee for renter with tier fee discount
    const rawPlatformFee = this.config.renterPlatformFee;
    const platformFeeDiscountPercent = renterBenefits.platformFeeDiscountPercent || 0;
    const platformFeeDiscount = Math.round((rawPlatformFee * platformFeeDiscountPercent) / 100);
    const renterPlatformFee = rawPlatformFee - platformFeeDiscount;

    // Total amount charged to renter
    const totalRenterPayable = netRent + finalSecurityDeposit + laundryFee + deliveryFee + renterPlatformFee;

    // 6. Lender payout calculation (deduct platform commission)
    const lenderCommissionPercent = this.config.platformCommissionPercent;
    const lenderCommissionAmount = Math.round((netRent * lenderCommissionPercent) / 100);
    const lenderEstimatedPayout = netRent - lenderCommissionAmount;

    return {
      currency: this.config.currency,
      rentalDays: days,
      itemRent: {
        dailyRate: baseDaily,
        grossRent,
        durationDiscountPercent,
        durationDiscountAmount,
        netRent
      },
      securityDeposit: {
        baseDeposit: cappedDeposit,
        tierReductionPercent: depositReductionPercent,
        depositDiscount,
        payableDeposit: finalSecurityDeposit,
        refundable: true
      },
      fees: {
        laundryFee,
        deliveryFee,
        platformFee: renterPlatformFee,
        platformFeeDiscount
      },
      totalRenterPayable,
      lenderPayout: {
        commissionPercent: lenderCommissionPercent,
        commissionAmount: lenderCommissionAmount,
        estimatedPayout: lenderEstimatedPayout
      },
      tierApplied: {
        renterTier,
        lenderTier
      }
    };
  }

  /**
   * Expose current CFO configuration for transparency
   */
  getConfig() {
    return { ...this.config };
  }
}

const pricingService = new PricingService();
pricingService.PricingService = PricingService;
module.exports = pricingService;

