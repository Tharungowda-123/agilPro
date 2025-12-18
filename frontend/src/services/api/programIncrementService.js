import axiosInstance from './axiosConfig'

/**
 * Program Increment Service
 * Handles PI Planning related API calls
 */
export const programIncrementService = {
  /**
   * Get program increments for a project
   * @param {string} projectId
   * @param {object} filters
   */
  getProgramIncrements: async (projectId, filters = {}) => {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.page) params.append('page', filters.page)
    if (filters.limit) params.append('limit', filters.limit)
    
    const queryString = params.toString()
    const url = queryString
      ? `/program-increments/projects/${projectId}/program-increments?${queryString}`
      : `/program-increments/projects/${projectId}/program-increments`
    const response = await axiosInstance.get(url)
    return response.data
  },

  /**
   * Create a new program increment
   * @param {string} projectId
   * @param {object} data
   */
  createProgramIncrement: async (projectId, data) => {
    const response = await axiosInstance.post(`/program-increments/projects/${projectId}/program-increments`, data)
    return response.data
  },

  /**
   * Get a single program increment
   * @param {string} piId
   */
  getProgramIncrement: async (piId) => {
    const response = await axiosInstance.get(`/program-increments/${piId}`)
    return response.data
  },

  /**
   * Update a program increment
   * @param {string} piId
   * @param {object} data
   */
  updateProgramIncrement: async (piId, data) => {
    const response = await axiosInstance.put(`/program-increments/${piId}`, data)
    return response.data
  },

  /**
   * Delete a program increment
   * @param {string} piId
   */
  deleteProgramIncrement: async (piId) => {
    const response = await axiosInstance.delete(`/program-increments/${piId}`)
    return response.data
  },

  /**
   * Add feature to PI
   * @param {string} piId
   * @param {string} featureId
   */
  addFeatureToPI: async (piId, featureId) => {
    const response = await axiosInstance.post(`/program-increments/${piId}/features`, { featureId })
    return response.data
  },

  /**
   * Add sprint to PI
   * @param {string} piId
   * @param {string} sprintId
   */
  addSprintToPI: async (piId, sprintId) => {
    const response = await axiosInstance.post(`/program-increments/${piId}/sprints`, { sprintId })
    return response.data
  },

  /**
   * Get PI capacity
   * @param {string} piId
   */
  getPICapacity: async (piId) => {
    const response = await axiosInstance.get(`/program-increments/${piId}/capacity`)
    return response.data
  },

  /**
   * Optimize PI feature distribution
   * @param {string} piId
   */
  optimizePI: async (piId) => {
    const response = await axiosInstance.post(`/program-increments/${piId}/optimize`)
    return response.data
  },

  /**
   * Start PI
   * @param {string} piId
   */
  startPI: async (piId) => {
    const response = await axiosInstance.post(`/program-increments/${piId}/start`)
    return response.data
  },

  /**
   * Complete PI
   * @param {string} piId
   */
  completePI: async (piId) => {
    const response = await axiosInstance.post(`/program-increments/${piId}/complete`)
    return response.data
  },

  /**
   * Break down features into stories and assign tasks
   * @param {string} piId
   * @param {object} options - { featureIds, autoAssign }
   */
  breakdownAndAssign: async (piId, options = {}) => {
    const response = await axiosInstance.post(`/program-increments/${piId}/breakdown-and-assign`, options)
    return response.data
  },
}

export default programIncrementService

