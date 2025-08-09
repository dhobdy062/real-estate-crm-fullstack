# Real Estate CRM Notification System

This document explains the notification system implemented in the Real Estate CRM backend.

## Overview

The notification system provides real-time alerts to users about important events in the CRM system, such as:

- Lead assignments
- Task assignments and due dates
- Transaction status updates
- New communications
- Workflow executions
- And more...

The system consists of two main components:

1. **REST API Endpoints**: For managing notifications (listing, marking as read, deleting)
2. **WebSocket Server**: For delivering real-time notifications to connected clients

## Database Schema

Notifications are stored in the `notifications` table with the following structure:

```sql
CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL (FK references users.id ON DELETE CASCADE),
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE NULLABLE,
  related_entity_type VARCHAR(50) NULLABLE,
  related_entity_id BIGINT NULLABLE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

The notification system exposes the following REST API endpoints:

### GET /api/notifications

Get all notifications for the current user.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20)
- `is_read`: Filter by read status ('true' or 'false')
- `notification_type`: Filter by notification type
- `related_entity_type`: Filter by related entity type
- `related_entity_id`: Filter by related entity ID
- `sort_by`: Field to sort by (default: 'created_at')
- `sort_dir`: Sort direction ('asc' or 'desc', default: 'desc')

**Response:**
```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "id": 123,
        "user_id": 1,
        "message": "John Doe assigned a new lead to you",
        "notification_type": "Lead Assigned",
        "is_read": false,
        "read_at": null,
        "related_entity_type": "Lead",
        "related_entity_id": 456,
        "created_at": "2023-12-01T12:00:00Z",
        "related_entity": {
          "id": 456,
          "first_name": "Jane",
          "last_name": "Smith",
          "email": "jane@example.com"
        }
      }
    ],
    "unread_count": 5,
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "pages": 2
    }
  }
}
```

### GET /api/notifications/:id

Get a specific notification by ID.

**Response:**
```json
{
  "status": "success",
  "data": {
    "notification": {
      "id": 123,
      "user_id": 1,
      "message": "John Doe assigned a new lead to you",
      "notification_type": "Lead Assigned",
      "is_read": false,
      "read_at": null,
      "related_entity_type": "Lead",
      "related_entity_id": 456,
      "created_at": "2023-12-01T12:00:00Z",
      "related_entity": {
        "id": 456,
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@example.com"
      }
    }
  }
}
```

### PATCH /api/notifications/:id/read

Mark a notification as read.

**Response:**
```json
{
  "status": "success",
  "message": "Notification marked as read",
  "data": {
    "unread_count": 4
  }
}
```

### PATCH /api/notifications/read-all

Mark all notifications as read.

**Response:**
```json
{
  "status": "success",
  "message": "All notifications marked as read",
  "data": {
    "unread_count": 0
  }
}
```

### DELETE /api/notifications/:id

Delete a notification.

**Response:**
```json
{
  "status": "success",
  "message": "Notification deleted successfully",
  "data": {
    "unread_count": 4
  }
}
```

### DELETE /api/notifications

Delete all notifications.

**Response:**
```json
{
  "status": "success",
  "message": "All notifications deleted successfully",
  "data": {
    "unread_count": 0
  }
}
```

## WebSocket Server

The notification system includes a WebSocket server for delivering real-time notifications to connected clients.

### Connection

To connect to the WebSocket server, clients should use the following URL:

```
ws://your-server-url/ws?token=your-jwt-token
```

The JWT token is required for authentication. If the token is invalid or missing, the connection will be closed.

### Message Types

The WebSocket server sends the following message types to clients:

#### Notification

Sent when a new notification is created for the user.

```json
{
  "type": "notification",
  "data": {
    "id": 123,
    "user_id": 1,
    "message": "John Doe assigned a new lead to you",
    "notification_type": "Lead Assigned",
    "is_read": false,
    "read_at": null,
    "related_entity_type": "Lead",
    "related_entity_id": 456,
    "created_at": "2023-12-01T12:00:00Z"
  }
}
```

#### Unread Count

Sent when the user's unread notification count changes.

```json
{
  "type": "unread_count",
  "data": {
    "count": 5
  }
}
```

#### Pong

Response to a ping message from the client.

```json
{
  "type": "pong"
}
```

### Client Messages

Clients can send the following message types to the server:

#### Ping

Sent periodically to keep the connection alive.

```json
{
  "type": "ping"
}
```

## Notification Service

The notification system includes a service for creating notifications from other parts of the application. This service is available as `notificationService` in the `notification.controller.js` file.

### Methods

#### createForUser

Create a notification for a single user.

```javascript
await notificationService.createForUser(
  userId,
  message,
  notificationType,
  relatedEntityType,
  relatedEntityId
);
```

#### createForUsers

Create a notification for multiple users.

```javascript
await notificationService.createForUsers(
  userIds,
  message,
  notificationType,
  relatedEntityType,
  relatedEntityId
);
```

#### leadAssigned

Create a notification for a lead assignment.

```javascript
await notificationService.leadAssigned(
  leadId,
  assignedUserId,
  assignedByUserId
);
```

#### taskAssigned

Create a notification for a task assignment.

```javascript
await notificationService.taskAssigned(
  taskId,
  assignedUserId,
  assignedByUserId
);
```

#### taskDueReminder

Create a notification for a task due reminder.

```javascript
await notificationService.taskDueReminder(
  taskId,
  assignedUserId
);
```

#### transactionStatusUpdated

Create a notification for a transaction status update.

```javascript
await notificationService.transactionStatusUpdated(
  transactionId,
  newStatus,
  agentUserId,
  updatedByUserId
);
```

#### newCommunication

Create a notification for a new communication.

```javascript
await notificationService.newCommunication(
  communicationId,
  userId,
  senderName,
  communicationType
);
```

## Integration with Other Controllers

To use the notification service in other controllers, import it and call the appropriate method:

```javascript
const { notificationService } = require('../controllers/notification.controller');

// Example: Create a notification when a lead is assigned
async function assignLead(leadId, assignedUserId) {
  // Assign the lead...
  
  // Create a notification
  await notificationService.leadAssigned(
    leadId,
    assignedUserId,
    req.user.id // Current user ID
  );
}
```

## Client-Side Integration

See the example files in the `examples` directory for how to integrate the notification system with a client-side application:

- `notification-client.js`: JavaScript code for connecting to the WebSocket server and handling notifications
- `notification-example.html`: Complete HTML example with UI for displaying notifications

## Mobile Push Notifications

For mobile push notifications, the system includes a `user_devices` table to store device tokens. In a production environment, you would integrate with a push notification service like Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNS) to send push notifications to mobile devices.

The integration would involve:

1. Storing device tokens in the `user_devices` table when users log in from mobile devices
2. Sending push notifications to these devices when new notifications are created
3. Handling notification clicks in the mobile app

This implementation is left as a future enhancement.
