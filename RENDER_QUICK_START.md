# ⚡ Render Quick Start - 5 Minute Setup

## 🎯 Quick Deployment Checklist

Follow these steps in order:

---

## ✅ Step 1: Setup Databases (5 minutes)

### MongoDB Atlas:
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create free M0 cluster
3. Create database user (save password!)
4. Allow network access: `0.0.0.0/0`
5. Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/agilpro`

### Redis (Upstash):
1. Go to: https://upstash.com
2. Create free Redis database
3. Copy connection URL: `redis://default:pass@host:6379`

---

## 🚀 Step 2: Deploy Backend (3 minutes)

1. **Go to**: https://render.com → Sign up
2. **Click**: "New +" → "Web Service"
3. **Connect**: Your GitHub repository
4. **Configure**:
   - Name: `agilpro-backend`
   - Root Directory: `backend` ⚠️
   - Build: `npm install`
   - Start: `npm start`
   - Plan: `Free`

5. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your-mongodb-connection-string
   REDIS_URL=your-redis-url
   JWT_SECRET=generate-32-char-random-string
   JWT_REFRESH_SECRET=generate-32-char-random-string
   ML_SERVICE_URL=https://agilpro-ml-service.onrender.com
   FRONTEND_URL=your-frontend-url
   CORS_ORIGIN=your-frontend-url
   ```

6. **Click**: "Create Web Service"
7. **Wait**: 5-10 minutes
8. **Copy URL**: `https://agilpro-backend.onrender.com`

---

## 🤖 Step 3: Deploy ML Service (3 minutes)

1. **Click**: "New +" → "Web Service"
2. **Select**: Same repository
3. **Configure**:
   - Name: `agilpro-ml-service`
   - Root Directory: `ml-service` ⚠️
   - Build: `pip install -r requirements.txt && python -m spacy download en_core_web_lg || echo "spaCy failed"`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Plan: `Free`

4. **Add Environment Variables**:
   ```
   PORT=10000
   MONGODB_URI=same-as-backend
   REDIS_URL=same-as-backend
   API_KEY=any-random-string
   ALLOWED_ORIGINS=https://agilpro-backend.onrender.com
   ```

5. **Click**: "Create Web Service"
6. **Wait**: 10-15 minutes
7. **Copy URL**: `https://agilpro-ml-service.onrender.com`

---

## 🔗 Step 4: Connect Services (1 minute)

1. Go to **Backend** service
2. **Environment** tab
3. Update `ML_SERVICE_URL` = `https://agilpro-ml-service.onrender.com`
4. **Save** (auto-redeploys)

---

## ✅ Step 5: Test (1 minute)

```bash
# Test Backend
curl https://agilpro-backend.onrender.com/health

# Test ML Service
curl https://agilpro-ml-service.onrender.com/health
```

Both should return: `{"status":"ok",...}`

---

## 🎉 Done!

Your services are now live:
- **Backend**: `https://agilpro-backend.onrender.com`
- **ML Service**: `https://agilpro-ml-service.onrender.com`

---

## 📚 Need More Details?

See `RENDER_DEPLOYMENT_STEPS.md` for detailed instructions.

---

## ⚠️ Important Notes

1. **Free tier sleeps** after 15 min inactivity
2. **First request** after sleep takes 30-60 seconds
3. **Keep awake**: Use UptimeRobot (free) to ping every 5 min

---

**That's it! You're deployed! 🚀**

