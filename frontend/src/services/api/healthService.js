import axiosInstance from './axiosConfig'

export const healthService = {
  getOverview: async () => {
    const response = await axiosInstance.get('/health')
    return response.data
  },
  getStatus: async () => {
    const response = await axiosInstance.get('/health/status')
    return response.data
  },
  getSlowQueries: async () => {
    const response = await axiosInstance.get('/health/slow-queries')
    return response.data
  },
  getErrorInsights: async () => {
    const response = await axiosInstance.get('/health/errors')
    return response.data
  },
  getRequestHistory: async () => {
    const response = await axiosInstance.get('/health/requests')
    return response.data
  },
}

export default healthService

