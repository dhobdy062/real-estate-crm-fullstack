#!/bin/bash

# Real Estate CRM Full Stack Setup Script
# This script combines the backend and frontend into a single deployable application

set -e  # Exit on any error

echo "🏠 Real Estate CRM Full Stack Setup"
echo "===================================="

# Configuration
PROJECT_NAME="real-estate-crm-fullstack"
BACKEND_SOURCE="/Users/donhobdyjr/Documents/GitHub/Real Estate CRM"
FRONTEND_SOURCE="/Users/donhobdyjr/Documents/GitHub/Real Estate CRM/crm-nexus-frontend"
TARGET_DIR="$HOME/Documents/GitHub/$PROJECT_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if directories exist
check_directories() {
    print_status "Checking source directories..."
    
    if [ ! -d "$BACKEND_SOURCE" ]; then
        print_error "Backend directory not found: $BACKEND_SOURCE"
        exit 1
    fi
    
    if [ ! -d "$FRONTEND_SOURCE" ]; then
        print_warning "Frontend directory not found: $FRONTEND_SOURCE"
        print_warning "Please move crm-nexus-frontend to the current directory first"
        print_warning "Expected location: /Users/donhobdyjr/Documents/GitHub/Real Estate CRM/crm-nexus-frontend"
        FRONTEND_EXISTS=false
    else
        FRONTEND_EXISTS=true
    fi
    
    print_success "Directory check completed"
}

# Create project structure
create_structure() {
    print_status "Creating project structure..."
    
    # Remove existing directory if it exists
    if [ -d "$TARGET_DIR" ]; then
        print_warning "Target directory exists. Removing..."
        rm -rf "$TARGET_DIR"
    fi
    
    # Create main directory
    mkdir -p "$TARGET_DIR"
    cd "$TARGET_DIR"
    
    # Copy backend
    print_status "Copying backend files..."
    cp -r "$BACKEND_SOURCE" ./backend
    
    # Copy frontend if it exists
    if [ "$FRONTEND_EXISTS" = true ]; then
        print_status "Copying frontend files..."
        cp -r "$FRONTEND_SOURCE" ./frontend
    else
        print_warning "Creating placeholder frontend directory"
        mkdir -p ./frontend
        echo "# Frontend Placeholder" > ./frontend/README.md
        echo "Copy your crm-nexus-frontend files here" >> ./frontend/README.md
    fi
    
    print_success "Project structure created"
}

# Setup configuration files
setup_config() {
    print_status "Setting up configuration files..."
    
    # Copy root package.json
    cp ./backend/package-root.json ./package.json
    
    # Copy docker-compose.yml
    cp ./backend/docker-compose.yml ./
    
    # Copy Dockerfile for backend
    cp ./backend/Dockerfile.backend ./backend/Dockerfile
    
    # Create environment file
    cat > .env << EOF
# Full Stack Environment Configuration

# Server Configuration
NODE_ENV=development
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
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=24h

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Logging Configuration
LOG_LEVEL=info

# Frontend Configuration
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000
EOF

    # Copy backend .env
    cp .env ./backend/.env
    
    print_success "Configuration files created"
}

# Create frontend Dockerfile if frontend exists
create_frontend_dockerfile() {
    if [ "$FRONTEND_EXISTS" = true ]; then
        print_status "Creating frontend Dockerfile..."
        
        cat > ./frontend/Dockerfile << 'EOF'
# Frontend Dockerfile
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

        # Create nginx configuration
        cat > ./frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
        
        print_success "Frontend Dockerfile created"
    fi
}

# Create README
create_readme() {
    print_status "Creating README..."
    
    cat > README.md << 'EOF'
# Real Estate CRM - Full Stack Application

A comprehensive Real Estate Customer Relationship Management system with a Node.js/Express backend and React frontend.

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Development Setup

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Setup database:**
   ```bash
   npm run migrate
   npm run seed
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API on http://localhost:3000
   - Frontend on http://localhost:3001

### Docker Setup

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Run migrations:**
   ```bash
   docker-compose exec backend npm run migrate
   ```

## Project Structure

```
├── backend/          # Node.js/Express API
├── frontend/         # React application
├── docker-compose.yml
├── package.json      # Root package.json
└── .env             # Environment variables
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build frontend for production
- `npm run start` - Start backend in production mode
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests

## Environment Variables

Copy `.env.example` to `.env` and update the values as needed.

## Deployment

See `FULLSTACK_SETUP.md` for detailed deployment instructions.
EOF
    
    print_success "README created"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install backend dependencies
    cd backend && npm install && cd ..
    
    # Install frontend dependencies if frontend exists
    if [ "$FRONTEND_EXISTS" = true ]; then
        cd frontend && npm install && cd ..
    fi
    
    print_success "Dependencies installed"
}

# Main execution
main() {
    print_status "Starting full stack setup..."
    
    check_directories
    create_structure
    setup_config
    create_frontend_dockerfile
    create_readme
    install_dependencies
    
    print_success "Full stack setup completed!"
    echo ""
    echo "📁 Project created at: $TARGET_DIR"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. cd $TARGET_DIR"
    if [ "$FRONTEND_EXISTS" = false ]; then
        echo "   2. Copy your frontend files to ./frontend/"
        echo "   3. Update frontend API configuration"
        echo "   4. npm run dev"
    else
        echo "   2. npm run dev"
    fi
    echo ""
    echo "📖 See README.md and FULLSTACK_SETUP.md for detailed instructions"
}

# Run main function
main "$@"