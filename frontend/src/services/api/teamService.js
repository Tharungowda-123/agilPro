import axiosInstance from './axiosConfig'

/**
 * Team Service
 * Handles team-related API calls
 * Connects to real backend API
 */
export const teamService = {
  /**
   * Get all teams
   * @param {Object} params - Query parameters (page, limit, search)
   * @returns {Promise} Paginated teams
   */
  getTeams: async (params = {}) => {
    const response = await axiosInstance.get('/teams', { params })
    return response.data
  },

  /**
   * Get single team by ID
   * @param {string} id - Team ID
   * @returns {Promise} Team object
   */
  getTeam: async (id) => {
    const response = await axiosInstance.get(`/teams/${id}`)
    return response.data
  },

  /**
   * Create new team
   * @param {Object} data - Team data
   * @returns {Promise} Created team
   */
  createTeam: async (data) => {
    const response = await axiosInstance.post('/teams', data)
    return response.data
  },

  /**
   * Update team
   * @param {string} id - Team ID
   * @param {Object} data - Updated team data
   * @returns {Promise} Updated team
   */
  updateTeam: async (id, data) => {
    const response = await axiosInstance.put(`/teams/${id}`, data)
    return response.data
  },

  /**
   * Delete team
   * @param {string} id - Team ID
   * @returns {Promise} Success message
   */
  deleteTeam: async (id) => {
    const response = await axiosInstance.delete(`/teams/${id}`)
    return response.data
  },

  /**
   * Add members to team
   * @param {string} id - Team ID
   * @param {Array<string>} userIds - Array of user IDs
   * @returns {Promise} Updated team
   */
  addMembers: async (id, userIds) => {
    const response = await axiosInstance.post(`/teams/${id}/members`, { userIds })
    return response.data
  },

  /**
   * Remove member from team
   * @param {string} id - Team ID
   * @param {string} userId - User ID
   * @returns {Promise} Updated team
   */
  removeMember: async (id, userId) => {
    const response = await axiosInstance.delete(`/teams/${id}/members/${userId}`)
    return response.data
  },

  /**
   * Get team capacity
   * @param {string} id - Team ID
   * @returns {Promise} Capacity data
   */
  getTeamCapacity: async (id) => {
    const response = await axiosInstance.get(`/teams/${id}/capacity`)
    return response.data
  },

  /**
   * Get team velocity
   * @param {string} id - Team ID
   * @returns {Promise} Velocity data
   */
  getTeamVelocity: async (id) => {
    const response = await axiosInstance.get(`/teams/${id}/velocity`)
    return response.data
  },

  /**
   * Get team performance metrics
   * @param {string} id - Team ID
   * @returns {Promise} Performance metrics
   */
  getTeamPerformance: async (id) => {
    const response = await axiosInstance.get(`/teams/${id}/performance`)
    return response.data
  },

  /**
   * Get team capacity planning data
   * @param {string} id - Team ID
   * @param {Object} params - Query parameters (sprintId)
   * @returns {Promise} Capacity planning data
   */
  getTeamCapacityPlanning: async (id, params = {}) => {
    const response = await axiosInstance.get(`/teams/${id}/capacity-planning`, { params })
    return response.data
  },

  /**
   * Get capacity utilization trends
   * @param {string} id - Team ID
   * @param {Object} params - Query parameters (limit)
   * @returns {Promise} Capacity trends
   */
  getCapacityTrends: async (id, params = {}) => {
    const response = await axiosInstance.get(`/teams/${id}/capacity-trends`, { params })
    return response.data
  },

  /**
   * Get AI rebalance suggestions
   * @param {string} id - Team ID
   * @param {Object} params - Query parameters (sprintId)
   * @returns {Promise} Rebalance suggestions
   */
  getRebalanceSuggestions: async (id, params = {}) => {
    const response = await axiosInstance.get(`/teams/${id}/rebalance-suggestions`, { params })
    return response.data
  },

  /**
   * Apply workload rebalance plan
   * @param {string} id - Team ID
   * @param {Object} data - Rebalance payload
   * @returns {Promise}
   */
  applyRebalancePlan: async (id, data) => {
    const response = await axiosInstance.post(`/teams/${id}/rebalance/apply`, data)
    return response.data
  },

  /**
   * Get workload rebalance history
   * @param {string} id - Team ID
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getRebalanceHistory: async (id, params = {}) => {
    const response = await axiosInstance.get(`/teams/${id}/rebalance/history`, { params })
    return response.data
  },

  /**
   * Team calendar and availability
   */
  getTeamCalendar: async (id, params = {}) => {
    const response = await axiosInstance.get(`/teams/${id}/calendar`, { params })
    return response.data
  },

  createCalendarEvent: async (id, data) => {
    const response = await axiosInstance.post(`/teams/${id}/calendar/events`, data)
    return response.data
  },

  updateCalendarEvent: async (id, eventId, data) => {
    const response = await axiosInstance.put(`/teams/${id}/calendar/events/${eventId}`, data)
    return response.data
  },

  deleteCalendarEvent: async (id, eventId) => {
    const response = await axiosInstance.delete(`/teams/${id}/calendar/events/${eventId}`)
    return response.data
  },

  syncTeamCalendar: async (id) => {
    const response = await axiosInstance.post(`/teams/${id}/calendar/sync/google`)
    return response.data
  },

  getTeamAvailabilityForecast: async (id, params = {}) => {
    const response = await axiosInstance.get(`/teams/${id}/availability/forecast`, { params })
    return response.data
  },

  getTeamAvailabilityDashboard: async (id, params = {}) => {
    const response = await axiosInstance.get(`/teams/${id}/availability/dashboard`, { params })
    return response.data
  },

  /**
   * Reassign task to different user
   * @param {string} id - Team ID
   * @param {string} taskId - Task ID
   * @param {string} newUserId - New user ID
   * @returns {Promise} Updated task
   */
  reassignTask: async (id, taskId, newUserId) => {
    const response = await axiosInstance.put(`/teams/${id}/reassign-task`, {
      taskId,
      newUserId,
    })
    return response.data
  },
}

export default teamService
