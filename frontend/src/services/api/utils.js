/**
 * Helper function to simulate API delay
 * Useful for testing loading states and simulating real API behavior
 * 
 * @param {any} data - Data to return after delay
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {Promise} Promise that resolves after delay with data
 * 
 * @example
 * const projects = await mockApiCall(mockProjects, 1000)
 */
export const mockApiCall = (data, delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data)
    }, delay)
  })
}

/**
 * Simulate API error
 * 
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {number} delay - Delay in milliseconds
 */
export const mockApiError = (message = 'Something went wrong', status = 500, delay = 500) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message)
      error.response = {
        status,
        data: { message },
      }
      reject(error)
    }, delay)
  })
}

/**
 * Paginate array of data
 * 
 * @param {Array} data - Array to paginate
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result with data, pagination info
 */
export const paginate = (data, page = 1, limit = 10) => {
  const start = (page - 1) * limit
  const end = start + limit
  const paginatedData = data.slice(start, end)

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
      hasNext: end < data.length,
      hasPrev: page > 1,
    },
  }
}

/**
 * Filter data by search term
 * 
 * @param {Array} data - Array to filter
 * @param {string} searchTerm - Search term
 * @param {Array} fields - Fields to search in
 * @returns {Array} Filtered array
 */
export const searchData = (data, searchTerm, fields = []) => {
  if (!searchTerm) return data

  const term = searchTerm.toLowerCase()
  return data.filter((item) => {
    return fields.some((field) => {
      const value = item[field]
      return value && String(value).toLowerCase().includes(term)
    })
  })
}

