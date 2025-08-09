# Full Stack Real Estate CRM Setup Guide

This guide will help you combine your Real Estate CRM backend with the crm-nexus-frontend to create a deployable full-stack application.

## Current Project Structure

Your current backend is located at:
```
/Users/donhobdyjr/Documents/GitHub/Real Estate CRM/
```

Your frontend is located at:
```
/Users/donhobdyjr/Documents/GitHub/Real Estate CRM/crm-nexus-frontend/
```

## Recommended Full Stack Structure

```
real-estate-crm-fullstack/
├── backend/                 # Move current backend here
│   ├── src/
│   ├── package.json
│   ├── knexfile.js
│   └── ...
├── frontend/               # Copy crm-nexus-frontend here
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── docker-compose.yml      # For local development
├── package.json           # Root package.json for scripts
├── README.md
└── .env                   # Environment variables
```

## Step-by-Step Integration Process

### 1. Create New Project Structure

```bash
# Create new project directory
mkdir real-estate-crm-fullstack
cd real-estate-crm-fullstack

# Copy backend
cp -r "/Users/donhobdyjr/Documents/GitHub/Real Estate CRM" ./backend

# Copy frontend
cp -r "/Users/donhobdyjr/Documents/GitHub/crm-nexus-frontend" ./frontend
```

### 2. Configure Backend for Full Stack

Update backend CORS configuration in `backend/src/server.js`:

```javascript
// Update CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

### 3. Update Environment Variables

Create `.env` file in the root directory:

```env
# Backend Configuration
BACKEND_PORT=3000
FRONTEND_PORT=3001
FRONTEND_URL=http://localhost:3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=real_estate_crm
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Logging Configuration
LOG_LEVEL=info
```

### 4. Create Root Package.json

This will allow you to manage both frontend and backend from the root:

```json
{
  "name": "real-estate-crm-fullstack",
  "version": "1.0.0",
  "description": "Full stack Real Estate CRM application",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm start",
    "build": "cd frontend && npm run build",
    "start": "cd backend && npm start",
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install",
    "migrate": "cd backend && npm run migrate",
    "seed": "cd backend && npm run seed"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

### 5. Frontend API Configuration

Update your frontend to point to the backend API. Look for API configuration files in your frontend and update the base URL:

```javascript
// In your frontend API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

### 6. Docker Setup (Optional)

Create `docker-compose.yml` for easy local development:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: real_estate_crm
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=real_estate_crm
      - DB_USER=postgres
      - DB_PASSWORD=postgres
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3001:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:3000/api
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

## Quick Start Commands

After setting up the structure:

```bash
# Install all dependencies
npm run install:all

# Set up database
npm run migrate
npm run seed

# Start development servers
npm run dev
```

## Production Deployment

### Option 1: Separate Deployment
- Deploy backend to a service like Heroku, Railway, or DigitalOcean
- Deploy frontend to Netlify, Vercel, or similar
- Update frontend environment variables to point to production backend

### Option 2: Single Server Deployment
- Build frontend: `npm run build`
- Serve frontend static files from backend
- Update backend to serve frontend build files

## Backend Modifications for Serving Frontend

Add to `backend/src/server.js` after routes but before error handler:

```javascript
// Serve static files from frontend build
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}
```

## Testing the Integration

1. Start both servers: `npm run dev`
2. Backend should be running on http://localhost:3000
3. Frontend should be running on http://localhost:3001
4. Test API calls from frontend to backend
5. Verify authentication flow works
6. Test real-time features (WebSocket notifications)

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure backend CORS is configured to allow frontend origin
2. **API Connection**: Verify frontend API base URL points to correct backend port
3. **Database Connection**: Ensure PostgreSQL is running and credentials are correct
4. **Port Conflicts**: Make sure ports 3000 and 3001 are available

### Environment Variables Checklist:

- [ ] Backend port configuration
- [ ] Frontend API URL
- [ ] Database credentials
- [ ] JWT secret
- [ ] File upload settings

This setup will give you a fully integrated full-stack application that you can develop locally and deploy as needed.