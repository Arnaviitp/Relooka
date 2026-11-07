const Feedback = require('./feedback.model');
const { Order, ORDER_STATES } = require('../orders/order.model');
const User = require('../users/user.model');
const AppError = require('../../core/utils/AppError');

class FeedbackService {
  async submitFeedback({
    orderId,
    reviewerId,
    itemAccuracy,
    itemCondition,
    lenderConduct,
    returnCondition,
    renterConduct,
    comment
  }) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.status !== ORDER_STATES.CLOSED) {
      throw new AppError('Feedback can only be submitted for completed (CLOSED) orders', 400, 'ORDER_NOT_CLOSED');
    }

    const isRenter = String(order.renterId) === String(reviewerId);
    const isLender = String(order.lenderId) === String(reviewerId);

    if (!isRenter && !isLender) {
      throw new AppError('You are not authorized to submit feedback for this order', 403, 'FORBIDDEN_FEEDBACK');
    }

    const reviewerRole = isRenter ? 'renter' : 'lender';
    const revieweeId = isRenter ? order.lenderId : order.renterId;

    let averageScore;
    if (isRenter) {
      if (!itemAccuracy || !itemCondition || !lenderConduct) {
        throw new AppError('Renters must rate item accuracy, condition, and lender conduct (1-5 each)', 400, 'INCOMPLETE_RATINGS');
      }
      averageScore = (Number(itemAccuracy) + Number(itemCondition) + Number(lenderConduct)) / 3;
    } else {
      if (!returnCondition || !renterConduct) {
        throw new AppError('Lenders must rate return condition and renter conduct (1-5 each)', 400, 'INCOMPLETE_RATINGS');
      }
      averageScore = (Number(returnCondition) + Number(renterConduct)) / 2;
    }

    averageScore = Math.round(averageScore * 10) / 10;

    const feedback = await Feedback.create({
      orderId,
      reviewerId,
      revieweeId,
      reviewerRole,
      itemAccuracy,
      itemCondition,
      lenderConduct,
      returnCondition,
      renterConduct,
      averageScore,
      comment
    });

    // Update reviewee rolling average feedback
    const reviewee = await User.findById(revieweeId);
    if (reviewee) {
      const currentAvg = reviewee.feedbackScoreAverage || 5.0;
      const count = reviewee.feedbackCount || 0;
      const newCount = count + 1;
      const newAvg = (currentAvg * count + averageScore) / newCount;

      reviewee.feedbackScoreAverage = Math.round(newAvg * 10) / 10;
      reviewee.feedbackCount = newCount;
      await reviewee.save();
    }

    return feedback;
  }

  /**
   * Internal service function that the tier engine reads
   * @param {string|ObjectId} userId
   * @returns {Promise<{ averageScore: number, totalReviews: number }>}
   */
  async getUserFeedbackSummary(userId) {
    const user = await User.findById(userId).select('feedbackScoreAverage feedbackCount');
    if (!user) {
      return { averageScore: 3.0, totalReviews: 0 };
    }
    return {
      averageScore: user.feedbackScoreAverage || 3.0,
      totalReviews: user.feedbackCount || 0
    };
  }

  async getOrderFeedbacks(orderId) {
    return Feedback.find({ orderId })
      .populate('reviewerId', 'name tier')
      .populate('revieweeId', 'name tier');
  }
}

module.exports = new FeedbackService();
