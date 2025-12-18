import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { timeEntryService } from '@/services/api'

/**
 * React Query hooks for time tracking
 */

/**
 * Get active timer
 */
export const useActiveTimer = () => {
  return useQuery({
    queryKey: ['timeEntry', 'active'],
    queryFn: async () => {
      const response = await timeEntryService.getActiveTimer()
      return response?.data?.timeEntry || null
    },
    refetchInterval: 1000, // Refetch every second to update elapsed time
    staleTime: 0,
  })
}

/**
 * Start timer for a task
 */
export const useStartTimer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId) => timeEntryService.startTimer(taskId),
    onSuccess: (data) => {
      queryClient.setQueryData(['timeEntry', 'active'], data?.data?.timeEntry || null)
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      queryClient.invalidateQueries({ queryKey: ['task'] })
      toast.success('Timer started!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start timer')
    },
  })
}

/**
 * Stop timer
 */
export const useStopTimer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (timeEntryId) => timeEntryService.stopTimer(timeEntryId),
    onSuccess: (data) => {
      queryClient.setQueryData(['timeEntry', 'active'], null)
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      queryClient.invalidateQueries({ queryKey: ['task'] })
      toast.success(`Timer stopped! ${data?.data?.timeEntry?.hours?.toFixed(2) || 0} hours logged`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to stop timer')
    },
  })
}

/**
 * Pause timer
 */
export const usePauseTimer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (timeEntryId) => timeEntryService.pauseTimer(timeEntryId),
    onSuccess: () => {
      queryClient.setQueryData(['timeEntry', 'active'], null)
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      toast.success('Timer paused!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to pause timer')
    },
  })
}

/**
 * Resume timer
 */
export const useResumeTimer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (timeEntryId) => timeEntryService.resumeTimer(timeEntryId),
    onSuccess: (data) => {
      queryClient.setQueryData(['timeEntry', 'active'], data?.data?.timeEntry || null)
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      toast.success('Timer resumed!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to resume timer')
    },
  })
}

/**
 * Get time entries for a task
 */
export const useTimeEntriesForTask = (taskId, params = {}) => {
  return useQuery({
    queryKey: ['timeEntries', 'task', taskId, params],
    queryFn: async () => {
      const response = await timeEntryService.getTimeEntriesForTask(taskId, params)
      return response?.data?.data || response?.data || response || []
    },
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000,
  })
}

/**
 * Get time entries for current user
 */
export const useTimeEntries = (params = {}) => {
  return useQuery({
    queryKey: ['timeEntries', params],
    queryFn: async () => {
      const response = await timeEntryService.getTimeEntries(params)
      return response?.data?.data || response?.data || response || []
    },
    staleTime: 1 * 60 * 1000,
  })
}

/**
 * Create manual time entry
 */
export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, ...data }) => timeEntryService.createTimeEntry(taskId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      queryClient.invalidateQueries({ queryKey: ['timeEntries', 'task', variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ['timeTracking', 'summary'] })
      toast.success('Time entry created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create time entry')
    },
  })
}

/**
 * Update time entry
 */
export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }) => timeEntryService.updateTimeEntry(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      queryClient.invalidateQueries({ queryKey: ['timeTracking', 'summary'] })
      toast.success('Time entry updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update time entry')
    },
  })
}

/**
 * Delete time entry
 */
export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => timeEntryService.deleteTimeEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      queryClient.invalidateQueries({ queryKey: ['timeTracking', 'summary'] })
      toast.success('Time entry deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete time entry')
    },
  })
}

/**
 * Get time tracking summary
 */
export const useTimeTrackingSummary = (params = {}) => {
  return useQuery({
    queryKey: ['timeTracking', 'summary', params],
    queryFn: async () => {
      const response = await timeEntryService.getTimeTrackingSummary(params)
      return response?.data?.summary || response?.data || response
    },
    staleTime: 1 * 60 * 1000,
  })
}

