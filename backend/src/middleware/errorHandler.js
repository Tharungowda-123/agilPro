import logger from '../utils/logger.js'
import { recordErrorMetrics } from '../services/monitoring.service.js'
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  AppError,
} from '../utils/errors.js'

/**
 * Global Error Handler Middleware
 * Handles all errors and returns standardized error responses
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'
  let errors = null

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    if (err instanceof ValidationError) {
      errors = err.errors || []
    }
  }
  // Handle Mongoose CastError (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid ID format'
  }
  // Handle Mongoose ValidationError
  else if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }))
  }
  // Handle MongoDB duplicate key error
  else if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409
    message = 'Resource already exists'
    const field = Object.keys(err.keyPattern || {})[0]
    errors = [{ field, message: `${field} already exists` }]
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }
  // Handle other operational errors
  else if (err.isOperational) {
    statusCode = err.statusCode || 500
    message = err.message
  }
  // Handle unexpected errors
  else {
    statusCode = 500
    message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  }

  // Log error (include validation errors for debugging)
  if (statusCode >= 500 || (statusCode === 400 && err instanceof ValidationError)) {
    const logLevel = statusCode >= 500 ? 'error' : 'warn'
    logger[logLevel](statusCode === 400 && err instanceof ValidationError ? 'Validation Error' : 'Server Error:', {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
        errors: err.errors || errors,
      },
      request: {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?.id || 'anonymous',
      },
    })
  } else {
    logger.warn('Client Error:', {
      message: err.message,
      statusCode,
      request: {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?.id || 'anonymous',
      },
    })
  }

  recordErrorMetrics({
    error: {
      message: err.message,
      name: err.name,
    },
    route: req.originalUrl,
    method: req.method,
    user: req.user?.id || 'anonymous',
  })

  // Build error response
  const errorResponse = {
    status: 'error',
    statusCode,
    message,
  }

  // Add errors array if validation errors exist
  if (errors && errors.length > 0) {
    errorResponse.errors = errors
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack
  }

  // Send error response
  return res.status(statusCode).json(errorResponse)
}

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`)
  next(error)
}


