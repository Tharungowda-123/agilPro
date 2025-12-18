import axiosInstance from './axiosConfig'

/**
 * Audit Log Service
 * API calls for audit log functionality
 */

const auditLogService = {
  /**
   * Get audit logs with filtering
   * @param {Object} params - Query parameters
   * @returns {Promise} Audit logs data
   */
  getAuditLogs: async (params = {}) => {
    const response = await axiosInstance.get('/audit-logs', { params })
    return response.data
  },

  /**
   * Get audit log by ID
   * @param {string} id - Audit log ID
   * @returns {Promise} Audit log data
   */
  getAuditLog: async (id) => {
    const response = await axiosInstance.get(`/audit-logs/${id}`)
    return response.data
  },

  /**
   * Get audit log statistics
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise} Statistics data
   */
  getAuditLogStats: async (params = {}) => {
    const response = await axiosInstance.get('/audit-logs/stats/summary', { params })
    return response.data
  },

  /**
   * Export audit logs to CSV
   * @param {Object} params - Query parameters
   * @returns {Promise} CSV blob
   */
  exportAuditLogsCSV: async (params = {}) => {
    const response = await axiosInstance.get('/audit-logs/export/csv', {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}

export default auditLogService

