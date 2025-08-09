# Deploying Real Estate CRM to Vercel

This guide will walk you through deploying your Real Estate CRM Full Stack application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub (already done)
3. **Database**: You'll need a PostgreSQL database (we'll use Neon or Supabase)

## Step 1: Set Up Database

### Option A: Using Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://username:password@host/database?sslmode=require`)

### Option B: Using Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > Database and copy the connection string

## Step 2: Deploy to Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "New Project"
3. Import your GitHub repository: `real-estate-crm-fullstack`
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: Leave empty (uses root)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install && cd backend && npm install && cd ../frontend && npm install`

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: real-estate-crm-fullstack
# - Directory: ./
```

## Step 3: Configure Environment Variables

In your Vercel dashboard, go to your project settings and add these environment variables:

### Backend Environment Variables

```env
NODE_ENV=production
PORT=3000

# Database Configuration (use your database connection string)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=24h

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Logging Configuration
LOG_LEVEL=info

# Frontend URL (will be your Vercel domain)
FRONTEND_URL=https://your-app-name.vercel.app
```

### Frontend Environment Variables

```env
VITE_API_URL=https://your-app-name.vercel.app/api
VITE_APP_NAME=Real Estate CRM
```

## Step 4: Database Migration

After deployment, you need to run database migrations. You can do this in several ways:

### Option A: Using Vercel CLI

```bash
# Connect to your deployed project
vercel env pull .env.local

# Run migrations locally against production database
npm run migrate
npm run seed
```

### Option B: Create a Migration Script

Create a simple migration endpoint in your backend (temporary):

```javascript
// Add to backend/src/server.js (remove after migration)
app.get('/migrate', async (req, res) => {
  try {
    const knex = require('./config/database');
    await knex.migrate.latest();
    await knex.seed.run();
    res.json({ message: 'Migration completed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Then visit `https://your-app-name.vercel.app/migrate` once to run migrations.

## Step 5: Update Frontend API Configuration

Make sure your frontend is configured to use the production API:

```javascript
// In your frontend API configuration file
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

## Step 6: Test Your Deployment

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Test the following:
   - Frontend loads correctly
   - API endpoints work
   - Authentication flow
   - Database operations
   - File uploads (if applicable)

## Configuration Files Created

The following files have been created/updated for Vercel deployment:

1. **`vercel.json`** (root): Main Vercel configuration
2. **`frontend/vercel.json`**: Frontend-specific configuration
3. **Updated `backend/src/server.js`**: CORS and static file serving for production

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify build commands are correct

2. **API Not Working**:
   - Check environment variables are set correctly
   - Verify CORS configuration allows your domain
   - Check function logs in Vercel dashboard

3. **Database Connection Issues**:
   - Verify database connection string is correct
   - Ensure database allows connections from Vercel IPs
   - Check if SSL is required

4. **Static Files Not Loading**:
   - Verify build output directory is correct (`frontend/dist`)
   - Check if all assets are being built properly

### Useful Commands:

```bash
# Check deployment logs
vercel logs

# Pull environment variables
vercel env pull

# Redeploy
vercel --prod

# Check project info
vercel project ls
```

## Production Checklist

- [ ] Database is set up and accessible
- [ ] All environment variables are configured
- [ ] Database migrations have been run
- [ ] Frontend API URL points to production backend
- [ ] CORS is configured for production domain
- [ ] SSL/HTTPS is working
- [ ] Authentication flow works
- [ ] File uploads work (if applicable)
- [ ] All features tested in production

## Monitoring and Maintenance

1. **Monitor Performance**: Use Vercel Analytics
2. **Error Tracking**: Consider adding Sentry or similar
3. **Database Monitoring**: Monitor your database performance
4. **Regular Backups**: Set up automated database backups
5. **Updates**: Keep dependencies updated

Your Real Estate CRM should now be live on Vercel! 🎉

## Next Steps

- Set up custom domain (optional)
- Configure email services for notifications
- Set up monitoring and alerting
- Consider adding a CDN for better performance
- Implement proper logging and error tracking