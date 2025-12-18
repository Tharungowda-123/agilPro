import { create } from 'zustand'
import { authService } from '@/services/api'

/**
 * Auth Store using Zustand
 * Manages authentication state, user data, and token management
 * Auto-refreshes token before expiry
 */
const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  refreshTokenTimer: null,

  // Set user
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Set token and store in localStorage
  setToken: (token) => {
    set({ token })
    if (token) {
      localStorage.setItem('token', token)
      get().startTokenRefresh()
    } else {
      localStorage.removeItem('token')
      get().stopTokenRefresh()
    }
  },

  // Set refresh token
  setRefreshToken: (refreshToken) => {
    set({ refreshToken })
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    } else {
      localStorage.removeItem('refreshToken')
    }
  },

  // Login action
  login: async (user, token, refreshToken = null) => {
    set({ user, token, refreshToken, isAuthenticated: true, isLoading: false })
    localStorage.setItem('token', token)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    get().startTokenRefresh()
  },

  // Register action
  register: async (userData) => {
    set({ isLoading: true })
    try {
      const response = await authService.register(userData)
      const { user, token, refreshToken } = response
      await get().login(user, token, refreshToken)
      return { success: true, user, token, refreshToken }
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // Login with email/password
  loginWithCredentials: async (email, password) => {
    set({ isLoading: true })
    try {
      console.log('AuthStore: loginWithCredentials called with email:', email)
      const response = await authService.login(email, password)
      console.log('AuthStore: authService.login response:', response)
      
      const { user, token, refreshToken } = response
      
      if (!user || !token) {
        console.error('AuthStore: Missing user or token in response:', { hasUser: !!user, hasToken: !!token })
        throw new Error('Invalid response from server: missing user or token')
      }
      
      console.log('AuthStore: Calling login method with user and tokens')
      // Use the same login method as register to ensure consistent behavior
      await get().login(user, token, refreshToken)
      console.log('AuthStore: Login successful, state updated')
    } catch (error) {
      console.error('AuthStore: loginWithCredentials error:', error)
      set({ isLoading: false, isAuthenticated: false, user: null, token: null })
      throw error
    }
  },

  // Login with Google OAuth
  loginWithGoogle: async () => {
    set({ isLoading: true })
    try {
      await authService.loginWithGoogle()
      // Redirect will happen, so we don't need to handle response here
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  // Logout action
  logout: async () => {
    get().stopTokenRefresh()
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    }
  },

  // Refresh token before expiry
  refreshToken: async () => {
    const currentRefreshToken = get().refreshToken || localStorage.getItem('refreshToken')
    if (!currentRefreshToken) {
      get().logout()
      return
    }

    try {
      const response = await authService.refreshToken()
      const { token } = response
      if (token) {
        get().setToken(token)
        get().startTokenRefresh() // Restart timer
      }
    } catch (error) {
      // If refresh fails, logout user
      console.error('Token refresh failed:', error)
      get().logout()
    }
  },

  // Start token refresh timer (refresh 5 minutes before expiry)
  // JWT tokens typically expire in 15 minutes, so refresh after 10 minutes
  startTokenRefresh: () => {
    get().stopTokenRefresh() // Clear existing timer

    // Refresh token 5 minutes before expiry (assuming 15 min expiry)
    // Adjust based on your token expiry time
    const refreshInterval = 10 * 60 * 1000 // 10 minutes

    const timer = setTimeout(() => {
      get().refreshToken()
    }, refreshInterval)

    set({ refreshTokenTimer: timer })
  },

  // Stop token refresh timer
  stopTokenRefresh: () => {
    const timer = get().refreshTokenTimer
    if (timer) {
      clearTimeout(timer)
      set({ refreshTokenTimer: null })
    }
  },

  // Initialize auth state from localStorage
  initAuth: async () => {
    const token = localStorage.getItem('token')
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!token) {
      set({ isLoading: false })
      return
    }

    set({ isLoading: true, token, refreshToken })
    try {
      const response = await authService.getCurrentUser()
      const user = response.user
      set({ user, isAuthenticated: true, isLoading: false })
      get().startTokenRefresh()
    } catch (error) {
      // Token is invalid, clear it
      console.error('Auth init error:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false })
    }
  },
}))

// Export as both default and named export for compatibility
export default useAuthStore
export { useAuthStore }
