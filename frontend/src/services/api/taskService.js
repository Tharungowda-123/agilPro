import axiosInstance from './axiosConfig'

/**
 * Task Service
 * Handles task-related API calls
 * Connects to real backend API
 */
export const taskService = {
  /**
   * Get all tasks for a story
   * @param {string} storyId - Story ID
   * @returns {Promise} Array of tasks
   */
  getTasks: async (storyId) => {
    const response = await axiosInstance.get(`/stories/${storyId}/tasks`)
    return response.data
  },

  /**
   * Get single task by ID
   * @param {string} id - Task ID
   * @returns {Promise} Task object
   */
  getTask: async (id) => {
    const response = await axiosInstance.get(`/tasks/${id}`)
    return response.data
  },

  /**
   * Create new task
   * @param {string} storyId - Story ID
   * @param {Object} data - Task data
   * @returns {Promise} Created task
   */
  createTask: async (storyId, data) => {
    const response = await axiosInstance.post(`/stories/${storyId}/tasks`, data)
    return response.data
  },

  /**
   * Update task
   * @param {string} id - Task ID
   * @param {Object} data - Updated task data
   * @returns {Promise} Updated task
   */
  updateTask: async (id, data) => {
    const response = await axiosInstance.put(`/tasks/${id}`, data)
    return response.data
  },

  /**
   * Delete task
   * @param {string} id - Task ID
   * @returns {Promise} Success message
   */
  deleteTask: async (id) => {
    const response = await axiosInstance.delete(`/tasks/${id}`)
    return response.data
  },

  /**
   * Assign task to user
   * @param {string} id - Task ID
   * @param {string} userId - User ID
   * @returns {Promise} Updated task
   */
  assignTask: async (id, userId) => {
    const response = await axiosInstance.post(`/tasks/${id}/assign`, { userId })
    return response.data
  },

  /**
   * Assign task using AI recommendation
   * @param {string} id - Task ID
   * @returns {Promise} Updated task with recommendation
   */
  assignTaskWithAI: async (id) => {
    const response = await axiosInstance.post(`/tasks/${id}/assign-ai`)
    return response.data
  },

  /**
   * Get AI recommendations for task assignment
   * @param {string} taskId - Task ID
   * @returns {Promise} Assignment recommendations
   */
  getAssignmentRecommendations: async (taskId) => {
    const response = await axiosInstance.get(`/tasks/${taskId}/recommendations`)
    return response.data
  },

  /**
   * Start task
   * @param {string} id - Task ID
   * @returns {Promise} Updated task
   */
  startTask: async (id) => {
    const response = await axiosInstance.post(`/tasks/${id}/start`)
    return response.data
  },

  /**
   * Complete task
   * @param {string} id - Task ID
   * @param {Object} data - Completion data (actualHours)
   * @returns {Promise} Updated task
   */
  completeTask: async (id, data = {}) => {
    const response = await axiosInstance.post(`/tasks/${id}/complete`, data)
    return response.data
  },

  /**
   * Dependency management
   */
  addDependency: async (id, dependencyId) => {
    const response = await axiosInstance.post(`/tasks/${id}/dependencies`, { dependencyId })
    return response.data
  },

  removeDependency: async (id, dependencyId) => {
    const response = await axiosInstance.delete(`/tasks/${id}/dependencies/${dependencyId}`)
    return response.data
  },

  getDependencyGraph: async (id) => {
    const response = await axiosInstance.get(`/tasks/${id}/dependencies/graph`)
    return response.data
  },

  getDependencyImpact: async (id) => {
    const response = await axiosInstance.get(`/tasks/${id}/dependencies/impact`)
    return response.data
  },

  /**
   * Commit linking
   */
  getTaskCommits: async (id) => {
    const response = await axiosInstance.get(`/tasks/${id}/commits`)
    return response.data
  },

  linkTaskCommit: async (id, data) => {
    const response = await axiosInstance.post(`/tasks/${id}/commits`, data)
    return response.data
  },

  scanTaskCommits: async (id, data = {}) => {
    const response = await axiosInstance.post(`/tasks/${id}/commits/scan`, data)
    return response.data
  },

  submitAIRecommendationFeedback: async (id, data) => {
    const response = await axiosInstance.post(`/tasks/${id}/ai/feedback`, data)
    return response.data
  },

  getTaskModelStats: async () => {
    const response = await axiosInstance.get('/tasks/ai/model-stats')
    return response.data
  },
}

export default taskService
