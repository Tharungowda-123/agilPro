import axiosInstance from './axiosConfig'

/**
 * Email Preferences Service
 * API calls for email notification preferences
 */

const emailPreferencesService = {
  /**
   * Get email preferences
   * @param {string} userId - User ID
   * @returns {Promise} Email preferences
   */
  getEmailPreferences: async (userId) => {
    const response = await axiosInstance.get(`/users/${userId}/email-preferences`)
    return response.data
  },

  /**
   * Update email preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Updated preferences
   * @returns {Promise} Updated preferences
   */
  updateEmailPreferences: async (userId, preferences) => {
    const response = await axiosInstance.put(`/users/${userId}/email-preferences`, preferences)
    return response.data
  },

  /**
   * Unsubscribe from emails
   * @param {string} token - Unsubscribe token
   * @returns {Promise} Unsubscribe response
   */
  unsubscribe: async (token) => {
    const response = await axiosInstance.post(`/users/unsubscribe/${token}`)
    return response.data
  },
}

export default emailPreferencesService

