import axiosInstance from './axiosConfig'

/**
 * Story Service
 * Handles user story-related API calls
 * Connects to real backend API
 */
export const storyService = {
  /**
   * Get all stories with filters
   * @param {string} projectId - Project ID
   * @param {Object} params - Query parameters (sprintId, status, assignedTo, search, page, limit)
   * @returns {Promise} Paginated stories
   */
  getStories: async (projectId, params = {}) => {
    const response = await axiosInstance.get(`/stories/projects/${projectId}/stories`, { params })
    return response.data
  },

  /**
   * Get single story by ID
   * @param {string} id - Story ID
   * @returns {Promise} Story object
   */
  getStory: async (id) => {
    const response = await axiosInstance.get(`/stories/${id}`)
    return response.data
  },

  /**
   * Create new story
   * @param {string} projectId - Project ID (or featureId)
   * @param {Object} data - Story data
   * @param {string} type - 'project' or 'feature'
   * @returns {Promise} Created story
   */
  createStory: async (projectId, data, type = 'project') => {
    let url = ''
    if (type === 'feature') {
      url = `/stories/features/${projectId}/stories`
    } else {
      url = `/stories/projects/${projectId}/stories`
    }
    const response = await axiosInstance.post(url, data)
    return response.data
  },

  /**
   * Update story
   * @param {string} id - Story ID
   * @param {Object} data - Updated story data
   * @returns {Promise} Updated story
   */
  updateStory: async (id, data) => {
    const response = await axiosInstance.put(`/stories/${id}`, data)
    return response.data
  },

  /**
   * Delete story
   * @param {string} id - Story ID
   * @returns {Promise} Success message
   */
  deleteStory: async (id) => {
    const response = await axiosInstance.delete(`/stories/${id}`)
    return response.data
  },

  /**
   * Analyze story with AI
   * @param {string} id - Story ID
   * @returns {Promise} AI insights
   */
  analyzeStory: async (id) => {
    const response = await axiosInstance.post(`/stories/${id}/analyze`)
    return response.data
  },

  /**
   * Estimate story points
   * @param {string} id - Story ID
   * @returns {Promise} Story points estimate
   */
  estimateStoryPoints: async (id) => {
    const response = await axiosInstance.post(`/stories/${id}/estimate-points`)
    return response.data
  },

  /**
   * Find similar stories
   * @param {string} id - Story ID
   * @returns {Promise} Array of similar stories
   */
  findSimilarStories: async (id) => {
    const response = await axiosInstance.get(`/stories/${id}/similar`)
    return response.data
  },

  /**
   * Add dependency to story
   * @param {string} id - Story ID
   * @param {string} dependencyId - Dependency story ID
   * @returns {Promise} Updated story
   */
  addDependency: async (id, dependencyId) => {
    const response = await axiosInstance.post(`/stories/${id}/dependencies`, { dependencyId })
    return response.data
  },

  /**
   * Remove dependency from story
   * @param {string} id - Story ID
   * @param {string} dependencyId - Dependency story ID
   * @returns {Promise} Updated story
   */
  removeDependency: async (id, dependencyId) => {
    const response = await axiosInstance.delete(`/stories/${id}/dependencies/${dependencyId}`)
    return response.data
  },
}

export default storyService
