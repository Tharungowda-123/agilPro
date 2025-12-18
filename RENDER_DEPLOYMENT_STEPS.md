# 🚀 Render.com Deployment - Step by Step Guide

This guide will walk you through deploying your **Backend** and **ML Service** to Render.com **FOR FREE**.

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] GitHub account
- [ ] Your code pushed to a GitHub repository
- [ ] MongoDB Atlas account (free tier)
- [ ] Upstash Redis account (free tier) OR Render Redis

---

## 🗄️ Step 1: Setup Databases (Do This First!)

### 1.1 MongoDB Atlas Setup

1. **Go to**: https://www.mongodb.com/cloud/atlas/register
2. **Sign up** for free account
3. **Create Free Cluster**:
   - Click "Build a Database"
   - Choose **"M0 Free"** (512MB - FREE)
   - Select region closest to you
   - Click "Create"
   - Wait 3-5 minutes for cluster to be created

4. **Create Database User**:
   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Authentication: Password
   - Username: `agilpro-user` (or any name)
   - Password: **Generate a strong password** (SAVE THIS!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

5. **Allow Network Access**:
   - Go to "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

6. **Get Connection String**:
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Node.js, Version: 5.5 or later
   - Copy the connection string
   - **Replace `<password>` with your database user password**
   - Example: `mongodb+srv://agilpro-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/agilpro?retryWrites=true&w=majority`
   - **SAVE THIS STRING** - You'll need it!

### 1.2 Redis Setup (Upstash - Free)

1. **Go to**: https://upstash.com/
2. **Sign up** for free account
3. **Create Redis Database**:
   - Click "Create Database"
   - Name: `agilpro-redis`
   - Type: **Regional** (free tier)
   - Region: Choose closest to your Render region
   - Click "Create"
4. **Copy Connection String**:
   - After creation, you'll see "Redis URL"
   - Copy it (looks like: `redis://default:password@host:6379`)
   - **SAVE THIS** - You'll need it!

**Alternative**: You can also use Render's free Redis (we'll set that up later)

---

## 🎯 Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. **Go to**: https://render.com
2. **Sign up** with GitHub (recommended) or email
3. **Verify your email** if needed

### 2.2 Create Backend Web Service

1. **Click "New +"** button (top right)
2. **Select "Web Service"**
3. **Connect Repository**:
   - If first time: Click "Connect GitHub" → Authorize Render
   - Select your repository from the list
   - Click "Connect"

4. **Configure Service**:
   - **Name**: `agilpro-backend` (or any name you like)
   - **Region**: Choose closest to you (e.g., `Oregon (US West)`)
   - **Branch**: `main` (or `master`)
   - **Root Directory**: `backend` ⚠️ **IMPORTANT!**
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (512 MB RAM)

