# 🚀 Quick Deployment Checklist

## Step-by-Step Deployment Guide

### ✅ Pre-Deployment

- [ ] Push all code to GitHub
- [ ] Create MongoDB Atlas account and cluster
- [ ] Create Upstash Redis account and database
- [ ] Note down all connection strings

---

### 📦 Deploy Backend (Render.com)

1. **Go to [Render.com](https://render.com)** → Sign up/Login
2. **Click "New +" → "Web Service"**
3. **Connect GitHub** → Select your repository
4. **Configure:**
   - **Name**: `agilpro-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/agilpro
   REDIS_URL=redis://default:pass@host:6379
   JWT_SECRET=your-32-char-secret-key-here
   JWT_REFRESH_SECRET=your-32-char-refresh-secret-here
   FRONTEND_URL=https://your-frontend.onrender.com
   CORS_ORIGIN=https://your-frontend.onrender.com
   ML_SERVICE_URL=https://agilpro-ml-service.onrender.com
   ```
6. **Click "Create Web Service"**
7. **Wait 5-10 minutes** for deployment
8. **Copy your backend URL**: `https://agilpro-backend.onrender.com`

---

### 🤖 Deploy ML Service (Render.com)

1. **Click "New +" → "Web Service"**
2. **Select same GitHub repository**
3. **Configure:**
   - **Name**: `agilpro-ml-service`
   - **Environment**: `Python 3`
   - **Root Directory**: `ml-service`
   - **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_lg || echo "spaCy download failed, continuing..."`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
4. **Add Environment Variables:**
   ```
   PORT=10000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/agilpro
   REDIS_URL=redis://default:pass@host:6379
   API_KEY=your-api-key-here
   ALLOWED_ORIGINS=https://agilpro-backend.onrender.com
   ```
5. **Click "Create Web Service"**
6. **Wait 10-15 minutes** (ML models take time to download)
7. **Copy your ML service URL**: `https://agilpro-ml-service.onrender.com`

---

### 🔗 Update Backend with ML Service URL

1. Go to **Backend service** in Render dashboard
2. **Environment** tab
3. Update `ML_SERVICE_URL` to: `https://agilpro-ml-service.onrender.com`
4. **Save Changes** (auto-redeploys)

---

### ✅ Test Your Deployment

1. **Test Backend Health:**
   ```bash
   curl https://agilpro-backend.onrender.com/health
   ```
   Expected: `{"status":"ok",...}`

2. **Test ML Service Health:**
   ```bash
   curl https://agilpro-ml-service.onrender.com/health
   ```
   Expected: `{"status":"ok",...}`

3. **Test Backend → ML Service Connection:**
   - Check backend logs in Render
   - Should show successful ML service connection

---

### 🗄️ Database Setup (MongoDB Atlas)

1. **Sign up**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Free Cluster**:
   - Choose `M0 Free` (512MB)
   - Select region (same as Render)
   - Click "Create"
3. **Create Database User**:
   - Database Access → Add New User
   - Username: `agilpro-user`
   - Password: (save this!)
   - Network Access → Add IP: `0.0.0.0/0`
4. **Get Connection String**:
   - Clusters → Connect → Connect your application
   - Copy: `mongodb+srv://user:pass@cluster.mongodb.net/agilpro?retryWrites=true&w=majority`
   - Replace `<password>` with your password

---

### 🔴 Redis Setup (Upstash)

1. **Sign up**: [Upstash](https://upstash.com)
2. **Create Redis Database**:
   - Click "Create Database"
   - Name: `agilpro-redis`
   - Region: (same as Render)
   - Type: `Regional`
   - Click "Create"
3. **Copy Connection String**:
   - Copy `REDIS_URL`: `redis://default:pass@host:6379`
   - Add to both backend and ML service env vars

---

### ⚙️ Environment Variables Reference

#### Backend Required Variables:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=min-32-characters-long-secret
JWT_REFRESH_SECRET=min-32-characters-long-secret
FRONTEND_URL=https://...
CORS_ORIGIN=https://...
ML_SERVICE_URL=https://agilpro-ml-service.onrender.com
```

#### ML Service Required Variables:
```
PORT=10000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
API_KEY=your-api-key
ALLOWED_ORIGINS=https://agilpro-backend.onrender.com
```

---

### 🐛 Common Issues & Fixes

#### Issue: Backend won't start
- ✅ Check logs in Render dashboard
- ✅ Verify all environment variables are set
- ✅ Check MongoDB connection string format
- ✅ Verify PORT is set to 10000

#### Issue: ML Service timeout during build
- ✅ Increase build timeout in Settings → Build & Deploy
- ✅ Check if spaCy model download is failing
- ✅ Try building without spaCy model first

#### Issue: Services can't connect
- ✅ Verify ML_SERVICE_URL in backend env vars
- ✅ Check CORS settings
- ✅ Verify MongoDB network access (0.0.0.0/0)

#### Issue: Slow first request
- ✅ Normal for free tier (service waking up)
- ✅ Use [UptimeRobot](https://uptimerobot.com) to ping every 5 min
- ✅ Or upgrade to paid plan

---

### 📊 Keep Services Awake (Optional)

**Using UptimeRobot (Free):**

1. Sign up: [UptimeRobot](https://uptimerobot.com)
2. Add Monitor:
   - Type: `HTTP(s)`
   - URL: `https://agilpro-backend.onrender.com/health`
   - Interval: `5 minutes`
3. Repeat for ML service

This keeps services awake and prevents sleep delays.

---

### 🎯 Final Checklist

- [ ] Backend deployed and running
- [ ] ML service deployed and running
- [ ] MongoDB Atlas cluster created
- [ ] Redis database created
- [ ] All environment variables set
- [ ] Backend health endpoint working
- [ ] ML service health endpoint working
- [ ] Backend can connect to ML service
- [ ] Frontend updated with new API URLs
- [ ] Full integration tested

---

### 📝 Your Service URLs

After deployment, you'll have:

- **Backend**: `https://agilpro-backend.onrender.com`
- **ML Service**: `https://agilpro-ml-service.onrender.com`
- **MongoDB**: `mongodb+srv://...`
- **Redis**: `redis://...`

**Update your frontend** to use:
```javascript
VITE_API_BASE_URL=https://agilpro-backend.onrender.com/api
```

---

**🎉 You're all set! Your services are now live!**

For detailed instructions, see `DEPLOYMENT_GUIDE.md`

