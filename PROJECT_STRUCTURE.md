# AgileSAFe AI Platform - Project Structure

## Complete Directory Tree

```
agilPro/
├── frontend/                    # React application (Vite + JavaScript)
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Layout.jsx
│   │   │   └── Navbar.jsx
│   │   ├── pages/               # Page components
│   │   │   └── Home.jsx
│   │   ├── services/            # API and socket services
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── store/               # Zustand stores
│   │   │   └── useAuthStore.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .eslintrc.cjs
│   ├── .prettierrc
│   └── README.md
│
├── backend/                     # Node.js + Express API
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── passport.js          # Google OAuth config
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── validation.js        # Joi validation
│   ├── models/
│   │   └── User.js              # User Mongoose model
│   ├── routes/
│   │   └── auth.js              # Authentication routes
│   ├── socket/
│   │   └── socketHandler.js     # Socket.IO handlers
│   ├── utils/
│   │   └── logger.js            # Winston logger
│   ├── logs/                    # Log files directory
│   ├── server.js                # Main server file
│   ├── package.json
│   ├── .eslintrc.cjs
│   ├── .prettierrc
│   └── README.md
│
├── ml-service/                  # Python + FastAPI ML service
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── health.py            # Health check endpoint
│   │   └── ml.py                # ML endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   └── ml_service.py        # ML service logic
│   ├── utils/
│   │   ├── __init__.py
│   │   └── logger.py            # Logging utility
│   ├── models/                  # ML model files (gitignored)
│   ├── logs/                    # Log files directory
│   ├── main.py                  # FastAPI application
│   ├── requirements.txt
│   ├── .gitignore
│   └── README.md
│
├── shared/                      # Shared utilities and constants
│   ├── constants.js             # Shared constants
│   ├── utils.js                 # Shared utility functions
│   └── README.md
│
├── .gitignore                   # Root gitignore
├── package.json                 # Root package.json with scripts
├── README.md                    # Main project README
└── PROJECT_STRUCTURE.md         # This file
```

## Technology Stack Summary

### Frontend
- **React 18** with JavaScript (NO TypeScript)
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query (TanStack Query)** - Server state management
- **Zustand** - Client state management
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **Passport.js** - OAuth authentication (Google)
- **Socket.IO** - Real-time bidirectional communication
- **Winston** - Logging library
- **Joi** - Schema validation
- **Helmet** - Security headers
- **Express Rate Limit** - API rate limiting

### ML Service
- **Python 3.9+** - Runtime
- **FastAPI** - Modern web framework
- **TensorFlow** - Deep learning framework
- **PyTorch** - Deep learning framework
- **scikit-learn** - Traditional ML algorithms
- **transformers** - NLP models (Hugging Face)
- **pandas** - Data manipulation
- **numpy** - Numerical computing

## Key Features Implemented

### Authentication
- JWT-based authentication
- Google OAuth integration
- Password hashing with bcrypt
- Protected routes middleware

### Real-time Features
- Socket.IO integration (backend + frontend)
- Room-based real-time updates
- Event-driven architecture

### ML Capabilities
- RESTful API for ML operations
- Prediction endpoints
- Text analysis endpoints
- Model management

### Development Tools
- ESLint configuration
- Prettier code formatting
- Hot module replacement (Vite)
- Auto-reload (Node.js watch mode, uvicorn --reload)

## Next Steps

1. **Install Dependencies**
   ```bash
   # Root
   pnpm install
   
   # Frontend
   cd frontend && pnpm install
   
   # Backend
   cd backend && pnpm install
   
   # ML Service
   cd ml-service && pip install -r requirements.txt
   ```

2. **Set Up Environment Variables**
   - Create `.env` files in each service directory
   - See individual README files for required variables

3. **Start Development Servers**
   ```bash
   # From root directory
   pnpm dev
   ```

4. **Begin Development**
   - Add your business logic
   - Implement ML models
   - Build UI components
   - Create API endpoints

## Port Configuration

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:3000`
- **ML Service**: `http://localhost:8000`

## Notes

- All services are configured to run concurrently from the root directory
- Logs are stored in `backend/logs/` and `ml-service/logs/`
- ML models should be placed in `ml-service/models/` (gitignored)
- Shared code is in the `shared/` directory for cross-service use

