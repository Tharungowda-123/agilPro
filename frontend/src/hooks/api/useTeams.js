import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { teamService } from '@/services/api'

/**
 * React Query hooks for teams
 */
export const useTeams = (params = {}) => {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: async () => {
      const response = await teamService.getTeams(params)
      return response?.data?.data || response?.data || response || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useTeam = (id) => {
  return useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      const response = await teamService.getTeam(id)
      return response?.data?.team || response?.data || response
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export const useCreateTeam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => teamService.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Team created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create team')
    },
  })
}

export const useUpdateTeam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => teamService.updateTeam(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['team', variables.id] })
      toast.success('Team updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update team')
    },
  })
}

export const useAddTeamMembers = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, userIds }) => teamService.addMembers(id, userIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Members added to team!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add members')
    },
  })
}

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, userId }) => teamService.removeMember(id, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Member removed from team')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove member')
    },
  })
}

export const useTeamPerformance = (id) => {
  return useQuery({
    queryKey: ['team', id, 'performance'],
    queryFn: async () => {
      const response = await teamService.getTeamPerformance(id)
      return response?.data?.performance || response?.data || response
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================
// CAPACITY PLANNING HOOKS
// ============================================

export const useTeamCapacityPlanning = (id, params = {}) => {
  return useQuery({
    queryKey: ['team', id, 'capacity-planning', params],
    queryFn: async () => {
      const response = await teamService.getTeamCapacityPlanning(id, params)
      return response?.data?.capacityPlanning || response?.data || response
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

export const useCapacityTrends = (id, params = {}) => {
  return useQuery({
    queryKey: ['team', id, 'capacity-trends', params],
    queryFn: async () => {
      const response = await teamService.getCapacityTrends(id, params)
      return response?.data?.trends || response?.data || response || []
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export const useRebalanceSuggestions = (id, params = {}) => {
  return useQuery({
    queryKey: ['team', id, 'rebalance-suggestions', params],
    queryFn: async () => {
      const response = await teamService.getRebalanceSuggestions(id, params)
      return response?.data || response || {}
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

export const useReassignTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, taskId, newUserId }) =>
      teamService.reassignTask(teamId, taskId, newUserId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'capacity-planning'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Task reassigned successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reassign task')
    },
  })
}

export const useApplyRebalancePlan = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, data }) => teamService.applyRebalancePlan(teamId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'capacity-planning'] })
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'rebalance-history'] })
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'rebalance-suggestions'] })
      toast.success('Rebalance applied successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to apply rebalance')
    },
  })
}

export const useRebalanceHistory = (teamId, params = {}) => {
  return useQuery({
    queryKey: ['team', teamId, 'rebalance-history', params],
    queryFn: async () => {
      const response = await teamService.getRebalanceHistory(teamId, params)
      return response?.data?.history || response?.data || response || []
    },
    enabled: !!teamId,
    staleTime: 60 * 1000,
  })
}

export const useTeamCalendar = (teamId, params = {}) => {
  return useQuery({
    queryKey: ['team', teamId, 'calendar', params],
    queryFn: async () => {
      const response = await teamService.getTeamCalendar(teamId, params)
      return response?.data || response || {}
    },
    enabled: !!teamId,
    staleTime: 60 * 1000,
  })
}

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, data }) => teamService.createCalendarEvent(teamId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'calendar'] })
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'availability-dashboard'] })
      toast.success('Calendar event created')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create event')
    },
  })
}

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, eventId, data }) => teamService.updateCalendarEvent(teamId, eventId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'calendar'] })
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'availability-dashboard'] })
      toast.success('Calendar event updated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update event')
    },
  })
}

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, eventId }) => teamService.deleteCalendarEvent(teamId, eventId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'calendar'] })
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'availability-dashboard'] })
      toast.success('Calendar event removed')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete event')
    },
  })
}

export const useSyncTeamCalendar = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId }) => teamService.syncTeamCalendar(teamId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'calendar'] })
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'availability-dashboard'] })
      toast.success(data?.data?.result?.message || 'Calendar synced')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to sync calendar')
    },
  })
}

export const useTeamAvailabilityForecast = (teamId, params = {}) => {
  return useQuery({
    queryKey: ['team', teamId, 'availability-forecast', params],
    queryFn: async () => {
      const response = await teamService.getTeamAvailabilityForecast(teamId, params)
      return response?.data?.forecast || response?.data || []
    },
    enabled: !!teamId,
    staleTime: 60 * 1000,
  })
}

export const useTeamAvailabilityDashboard = (teamId) => {
  return useQuery({
    queryKey: ['team', teamId, 'availability-dashboard'],
    queryFn: async () => {
      const response = await teamService.getTeamAvailabilityDashboard(teamId)
      return response?.data?.dashboard || response?.data || {}
    },
    enabled: !!teamId,
    staleTime: 60 * 1000,
  })
}

