const tierService = require('./tier.service');
const { successResponse } = require('../../core/utils/response');

class TierController {
  async triggerNightlyRecompute(req, res, next) {
    try {
      const summary = await tierService.recomputeAllTiers();
      return successResponse(res, summary, 'Nightly tier recomputation completed successfully');
    } catch (err) {
      next(err);
    }
  }

  async recomputeUserTier(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await tierService.recomputeUserTier(userId, 'admin_override');
      return successResponse(res, result, 'User tier recalculated');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TierController();

