import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { authService } from '@/services/api'
import { useAuthStore } from '@/stores/useAuthStore'
import { API_ENDPOINTS } from '@/constants'

/**
 * React Query hooks for authentication
 */
export const useLogin = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { login } = useAuthStore()

  return useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
    onSuccess: (data) => {
      login(data.user, data.token)
      queryClient.setQueryData(['user'], data.user)
      toast.success('Login successful!')
      navigate('/dashboard')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Login failed')
    },
  })
}

export const useRegister = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { login } = useAuthStore()

  return useMutation({
    mutationFn: (data) => authService.register(data),
    onSuccess: (data) => {
      login(data.user, data.token)
      queryClient.setQueryData(['user'], data.user)
      toast.success('Account created successfully!')
      navigate('/dashboard')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Registration failed')
    },
  })
}

export const useLogout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { logout } = useAuthStore()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout()
      queryClient.clear()
      navigate('/login')
    },
    onError: (error) => {
      // Even if API call fails, logout locally
      logout()
      queryClient.clear()
      navigate('/login')
      toast.error(error.response?.data?.message || 'Logout failed')
    },
  })
}

export const useCurrentUser = () => {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })
}

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email) => authService.forgotPassword(email),
    onSuccess: () => {
      toast.success('Password reset link sent to your email')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send reset link')
    },
  })
}

export const useResetPassword = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ token, password }) => authService.resetPassword(token, password),
    onSuccess: () => {
      toast.success('Password reset successfully!')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    },
  })
}

