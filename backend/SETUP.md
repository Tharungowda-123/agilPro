# Backend Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher recommended)
   - Check version: `node --version`
   - Download from: https://nodejs.org/

2. **MongoDB** (v6 or higher)
   - Check if MongoDB is installed: `mongod --version`
   - Make sure MongoDB service is running
   - Download from: https://www.mongodb.com/try/download/community

3. **npm** (comes with Node.js)
   - Check version: `npm --version`

## Step-by-Step Setup

### 1. Navigate to Backend Directory

```bash
cd /home/ai/agilPro/backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies listed in `package.json`:
- Express, Mongoose, JWT, Socket.IO, Winston, etc.

### 3. Set Up Environment Variables

Create a `.env` file from the example:

```bash
cp env.example .env
```

Or manually create `.env` file with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/agilesafe

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRY=604800
JWT_REFRESH_EXPIRY=2592000

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# ML Service URL (Optional)
ML_SERVICE_URL=http://localhost:8000

# Logging
LOG_LEVEL=info
```

**Important:** Change the JWT secrets to secure random strings in production!

### 4. Start MongoDB

Make sure MongoDB is running:

**On Linux:**
```bash
sudo systemctl start mongod
# Or
sudo service mongod start
```

**On macOS:**
```bash
brew services start mongodb-community
```

**On Windows:**
- MongoDB should start automatically as a service
- Or run: `net start MongoDB`

**Verify MongoDB is running:**
```bash
mongosh
# Or
mongo
```

### 5. Run the Backend Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in `.env`)

## Verify Installation

1. **Check server is running:**
   - Open browser: `http://localhost:5000/health`
   - Should return: `{"status":"ok","timestamp":"...","uptime":...}`

2. **Check logs:**
   - You should see Winston logs in the console
   - Log files will be created in `backend/logs/` directory

## Common Issues & Solutions

### Issue: `Error: Cannot find module`
**Solution:** Run `npm install` again

### Issue: `MongoNetworkError: connect ECONNREFUSED`
**Solution:** 
- Make sure MongoDB is running
- Check MongoDB URI in `.env` file
- Try: `mongosh` to verify MongoDB connection

### Issue: `Port 5000 already in use`
**Solution:**
- Change PORT in `.env` file
- Or kill the process using port 5000:
  ```bash
  # Linux/Mac
  lsof -ti:5000 | xargs kill -9
  
  # Or find and kill manually
  lsof -i:5000
  ```

### Issue: `EADDRINUSE: address already in use`
**Solution:** Same as above - change port or kill existing process

## Available Scripts

- `npm start` - Start server in production mode
- `npm run dev` - Start server in development mode with nodemon (auto-reload)
- `npm run lint` - Run ESLint to check code quality
- `npm run format` - Format code with Prettier

## API Endpoints

Once running, the API will be available at:
- Base URL: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/health`

### Main API Routes:
- `/api/auth` - Authentication
- `/api/projects` - Projects
- `/api/sprints` - Sprints
- `/api/features` - Features
- `/api/stories` - Stories
- `/api/tasks` - Tasks
- `/api/teams` - Teams
- `/api/users` - Users
- `/api/activities` - Activities
- `/api/comments` - Comments
- `/api/notifications` - Notifications

## Next Steps

1. Test the API using Postman or curl
2. Connect the frontend to the backend
3. Set up Google OAuth (if needed)
4. Configure ML service URL (if using AI features)

## Production Deployment

Before deploying to production:

1. Change all secrets in `.env`
2. Set `NODE_ENV=production`
3. Use a secure MongoDB connection string
4. Set up proper CORS origins
5. Configure SSL/HTTPS
6. Set up log rotation
7. Use a process manager like PM2

