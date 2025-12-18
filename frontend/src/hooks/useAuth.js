import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import api from '@/services/api'
import { API_ENDPOINTS } from '@/constants'

export function useAuth() {
  const { user, isAuthenticated, setUser, setToken, logout } = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && !user) {
      // Verify token and get user
      api
        .get(API_ENDPOINTS.AUTH.ME)
        .then((response) => {
          setUser(response.data.user)
          setToken(token)
        })
        .catch(() => {
          logout()
        })
    }
  }, [user, setUser, setToken, logout])

  return { user, isAuthenticated, logout }
}

