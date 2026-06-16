const notificationService = require('../services/notification.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { validationResult } = require('express-validator');

class NotificationController {
  getNotifications = catchAsync(async (req, res) => {
    const { category } = req.query;
    const notifications = await notificationService.getNotifications(req.user._id, category);
    return sendSuccess(res, notifications, 'Notifications list fetched');
  });

  sendNotification = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation error', 400, errors.array());

    try {
      const notifications = await notificationService.sendNotifications(req.body, req.user._id);
      return sendSuccess(res, notifications, `Notification sent to ${notifications.length} recipients`, 201);
    } catch (e) {
      return sendError(res, e.message, 400);
    }
  });

  markAllRead = catchAsync(async (req, res) => {
    await notificationService.markAllRead(req.user._id);
    return sendSuccess(res, null, 'All notifications marked as read');
  });

  markRead = catchAsync(async (req, res) => {
    try {
      const notification = await notificationService.markRead(req.params.id, req.user._id);
      return sendSuccess(res, notification, 'Notification marked as read');
    } catch (e) {
      return sendError(res, e.message, 404);
    }
  });

  getUnreadCount = catchAsync(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user._id);
    return sendSuccess(res, { count }, 'Unread count fetched');
  });
}

module.exports = new NotificationController();
