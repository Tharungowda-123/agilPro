# Quick Setup Commands - Copy & Paste

## Prerequisites Check
```bash
node --version    # Should be v18+
pythaon3 --version # Should be 3.10+
mongod --version  # MongoDB should be installed
```

---

## 1. Start MongoDB
```bash
# Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community

# Windows
net start MongoDB
```

---

## 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env file with your MongoDB URI and JWT secrets
npm run dev
```

**Backend runs on:** `http://localhost:5000`

---

## 3. ML Service Setup (New Terminal)

**⚠️ REQUIRES: Python 3.10 or higher!**
**Note: Project configured for Python 3.12.7, but 3.10+ works**

```bash
# First, verify Python version
python3 --version  # Must be 3.10.x or higher (project uses 3.12.7)

cd ml-service
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env
# Edit .env file with MongoDB URI and API key
uvicorn main:app --reload --port 8000
```

**ML Service runs on:** `http://localhost:8000`

---

## 4. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
cp env.example .env
# Edit .env file with API URL
npm run dev
```

**Frontend runs on:** `http://localhost:5173`

---

## Generate Secrets

**JWT Secrets (for backend/.env):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**ML API Key (for ml-service/.env):**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Verify Everything Works

```bash
# Backend
curl http://localhost:5000/health

# ML Service
curl http://localhost:8000/health

# Frontend
# Open http://localhost:5173 in browser
```

---

## All Services Running?

✅ Backend: `http://localhost:5000/health`  
✅ ML Service: `http://localhost:8000/docs`  
✅ Frontend: `http://localhost:5173`

---

## Troubleshooting

**Port in use?**
```bash
lsof -i:5000  # Backend
lsof -i:8000  # ML Service
lsof -i:5173  # Frontend
kill -9 <PID>
```

**MongoDB not connecting?**
```bash
mongosh  # Test connection
```

**Module not found?**
```bash
rm -rf node_modules package-lock.json
npm install
```

