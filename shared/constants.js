// Shared constants for frontend and backend

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    GOOGLE: '/api/auth/google',
  },
  ML: {
    PREDICT: '/api/ml/predict',
    ANALYZE: '/api/ml/analyze',
    MODELS: '/api/ml/models',
  },
}

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  UPDATE: 'update',
  NOTIFICATION: 'notification',
}

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
}

export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
}

