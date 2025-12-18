import axiosInstance from './axiosConfig'

/**
 * Export Service
 * API calls for export functionality
 */

const exportService = {
  /**
   * Export dashboard to PDF
   * @param {Object} params - Query parameters (dateRange, filters)
   * @returns {Promise} PDF blob
   */
  exportDashboardPDF: async (params = {}) => {
    const response = await axiosInstance.get('/export/dashboard/pdf', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Export projects to Excel
   * @returns {Promise} Excel blob
   */
  exportProjectsExcel: async () => {
    const response = await axiosInstance.get('/export/projects/excel', {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Export stories to Excel
   * @param {Object} params - Query parameters (projectId)
   * @returns {Promise} Excel blob
   */
  exportStoriesExcel: async (params = {}) => {
    const response = await axiosInstance.get('/export/stories/excel', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Export tasks to Excel
   * @param {Object} params - Query parameters (storyId, projectId)
   * @returns {Promise} Excel blob
   */
  exportTasksExcel: async (params = {}) => {
    const response = await axiosInstance.get('/export/tasks/excel', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Export teams to Excel
   * @returns {Promise} Excel blob
   */
  exportTeamsExcel: async () => {
    const response = await axiosInstance.get('/export/teams/excel', {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Export custom report
   * @param {Object} data - Report configuration (type, format, filters)
   * @returns {Promise} Blob (PDF or Excel)
   */
  exportCustomReport: async (data) => {
    const response = await axiosInstance.post('/export/custom', data, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Export time entries to PDF
   */
  exportTimeEntriesPDF: async (params = {}) => {
    const response = await axiosInstance.get('/export/time-entries/pdf', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Export time entries to Excel
   */
  exportTimeEntriesExcel: async (params = {}) => {
    const response = await axiosInstance.get('/export/time-entries/excel', {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}

/**
 * Download blob as file
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export default exportService

