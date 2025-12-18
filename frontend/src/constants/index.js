// API Endpoints
// Note: baseURL already includes '/api', so endpoints should not include it
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    GOOGLE: '/auth/google',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  PROJECTS: {
    LIST: '/projects',
    DETAIL: (id) => `/projects/${id}`,
    METRICS: (id) => `/projects/${id}/metrics`,
    TEAM_PERFORMANCE: (id) => `/projects/${id}/team-performance`,
  },
  SPRINTS: {
    LIST: (projectId) => `/projects/${projectId}/sprints`,
    DETAIL: (id) => `/sprints/${id}`,
    BURNDOWN: (id) => `/sprints/${id}/burndown`,
    VELOCITY: (id) => `/sprints/${id}/velocity`,
  },
  STORIES: {
    LIST: (projectId) => `/projects/${projectId}/stories`,
    DETAIL: (id) => `/stories/${id}`,
    ANALYZE: (id) => `/stories/${id}/analyze`,
    ESTIMATE: (id) => `/stories/${id}/estimate-points`,
    SIMILAR: (id) => `/stories/${id}/similar`,
  },
  TASKS: {
    LIST: (storyId) => `/stories/${storyId}/tasks`,
    DETAIL: (id) => `/tasks/${id}`,
    ASSIGN: (id) => `/tasks/${id}/assign`,
    ASSIGN_AI: (id) => `/tasks/${id}/assign-ai`,
    RECOMMENDATIONS: (id) => `/tasks/${id}/recommendations`,
  },
  TEAMS: {
    LIST: '/teams',
    DETAIL: (id) => `/teams/${id}`,
    CAPACITY: (id) => `/teams/${id}/capacity`,
    VELOCITY: (id) => `/teams/${id}/velocity`,
    PERFORMANCE: (id) => `/teams/${id}/performance`,
  },
  USERS: {
    LIST: '/users',
    DETAIL: (id) => `/users/${id}`,
    PERFORMANCE: (id) => `/users/${id}/performance`,
    WORKLOAD: (id) => `/users/${id}/workload`,
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    VELOCITY_FORECAST: '/dashboard/velocity-forecast',
    RISK_ALERTS: '/dashboard/risk-alerts',
    DEADLINES: '/dashboard/deadlines',
  },
  ML: {
    PREDICT: '/ml/predict',
    ANALYZE: '/ml/analyze',
    MODELS: '/ml/models',
  },
}

// Socket Events
export const SOCKET_EVENTS = {
  // Connection Events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
  
  // Room Events
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  
  // Task Events
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_ASSIGNED: 'task:assigned',
  TASK_STATUS_CHANGED: 'task:status-changed',
  TASK_COMPLETED: 'task:completed',
  
  // Story Events
  STORY_CREATED: 'story:created',
  STORY_UPDATED: 'story:updated',
  STORY_MOVED: 'story:moved',
  STORY_AI_ANALYZED: 'story:ai-analyzed',
  
  // Sprint Events
  SPRINT_STARTED: 'sprint:started',
  SPRINT_COMPLETED: 'sprint:completed',
  SPRINT_VELOCITY_UPDATED: 'sprint:velocity-updated',
  SPRINT_UPDATED: 'sprint:updated',
  
  // Project Events
  PROJECT_UPDATED: 'project:updated',
  
  // Collaboration Events
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  USER_TYPING: 'user:typing',
  COMMENT_ADDED: 'comment:added',
  
  // Presence Events
  PRESENCE_JOIN: 'presence:join',
  PRESENCE_LEAVE: 'presence:leave',
  PRESENCE_HEARTBEAT: 'presence:heartbeat',
  PRESENCE_GET_USERS: 'presence:get-users',
  
  // Notification Events
  NOTIFICATION_NEW: 'notification:new',
}

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MANAGER: 'manager',
}

// Status Codes
export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
}

// Kanban Status
export const KANBAN_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
}

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}

