/**
 * WebSocket handler for real-time notifications
 * 
 * This module provides functionality for sending real-time notifications to clients
 * via WebSockets. In a production environment, you would use a library like Socket.IO
 * or a service like Pusher for more robust WebSocket support.
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('./logger');
const db = require('../db/connection');

let wss = null;
const userSockets = new Map(); // Map of userId -> Set of WebSocket connections

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 */
const initialize = (server) => {
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', async (ws, req) => {
    try {
      // Extract token from query parameters
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(4001, 'Authentication token is required');
        return;
      }
      
      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        ws.close(4002, 'Invalid authentication token');
        return;
      }
      
      const userId = decoded.id;
      
      // Check if user exists
      const user = await db('users').where({ id: userId, is_active: true }).first();
      if (!user) {
        ws.close(4003, 'User not found or inactive');
        return;
      }
      
      // Store user ID in WebSocket object
      ws.userId = userId;
      
      // Add WebSocket connection to user's connections
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(ws);
      
      logger.info(`User ${userId} connected to WebSocket`);
      
      // Send initial unread count
      const [{ count }] = await db('notifications')
        .where({
          user_id: userId,
          is_read: false,
        })
        .count('id as count');
      
      ws.send(JSON.stringify({
        type: 'unread_count',
        data: {
          count: parseInt(count),
        },
      }));
      
      // Handle WebSocket messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          // Handle different message types
          switch (data.type) {
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
            
            default:
              logger.warn(`Unknown message type: ${data.type}`);
          }
        } catch (error) {
          logger.error('Error handling WebSocket message:', error);
        }
      });
      
      // Handle WebSocket close
      ws.on('close', () => {
        if (userSockets.has(userId)) {
          userSockets.get(userId).delete(ws);
          
          // Remove user from map if no connections left
          if (userSockets.get(userId).size === 0) {
            userSockets.delete(userId);
          }
        }
        
        logger.info(`User ${userId} disconnected from WebSocket`);
      });
    } catch (error) {
      logger.error('Error handling WebSocket connection:', error);
      ws.close(4000, 'Internal server error');
    }
  });
  
  logger.info('WebSocket server initialized');
};

/**
 * Send notification to a user
 * @param {number} userId - User ID
 * @param {Object} notification - Notification object
 */
const sendNotification = (userId, notification) => {
  if (!wss) {
    logger.warn('WebSocket server not initialized');
    return;
  }
  
  if (!userSockets.has(userId)) {
    // User not connected, notification will be seen when they log in
    return;
  }
  
  const message = JSON.stringify({
    type: 'notification',
    data: notification,
  });
  
  // Send to all connections for this user
  userSockets.get(userId).forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
};

/**
 * Send unread count update to a user
 * @param {number} userId - User ID
 * @param {number} count - Unread count
 */
const sendUnreadCount = (userId, count) => {
  if (!wss) {
    logger.warn('WebSocket server not initialized');
    return;
  }
  
  if (!userSockets.has(userId)) {
    // User not connected
    return;
  }
  
  const message = JSON.stringify({
    type: 'unread_count',
    data: {
      count,
    },
  });
  
  // Send to all connections for this user
  userSockets.get(userId).forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
};

/**
 * Broadcast a message to all connected clients
 * @param {Object} data - Data to broadcast
 */
const broadcast = (data) => {
  if (!wss) {
    logger.warn('WebSocket server not initialized');
    return;
  }
  
  const message = JSON.stringify(data);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

module.exports = {
  initialize,
  sendNotification,
  sendUnreadCount,
  broadcast,
};
