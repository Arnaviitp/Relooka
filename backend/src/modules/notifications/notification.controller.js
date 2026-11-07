const { notificationAdapter } = require('../../core/adapters/push.adapter');
const { successResponse } = require('../../core/utils/response');

class NotificationController {
  async getMyNotifications(req, res, next) {
    try {
      const list = notificationAdapter.getUserNotifications(req.user.id);
      return successResponse(res, list, 'In-app notifications retrieved');
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const success = notificationAdapter.markAsRead(id);
      return successResponse(res, { marked: success }, success ? 'Notification marked as read' : 'Notification not found');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();

