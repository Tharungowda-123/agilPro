import axiosInstance from './axiosConfig'

/**
 * Project Service
 * Handles project-related API calls
 * Connects to real backend API
 */
export const projectService = {
  /**
   * Get all projects with pagination and filters
   * @param {Object} params - Query parameters (page, limit, search, status)
   * @returns {Promise} Paginated projects
   */
  getProjects: async (params = {}) => {
    const response = await axiosInstance.get('/projects', { params })
    return response.data
  },

  /**
   * Get single project by ID
   * @param {string} id - Project ID
   * @returns {Promise} Project object
   */
  getProject: async (id) => {
    const response = await axiosInstance.get(`/projects/${id}`)
    return response.data
  },

  /**
   * Create new project
   * @param {Object} data - Project data
   * @returns {Promise} Created project
   */
  createProject: async (data) => {
    const response = await axiosInstance.post('/projects', data)
    return response.data
  },

  /**
   * Update project
   * @param {string} id - Project ID
   * @param {Object} data - Updated project data
   * @returns {Promise} Updated project
   */
  updateProject: async (id, data) => {
    const response = await axiosInstance.put(`/projects/${id}`, data)
    return response.data
  },

  /**
   * Delete project
   * @param {string} id - Project ID
   * @returns {Promise} Success message
   */
  deleteProject: async (id) => {
    const response = await axiosInstance.delete(`/projects/${id}`)
    return response.data
  },

  /**
   * Get project metrics
   * @param {string} id - Project ID
   * @returns {Promise} Project metrics
   */
  getProjectMetrics: async (id) => {
    const response = await axiosInstance.get(`/projects/${id}/metrics`)
    return response.data
  },

  /**
   * Get team performance for project
   * @param {string} id - Project ID
   * @returns {Promise} Team performance data
   */
  getTeamPerformance: async (id) => {
    const response = await axiosInstance.get(`/projects/${id}/team-performance`)
    return response.data
  },
}

export default projectService
