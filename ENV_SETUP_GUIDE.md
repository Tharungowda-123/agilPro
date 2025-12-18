# Environment Variables Setup Guide

## Overview
You need to configure environment variables in 3 files:
1. `backend/.env`
2. `frontend/.env`
3. `ml-service/.env`

---

## 1. Backend Environment Variables (`backend/.env`)

### Required Variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/agilesafe

# JWT Authentication Secrets (REQUIRED - Generate secure random strings)
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Google OAuth (Optional - Only if using Google login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Server Configuration
PORT=5000
ML_SERVICE_URL=http://localhost:8000
SESSION_SECRET=your_session_secret

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Environment
NODE_ENV=development
```

### How to Generate Secrets:

**For JWT_SECRET, JWT_REFRESH_SECRET, and SESSION_SECRET:**
```bash
# Generate a secure random string (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online tool: https://randomkeygen.com/
```

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## 2. Frontend Environment Variables (`frontend/.env`)

### Required Variables:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:5000/api

# WebSocket URL for Socket.IO
VITE_WS_URL=http://localhost:5000

# Google OAuth Client ID (Optional - Only if using Google login)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**Note:** Frontend variables must start with `VITE_` to be accessible in the React app.

---

## 3. ML Service Environment Variables (`ml-service/.env`)

### Required Variables:

```env
# MongoDB Connection (same as backend)
MONGODB_URI=mongodb://localhost:27017/agilesafe

# Model Storage Path
MODEL_PATH=./models

# Server Configuration
PORT=8000

# API Authentication (Optional - for securing ML endpoints)
API_KEY=your_ml_api_key_here

# Backend API URL
NODE_API_URL=http://localhost:5000
```

---

## Quick Setup Steps

### Step 1: Generate Secrets
```bash
# Generate JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Edit Backend .env
```bash
nano backend/.env
# or
code backend/.env
```

Replace:
- `your_jwt_secret_here` → Generated JWT_SECRET
- `your_refresh_secret_here` → Generated JWT_REFRESH_SECRET
- `your_session_secret` → Generated SESSION_SECRET
- `your_google_client_id` → Your Google OAuth Client ID (if using)
- `your_google_client_secret` → Your Google OAuth Client Secret (if using)

### Step 3: Edit Frontend .env
```bash
nano frontend/.env
# or
code frontend/.env
```

Replace:
- `your_google_client_id` → Your Google OAuth Client ID (if using, same as backend)

### Step 4: Edit ML Service .env
```bash
nano ml-service/.env
# or
code ml-service/.env
```

Replace:
- `your_ml_api_key_here` → Generate a secure API key (optional)

---

## Optional: Google OAuth Setup

If you want to use Google OAuth login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to both backend and frontend `.env` files

---

## Minimum Required Setup (Without Google OAuth)

For basic functionality, you only need:

**Backend:**
- `MONGODB_URI` (if MongoDB is running)
- `JWT_SECRET` (generate one)
- `JWT_REFRESH_SECRET` (generate one)
- `SESSION_SECRET` (generate one)
- `PORT=5000`
- `CORS_ORIGIN=http://localhost:5173`

**Frontend:**
- `VITE_API_BASE_URL=http://localhost:5000/api`
- `VITE_WS_URL=http://localhost:5000`

**ML Service:**
- `PORT=8000`
- `NODE_API_URL=http://localhost:5000`

---

## Verification

After setting up, restart your services:
```bash
# Stop current services (Ctrl+C)
# Then restart:
npm run dev
```

Check logs to ensure all services start without errors.

