# Backend - AgileSAFe AI Platform

Node.js + Express API server with MongoDB, JWT authentication, and Socket.IO.

## Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Passport.js** - OAuth (Google)
- **Socket.IO** - Real-time communication
- **Winston** - Logging
- **Joi** - Validation
- **Helmet** - Security
- **Express Rate Limit** - Rate limiting

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Environment Setup

Copy the example file and create a `.env` file:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:

```env
MONGODB_URI=mongodb://localhost:27017/agilesafe
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
PORT=5000
ML_SERVICE_URL=http://localhost:8000
SESSION_SECRET=your_session_secret
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Development

```bash
pnpm dev
```

The server will run on `http://localhost:5000`

### Production

```bash
pnpm start
```

## Project Structure

```
backend/
├── config/          # Configuration files (database, passport)
├── middleware/      # Express middleware (auth, validation)
├── models/          # Mongoose models
├── routes/          # API routes
├── socket/          # Socket.IO handlers
├── utils/           # Utility functions (logger, etc.)
└── server.js        # Main server file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

## Logging

Logs are written to:
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs

