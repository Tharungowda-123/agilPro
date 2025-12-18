# AgileSAFe AI Platform

A production-ready full-stack platform for Agile and SAFe methodologies with AI-powered features.

## Project Structure

```
agilPro/
├── frontend/          # React application (Vite + JavaScript)
├── backend/           # Node.js + Express API
├── ml-service/        # Python + FastAPI ML service
└── shared/            # Shared utilities and constants
```

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download](https://www.python.org/downloads/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **pnpm** - npm comes with Node.js, or [install pnpm](https://pnpm.io/installation)

## Detailed Setup Instructions

### 1. Install MongoDB Locally

#### macOS (using Homebrew)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify MongoDB is running
mongosh --eval "db.version()"
```

#### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
mongosh --eval "db.version()"
```

#### Windows
1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. MongoDB will be installed as a Windows service and start automatically
4. Verify installation by opening Command Prompt and running:
   ```bash
   mongosh --eval "db.version()"
   ```

#### Verify MongoDB Installation
```bash
# Connect to MongoDB shell
mongosh

# Create a test database (optional)
use agilesafe
db.test.insertOne({name: "test"})
db.test.find()
```

### 2. Set Up Python Virtual Environment

#### Create Virtual Environment
```bash
# Navigate to ml-service directory
cd ml-service

# Create virtual environment
python -m venv venv

# Or using python3 if python command doesn't work
python3 -m venv venv
```

#### Activate Virtual Environment

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

You should see `(venv)` prefix in your terminal prompt when activated.

#### Install Python Dependencies
```bash
# Make sure virtual environment is activated
pip install -r requirements.txt

# Or using pip3
pip3 install -r requirements.txt
```

#### Deactivate Virtual Environment
```bash
# When you're done working
deactivate
```

**Note:** Always activate the virtual environment before working on the ML service or running ML service commands.

### 3. Install Node.js Dependencies

#### Install Root Dependencies
```bash
# From project root
npm install
```

#### Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

#### Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

#### Install All Dependencies at Once
```bash
# From project root - installs all Node.js dependencies
npm run install:all
```

### 4. Environment Variables Setup

#### Backend Environment Variables
```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit the .env file with your actual values
# Required variables:
# - MONGODB_URI: MongoDB connection string
# - JWT_SECRET: Secret key for JWT tokens (generate a strong random string)
# - JWT_REFRESH_SECRET: Secret key for refresh tokens
# - GOOGLE_CLIENT_ID: Google OAuth client ID
# - GOOGLE_CLIENT_SECRET: Google OAuth client secret
# - SESSION_SECRET: Secret for session management
```

**Generate Secure Secrets:**
```bash
# Generate random secrets (macOS/Linux)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online tools like: https://randomkeygen.com/
```

#### ML Service Environment Variables
```bash
# Copy the example file
cp ml-service/.env.example ml-service/.env

# Edit the .env file with your actual values
# Required variables:
# - MONGODB_URI: MongoDB connection string (same as backend)
# - API_KEY: API key for ML service authentication
# - NODE_API_URL: Backend API URL
```

#### Frontend Environment Variables
```bash
# Copy the example file
cp frontend/.env.example frontend/.env

# Edit the .env file with your actual values
# Required variables:
# - VITE_API_BASE_URL: Backend API base URL
# - VITE_WS_URL: WebSocket URL for Socket.IO
# - VITE_GOOGLE_CLIENT_ID: Google OAuth client ID (same as backend)
```

### 5. Running All Services Concurrently

#### Start All Services
```bash
# From project root
npm run dev
```

This command will start:
- **Frontend** on `http://localhost:5173`
- **Backend** on `http://localhost:5000`
- **ML Service** on `http://localhost:8000`

#### Start Services Individually

**Frontend:**
```bash
npm run dev:frontend
# Or
cd frontend && npm run dev
```

**Backend:**
```bash
npm run dev:backend
# Or
cd backend && npm run dev
```

**ML Service:**
```bash
# Make sure virtual environment is activated first!
source ml-service/venv/bin/activate  # macOS/Linux
# or
ml-service\venv\Scripts\activate      # Windows

npm run dev:ml
# Or
cd ml-service && python -m uvicorn app.main:app --reload --port 8000
```

## Service Details

### Frontend
- **Port**: 5173
- **URL**: http://localhost:5173
- **Tech Stack**: React, Vite, Tailwind CSS, React Router, React Query, Zustand, Socket.IO
- **Hot Reload**: Enabled automatically with Vite

### Backend
- **Port**: 5000
- **URL**: http://localhost:5000
- **API Base**: http://localhost:5000/api
- **Tech Stack**: Node.js, Express, MongoDB, Mongoose, JWT, Socket.IO
- **Auto-reload**: Enabled with Node.js watch mode

### ML Service
- **Port**: 8000
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **Tech Stack**: Python, FastAPI, TensorFlow/PyTorch, scikit-learn, transformers
- **Auto-reload**: Enabled with uvicorn --reload

## Development Workflow

### First Time Setup Checklist

- [ ] Install MongoDB and verify it's running
- [ ] Create Python virtual environment in `ml-service/`
- [ ] Install all Node.js dependencies (`npm run install:all`)
- [ ] Install Python dependencies (`pip install -r ml-service/requirements.txt`)
- [ ] Copy and configure all `.env.example` files to `.env`
- [ ] Generate secure JWT secrets and update backend `.env`
- [ ] Set up Google OAuth credentials (if using Google login)
- [ ] Start all services with `npm run dev`

### Daily Development

1. **Activate Python virtual environment** (if working on ML service):
   ```bash
   source ml-service/venv/bin/activate  # macOS/Linux
   ```

2. **Start all services**:
   ```bash
   npm run dev
   ```

3. **Make your changes** - Hot reload is enabled for all services

4. **Deactivate virtual environment** (when done):
   ```bash
   deactivate
   ```

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod  # Linux
brew services list             # macOS

# Restart MongoDB
sudo systemctl restart mongod  # Linux
brew services restart mongodb-community  # macOS
```

### Port Already in Use
```bash
# Find process using port (example for port 5000)
lsof -i :5000        # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>        # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Python Virtual Environment Issues
```bash
# Recreate virtual environment
cd ml-service
rm -rf venv
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### Node Modules Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Do this for each service (frontend, backend, root)
```

## Available Scripts

### Root Level Scripts
- `npm run dev` - Start all services concurrently
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run dev:ml` - Start only ML service
- `npm run install:all` - Install all Node.js dependencies
- `npm run install:frontend` - Install frontend dependencies
- `npm run install:backend` - Install backend dependencies
- `npm run install:ml` - Install ML service Python dependencies

## Production Build

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Start production servers
npm start
```

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Python Virtual Environments](https://docs.python.org/3/tutorial/venv.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)

## License

MIT
