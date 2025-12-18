import { ValidationError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Validation Middleware
 * Validates request body against Joi schema
 * @param {Object} schema - Joi validation schema
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    })

    if (error) {
      // Format validation errors consistently
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''), // Remove quotes from messages
      }))

      // Log validation errors for debugging
      logger.warn('Validation Error', {
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        errors: errors,
        errorDetails: error.details.map(d => ({
          path: d.path.join('.'),
          message: d.message,
          type: d.type,
        })),
      })

      return next(new ValidationError('Validation Error', errors))
    }

    // Replace req.body with validated and sanitized value
    req.body = value
    next()
  }
}

/**
 * Validate query parameters
 * @param {Object} schema - Joi validation schema
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))

      return next(new ValidationError('Query validation failed', errors))
    }

    req.query = value
    next()
  }
}

/**
 * Validate URL parameters
 * @param {Object} schema - Joi validation schema
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))

      return next(new ValidationError('Parameter validation failed', errors))
    }

    req.params = value
    next()
  }
}


