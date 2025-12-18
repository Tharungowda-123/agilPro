import morgan from 'morgan'
import logger from '../utils/logger.js'

/**
 * Request Logger Middleware
 * Logs all incoming requests using Morgan with Winston
 */

// Skip logging for health checks and other non-essential routes
const skipLogging = (req, res) => {
  // Skip logging for health check endpoint
  if (req.originalUrl === '/health') {
    return true
  }
  return false
}

// Create Morgan stream that writes to Winston
const stream = {
  write: (message) => {
    // Remove trailing newline
    logger.http(message.trim())
  },
}

// Development format: colored, concise
const devFormat = ':method :url :status :response-time ms - :res[content-length]'

// Production format: detailed
const prodFormat = ':method :url :status :response-time ms :res[content-length] :remote-addr :user-agent'

// Create morgan middleware
const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  {
    stream,
    skip: skipLogging,
  }
)

export default requestLogger

