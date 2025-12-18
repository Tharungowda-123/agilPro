# Complete Setup Guide - AgileSAFe AI Platform

This guide will help you set up the entire project (Backend, Frontend, and ML Service) from scratch.

## Prerequisites

Before starting, make sure you have installed:

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should show v18.x.x or higher
   ```

2. **npm** or **pnpm** (comes with Node.js)
   ```bash
   npm --version
   # OR
   pnpm --version
   ```

3. **Python** (v3.10 or higher) - **REQUIRED for ML Service**
   ```bash
   python3 --version  # Should show 3.10.x or higher
   ```
   
   **⚠️ Important:** 
   - The ML Service requires Python 3.10 or higher
   - **This project is currently configured for Python 3.12.7** (see `ml-service/.python-version`)
   - Python 3.10, 3.11, 3.12, or 3.13 should all work fine
   
   **Installation:**
   - **Linux:** `sudo apt install python3.12 python3.12-venv` (or python3.10/python3.11)
   - **macOS:** `brew install python@3.12` or download from python.org
   - **Windows:** Download from https://www.python.org/downloads/

4. **MongoDB** (v6 or higher)
   ```bash
   mongod --version  # Check if MongoDB is installed
   ```

5. **Git** (to clone the repository)
   ```bash
   git --version
   ```

---

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd agilPro
```

---

## Step 2: Set Up MongoDB

### Start MongoDB Service

**Linux:**
```bash
sudo systemctl start mongod
# OR
sudo service mongod start
```

**macOS:**
```bash
brew services start mongodb-community
```

**Windows:**
- MongoDB should start automatically as a service
- Or run: `net start MongoDB`

### Verify MongoDB is Running

```bash
mongosh
# If connection successful, type 'exit' to leave
```

---

## Step 3: Set Up Backend

### 3.1 Navigate to Backend Directory

```bash
cd backend
```

### 3.2 Install Dependencies

```bash
npm install
# OR if you prefer pnpm:
pnpm install
```

### 3.3 Create Environment File

```bash
cp env.example .env
```

### 3.4 Edit `.env` File

Open the `.env` file and update these values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/agilesafe

# JWT Configuration (IMPORTANT: Change these to random strings!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRY=604800
JWT_REFRESH_EXPIRY=2592000

# Google OAuth Configuration (Optional - can leave as is for now)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# ML Service URL
ML_SERVICE_URL=http://localhost:8000

# Logging
LOG_LEVEL=info
```

**Important:** Generate random strings for JWT secrets. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.5 Start Backend Server

```bash
npm run dev
# OR
pnpm dev
```

The backend will run on `http://localhost:5000`

**Verify it's working:**
- Open browser: `http://localhost:5000/health`
- Should return: `{"status":"ok",...}`

**Keep this terminal open!** The server needs to keep running.

---

## Step 4: Set Up ML Service

**⚠️ IMPORTANT: Python 3.10 or higher is required for ML Service!**

**Note:** This project is currently configured for **Python 3.12.7**, but Python 3.10, 3.11, 3.12, or 3.13 will all work.

Check your Python version first:
```bash
python3 --version  # Must be 3.10.x or higher (3.11, 3.12, 3.13, etc.)
```

If you don't have Python 3.10+, install it:
- **Linux:** `sudo apt install python3.12 python3.12-venv` (or python3.10/python3.11)
- **macOS:** `brew install python@3.12` or download from python.org
- **Windows:** Download from https://www.python.org/downloads/

### 4.1 Open a New Terminal

Keep the backend running, and open a **new terminal window**.

### 4.2 Navigate to ML Service Directory

```bash
cd /path/to/agilPro/ml-service
```

### 4.3 Create Python Virtual Environment

**Make sure you're using Python 3.10+:**

```bash
# Verify Python version
python3 --version  # Should show 3.10.x or higher

# Create virtual environment
python3 -m venv venv
```

### 4.4 Activate Virtual Environment

**Linux/macOS:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt.

### 4.5 Install Python Dependencies

```bash
jj
```

**Note:** This may take several minutes as it installs TensorFlow, PyTorch, and other ML libraries.

### 4.6 Create Environment File

```bash
cp env.example .env
```

### 4.7 Edit `.env` File

Open the `.env` file and update:

```env
MONGODB_URI=mongodb://localhost:27017/agilesafe
MONGODB_DB=agilesafe
API_KEY=your_ml_api_key_here
NODE_API_URL=http://localhost:5000/api
MODEL_PATH=./app/ml/models
LOG_LEVEL=INFO
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173
TRAINING_BATCH_SIZE=64
TRAINING_EPOCHS=10
```

**Important:** Generate a random API key:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 4.8 Start ML Service

