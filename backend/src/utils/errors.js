/**
 * Custom Error Classes
 * Extends Error class for different error types
 */

/**
 * Base App Error class
 * All custom errors extend this class
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Bad Request Error (400)
 * Used for invalid request data
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400)
  }
}

/**
 * Unauthorized Error (401)
 * Used when authentication is required or failed
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
  }
}

/**
 * Forbidden Error (403)
 * Used when user doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403)
  }
}

/**
 * Not Found Error (404)
 * Used when resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404)
  }
}

/**
 * Validation Error (400)
 * Used for validation failures
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation Error', errors = []) {
    super(message, 400)
    this.errors = errors
  }
}

/**
 * Conflict Error (409)
 * Used when resource conflict occurs (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409)
  }
}

/**
 * Internal Server Error (500)
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500)
  }
}


