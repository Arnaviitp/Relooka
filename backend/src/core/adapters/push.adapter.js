const env = require('../config/env');

class NotificationAdapter {
  async sendNotification({ userId, title, body, data = {} }) {
    throw new Error('sendNotification() must be implemented');
  }
}

/**
 * In-App Notification Store Fallback
 * Provides 100% free notification storage without any external dependencies or keys.
 */
class InAppNotificationAdapter extends NotificationAdapter {
  constructor() {
    super();
    this.inAppStore = [];
  }

  async sendNotification({ userId, title, body, data = {} }) {
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: String(userId),
      title,
      body,
      data,
      read: false,
      createdAt: new Date()
    };
    this.inAppStore.push(notification);
    if (env.NODE_ENV !== 'test') {
      console.log(`[InApp Notification] To User ${userId}: ${title} - ${body}`);
    }
    return { success: true, notification };
  }

  getUserNotifications(userId) {
    return this.inAppStore.filter(n => n.userId === String(userId));
  }

  markAsRead(notificationId) {
    const item = this.inAppStore.find(n => n.id === notificationId);
    if (item) {
      item.read = true;
      return true;
    }
    return false;
  }
}

/**
 * Firebase Cloud Messaging Free Tier Adapter
 */
class FcmPushAdapter extends NotificationAdapter {
  constructor() {
    super();
    this.fallback = new InAppNotificationAdapter();
    this.serverKey = env.FCM_SERVER_KEY;
  }

  async sendNotification({ userId, title, body, data = {}, fcmToken }) {
    // Always store in-app for guaranteed history
    await this.fallback.sendNotification({ userId, title, body, data });

    if (!this.serverKey || !fcmToken) {
      return { success: true, channel: 'inapp_fallback' };
    }

    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${this.serverKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: fcmToken,
          notification: { title, body },
          data
        })
      });
      const resData = await response.json();
      return { success: resData.success === 1, channel: 'fcm', raw: resData };
    } catch (err) {
      console.error('[FCM Send Error]', err.message);
      return { success: true, channel: 'inapp_fallback' };
    }
  }

  getUserNotifications(userId) {
    return this.fallback.getUserNotifications(userId);
  }

  markAsRead(notificationId) {
    return this.fallback.markAsRead(notificationId);
  }
}

function createNotificationAdapter() {
  if (env.PUSH_DRIVER === 'fcm' && env.FCM_SERVER_KEY) {
    return new FcmPushAdapter();
  }
  return new InAppNotificationAdapter();
}

module.exports = {
  NotificationAdapter,
  InAppNotificationAdapter,
  FcmPushAdapter,
  notificationAdapter: createNotificationAdapter()
};

