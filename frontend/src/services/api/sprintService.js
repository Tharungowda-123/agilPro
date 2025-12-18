import axiosInstance from './axiosConfig'

/**
 * Sprint Service
 * Handles sprint-related API calls
 * Connects to real backend API
 */
export const sprintService = {
  /**
   * Get all sprints (across all projects) or for a specific project
   * @param {string} projectId - Optional project ID. If not provided, returns all sprints
   * @param {Object} params - Query parameters (status, page, limit)
   * @returns {Promise} Array of sprints
   */
  getSprints: async (projectId, params = {}) => {
    // Increase limit to show more sprints (default backend limit is 50)
    const queryParams = { ...params, limit: params.limit || 100 }
    
    if (projectId) {
      // Get sprints for specific project
      const response = await axiosInstance.get(`/projects/${projectId}/sprints`, { params: queryParams })
      return response.data
    } else {
      // Get all sprints
      const response = await axiosInstance.get(`/sprints`, { params: queryParams })
      return response.data
    }
  },

  /**
   * Get single sprint by ID
   * @param {string} id - Sprint ID
   * @returns {Promise} Sprint object
   */
  getSprint: async (id) => {
    const response = await axiosInstance.get(`/sprints/${id}`)
    return response.data
  },

  /**
   * Create new sprint
   * @param {string} projectId - Project ID
   * @param {Object} data - Sprint data
   * @returns {Promise} Created sprint
   */
  createSprint: async (projectId, data) => {
    const response = await axiosInstance.post(`/projects/${projectId}/sprints`, data)
    return response.data
  },

  /**
   * Update sprint
   * @param {string} id - Sprint ID
   * @param {Object} data - Updated sprint data
   * @returns {Promise} Updated sprint
   */
  updateSprint: async (id, data) => {
    const response = await axiosInstance.put(`/sprints/${id}`, data)
    return response.data
  },

  /**
   * Start sprint
   * @param {string} id - Sprint ID
   * @returns {Promise} Updated sprint
   */
  startSprint: async (id) => {
    if (!id || id === 'undefined') {
      throw new Error('Sprint ID is required')
    }
    const response = await axiosInstance.post(`/sprints/${id}/start`)
    return response.data
  },

  /**
   * Complete sprint
   * @param {string} id - Sprint ID
   * @param {Object} data - Retrospective data (optional)
   * @returns {Promise} Updated sprint
   */
  completeSprint: async (id, data = {}) => {
    const response = await axiosInstance.post(`/sprints/${id}/complete`, data)
    return response.data
  },

  /**
   * Get sprint burndown chart data
   * @param {string} id - Sprint ID
   * @returns {Promise} Burndown data
   */
  getSprintBurndown: async (id) => {
    if (!id || id === 'undefined') {
      throw new Error('Sprint ID is required')
    }
    const response = await axiosInstance.get(`/sprints/${id}/burndown`)
    return response.data
  },

  /**
   * Get sprint velocity
   * @param {string} id - Sprint ID
   * @returns {Promise} Velocity data
   */
  getSprintVelocity: async (id) => {
    const response = await axiosInstance.get(`/sprints/${id}/velocity`)
    return response.data
  },

  /**
   * Assign stories to sprint
   * @param {string} id - Sprint ID
   * @param {Array<string>} storyIds - Array of story IDs
   * @returns {Promise} Success message
   */
  assignStories: async (id, storyIds) => {
    const response = await axiosInstance.post(`/sprints/${id}/stories`, { storyIds })
    return response.data
  },

  /**
   * Save or update sprint retrospective
   * @param {string} id - Sprint ID
   * @param {Object} data - Retrospective data (whatWentWell, whatDidntGoWell, actionItems)
   * @returns {Promise} Updated sprint
   */
  saveRetrospective: async (id, data) => {
    const response = await axiosInstance.post(`/sprints/${id}/retrospective`, data)
    return response.data
  },

  /**
   * Update action item completion status
   * @param {string} id - Sprint ID
   * @param {string} itemId - Action item ID
   * @param {boolean} completed - Completion status
   * @returns {Promise} Updated sprint
   */
  updateActionItem: async (id, itemId, completed) => {
    const response = await axiosInstance.put(`/sprints/${id}/retrospective/action-items/${itemId}`, {
      completed,
    })
    return response.data
  },

  /**
   * Get past retrospectives for a project
   * @param {string} projectId - Project ID
   * @param {Object} params - Query parameters (limit)
   * @returns {Promise} Array of past retrospectives
   */
  getPastRetrospectives: async (projectId, params = {}) => {
    const response = await axiosInstance.get(`/sprints/projects/${projectId}/retrospectives`, {
      params,
    })
    return response.data
  },

  /**
   * Optimize sprint plan with AI
   * @param {string} sprintId
   * @param {Object} data - Optional overrides/constraints
   */
  optimizeSprintPlan: async (sprintId, data = {}) => {
    const response = await axiosInstance.post(`/sprints/${sprintId}/ai/optimize-plan`, data)
    return response.data
  },

  /**
   * Predict sprint velocity with AI
   * @param {string} sprintId
   * @param {Object} data - Optional payload (historical overrides)
   */
  predictSprintVelocity: async (sprintId, data = {}) => {
    const response = await axiosInstance.post(`/sprints/${sprintId}/ai/predict-velocity`, data)
    return response.data
  },

  /**
   * Get AI story suggestions
   * @param {string} sprintId
   * @param {Object} data - Optional filters
   */
  suggestSprintStories: async (sprintId, data = {}) => {
    const response = await axiosInstance.post(`/sprints/${sprintId}/ai/suggest-stories`, data)
    return response.data
  },

  /**
   * Simulate sprint outcome with AI
   * @param {string} sprintId
   * @param {Object} data - Planned stories / constraints
   */
  simulateSprintOutcome: async (sprintId, data = {}) => {
    const response = await axiosInstance.post(`/sprints/${sprintId}/ai/simulate`, data)
    return response.data
  },

  /**
   * Predict sprint completion date with AI
   * @param {string} sprintId
   * @param {Object} data - Remaining points / capacity overrides
   */
  predictSprintCompletion: async (sprintId, data = {}) => {
    const response = await axiosInstance.post(`/sprints/${sprintId}/ai/predict-completion`, data)
    return response.data
  },

  /**
   * Auto-generate sprint plan instantly
   * @param {string} sprintId
   * @returns {Promise} Generated plan with stories and tasks
   */
  autoGeneratePlan: async (sprintId) => {
    const response = await axiosInstance.post(`/sprints/${sprintId}/auto-generate`)
    return response.data
  },

  /**
   * Accept generated sprint plan
   * @param {string} sprintId
   * @param {Object} generatedPlan - Generated plan to accept
   * @returns {Promise} Success message
   */
  acceptGeneratedPlan: async (sprintId, generatedPlan) => {
    const response = await axiosInstance.post(`/sprints/${sprintId}/accept-generated-plan`, { generatedPlan })
    return response.data
  },
}

export default sprintService
