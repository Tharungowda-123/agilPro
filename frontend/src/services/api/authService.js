import axiosInstance from './axiosConfig'
import { API_ENDPOINTS } from '@/constants'

/**
 * Auth Service
 * Handles authentication-related API calls
 * Connects to real backend API
 */

export const authService = {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} User object and JWT tokens
   */
  login: async (email, password) => {
    try {
      console.log('AuthService: Attempting login for:', email)
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      })
      
      console.log('AuthService: Full response:', response)
      console.log('AuthService: Response data:', response.data)
      
      // Backend returns: { status: 'success', message: '...', data: { user, accessToken, refreshToken } }
      // Axios wraps it: response.data = { status: 'success', message: '...', data: { user, accessToken, refreshToken } }
      const responseData = response.data?.data || response.data
      
      console.log('AuthService: Extracted responseData:', responseData)
      
      if (!responseData) {
        console.error('AuthService: No response data found')
        throw new Error('Invalid response from server')
      }
      
      const user = responseData.user
      const accessToken = responseData.accessToken
      const refreshToken = responseData.refreshToken
      
      console.log('AuthService: Extracted values:', {
        hasUser: !!user,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      })
      
      if (!user || !accessToken) {
        console.error('AuthService: Missing user or token. Full response:', response.data)
        throw new Error('Missing user or token in response')
      }
      
      // Store tokens
      localStorage.setItem('token', accessToken)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      
      console.log('AuthService: Login successful, returning user and tokens')
      return {
        user,
        token: accessToken,
        refreshToken,
      }
    } catch (error) {
      console.error('AuthService: Login error:', error)
      console.error('AuthService: Error response:', error.response?.data)
      console.error('AuthService: Error status:', error.response?.status)
      throw error
    }
  },

  /**
   * Register new user
   * @param {Object} data - Registration data (name, email, password)
   * @returns {Promise} Success message and user data
   */
  register: async (data) => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, data)
    
    const { user, accessToken, refreshToken } = response.data.data || response.data
    
    // Store tokens
    if (accessToken) {
      localStorage.setItem('token', accessToken)
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    
    return {
      message: response.data.message || 'Account created successfully',
      user,
      token: accessToken,
      refreshToken,
    }
  },

  /**
   * Login with Google OAuth
   * Redirects to Google OAuth endpoint
   * @returns {void}
   */
  loginWithGoogle: async () => {
    const googleAuthUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/google`
    window.location.href = googleAuthUrl
  },

  /**
   * Logout user
   * @returns {Promise} Success message
   */
  logout: async () => {
    try {
      await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error)
    } finally {
      // Clear tokens
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    }
    
    return { message: 'Logged out successfully' }
  },

  /**
   * Refresh JWT token
   * @returns {Promise} New JWT token
   */
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await axiosInstance.post('/auth/refresh-token', {
      refreshToken,
    })
    
    const { accessToken, token } = response.data.data || response.data
    const newToken = accessToken || token
    
    if (newToken) {
      localStorage.setItem('token', newToken)
    }
    
    return { token: newToken }
  },

  /**
   * Get current user
   * @returns {Promise} Current user object
   */
  getCurrentUser: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.AUTH.ME)
    // Backend returns: { status: 'success', message: '...', data: { user: ... } }
    const user = response.data.data?.user || response.data.user || response.data.data
    
    return { user }
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} Success message
   */
  forgotPassword: async (email) => {
    const response = await axiosInstance.post('/auth/forgot-password', { email })
    return {
      message: response.data.message || 'Password reset link sent to your email',
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise} Success message
   */
  resetPassword: async (token, password) => {
    const response = await axiosInstance.post('/auth/reset-password', { token, password })
    return {
      message: response.data.message || 'Password reset successfully',
    }
  },
}

export default authService
