import axios from 'axios'
import useAuthStore from '@/stores/useAuthStore'
import { toast } from 'react-hot-toast'

/**
 * Axios Configuration
 * Creates configured axios instance with interceptors for authentication and error handling
 * Comprehensive error handling with retry logic and user-friendly messages
 */

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second base delay

// Calculate exponential backoff delay
const getRetryDelay = (retryCount) => {
  return RETRY_DELAY * Math.pow(2, retryCount)
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor: Add Authorization header with JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Initialize retry count if not present
    if (!config._retryCount) {
      config._retryCount = 0
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: Handle errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // Reset retry count on success
    if (response.config) {
      response.config._retryCount = 0
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh token for login/register endpoints - let them handle their own errors
      const requestUrl = originalRequest?.url || error.config?.url || ''
      const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                             requestUrl.includes('/auth/register')
      
      console.log('Axios Interceptor: 401 error on:', requestUrl, 'isAuthEndpoint:', isAuthEndpoint)
      
      if (isAuthEndpoint) {
        // For login/register, just reject the error so the component can handle it
        console.log('Axios Interceptor: Rejecting auth endpoint error directly')
        return Promise.reject(error)
      }
      
      originalRequest._retry = true

      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
            { refreshToken }
          )
          const { accessToken, token } = response.data.data || response.data
          const newToken = accessToken || token
          if (newToken) {
            localStorage.setItem('token', newToken)
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            originalRequest._retry = false // Reset for retry
            return axiosInstance(originalRequest)
          }
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        // Only redirect if not already on login page to prevent redirect loops
        if (window.location.pathname !== '/login') {
          useAuthStore.getState().logout()
          toast.error('Your session has expired. Please log in again.')
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }

      // No refresh token, logout user
      // Only redirect if not already on login page to prevent redirect loops
      if (window.location.pathname !== '/login') {
        useAuthStore.getState().logout()
        toast.error('Your session has expired. Please log in again.')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'You do not have permission to perform this action'
      toast.error(message)
    // Do not redirect automatically on API calls; let pages handle UX.
    // Many axios requests use a baseURL, so originalRequest.url won't contain '/api/'.
    // Redirects from here can cause loops; rely on route-level guards instead.
    return Promise.reject(error)
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      // Don't show toast for 404s - they're often expected (missing optional endpoints)
      // Just reject the error so components can handle it gracefully
      return Promise.reject(error)
    }

    // Handle 500 Server Error with retry
    if (error.response?.status === 500 || error.response?.status >= 502) {
      const retryCount = originalRequest._retryCount || 0
      
      if (retryCount < MAX_RETRIES) {
        originalRequest._retryCount = retryCount + 1
        const delay = getRetryDelay(retryCount)
        
        // Show retry notification
        if (retryCount === 0) {
          toast.error(`Server error. Retrying... (${retryCount + 1}/${MAX_RETRIES})`)
        } else {
          toast.loading(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`, { id: 'retry' })
        }
        
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))
        
        // Retry the request
        return axiosInstance(originalRequest)
      } else {
        // Max retries reached
        toast.error('Server error. Please try again later or contact support.', { id: 'retry' })
        
        // Redirect to server error page for critical errors
        if (originalRequest?.url?.includes('/api/')) {
          // Don't redirect for API calls
        } else {
          window.location.href = '/server-error'
        }
      }
      
      return Promise.reject(error)
    }

    // Handle network errors with retry
    if (!error.response) {
      const retryCount = originalRequest._retryCount || 0
      
      if (retryCount < MAX_RETRIES) {
        originalRequest._retryCount = retryCount + 1
        const delay = getRetryDelay(retryCount)
        
        // Show retry notification
        if (retryCount === 0) {
          toast.error(`Network error. Retrying... (${retryCount + 1}/${MAX_RETRIES})`)
        } else {
          toast.loading(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`, { id: 'network-retry' })
        }
        
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))
        
        // Retry the request
        return axiosInstance(originalRequest)
      } else {
        // Max retries reached
        toast.error('Network error. Please check your connection and try again.', { id: 'network-retry' })
      }
      
      return Promise.reject(error)
    }

    // Handle other errors (400, 422, etc.)
    const status = error.response?.status
    const message = error.response?.data?.message || 
                   error.response?.data?.error ||
                   `An error occurred (${status})`
    
    // Show appropriate error message
    if (status >= 400 && status < 500) {
      toast.error(message)
    } else {
      toast.error('An unexpected error occurred. Please try again.')
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
export { axiosInstance }

