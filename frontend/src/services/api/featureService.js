import axiosInstance from './axiosConfig'

/**
 * Feature Service
 * Handles feature/epic related API calls
 */
export const featureService = {
  /**
   * Get features with filters (can filter by project, priority, status)
   * @param {object} filters - { project, priority, status, search, page, limit }
   */
  getFeatures: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.project) params.append('project', filters.project)
    if (filters.priority) params.append('priority', filters.priority)
    if (filters.status) params.append('status', filters.status)
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page)
    if (filters.limit) params.append('limit', filters.limit)
    
    const queryString = params.toString()
    const url = queryString ? `/features?${queryString}` : '/features'
    const response = await axiosInstance.get(url)
    return response.data
  },

  /**
   * Get features for a project (legacy endpoint)
   * @param {string} projectId
   */
  getFeaturesByProject: async (projectId) => {
    const response = await axiosInstance.get(`/features/projects/${projectId}/features`)
    return response.data
  },

  /**
   * Create a new feature (standalone)
   * @param {object} data - { title, description, projectId, ... }
   */
  createFeature: async (data) => {
    const response = await axiosInstance.post('/features', data)
    return response.data
  },

  /**
   * Create a new feature under a project (legacy endpoint)
   * @param {string} projectId
   * @param {object} data
   */
  createFeatureInProject: async (projectId, data) => {
    const response = await axiosInstance.post(`/features/projects/${projectId}/features`, data)
    return response.data
  },

  /**
   * Get a single feature
   * @param {string} featureId
   */
  getFeature: async (featureId) => {
    const response = await axiosInstance.get(`/features/${featureId}`)
    return response.data
  },

  /**
   * Update a feature
   * @param {string} featureId
   * @param {object} data
   */
  updateFeature: async (featureId, data) => {
    const response = await axiosInstance.put(`/features/${featureId}`, data)
    return response.data
  },

  /**
   * Delete a feature
   * @param {string} featureId - Can include query params like "?deleteChildren=true"
   */
  deleteFeature: async (featureId) => {
    const response = await axiosInstance.delete(`/features/${featureId}`)
    return response.data
  },

  /**
   * Analyze feature (NLP analysis only)
   * @param {string} featureId
   */
  analyzeFeature: async (featureId) => {
    const response = await axiosInstance.post(`/features/${featureId}/analyze`)
    return response.data
  },

  /**
   * Break down feature into stories via AI (returns suggestions)
   * @param {string} featureId
   */
  breakDownFeature: async (featureId) => {
    const response = await axiosInstance.post(`/features/${featureId}/breakdown`)
    return response.data
  },

  /**
   * Accept breakdown and create stories/tasks
   * @param {string} featureId
   * @param {object} options - { storyIds, createAll }
   */
  acceptBreakdown: async (featureId, options = {}) => {
    const response = await axiosInstance.post(`/features/${featureId}/accept-breakdown`, options)
    return response.data
  },

  /**
   * Auto-breakdown and create (one-click instant)
   * @param {string} featureId
   */
  autoBreakdownAndCreate: async (featureId) => {
    const response = await axiosInstance.post(`/features/${featureId}/auto-breakdown-and-create`)
    return response.data
  },

  /**
   * Add story to feature manually
   * @param {string} featureId
   * @param {string} storyId
   */
  addStoryToFeature: async (featureId, storyId) => {
    const response = await axiosInstance.post(`/features/${featureId}/stories`, { storyId })
    return response.data
  },

  /**
   * Get feature progress
   * @param {string} featureId
   */
  getFeatureProgress: async (featureId) => {
    const response = await axiosInstance.get(`/features/${featureId}/progress`)
    return response.data
  },
}

export default featureService

