import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import organizationService from '@/services/api/organizationService'

/**
 * React Query hooks for organization
 */
export const useOrganization = () => {
  return useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const response = await organizationService.getOrganization()
      return response?.data?.organization || response?.data || response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => organizationService.updateOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] })
      toast.success('Organization updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update organization')
    },
  })
}

export const useOrganizationTeams = () => {
  return useQuery({
    queryKey: ['organization', 'teams'],
    queryFn: async () => {
      const response = await organizationService.getOrganizationTeams()
      return response?.data?.teams || response?.data || response || []
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

