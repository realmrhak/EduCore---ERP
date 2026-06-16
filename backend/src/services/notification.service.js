const { Notification, User } = require('../models');
const { notifyUser, notifyRole } = require('./websocket.service');

class NotificationService {
  async getNotifications(userId, category) {
    const query = { recipient: userId };
    if (category) query.category = category;
    return Notification.find(query)
      .populate('sender', 'name role')
      .sort({ createdAt: -1 });
  }

  async sendNotifications({ title, message, category, recipientId, recipientRole, recipientIds, department, semester }, senderId) {
    let recipients = [];

    if (recipientIds && Array.isArray(recipientIds)) {
      // Specific list of user IDs
      recipients = recipientIds;
    } else if (recipientId) {
      // Single recipient
      recipients = [recipientId];
    } else if (recipientRole) {
      if (recipientRole === 'all') {
        // Broadcast to all active users
        const filter = { status: 'Active', isDeleted: false };
        if (department) filter.department = department;
        if (semester) filter.semester = parseInt(semester);
        const users = await User.find(filter).select('_id');
        recipients = users.map((u) => u._id);
      } else {
        // All users with a specific role, optionally filtered by department/semester
        const filter = { role: recipientRole, status: 'Active', isDeleted: false };
        if (department) filter.department = department;
        if (semester) filter.semester = parseInt(semester);
        const users = await User.find(filter).select('_id');
        recipients = users.map((u) => u._id);
      }
    } else {
      throw new Error('Specify recipientId, recipientIds, or recipientRole');
    }

    if (recipients.length === 0) {
      throw new Error('No matching recipients found');
    }

    const notifications = await Notification.insertMany(
      recipients.map((recipient) => ({
        recipient,
        title,
        message,
        category: category || 'Message',
        sender: senderId,
      }))
    );

    // ── Push real-time notifications via WebSocket ──
    const sender = await User.findById(senderId).select('name role');
    const notificationPayload = {
      title,
      message,
      category: category || 'Message',
      sender: sender ? { name: sender.name, role: sender.role } : null,
      createdAt: new Date().toISOString(),
    };

    // Notify each individual user
    recipients.forEach((recipientId) => {
      notifyUser(recipientId.toString(), {
        ...notificationPayload,
        _id: notifications.find(n => n.recipient.toString() === recipientId.toString())?._id,
      });
    });

    // Also emit to role-based room for instant badge updates
    if (recipientRole) {
      notifyRole(recipientRole, {
        ...notificationPayload,
        type: 'badge-update',
      });
    }

    return notifications;
  }

  async markAllRead(userId) {
    return Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  }

  async markRead(id, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { returnDocument: 'after' }
    );
    if (!notification) throw new Error('Notification not found');
    return notification;
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({ recipient: userId, isRead: false });
  }
}

module.exports = new NotificationService();
