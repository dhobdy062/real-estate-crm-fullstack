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
   - Frontend on http://localhost:8080 (or 8081 if 8080 is occupied)

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
