/**
 * Configurable Tier Engine Configuration
 * Defines RFM + LoopWear normalization bands, tier score thresholds, and tier benefits.
 * Config-driven: update here to rebalance without code changes.
 */

const tierConfig = {
  // RFM + LoopWear normalization bands (returns 1 to 5; never zeroes out)
  normalizationBands: {
    // Recency (days since last closed order / completed rental)
    // Fewer days = higher score
    recency: [
      { maxDays: 14, score: 5 },
      { maxDays: 30, score: 4 },
      { maxDays: 60, score: 3 },
      { maxDays: 120, score: 2 },
      { maxDays: Infinity, score: 1 }
    ],

    // Frequency (total completed orders as lender or renter)
    frequency: [
      { minCount: 20, score: 5 },
      { minCount: 10, score: 4 },
      { minCount: 5, score: 3 },
      { minCount: 2, score: 2 },
      { minCount: 0, score: 1 }
    ],

    // Monetary (total spend or earnings in INR)
    monetary: [
      { minAmount: 25000, score: 5 },
      { minAmount: 10000, score: 4 },
      { minAmount: 5000, score: 3 },
      { minAmount: 2000, score: 2 },
      { minAmount: 0, score: 1 }
    ],

    // LoopWear Score (1 to 5 scale, entered by executives or seeded by feedback)
    loopWearDefaultScore: 3.0
  },

  // Minimum total composite score = Recency * Frequency * Monetary * LoopWear
  // Min possible = 1 * 1 * 1 * 1 = 1
  // Max possible = 5 * 5 * 5 * 5 = 625
  tierThresholds: {
    Diamond: 400,
    Platinum: 200,
    Gold: 60,
    Silver: 0 // Base tier
  },

  // Placeholder benefits per tier
  tierBenefits: {
    Silver: {
      platformFeeDiscountPercent: 0,
      depositReductionPercent: 0,
      priorityCustomerSupport: false,
      priorityListingBoost: false
    },
    Gold: {
      platformFeeDiscountPercent: 10,
      depositReductionPercent: 10,
      priorityCustomerSupport: false,
      priorityListingBoost: true
    },
    Platinum: {
      platformFeeDiscountPercent: 20,
      depositReductionPercent: 25,
      priorityCustomerSupport: true,
      priorityListingBoost: true
    },
    Diamond: {
      platformFeeDiscountPercent: 35,
      depositReductionPercent: 40,
      priorityCustomerSupport: true,
      priorityListingBoost: true
    }
  }
};

module.exports = tierConfig;