```bash
uvicorn main:app --reload --port 8000
```

The ML service will run on `http://localhost:8000`

**Verify it's working:**
- Open browser: `http://localhost:8000/docs`
- Should show FastAPI Swagger documentation

**Keep this terminal open!** The ML service needs to keep running.

---

## Step 5: Set Up Frontend

### 5.1 Open a New Terminal

Keep both backend and ML service running, and open a **new terminal window**.

### 5.2 Navigate to Frontend Directory

```bash
cd /path/to/agilPro/frontend
```

### 5.3 Install Dependencies

```bash
npm install
# OR if you prefer pnpm:
pnpm install
```

### 5.4 Create Environment File

```bash
cp env.example .env
```

### 5.5 Edit `.env` File

Open the `.env` file and update:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**Note:** If you're not using Google OAuth, you can leave `VITE_GOOGLE_CLIENT_ID` as is.

### 5.6 Start Frontend Development Server

```bash
npm run dev
# OR
pnpm dev
```

The frontend will run on `http://localhost:5173`

**Verify it's working:**
- Open browser: `http://localhost:5173`
- Should show the login page

---

## Step 6: Verify All Services Are Running

You should now have **3 terminal windows** running:

1. **Backend** - `http://localhost:5000`
2. **ML Service** - `http://localhost:8000`
3. **Frontend** - `http://localhost:5173`

### Quick Health Checks:

**Backend:**
```bash
curl http://localhost:5000/health
```

**ML Service:**
```bash
curl http://localhost:8000/health
```

**Frontend:**
- Open `http://localhost:5173` in your browser

---

## Step 7: Create Your First User (Optional)

### Option 1: Use the Registration Page

1. Open `http://localhost:5173`
2. Click "Register"
3. Fill in the registration form
4. Submit

### Option 2: Use the Seed Script (for testing)

```bash
cd backend
node src/scripts/seed.js
```

This will create sample users, projects, and data for testing.

---

## Common Issues & Solutions

### Issue: Port Already in Use

**Solution:** Change the port in the respective `.env` file or kill the process:

```bash
# Find process using port
lsof -i:5000  # For backend
lsof -i:8000  # For ML service
lsof -i:5173  # For frontend

# Kill process (replace PID with actual process ID)
kill -9 <PID>
```

### Issue: MongoDB Connection Error

**Solution:**
1. Make sure MongoDB is running: `mongosh`
2. Check MongoDB URI in `.env` files
3. Verify MongoDB is listening on port 27017

### Issue: Module Not Found (Backend/Frontend)

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Python Package Installation Fails (ML Service)

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Linux/macOS
# OR
venv\Scripts\activate  # Windows

# Upgrade pip
pip install --upgrade pip

# Try installing again
pip install -r requirements.txt
```

### Issue: CORS Error

**Solution:**
- Make sure `CORS_ORIGIN` in backend `.env` matches frontend URL
- Make sure `ALLOWED_ORIGINS` in ML service `.env` matches frontend URL

---

## Development Workflow

### Starting All Services

You need to start services in this order:

1. **MongoDB** (if not running as service)
2. **Backend** (`cd backend && npm run dev`)
3. **ML Service** (`cd ml-service && source venv/bin/activate && uvicorn main:app --reload --port 8000`)
4. **Frontend** (`cd frontend && npm run dev`)

### Stopping Services

Press `Ctrl+C` in each terminal window to stop the services.

---

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in backend `.env`
2. Use secure MongoDB connection string
3. Generate strong JWT secrets
4. Configure proper CORS origins
5. Use process managers (PM2 for Node.js, systemd for Python)
6. Set up SSL/HTTPS
7. Configure log rotation

---

## Additional Resources

- **Backend API Docs:** `http://localhost:5000/api` (if available)
- **ML Service Docs:** `http://localhost:8000/docs` (Swagger UI)
- **Frontend:** `http://localhost:5173`

---

## Need Help?

If you encounter any issues:

1. Check the logs in each service's terminal
2. Verify all environment variables are set correctly
3. Make sure all services are running
4. Check MongoDB connection
5. Review the error messages carefully

---

## Summary of Commands

```bash
# 1. Start MongoDB
sudo systemctl start mongod

# 2. Backend Setup
cd backend
npm install
cp env.example .env
# Edit .env file
npm run dev

# 3. ML Service Setup (in new terminal)
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp env.example .env
# Edit .env file
uvicorn main:app --reload --port 8000

# 4. Frontend Setup (in new terminal)
cd frontend
npm install
cp env.example .env
# Edit .env file
npm run dev
```

That's it! Your AgileSAFe AI Platform should now be running. 🚀

