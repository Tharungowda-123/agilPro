import axiosInstance from './axiosConfig'

/**
 * TimeEntry Service
 * Handles time tracking API calls
 */
export const timeEntryService = {
  /**
   * Start timer for a task
   * @param {string} taskId - Task ID
   * @returns {Promise} Time entry
   */
  startTimer: async (taskId) => {
    const response = await axiosInstance.post(`/tasks/${taskId}/timer/start`)
    return response.data
  },

  /**
   * Stop timer
   * @param {string} timeEntryId - Time entry ID
   * @returns {Promise} Updated time entry
   */
  stopTimer: async (timeEntryId) => {
    const response = await axiosInstance.post(`/time-entries/${timeEntryId}/timer/stop`)
    return response.data
  },

  /**
   * Pause timer
   * @param {string} timeEntryId - Time entry ID
   * @returns {Promise} Updated time entry
   */
  pauseTimer: async (timeEntryId) => {
    const response = await axiosInstance.post(`/time-entries/${timeEntryId}/timer/pause`)
    return response.data
  },

  /**
   * Resume timer
   * @param {string} timeEntryId - Time entry ID
   * @returns {Promise} Updated time entry
   */
  resumeTimer: async (timeEntryId) => {
    const response = await axiosInstance.post(`/time-entries/${timeEntryId}/timer/resume`)
    return response.data
  },

  /**
   * Get active timer
   * @returns {Promise} Active time entry or null
   */
  getActiveTimer: async () => {
    const response = await axiosInstance.get('/time-entries/active')
    return response.data
  },

  /**
   * Create manual time entry
   * @param {string} taskId - Task ID
   * @param {Object} data - Time entry data (hours, date, description)
   * @returns {Promise} Created time entry
   */
  createTimeEntry: async (taskId, data) => {
    const response = await axiosInstance.post(`/tasks/${taskId}/time-entries`, data)
    return response.data
  },

  /**
   * Get time entries for a task
   * @param {string} taskId - Task ID
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise} Time entries
   */
  getTimeEntriesForTask: async (taskId, params = {}) => {
    const response = await axiosInstance.get(`/tasks/${taskId}/time-entries`, { params })
    return response.data
  },

  /**
   * Get time entries for current user
   * @param {Object} params - Query parameters (dateFrom, dateTo, taskId, projectId, page, limit)
   * @returns {Promise} Time entries
   */
  getTimeEntries: async (params = {}) => {
    const response = await axiosInstance.get('/time-entries', { params })
    return response.data
  },

  /**
   * Update time entry
   * @param {string} id - Time entry ID
   * @param {Object} data - Update data
   * @returns {Promise} Updated time entry
   */
  updateTimeEntry: async (id, data) => {
    const response = await axiosInstance.put(`/time-entries/${id}`, data)
    return response.data
  },

  /**
   * Delete time entry
   * @param {string} id - Time entry ID
   * @returns {Promise} Success message
   */
  deleteTimeEntry: async (id) => {
    const response = await axiosInstance.delete(`/time-entries/${id}`)
    return response.data
  },

  /**
   * Get time tracking summary
   * @param {Object} params - Query parameters (dateFrom, dateTo)
   * @returns {Promise} Time tracking summary
   */
  getTimeTrackingSummary: async (params = {}) => {
    const response = await axiosInstance.get('/time-entries/summary', { params })
    return response.data
  },
}

export default timeEntryService

