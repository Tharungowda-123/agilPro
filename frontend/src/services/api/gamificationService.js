import axiosInstance from './axiosConfig'

const gamificationService = {
  getSummary: async () => {
    const response = await axiosInstance.get('/gamification/me')
    return response.data
  },
  updatePreferences: async (data) => {
    const response = await axiosInstance.patch('/gamification/preferences', data)
    return response.data
  },
  getLeaderboard: async (params = {}) => {
    const response = await axiosInstance.get('/gamification/leaderboard', { params })
    return response.data
  },
}

export default gamificationService

