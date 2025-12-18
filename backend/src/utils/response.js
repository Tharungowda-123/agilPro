/**
 * Standardized API Response Helpers
 * Provides consistent response format across the API
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    status: 'success',
    message,
  }

  if (data !== null) {
    // If data has pagination, include it
    if (data.data && data.pagination) {
      response.data = data.data
      response.pagination = data.pagination
    } else {
      response.data = data
    }
  }

  return res.status(statusCode).json(response)
}

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Array} errors - Array of validation errors (optional)
 */
export const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const response = {
    status: 'error',
    statusCode,
    message,
  }

  if (errors) {
    response.errors = errors
  }

  return res.status(statusCode).json(response)
}

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 * @param {string} message - Success message
 */
export const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    status: 'success',
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages || Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false,
    },
  })
}

// Export aliases for convenience
export const success = successResponse
export const error = errorResponse
export const paginated = paginatedResponse


