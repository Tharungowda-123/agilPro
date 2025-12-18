import axiosInstance from './axiosConfig'

export const reportService = {
  getWidgets: async () => {
    const response = await axiosInstance.get('/reports/widgets')
    return response.data
  },
  getReports: async () => {
    const response = await axiosInstance.get('/reports/custom')
    return response.data
  },
  getReport: async (id) => {
    const response = await axiosInstance.get(`/reports/custom/${id}`)
    return response.data
  },
  createReport: async (data) => {
    const response = await axiosInstance.post('/reports/custom', data)
    return response.data
  },
  updateReport: async (id, data) => {
    const response = await axiosInstance.put(`/reports/custom/${id}`, data)
    return response.data
  },
  deleteReport: async (id) => {
    const response = await axiosInstance.delete(`/reports/custom/${id}`)
    return response.data
  },
  previewReport: async (data) => {
    const response = await axiosInstance.post('/reports/custom/preview', data)
    return response.data
  },
  runReport: async (id, data = {}) => {
    const response = await axiosInstance.post(`/reports/custom/${id}/run`, data)
    return response.data
  },
}

export default reportService


