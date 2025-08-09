/**
 * Example client-side code for connecting to the notification WebSocket
 * 
 * This is a simple example of how to connect to the WebSocket server
 * and receive real-time notifications. In a real application, you would
 * integrate this with your frontend framework (React, Vue, Angular, etc.).
 */

// Function to connect to the notification WebSocket
function connectToNotificationSocket(token) {
  // Create WebSocket connection
  const socket = new WebSocket(`ws://localhost:3000/ws?token=${token}`);
  
  // Connection opened
  socket.addEventListener('open', (event) => {
    console.log('Connected to notification server');
    
    // Send a ping message every 30 seconds to keep the connection alive
    setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  });
  
  // Listen for messages
  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'notification':
          // Handle new notification
          console.log('New notification:', data.data);
          displayNotification(data.data);
          break;
        
        case 'unread_count':
          // Update unread count badge
          console.log('Unread count:', data.data.count);
          updateUnreadBadge(data.data.count);
          break;
        
        case 'pong':
          // Ping response, do nothing
          break;
        
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  // Connection closed
  socket.addEventListener('close', (event) => {
    console.log('Disconnected from notification server:', event.code, event.reason);
    
    // Attempt to reconnect after a delay if the connection was closed unexpectedly
    if (event.code !== 1000) {
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        connectToNotificationSocket(token);
      }, 5000);
    }
  });
  
  // Connection error
  socket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
  });
  
  return socket;
}

// Function to display a notification
function displayNotification(notification) {
  // In a real application, you would update your UI to show the notification
  // For example, adding it to a notification list and showing a toast
  
  // Example: Show browser notification if supported
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Real Estate CRM', {
      body: notification.message,
      icon: '/logo.png',
    });
  }
  
  // Example: Add to notification list in UI
  const notificationList = document.getElementById('notification-list');
  if (notificationList) {
    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification-item' + (notification.is_read ? '' : ' unread');
    notificationElement.innerHTML = `
      <div class="notification-message">${notification.message}</div>
      <div class="notification-time">${new Date(notification.created_at).toLocaleTimeString()}</div>
    `;
    notificationList.prepend(notificationElement);
  }
}

// Function to update the unread notification badge
function updateUnreadBadge(count) {
  // In a real application, you would update your UI to show the unread count
  // For example, updating a badge on a notification icon
  
  const badge = document.getElementById('notification-badge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }
}

// Example usage:
// 1. Get JWT token from login or localStorage
// const token = localStorage.getItem('token');
// 
// 2. Connect to notification WebSocket
// const socket = connectToNotificationSocket(token);
// 
// 3. Disconnect when needed (e.g., on logout)
// function logout() {
//   socket.close();
//   // Other logout logic...
// }
