# 🚀 Free Hosting Guide - Backend & ML Service

This guide will help you deploy your **Backend (Node.js)** and **ML Service (Python/FastAPI)** for **FREE** using Render.com.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Option 1: Render.com (Recommended)](#option-1-rendercom-recommended)
3. [Option 2: Railway.app](#option-2-railwayapp)
4. [Option 3: Fly.io](#option-3-flyio)
5. [Database Hosting (MongoDB)](#database-hosting-mongodb)
6. [Redis Hosting](#redis-hosting)
7. [Environment Variables Setup](#environment-variables-setup)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Code pushed to GitHub repository
- ✅ MongoDB Atlas account (free tier available)
- ✅ Redis account (free tier available)

---

## Option 1: Render.com (Recommended) ⭐

**Free Tier Includes:**
- 750 hours/month (enough for 24/7 if you use 1 service)
- Auto-sleep after 15 min inactivity (wakes on request)
- Free PostgreSQL database
- Free Redis instance
- Auto-deploy from GitHub

### Step 1: Prepare Your Code

#### 1.1 Create `render.yaml` in root directory:

```yaml
services:
  # Backend Service
  - type: web
    name: agilpro-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        sync: false  # Set in Render dashboard
      - key: REDIS_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
      - key: FRONTEND_URL
        value: https://your-frontend.onrender.com
      - key: CORS_ORIGIN
        value: https://your-frontend.onrender.com

  # ML Service
  - type: web
    name: agilpro-ml-service
    env: python
    plan: free
    buildCommand: cd ml-service && pip install -r requirements.txt && python -m spacy download en_core_web_lg
    startCommand: cd ml-service && uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        sync: false
      - key: REDIS_URL
        sync: false
      - key: API_KEY
        generateValue: true
```

#### 1.2 Create `backend/render.yaml` (alternative):

```yaml
services:
  - type: web
    name: agilpro-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

#### 1.3 Create `ml-service/render.yaml`:

```yaml
services:
  - type: web
    name: agilpro-ml-service
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt && python -m spacy download en_core_web_lg
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PORT
        value: 10000
```

### Step 2: Deploy Backend on Render

1. **Go to [Render.com](https://render.com)** and sign up/login
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure Backend Service:**
   - **Name**: `agilpro-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

5. **Add Environment Variables** (in Render dashboard):
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agilpro?retryWrites=true&w=majority
   REDIS_URL=redis://default:password@redis-host:6379
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   FRONTEND_URL=https://your-frontend.onrender.com
   CORS_ORIGIN=https://your-frontend.onrender.com
   ```

6. **Click "Create Web Service"**
7. **Wait for deployment** (5-10 minutes)

### Step 3: Deploy ML Service on Render

1. **Click "New +" → "Web Service"**
2. **Select same GitHub repository**
3. **Configure ML Service:**
   - **Name**: `agilpro-ml-service`
   - **Environment**: `Python 3`
   - **Root Directory**: `ml-service`
   - **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_lg`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`

4. **Add Environment Variables**:
   ```
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agilpro?retryWrites=true&w=majority
   REDIS_URL=redis://default:password@redis-host:6379
   ML_SERVICE_URL=https://agilpro-ml-service.onrender.com
   API_KEY=your-api-key-here
   ```

5. **Click "Create Web Service"**
6. **Wait for deployment** (10-15 minutes - ML models take time to download)

### Step 4: Update Backend to Use ML Service URL

In Render dashboard, update backend environment variables:
```
ML_SERVICE_URL=https://agilpro-ml-service.onrender.com
```

### Step 5: Get Your Service URLs

After deployment, you'll get:
- **Backend**: `https://agilpro-backend.onrender.com`
- **ML Service**: `https://agilpro-ml-service.onrender.com`

**Note**: Free tier services sleep after 15 min inactivity. First request after sleep takes 30-60 seconds to wake up.

---

## Option 2: Railway.app

**Free Tier**: $5 credit/month (enough for small projects)

### Deploy Backend:

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add service → Select `backend` folder
5. Railway auto-detects Node.js
6. Add environment variables
7. Deploy!

### Deploy ML Service:

1. Add another service → Select `ml-service` folder
2. Railway auto-detects Python
3. Add environment variables
4. Deploy!

**Railway automatically provides:**
- MongoDB (via plugin)
- Redis (via plugin)
- Auto HTTPS
- Custom domains

---

## Option 3: Fly.io

**Free Tier**: 3 shared VMs, 3GB storage

### Deploy Backend:

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Initialize: `fly launch` (in backend folder)
4. Deploy: `fly deploy`

### Deploy ML Service:

1. `cd ml-service`
2. `fly launch`
3. `fly deploy`

---

## Database Hosting (MongoDB)

### MongoDB Atlas (Free Tier) - Recommended

1. **Sign up**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Free Cluster**:
   - Choose: `M0 Free` (512MB storage)
   - Select region closest to your Render services
   - Click "Create Cluster"
3. **Create Database User**:
   - Database Access → Add New User
   - Username/Password (save these!)
   - Network Access → Add IP: `0.0.0.0/0` (allow all)
4. **Get Connection String**:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your password
   - Example: `mongodb+srv://user:pass@cluster.mongodb.net/agilpro?retryWrites=true&w=majority`

---

## Redis Hosting

### Option 1: Upstash (Free Tier) - Recommended

1. **Sign up**: [Upstash](https://upstash.com)
2. **Create Redis Database**:
   - Free tier: 10,000 commands/day
   - Select region
   - Copy `REDIS_URL`
3. **Add to environment variables**:
   ```
   REDIS_URL=redis://default:password@host:6379
   ```

### Option 2: Render Redis (Free)

1. In Render dashboard: "New +" → "Redis"
2. Free tier: 25MB storage
3. Copy connection URL

---

## Environment Variables Setup

### Backend Environment Variables:

```bash
# Server
NODE_ENV=production
PORT=10000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/agilpro

# Redis
REDIS_URL=redis://default:pass@host:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://your-frontend.onrender.com
CORS_ORIGIN=https://your-frontend.onrender.com

# ML Service
ML_SERVICE_URL=https://agilpro-ml-service.onrender.com

# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### ML Service Environment Variables:

```bash
# Server
PORT=10000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/agilpro

# Redis
REDIS_URL=redis://default:pass@host:6379

# API Key
API_KEY=your-api-key-here

# Allowed Origins
ALLOWED_ORIGINS=https://agilpro-backend.onrender.com,https://your-frontend.onrender.com
```

---

## Important Notes

### ⚠️ Free Tier Limitations:

1. **Render Free Tier**:
   - Services sleep after 15 min inactivity
   - First request after sleep: 30-60 second delay
   - 750 hours/month (enough for 1 service 24/7)

2. **MongoDB Atlas Free**:
   - 512MB storage
   - Shared resources
   - Good for development/small projects

3. **Upstash Redis Free**:
   - 10,000 commands/day
   - 256MB storage
   - Good for caching

### 💡 Tips:

1. **Keep Services Awake** (if needed):
   - Use [UptimeRobot](https://uptimerobot.com) (free) to ping every 5 minutes
   - Or use cron job to ping your services

2. **Monitor Usage**:
   - Check Render dashboard for usage
   - Monitor MongoDB Atlas for storage

3. **Optimize for Free Tier**:
   - Use Redis caching to reduce database calls
   - Optimize ML model loading
   - Use connection pooling

---

## Troubleshooting

### Backend won't start:

1. **Check logs** in Render dashboard
2. **Verify environment variables** are set
3. **Check MongoDB connection** string
4. **Verify PORT** is set correctly

### ML Service timeout:

1. **Increase build timeout** in Render (Settings → Build & Deploy)
2. **Check if spaCy model** downloaded correctly
3. **Verify Python version** (3.10+)

### Services can't connect:

1. **Check CORS settings**
2. **Verify ML_SERVICE_URL** in backend
3. **Check network access** in MongoDB Atlas

### Slow first request:

- **Normal for free tier** (service waking up)
- Use UptimeRobot to keep services awake

---

## Quick Start Checklist

- [ ] Push code to GitHub
- [ ] Create MongoDB Atlas cluster
- [ ] Create Upstash Redis database
- [ ] Deploy backend on Render
- [ ] Deploy ML service on Render
- [ ] Set all environment variables
- [ ] Test backend health endpoint
- [ ] Test ML service health endpoint
- [ ] Update frontend API URLs
- [ ] Test full integration

---

## Support

If you encounter issues:
1. Check Render logs
2. Check MongoDB Atlas logs
3. Verify environment variables
4. Test endpoints with Postman/curl

**Happy Deploying! 🚀**

