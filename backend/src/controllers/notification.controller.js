const db = require('../db/connection');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const notificationSocket = require('../utils/notificationSocket');

/**
 * Get all notifications for the current user
 * @route GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      is_read,
      notification_type,
      related_entity_type,
      related_entity_id,
      sort_by = 'created_at',
      sort_dir = 'desc',
    } = req.query;

    // Build query
    let query = db('notifications')
      .where('user_id', req.user.id)
      .select('*');

    // Filter by read status
    if (is_read !== undefined) {
      query = query.where('is_read', is_read === 'true');
    }

    // Filter by notification type
    if (notification_type) {
      query = query.where('notification_type', notification_type);
    }

    // Filter by related entity
    if (related_entity_type) {
      query = query.where('related_entity_type', related_entity_type);
    }

    if (related_entity_id) {
      query = query.where('related_entity_id', related_entity_id);
    }

    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('id as count');

    // Apply pagination and sorting
    query = query
      .orderBy(sort_by, sort_dir)
      .limit(limit)
      .offset((page - 1) * limit);

    // Execute query
    const notifications = await query;

    // Enrich notifications with related entity details
    for (const notification of notifications) {
      if (notification.related_entity_type && notification.related_entity_id) {
        notification.related_entity = await getRelatedEntityDetails(
          notification.related_entity_type,
          notification.related_entity_id
        );
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        unread_count: await getUnreadCount(req.user.id),
        pagination: {
          total: parseInt(count),
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification by ID
 * @route GET /api/notifications/:id
 */
const getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get notification
    const notification = await db('notifications')
      .where({
        id,
        user_id: req.user.id,
      })
      .first();

    if (!notification) {
      return next(new ApiError(404, 'Notification not found'));
    }

    // Enrich notification with related entity details
    if (notification.related_entity_type && notification.related_entity_id) {
      notification.related_entity = await getRelatedEntityDetails(
        notification.related_entity_type,
        notification.related_entity_id
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * @route PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if notification exists and belongs to the user
    const notification = await db('notifications')
      .where({
        id,
        user_id: req.user.id,
      })
      .first();

    if (!notification) {
      return next(new ApiError(404, 'Notification not found'));
    }

    // Mark as read
    await db('notifications')
      .where({ id })
      .update({
        is_read: true,
        read_at: new Date(),
      });

    // Get updated unread count
    const unreadCount = await getUnreadCount(req.user.id);

    // Send real-time update via WebSocket
    notificationSocket.sendUnreadCount(req.user.id, unreadCount);

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: {
        unread_count: unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    // Mark all user's unread notifications as read
    await db('notifications')
      .where({
        user_id: req.user.id,
        is_read: false,
      })
      .update({
        is_read: true,
        read_at: new Date(),
      });

    // Send real-time update via WebSocket
    notificationSocket.sendUnreadCount(req.user.id, 0);

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
      data: {
        unread_count: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 * @route DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if notification exists and belongs to the user
    const notification = await db('notifications')
      .where({
        id,
        user_id: req.user.id,
      })
      .first();

    if (!notification) {
      return next(new ApiError(404, 'Notification not found'));
    }

    // Delete notification
    await db('notifications')
      .where({ id })
      .del();

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully',
      data: {
        unread_count: await getUnreadCount(req.user.id),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all notifications
 * @route DELETE /api/notifications
 */
const deleteAllNotifications = async (req, res, next) => {
  try {
    // Delete all user's notifications
    await db('notifications')
      .where({
        user_id: req.user.id,
      })
      .del();

    res.status(200).json({
      status: 'success',
      message: 'All notifications deleted successfully',
      data: {
        unread_count: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<number>} - ID of the created notification
 */
const createNotification = async (notificationData) => {
  try {
    const [notificationId] = await db('notifications')
      .insert({
        user_id: notificationData.user_id,
        message: notificationData.message,
        notification_type: notificationData.notification_type,
        related_entity_type: notificationData.related_entity_type,
        related_entity_id: notificationData.related_entity_id,
        created_at: new Date(),
      })
      .returning('id');

    logger.info(`Created notification ${notificationId} for user ${notificationData.user_id}`);

    // Get the created notification
    const notification = await db('notifications')
      .where({ id: notificationId })
      .first();

    // Send real-time notification via WebSocket
    notificationSocket.sendNotification(notificationData.user_id, notification);

    // Update unread count
    const unreadCount = await getUnreadCount(notificationData.user_id);
    notificationSocket.sendUnreadCount(notificationData.user_id, unreadCount);

    // In a real-world application, you would also trigger push notifications here
    // using the user's device tokens from the user_devices table

    return notificationId;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple users
 * @param {Array} users - Array of user IDs
 * @param {Object} notificationData - Notification data (without user_id)
 * @returns {Promise<Array>} - Array of created notification IDs
 */
const createNotificationForUsers = async (users, notificationData) => {
  try {
    const notificationIds = [];

    for (const userId of users) {
      const notificationId = await createNotification({
        ...notificationData,
        user_id: userId,
      });

      notificationIds.push(notificationId);
    }

    return notificationIds;
  } catch (error) {
    logger.error('Error creating notifications for users:', error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} - Unread notification count
 */
const getUnreadCount = async (userId) => {
  const [{ count }] = await db('notifications')
    .where({
      user_id: userId,
      is_read: false,
    })
    .count('id as count');

  return parseInt(count);
};

/**
 * Get related entity details
 * @param {string} entityType - Entity type
 * @param {number} entityId - Entity ID
 * @returns {Promise<Object>} - Entity details
 */
const getRelatedEntityDetails = async (entityType, entityId) => {
  let entity = null;

  switch (entityType) {
    case 'Lead':
      entity = await db('leads')
        .select('id', 'first_name', 'last_name', 'email')
        .where('id', entityId)
        .first();
      break;

    case 'Contact':
      entity = await db('contacts')
        .select('id', 'first_name', 'last_name', 'email')
        .where('id', entityId)
        .first();
      break;

    case 'Task':
      entity = await db('tasks')
        .select('id', 'task_title', 'due_date', 'status')
        .where('id', entityId)
        .first();
      break;

    case 'Transaction':
      entity = await db('transactions')
        .join('properties', 'transactions.property_id', '=', 'properties.id')
        .select(
          'transactions.id',
          'transactions.transaction_name',
          'transactions.transaction_type',
          'properties.address_street',
          'properties.address_city',
          'properties.address_state'
        )
        .where('transactions.id', entityId)
        .first();
      break;

    case 'Communication':
      entity = await db('communications')
        .select('id', 'communication_type', 'subject', 'timestamp')
        .where('id', entityId)
        .first();
      break;

    default:
      logger.warn(`Unknown entity type: ${entityType}`);
  }

  return entity;
};

/**
 * Notification service for creating notifications from other parts of the application
 */
const notificationService = {
  /**
   * Create a notification for a user
   * @param {number} userId - User ID
   * @param {string} message - Notification message
   * @param {string} notificationType - Notification type
   * @param {string} relatedEntityType - Related entity type
   * @param {number} relatedEntityId - Related entity ID
   * @returns {Promise<number>} - ID of the created notification
   */
  async createForUser(userId, message, notificationType, relatedEntityType = null, relatedEntityId = null) {
    return await createNotification({
      user_id: userId,
      message,
      notification_type: notificationType,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
    });
  },

  /**
   * Create a notification for multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {string} message - Notification message
   * @param {string} notificationType - Notification type
   * @param {string} relatedEntityType - Related entity type
   * @param {number} relatedEntityId - Related entity ID
   * @returns {Promise<Array>} - Array of created notification IDs
   */
  async createForUsers(userIds, message, notificationType, relatedEntityType = null, relatedEntityId = null) {
    return await createNotificationForUsers(userIds, {
      message,
      notification_type: notificationType,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
    });
  },

  /**
   * Create a notification for a lead assignment
   * @param {number} leadId - Lead ID
   * @param {number} assignedUserId - Assigned user ID
   * @param {number} assignedByUserId - User ID who assigned the lead
   * @returns {Promise<number>} - ID of the created notification
   */
  async leadAssigned(leadId, assignedUserId, assignedByUserId) {
    // Get lead details
    const lead = await db('leads')
      .select('first_name', 'last_name')
      .where('id', leadId)
      .first();

    // Get assigner details
    const assigner = await db('users')
      .select('first_name', 'last_name')
      .where('id', assignedByUserId)
      .first();

    const leadName = lead.first_name && lead.last_name
      ? `${lead.first_name} ${lead.last_name}`
      : 'New lead';

    const assignerName = assigner
      ? `${assigner.first_name} ${assigner.last_name}`
      : 'A user';

    const message = `${assignerName} assigned ${leadName} to you`;

    return await createNotification({
      user_id: assignedUserId,
      message,
      notification_type: 'Lead Assigned',
      related_entity_type: 'Lead',
      related_entity_id: leadId,
    });
  },

  /**
   * Create a notification for a task assignment
   * @param {number} taskId - Task ID
   * @param {number} assignedUserId - Assigned user ID
   * @param {number} assignedByUserId - User ID who assigned the task
   * @returns {Promise<number>} - ID of the created notification
   */
  async taskAssigned(taskId, assignedUserId, assignedByUserId) {
    // Get task details
    const task = await db('tasks')
      .select('task_title')
      .where('id', taskId)
      .first();

    // Get assigner details
    const assigner = await db('users')
      .select('first_name', 'last_name')
      .where('id', assignedByUserId)
      .first();

    const assignerName = assigner
      ? `${assigner.first_name} ${assigner.last_name}`
      : 'A user';

    const message = `${assignerName} assigned task "${task.task_title}" to you`;

    return await createNotification({
      user_id: assignedUserId,
      message,
      notification_type: 'Task Assigned',
      related_entity_type: 'Task',
      related_entity_id: taskId,
    });
  },

  /**
   * Create a notification for a task due reminder
   * @param {number} taskId - Task ID
   * @param {number} assignedUserId - Assigned user ID
   * @returns {Promise<number>} - ID of the created notification
   */
  async taskDueReminder(taskId, assignedUserId) {
    // Get task details
    const task = await db('tasks')
      .select('task_title', 'due_date')
      .where('id', taskId)
      .first();

    const dueDate = new Date(task.due_date).toLocaleDateString();
    const message = `Task "${task.task_title}" is due on ${dueDate}`;

    return await createNotification({
      user_id: assignedUserId,
      message,
      notification_type: 'Task Due Reminder',
      related_entity_type: 'Task',
      related_entity_id: taskId,
    });
  },

  /**
   * Create a notification for a transaction status update
   * @param {number} transactionId - Transaction ID
   * @param {string} newStatus - New transaction status
   * @param {number} agentUserId - Agent user ID
   * @param {number} updatedByUserId - User ID who updated the transaction
   * @returns {Promise<number>} - ID of the created notification
   */
  async transactionStatusUpdated(transactionId, newStatus, agentUserId, updatedByUserId) {
    // Get transaction details
    const transaction = await db('transactions')
      .join('properties', 'transactions.property_id', '=', 'properties.id')
      .select(
        'transactions.transaction_name',
        'properties.address_street',
        'properties.address_city'
      )
      .where('transactions.id', transactionId)
      .first();

    const transactionName = transaction.transaction_name ||
      `${transaction.address_street}, ${transaction.address_city}`;

    const message = `Transaction "${transactionName}" status updated to "${newStatus}"`;

    return await createNotification({
      user_id: agentUserId,
      message,
      notification_type: 'Transaction Status Updated',
      related_entity_type: 'Transaction',
      related_entity_id: transactionId,
    });
  },

  /**
   * Create a notification for a new communication
   * @param {number} communicationId - Communication ID
   * @param {number} userId - User ID to notify
   * @param {string} senderName - Name of the sender
   * @param {string} communicationType - Type of communication (Email, SMS, etc.)
   * @returns {Promise<number>} - ID of the created notification
   */
  async newCommunication(communicationId, userId, senderName, communicationType) {
    // Get communication details
    const communication = await db('communications')
      .select('subject')
      .where('id', communicationId)
      .first();

    const subject = communication.subject || 'No subject';
    const message = `New ${communicationType} from ${senderName}: "${subject}"`;

    return await createNotification({
      user_id: userId,
      message,
      notification_type: 'New Communication',
      related_entity_type: 'Communication',
      related_entity_id: communicationId,
    });
  },
};

module.exports = {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  notificationService,
};
