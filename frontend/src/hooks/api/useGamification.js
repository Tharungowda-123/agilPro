import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { gamificationService } from '@/services/api'

export const useGamificationSummary = () => {
  return useQuery({
    queryKey: ['gamification', 'me'],
    queryFn: async () => {
      const response = await gamificationService.getSummary()
      return response?.gamification || response?.data || response
    },
    staleTime: 2 * 60 * 1000,
  })
}

export const useLeaderboard = (params = {}) => {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', params],
    queryFn: async () => {
      const response = await gamificationService.getLeaderboard(params)
      return response?.leaderboard || response?.data || response || []
    },
    staleTime: 1 * 60 * 1000,
  })
}

export const useUpdateGamificationPreferences = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => gamificationService.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Gamification preferences updated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update preferences')
    },
  })
}

