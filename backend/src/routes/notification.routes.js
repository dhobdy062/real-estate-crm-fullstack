const express = require('express');
const {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const yup = require('yup');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all notifications for the current user
router.get('/', validate(yup.object({
  page: yup.number().integer().min(1),
  limit: yup.number().integer().min(1).max(100),
  is_read: yup.string().oneOf(['true', 'false']),
  notification_type: yup.string(),
  related_entity_type: yup.string(),
  related_entity_id: yup.number().integer(),
  sort_by: yup.string(),
  sort_dir: yup.string().oneOf(['asc', 'desc']),
}), 'query'), getNotifications);

// Get notification by ID
router.get('/:id', getNotificationById);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Delete all notifications
router.delete('/', deleteAllNotifications);

module.exports = router;
