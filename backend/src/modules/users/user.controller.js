const userService = require('./user.service');
const { successResponse } = require('../../core/utils/response');

class UserController {
  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserById(req.user.id);
      return successResponse(res, user, 'Profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { name, fcmToken } = req.body;
      const user = await userService.updateProfile(req.user.id, { name, fcmToken });
      return successResponse(res, user, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateCapabilities(req, res, next) {
    try {
      const { capabilities } = req.body;
      const user = await userService.updateCapabilities(req.user.id, capabilities);
      return successResponse(res, user, 'Capabilities updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async submitIdVerification(req, res, next) {
    try {
      const { idType, idNumber, nameAsPrinted, consentGiven } = req.body;
      const user = await userService.submitIdVerification(req.user.id, {
        idType,
        idNumber,
        nameAsPrinted,
        consentGiven
      });
      return successResponse(res, user, 'ID submitted for verification successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getPendingIdReviews(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await userService.getPendingIdReviews({ page, limit });
      return successResponse(res, result.reviews, 'Pending ID reviews retrieved', 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async reviewIdSubmission(req, res, next) {
    try {
      const { userId } = req.params;
      const { decision, rejectionReason } = req.body;
      const user = await userService.reviewIdSubmission(userId, req.user.id, {
        decision,
        rejectionReason
      });
      return successResponse(res, user, `ID submission ${decision} successfully`);
    } catch (err) {
      next(err);
    }
  }

  async setLoopWearScore(req, res, next) {
    try {
      const { userId } = req.params;
      const { score } = req.body;
      const user = await userService.setLoopWearScore(userId, score, req.user.id);
      return successResponse(res, user, 'LoopWear score updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async getTierInfo(req, res, next) {
    try {
      const tierInfo = await userService.getTierInfo(req.user.id);
      return successResponse(res, tierInfo, 'Tier details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getCartView(req, res, next) {
    try {
      const cart = await userService.getCartView(req.user.id);
      return successResponse(res, cart, 'Cart and active rental summary retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getUserInfo(req, res, next) {
    try {
      const info = await userService.getUserInfo(req.user.id);
      return successResponse(res, info, 'User comprehensive info retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();

