import axiosInstance from './axiosConfig'

/**
 * Organization Service
 * Handles organization-related API calls
 * Connects to real backend API
 */
export const organizationService = {
  /**
   * Get organization details
   * @returns {Promise} Organization object
   */
  getOrganization: async () => {
    const response = await axiosInstance.get('/organization')
    return response.data
  },

  /**
   * Update organization
   * @param {Object} data - Updated organization data
   * @returns {Promise} Updated organization
   */
  updateOrganization: async (data) => {
    const response = await axiosInstance.put('/organization', data)
    return response.data
  },

  /**
   * Get organization teams
   * @returns {Promise} Array of teams
   */
  getOrganizationTeams: async () => {
    const response = await axiosInstance.get('/organization/teams')
    return response.data
  },
}

export default organizationService

