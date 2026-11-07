/**
 * CFO-Controlled Pricing Configuration
 * NOTE: All pricing calculations MUST read from this config or a dynamic DB override.
 * Hardcoding amounts, commissions, or percentages anywhere else is strictly prohibited.
 */

const defaultPricingConfig = {
  // Base platform commission deducted from lender payout (percentage, e.g. 15%)
  platformCommissionPercent: 15,

  // Fixed renter platform service fee (INR)
  renterPlatformFee: 49,

  // Standard laundry & sanitization fee per rental item (INR)
  laundryFee: 150,

  // Standard delivery & pickup fee handled via local partner hub (INR)
  deliveryFee: 99,

  // Minimum & maximum security deposit percentage of the item's declared retail value
  securityDepositPercent: 30, // 30% of item retail price, or configurable per item
  minSecurityDeposit: 500,     // Floor in INR
  maxSecurityDeposit: 10000,   // Ceiling in INR

  // Multi-day discount percentages (e.g. 3-day baseline, 7-day discount)
  rentalDayDiscounts: [
    { minDays: 7, discountPercent: 10 },
    { minDays: 14, discountPercent: 20 },
    { minDays: 30, discountPercent: 35 }
  ],

  // Late return penalty fee per day (INR)
  lateReturnFeePerDay: 200,

  // Currency
  currency: 'INR'
};

module.exports = defaultPricingConfig;

