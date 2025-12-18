/**
 * Retry Utilities
 * Functions for retrying operations with exponential backoff
 */

/**
 * Retry a function with exponential backoff
 * 
 * @param {Function} fn - Function to retry (must return a Promise)
 * @param {object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in milliseconds (default: 1000)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @param {Function} options.onRetry - Callback called before each retry
 * @returns {Promise} - Promise that resolves with function result
 * 
 * @example
 * const result = await retryWithBackoff(
 *   () => fetchData(),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    shouldRetry = () => true,
    onRetry = null,
  } = options

  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if we should retry
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, maxRetries, delay, error)
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Retry a function with fixed delay
 * 
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise} - Promise that resolves with function result
 */
export async function retryWithFixedDelay(fn, maxRetries = 3, delay = 1000) {
  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Check if error is retryable
 * 
 * @param {Error} error - Error to check
 * @returns {boolean} - True if error is retryable
 */
export function isRetryableError(error) {
  // Network errors are retryable
  if (!error.response) {
    return true
  }

  const status = error.response?.status

  // 5xx errors are retryable
  if (status >= 500) {
    return true
  }

  // 429 (Too Many Requests) is retryable
  if (status === 429) {
    return true
  }

  // 408 (Request Timeout) is retryable
  if (status === 408) {
    return true
  }

  // 4xx errors (except above) are not retryable
  return false
}

export default {
  retryWithBackoff,
  retryWithFixedDelay,
  isRetryableError,
}

