const feedbackService = require('./feedback.service');
const { successResponse } = require('../../core/utils/response');

class FeedbackController {
  async submitFeedback(req, res, next) {
    try {
      const { orderId } = req.params;
      const { itemAccuracy, itemCondition, lenderConduct, returnCondition, renterConduct, comment } = req.body;
      const feedback = await feedbackService.submitFeedback({
        orderId,
        reviewerId: req.user.id,
        itemAccuracy,
        itemCondition,
        lenderConduct,
        returnCondition,
        renterConduct,
        comment
      });
      return successResponse(res, feedback, 'Feedback submitted successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getOrderFeedbacks(req, res, next) {
    try {
      const { orderId } = req.params;
      const feedbacks = await feedbackService.getOrderFeedbacks(orderId);
      return successResponse(res, feedbacks, 'Feedbacks retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FeedbackController();

