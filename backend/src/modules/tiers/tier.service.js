const User = require('../users/user.model');
const { Order, ORDER_STATES } = require('../orders/order.model');
const tierConfig = require('../../core/config/tiers.config');
const feedbackService = require('../feedback/feedback.service');

class TierService {
  constructor(config = tierConfig) {
    this.config = config;
  }

  /**
   * Normalize recency days to 1-5 score using configurable bands
   */
  _normalizeRecency(days) {
    for (const band of this.config.normalizationBands.recency) {
      if (days <= band.maxDays) {
        return band.score;
      }
    }
    return 1;
  }

  /**
   * Normalize frequency count to 1-5 score
   */
  _normalizeFrequency(count) {
    for (const band of this.config.normalizationBands.frequency) {
      if (count >= band.minCount) {
        return band.score;
      }
    }
    return 1;
  }

  /**
   * Normalize monetary amount to 1-5 score
   */
  _normalizeMonetary(amount) {
    for (const band of this.config.normalizationBands.monetary) {
      if (amount >= band.minAmount) {
        return band.score;
      }
    }
    return 1;
  }

  /**
   * Compute RFM + LoopWear score and assign tier for a user
   * @param {string|ObjectId} userId
   * @param {string} reason - 'order_closed' | 'nightly_recompute' | 'admin_override'
   */
  async recomputeUserTier(userId, reason = 'order_closed') {
    const user = await User.findById(userId);
    if (!user) return null;

    // Get all completed/closed orders where user was renter or lender
    const closedOrders = await Order.find({
      $or: [{ renterId: user._id }, { lenderId: user._id }],
      status: ORDER_STATES.CLOSED
    }).sort({ updatedAt: -1 });

    const frequencyCount = closedOrders.length;

    // Calculate Recency (days since last closed order)
    let recencyDays = 999;
    if (closedOrders.length > 0) {
      const lastOrderDate = closedOrders[0].updatedAt || closedOrders[0].createdAt;
      recencyDays = Math.max(0, Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Calculate Monetary (total spend if renter, total earnings if lender)
    let totalMonetary = 0;
    for (const order of closedOrders) {
      if (String(order.renterId) === String(user._id)) {
        totalMonetary += (order.pricing.rentAmount || 0);
      } else {
        totalMonetary += (order.pricing.lenderPayout || 0);
      }
    }

    // Read feedback summary via feedback service function
    const feedbackSummary = await feedbackService.getUserFeedbackSummary(user._id);

    // Normalize each dimension (1 to 5; never zeroes out!)
    const R = this._normalizeRecency(recencyDays);
    const F = this._normalizeFrequency(frequencyCount);
    const M = this._normalizeMonetary(totalMonetary);

    // LoopWear Score: Exec input (70%) blended with Feedback average (30%)
    const execScore = user.loopWearScore || tierConfig.normalizationBands.loopWearDefaultScore;
    const feedbackScore = feedbackSummary.totalReviews > 0 ? feedbackSummary.averageScore : execScore;
    const compositeLoopWear = Math.min(5, Math.max(1, (execScore * 0.7) + (feedbackScore * 0.3)));

    // Composite formula: R x F x M x LoopWear Score
    const compositeScore = Math.round(R * F * M * compositeLoopWear);

    // Map to tier thresholds
    let newTier = 'Silver';
    if (compositeScore >= tierConfig.tierThresholds.Diamond) {
      newTier = 'Diamond';
    } else if (compositeScore >= tierConfig.tierThresholds.Platinum) {
      newTier = 'Platinum';
    } else if (compositeScore >= tierConfig.tierThresholds.Gold) {
      newTier = 'Gold';
    }

    const previousTier = user.tier;
    const tierChanged = previousTier !== newTier;

    user.tierScore = compositeScore;
    user.tier = newTier;

    if (tierChanged || user.tierHistory.length === 0) {
      user.tierHistory.push({
        tier: newTier,
        score: compositeScore,
        reason,
        changedAt: new Date()
      });
    }

    await user.save();

    return {
      userId: user._id,
      previousTier,
      newTier,
      tierScore: compositeScore,
      rfm: {
        R,
        F,
        M,
        compositeLoopWear: Math.round(compositeLoopWear * 10) / 10,
        raw: { recencyDays, frequencyCount, totalMonetary }
      },
      tierChanged
    };
  }

  /**
   * Idempotent batch recomputation for all users
   * Called by nightly cron job or protected API endpoint
   */
  async recomputeAllTiers() {
    const users = await User.find({ role: 'user' }).select('_id');
    const results = [];

    for (const u of users) {
      try {
        const res = await this.recomputeUserTier(u._id, 'nightly_recompute');
        if (res) results.push(res);
      } catch (err) {
        console.error(`[Tier Engine] Failed for user ${u._id}:`, err.message);
      }
    }

    return {
      processedCount: results.length,
      upgradesCount: results.filter(r => r.tierChanged).length,
      timestamp: new Date()
    };
  }
}

const tierService = new TierService();
tierService.TierService = TierService;
module.exports = tierService;

