import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import connectDB from './src/config/database.js'
import passport from './src/config/passport.js'
import logger from './src/utils/logger.js'
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js'
import { generalLimiter } from './src/middleware/rateLimiter.js'
import requestLogger from './src/middleware/requestLogger.js'
import { metricsMiddleware } from './src/middleware/metrics.middleware.js'
import { initializeSocket } from './src/socket/socket.js'
import { initializeQueryMonitoring } from './src/services/monitoring.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const httpServer = createServer(app)

// Initialize Socket.IO
const io = initializeSocket(httpServer)

const PORT = process.env.PORT || 5000

// ==================== Middleware Setup ====================

// Security middleware
app.use(helmet())

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Request logging middleware (using Winston via Morgan)
app.use(requestLogger)
app.use(metricsMiddleware)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
app.use('/api/', generalLimiter)

// Passport initialization
app.use(passport.initialize())

// ==================== Routes ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Static file serving for uploads
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')))

// API routes
import authRoutes from './src/routes/auth.routes.js'
import projectRoutes from './src/routes/project.routes.js'
import sprintRoutes from './src/routes/sprint.routes.js'
import featureRoutes from './src/routes/feature.routes.js'
import programIncrementRoutes from './src/routes/programIncrement.routes.js'
import storyRoutes from './src/routes/story.routes.js'
import taskRoutes from './src/routes/task.routes.js'
import timeEntryRoutes from './src/routes/timeEntry.routes.js'
import teamRoutes from './src/routes/team.routes.js'
import userRoutes from './src/routes/user.routes.js'
import activityRoutes from './src/routes/activity.routes.js'
import commentRoutes from './src/routes/comment.routes.js'
import notificationRoutes from './src/routes/notification.routes.js'
import dashboardRoutes from './src/routes/dashboard.routes.js'
import organizationRoutes from './src/routes/organization.routes.js'
import exportRoutes from './src/routes/export.routes.js'
import auditLogRoutes from './src/routes/auditLog.routes.js'
import healthRoutes from './src/routes/health.routes.js'
import searchRoutes from './src/routes/search.routes.js'
import sprintTemplateRoutes from './src/routes/sprintTemplate.routes.js'
import gamificationRoutes from './src/routes/gamification.routes.js'
import meetingRoutes from './src/routes/meeting.routes.js'
import reportRoutes from './src/routes/report.routes.js'
import mlFeedbackRoutes from './src/routes/mlFeedback.routes.js'
import cacheRoutes from './src/routes/cache.routes.js'
import importRoutes from './src/routes/import.routes.js'

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/sprints', sprintRoutes)
app.use('/api/features', featureRoutes)
app.use('/api/program-increments', programIncrementRoutes)
app.use('/api/stories', storyRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/time-entries', timeEntryRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/users', userRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/organization', organizationRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/audit-logs', auditLogRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/sprint-templates', sprintTemplateRoutes)
app.use('/api/gamification', gamificationRoutes)
app.use('/api', meetingRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/ml-feedback', mlFeedbackRoutes)
app.use('/api/cache', cacheRoutes)
app.use('/api/import', importRoutes)

// ==================== Socket.IO ====================
// Socket.IO is initialized in socket.js
// All event handlers are registered there

// ==================== Scheduled Jobs ====================
// Start deadline reminder job (runs daily)
if (process.env.NODE_ENV !== 'test') {
  try {
    const { startDeadlineReminderJob } = await import('./src/jobs/deadlineReminder.job.js')
    startDeadlineReminderJob()
    const { startReportScheduler } = await import('./src/jobs/reportScheduler.job.js')
    startReportScheduler()
  } catch (error) {
    logger.warn('Could not start deadline reminder job:', error.message)
  }
}

// ==================== Error Handling ====================

// 404 handler (must be after all routes)
app.use(notFoundHandler)

// Global error handler (must be last)
app.use(errorHandler)

// ==================== Server Startup ====================

const startServer = async () => {
  try {
    await connectDB()
    initializeQueryMonitoring()

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`)
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173'}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    promise,
  })
  // Close server & exit process
  httpServer.close(() => {
    logger.info('HTTP server closed due to unhandled rejection')
    process.exit(1)
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
  })
  // Exit immediately for uncaught exceptions
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server')
  httpServer.close(() => {
    logger.info('HTTP server closed')
  })
})

// Export for use in other modules
export { io }
export { getIO } from './src/socket/socket.js'

// Start the server
startServer()
