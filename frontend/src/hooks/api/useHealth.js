import { useQuery } from '@tanstack/react-query'
import { healthService } from '@/services/api'

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['health', 'overview'],
    queryFn: async () => {
      const response = await healthService.getOverview()
      return response?.data || response
    },
    refetchInterval: 60 * 1000,
  })
}

export const useHealthStatus = () => {
  return useQuery({
    queryKey: ['health', 'status'],
    queryFn: async () => {
      const response = await healthService.getStatus()
      return response?.data || response
    },
    refetchInterval: 60 * 1000,
  })
}

export const useSlowQueries = () => {
  return useQuery({
    queryKey: ['health', 'slow-queries'],
    queryFn: async () => {
      const response = await healthService.getSlowQueries()
      return response?.data || response || { slowQueries: [] }
    },
    refetchInterval: 2 * 60 * 1000,
  })
}

export const useHealthErrors = () => {
  return useQuery({
    queryKey: ['health', 'errors'],
    queryFn: async () => {
      const response = await healthService.getErrorInsights()
      return response?.data || response || { errors: [] }
    },
    refetchInterval: 60 * 1000,
  })
}

export const useRequestHistory = () => {
  return useQuery({
    queryKey: ['health', 'requests'],
    queryFn: async () => {
      const response = await healthService.getRequestHistory()
      return response?.data || response || { history: [] }
    },
    refetchInterval: 30 * 1000,
  })
}

