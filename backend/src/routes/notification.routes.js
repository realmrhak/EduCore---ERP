const express = require('express');
const { body } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const { auth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/', auth, notificationController.getNotifications);
router.post('/', auth, requireAdmin, [
  body('title').trim().notEmpty(),
  body('message').trim().notEmpty(),
  body('category').optional().trim(),
  body('recipientId').optional().trim(),
  body('recipientRole').optional().trim(),
  body('recipientIds').optional().isArray(),
  body('department').optional().trim(),
  body('semester').optional().isNumeric(),
], notificationController.sendNotification);
router.put('/read-all', auth, notificationController.markAllRead);
router.get('/unread-count', auth, notificationController.getUnreadCount);
router.put('/:id/read', auth, notificationController.markRead);

module.exports = router;
