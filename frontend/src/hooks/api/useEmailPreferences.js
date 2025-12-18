import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import emailPreferencesService from '@/services/api/emailPreferencesService'

/**
 * Get email preferences
 */
export const useEmailPreferences = (userId) => {
  return useQuery({
    queryKey: ['user', userId, 'emailPreferences'],
    queryFn: async () => {
      const response = await emailPreferencesService.getEmailPreferences(userId)
      return response?.data?.preferences || response?.data || response || {}
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Update email preferences
 */
export const useUpdateEmailPreferences = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, preferences }) =>
      emailPreferencesService.updateEmailPreferences(userId, preferences),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId, 'emailPreferences'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })
      toast.success('Email preferences updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update email preferences')
    },
  })
}

/**
 * Unsubscribe from emails
 */
export const useUnsubscribe = () => {
  return useMutation({
    mutationFn: (token) => emailPreferencesService.unsubscribe(token),
    onSuccess: () => {
      toast.success('You have been unsubscribed from email notifications')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unsubscribe')
    },
  })
}

