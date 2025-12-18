/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to error handler
 */

/**
 * Wrapper function to catch async errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export default asyncHandler

