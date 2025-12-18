import api from './axiosConfig'

/**
 * ML Feedback Service
 * Handles communication with the ML feedback API
 */

/**
 * Submit general ML feedback
 */
export const submitMLFeedback = async (feedbackData) => {
  const response = await api.post('/ml-feedback/submit', feedbackData)
  return response.data
}

/**
 * Submit task assignment feedback
 */
export const submitTaskAssignmentFeedback = async (feedbackData) => {
  const response = await api.post('/ml-feedback/task-assignment', feedbackData)
  return response.data
}

/**
 * Submit sprint outcome feedback
 */
export const submitSprintOutcomeFeedback = async (feedbackData) => {
  const response = await api.post('/ml-feedback/sprint-outcome', feedbackData)
  return response.data
}

/**
 * Submit story estimation feedback
 */
export const submitStoryEstimationFeedback = async (feedbackData) => {
  const response = await api.post('/ml-feedback/story-estimation', feedbackData)
  return response.data
}

/**
 * Get feedback statistics for a model type
 */
export const getFeedbackStats = async (modelType) => {
  const response = await api.get(`/ml-feedback/stats/${modelType}`)
  return response.data
}

/**
 * Get model performance trends over time
 */
export const getPerformanceTrends = async (modelType, timeframe = 90) => {
  const response = await api.get(`/ml-feedback/performance/${modelType}`, {
    params: { timeframe },
  })
  return response.data
}

