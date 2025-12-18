import axiosInstance from './axiosConfig'

/**
 * User Service
 * Handles user-related API calls
 * Connects to real backend API
 */
export const userService = {
  /**
   * Get all users
   * @param {Object} params - Query parameters (page, limit, search, role, teamId, skills)
   * @returns {Promise} Paginated users
   */
  getUsers: async (params = {}) => {
    const response = await axiosInstance.get('/users', { params })
    return response.data
  },

  /**
   * Get single user by ID
   * @param {string} id - User ID
   * @returns {Promise} User object
   */
  getUser: async (id) => {
    const response = await axiosInstance.get(`/users/${id}`)
    return response.data
  },

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} data - Updated user data
   * @returns {Promise} Updated user
   */
  updateUser: async (id, data) => {
    const response = await axiosInstance.put(`/users/${id}`, data)
    return response.data
  },

  /**
   * Add skills to user
   * @param {string} id - User ID
   * @param {Array<string>} skills - Array of skills
   * @returns {Promise} Updated user
   */
  addSkills: async (id, skills) => {
    const response = await axiosInstance.post(`/users/${id}/skills`, { skills })
    return response.data
  },

  /**
   * Remove skill from user
   * @param {string} id - User ID
   * @param {string} skill - Skill name
   * @returns {Promise} Updated user
   */
  removeSkill: async (id, skill) => {
    const response = await axiosInstance.delete(`/users/${id}/skills/${skill}`)
    return response.data
  },

  /**
   * Get user performance metrics
   * @param {string} id - User ID
   * @returns {Promise} Performance data
   */
  getUserPerformance: async (id) => {
    const response = await axiosInstance.get(`/users/${id}/performance`)
    return response.data
  },

  /**
   * Get user workload
   * @param {string} id - User ID
   * @returns {Promise} Workload data
   */
  getUserWorkload: async (id) => {
    const response = await axiosInstance.get(`/users/${id}/workload`)
    return response.data
  },

  /**
   * Update user availability
   * @param {string} id - User ID
   * @param {number} availability - Availability (story points per sprint)
   * @returns {Promise} Updated user
   */
  updateAvailability: async (id, availability) => {
    const response = await axiosInstance.put(`/users/${id}/availability`, { availability })
    return response.data
  },

  // ============================================
  // ADMIN-ONLY USER MANAGEMENT FUNCTIONS
  // ============================================

  /**
   * Create new user (admin only)
   * @param {Object} userData - User data (name, email, password, role, skills, availability, teamId)
   * @returns {Promise} Created user
   */
  createUser: async (userData) => {
    const response = await axiosInstance.post('/users/admin/create', userData)
    return response.data
  },

  /**
   * Update user (admin only - full update)
   * @param {string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} Updated user
   */
  adminUpdateUser: async (id, userData) => {
    const response = await axiosInstance.put(`/users/admin/${id}`, userData)
    return response.data
  },

  /**
   * Reset user password (admin only)
   * @param {string} id - User ID
   * @param {string} newPassword - New password
   * @returns {Promise} Success response
   */
  resetUserPassword: async (id, newPassword) => {
    const response = await axiosInstance.post(`/users/admin/${id}/reset-password`, {
      newPassword,
    })
    return response.data
  },

  /**
   * Deactivate user (admin only)
   * @param {string} id - User ID
   * @returns {Promise} Updated user
   */
  deactivateUser: async (id) => {
    const response = await axiosInstance.post(`/users/admin/${id}/deactivate`)
    return response.data
  },

  /**
   * Activate user (admin only)
   * @param {string} id - User ID
   * @returns {Promise} Updated user
   */
  activateUser: async (id) => {
    const response = await axiosInstance.post(`/users/admin/${id}/activate`)
    return response.data
  },

  /**
   * Assign user to team (admin only)
   * @param {string} id - User ID
   * @param {string|null} teamId - Team ID or null to remove from team
   * @returns {Promise} Updated user
   */
  assignUserToTeam: async (id, teamId) => {
    const response = await axiosInstance.post(`/users/admin/${id}/assign-team`, {
      teamId: teamId || null,
    })
    return response.data
  },

  /**
   * Bulk user actions (admin only)
   * @param {Array<string>} userIds - Array of user IDs
   * @param {string} action - Action to perform ('activate' or 'deactivate')
   * @returns {Promise} Success response
   */
  bulkUserAction: async (userIds, action) => {
    const response = await axiosInstance.post('/users/admin/bulk-action', {
      userIds,
      action,
    })
    return response.data
  },

  /**
   * Get user activity (admin only)
   * @param {string} id - User ID
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise} Paginated activities
   */
  getUserActivity: async (id, params = {}) => {
    const response = await axiosInstance.get(`/users/admin/${id}/activity`, { params })
    return response.data
  },

  /**
   * Add capacity adjustment (manager/admin only)
   * @param {string} id - User ID
   * @param {Object} data - Adjustment data (type, reason, startDate, endDate, adjustedCapacity)
   * @returns {Promise} Updated user
   */
  addCapacityAdjustment: async (id, data) => {
    const response = await axiosInstance.post(`/users/${id}/capacity-adjustment`, data)
    return response.data
  },

  /**
   * Remove capacity adjustment (manager/admin only)
   * @param {string} id - User ID
   * @param {string} adjustmentId - Adjustment ID
   * @returns {Promise} Updated user
   */
  removeCapacityAdjustment: async (id, adjustmentId) => {
    const response = await axiosInstance.delete(`/users/${id}/capacity-adjustment/${adjustmentId}`)
    return response.data
  },

  /**
   * Get detailed developer workload
   * @param {string} id - User ID
   * @param {Object} params - Query parameters (sprintId)
   * @returns {Promise} Detailed workload data
   */
  getDeveloperWorkload: async (id, params = {}) => {
    const response = await axiosInstance.get(`/users/${id}/workload/detailed`, { params })
    return response.data
  },

  /**
   * Get historical workload
   * @param {string} id - User ID
   * @param {Object} params - Query parameters (limit)
   * @returns {Promise} Historical workload data
   */
  getHistoricalWorkload: async (id, params = {}) => {
    const response = await axiosInstance.get(`/users/${id}/workload/history`, { params })
    return response.data
  },

  /**
   * Get suggested tasks based on capacity
   * @param {string} id - User ID
   * @param {Object} params - Query parameters (maxSuggestions)
   * @returns {Promise} Suggested tasks
   */
  getSuggestedTasks: async (id, params = {}) => {
    const response = await axiosInstance.get(`/users/${id}/workload/suggestions`, { params })
    return response.data
  },

  downloadImportTemplate: async () => {
    const response = await axiosInstance.get('/users/admin/import/template', {
      responseType: 'blob',
    })
    return response
  },

  previewBulkImport: async (formData) => {
    const response = await axiosInstance.post('/users/admin/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  confirmBulkImport: async (data) => {
    const response = await axiosInstance.post('/users/admin/import/confirm', data)
    return response.data
  },
}

export default userService
