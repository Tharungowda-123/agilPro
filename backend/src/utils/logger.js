import winston from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Winston Logger Configuration
 * Logs to console (development) and files (production)
 */

// Define log format with metadata
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json()
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, metadata, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`
    
    // Add stack trace for errors
    if (stack) {
      msg += `\n${stack}`
    }
    
    // Add metadata
    if (metadata && Object.keys(metadata).length > 0) {
      msg += `\n${JSON.stringify(metadata, null, 2)}`
    }
    
    // Add other meta fields
    const otherMeta = { ...meta }
    delete otherMeta.timestamp
    delete otherMeta.level
    delete otherMeta.message
    
    if (Object.keys(otherMeta).length > 0) {
      msg += `\n${JSON.stringify(otherMeta, null, 2)}`
    }
    
    return msg
  })
)

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs')

// Create transports
const transports = []

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    level: process.env.LOG_LEVEL || 'info',
  })
)

// File transports (production)
if (process.env.NODE_ENV === 'production') {
  // Combined log file (all logs)
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  )

  // Error log file (errors only)
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      format: logFormat,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  )
}

// Add colors for log levels (must be done before creating logger)
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
})

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { 
    service: 'agilesafe-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
})

// Note: Console transport is already added above in the transports array
// No need to add it again here

export default logger