5. **Click "Advanced"** and add Environment Variables:

   Click "Add Environment Variable" for each:

   ```
   NODE_ENV = production
   PORT = 10000
   MONGODB_URI = mongodb+srv://agilpro-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/agilpro?retryWrites=true&w=majority
   REDIS_URL = redis://default:password@host:6379
   JWT_SECRET = your-super-secret-jwt-key-minimum-32-characters-long
   JWT_REFRESH_SECRET = your-super-secret-refresh-key-minimum-32-characters-long
   JWT_EXPIRY = 604800
   JWT_REFRESH_EXPIRY = 2592000
   FRONTEND_URL = https://your-frontend-url.onrender.com (or your frontend URL)
   CORS_ORIGIN = https://your-frontend-url.onrender.com (or your frontend URL)
   ML_SERVICE_URL = https://agilpro-ml-service.onrender.com (we'll update this after ML service is deployed)
   LOG_LEVEL = info
   ```

   **Important Notes**:
   - Replace `YOUR_PASSWORD` with your MongoDB password
   - Generate strong secrets for JWT keys (use: https://randomkeygen.com/)
   - For `ML_SERVICE_URL`, we'll update this after deploying ML service
   - For `FRONTEND_URL`, use your frontend URL (or localhost for now)

6. **Click "Create Web Service"**
7. **Wait for deployment** (5-10 minutes)
   - You'll see build logs in real-time
   - Watch for any errors

8. **Copy your Backend URL**:
   - Once deployed, you'll see: `https://agilpro-backend.onrender.com`
   - **SAVE THIS URL!**

### 2.3 Test Backend

1. **Click on your service** → Go to "Logs" tab
2. **Check for errors** - Should see "Server running on port..."
3. **Test Health Endpoint**:
   - Open: `https://agilpro-backend.onrender.com/health`
   - Should return: `{"status":"ok",...}`

---

## 🤖 Step 3: Deploy ML Service to Render

### 3.1 Create ML Service Web Service

1. **In Render dashboard, click "New +"** → "Web Service"
2. **Select same repository** (your GitHub repo)
3. **Configure Service**:
   - **Name**: `agilpro-ml-service`
   - **Region**: Same as backend (e.g., `Oregon (US West)`)
   - **Branch**: `main` (or `master`)
   - **Root Directory**: `ml-service` ⚠️ **IMPORTANT!**
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```
     pip install -r requirements.txt && python -m spacy download en_core_web_lg || echo "spaCy model download failed, continuing..."
     ```
   - **Start Command**: 
     ```
     uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: `Free` (512 MB RAM)

4. **Add Environment Variables**:

   ```
   PORT = 10000
   MONGODB_URI = mongodb+srv://agilpro-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/agilpro?retryWrites=true&w=majority
   REDIS_URL = redis://default:password@host:6379
   API_KEY = your-ml-api-key-here-generate-random-string
   ALLOWED_ORIGINS = https://agilpro-backend.onrender.com
   MONGODB_DB = agilpro
   LOG_LEVEL = INFO
   ENV = production
   ```

   **Important**:
   - Use same MongoDB URI as backend
   - Use same Redis URL as backend
   - Generate a random API_KEY (can be any string)
   - ALLOWED_ORIGINS should be your backend URL

5. **Click "Create Web Service"**
6. **Wait for deployment** (10-15 minutes)
   - ML service takes longer because it downloads models
   - Watch build logs for progress
   - Don't worry if spaCy download fails - it will use fallback

7. **Copy your ML Service URL**:
   - Once deployed: `https://agilpro-ml-service.onrender.com`
   - **SAVE THIS URL!**

### 3.2 Test ML Service

1. **Check Logs** - Should see "ML service started"
2. **Test Health Endpoint**:
   - Open: `https://agilpro-ml-service.onrender.com/health`
   - Should return: `{"status":"ok",...}`

### 3.3 Update Backend with ML Service URL

1. **Go back to Backend service** in Render
2. **Click "Environment"** tab
3. **Find `ML_SERVICE_URL`** variable
4. **Update value** to: `https://agilpro-ml-service.onrender.com`
5. **Save Changes** (auto-redeploys)

---

## ✅ Step 4: Verify Everything Works

### 4.1 Test Backend

```bash
# Test health
curl https://agilpro-backend.onrender.com/health

# Should return: {"status":"ok",...}
```

### 4.2 Test ML Service

```bash
# Test health
curl https://agilpro-ml-service.onrender.com/health

# Should return: {"status":"ok",...}
```

### 4.3 Test Backend → ML Service Connection

1. **Check Backend logs** in Render
2. **Look for**: "Connected to ML service" or similar
3. **If errors**: Check ML_SERVICE_URL is correct

---

## 🔧 Step 5: Update Frontend (If You Have One)

Update your frontend environment variables:

```env
VITE_API_BASE_URL=https://agilpro-backend.onrender.com/api
```

Or if using `.env`:
```
VITE_API_BASE_URL=https://agilpro-backend.onrender.com/api
```

---

## ⚠️ Important Notes About Free Tier

### Service Sleep Behavior

- **Free tier services sleep** after 15 minutes of inactivity
- **First request after sleep** takes 30-60 seconds (wake-up time)
- **Subsequent requests** are fast

### Keep Services Awake (Optional)

**Using UptimeRobot (Free)**:

1. Go to: https://uptimerobot.com
2. Sign up (free)
3. Add Monitor:
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `AgilPro Backend`
   - URL: `https://agilpro-backend.onrender.com/health`
   - Monitoring Interval: `5 minutes`
4. Repeat for ML service
5. This keeps services awake 24/7

---

## 🐛 Troubleshooting

### Backend Won't Start

1. **Check Logs** in Render dashboard
2. **Common Issues**:
   - Missing environment variables
   - Wrong MongoDB connection string
   - PORT not set correctly
   - Build errors

3. **Fix**:
   - Verify all env vars are set
   - Check MongoDB connection string format
   - Ensure PORT=10000

### ML Service Timeout

1. **Issue**: Build takes too long
2. **Fix**:
   - Go to Settings → Build & Deploy
   - Increase "Build Timeout" to 30 minutes
   - Or simplify build command (remove spaCy download)

### Services Can't Connect

1. **Check**:
   - ML_SERVICE_URL in backend is correct
   - CORS settings in ML service
   - MongoDB network access (0.0.0.0/0)

2. **Fix**:
   - Update ML_SERVICE_URL
   - Check ALLOWED_ORIGINS in ML service
   - Verify MongoDB allows all IPs

### Slow First Request

- **This is normal** for free tier
- Service is waking up from sleep
- Use UptimeRobot to keep awake

---

## 📊 Your Deployment Summary

After completing all steps, you'll have:

- ✅ **Backend URL**: `https://agilpro-backend.onrender.com`
- ✅ **ML Service URL**: `https://agilpro-ml-service.onrender.com`
- ✅ **MongoDB**: Connected via Atlas
- ✅ **Redis**: Connected via Upstash
- ✅ **Services**: Running and connected

---

## 🎉 You're Done!

Your backend and ML service are now live on Render.com!

**Next Steps**:
1. Test all endpoints
2. Update frontend with new URLs
3. Set up UptimeRobot to keep services awake
4. Monitor logs for any issues

**Need Help?**
- Check Render logs
- Check MongoDB Atlas logs
- Verify all environment variables
- Test endpoints with Postman/curl

---

## 📝 Quick Reference

### Your Service URLs:
- Backend: `https://agilpro-backend.onrender.com`
- ML Service: `https://agilpro-ml-service.onrender.com`

### Environment Variables Checklist:
- [ ] NODE_ENV=production
- [ ] PORT=10000
- [ ] MONGODB_URI (from Atlas)
- [ ] REDIS_URL (from Upstash)
- [ ] JWT_SECRET (32+ chars)
- [ ] JWT_REFRESH_SECRET (32+ chars)
- [ ] ML_SERVICE_URL (ML service URL)
- [ ] FRONTEND_URL (your frontend URL)
- [ ] CORS_ORIGIN (your frontend URL)

---

**Happy Deploying! 🚀**

