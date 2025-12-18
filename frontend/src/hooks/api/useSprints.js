import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { sprintService } from '@/services/api'

/**
 * React Query hooks for sprints
 */
export const useSprints = (projectId) => {
  return useQuery({
    queryKey: ['sprints', projectId || 'all'],
    queryFn: async () => {
      const response = await sprintService.getSprints(projectId || undefined)
      // Backend returns { data: { sprints: [...], pagination: {...} } } or { sprints: [...] }
      return response?.data?.sprints || response?.data?.data || response?.data || response || []
    },
    staleTime: 2 * 60 * 1000,
  })
}

export const useSprint = (id) => {
  return useQuery({
    queryKey: ['sprint', id],
    queryFn: async () => {
      const response = await sprintService.getSprint(id)
      return response?.data?.sprint || response?.data || response
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export const useCreateSprint = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, ...data }) => sprintService.createSprint(projectId, data),
    onSuccess: (response, variables) => {
      const projectId = variables.projectId || response.data?.project?._id || response.data?.project
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] })
      queryClient.invalidateQueries({ queryKey: ['sprints'] })
      toast.success('Sprint created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create sprint')
    },
  })
}

export const useUpdateSprint = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => sprintService.updateSprint(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] })
      queryClient.invalidateQueries({ queryKey: ['sprint', variables.id] })
      toast.success('Sprint updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update sprint')
    },
  })
}

export const useStartSprint = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => sprintService.startSprint(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] })
      queryClient.invalidateQueries({ queryKey: ['sprint', id] })
      toast.success('Sprint started!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start sprint')
    },
  })
}

export const useCompleteSprint = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => sprintService.completeSprint(id),
    onSuccess: (response, id) => {
      const sprint = response?.data?.sprint || response?.data || response
      const projectId = sprint?.project?._id || sprint?.project?.toString() || sprint?.project
      
      // Update sprint in cache immediately
      if (sprint && id) {
        queryClient.setQueryData(['sprint', id], sprint)
      }
      
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['sprints'] })
      queryClient.invalidateQueries({ queryKey: ['sprint', id] })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['sprints', projectId] })
        queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      toast.success('Sprint completed!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to complete sprint')
    },
  })
}

export const useSprintBurndown = (id) => {
  return useQuery({
    queryKey: ['sprint', id, 'burndown'],
    queryFn: () => sprintService.getSprintBurndown(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================
// RETROSPECTIVE HOOKS
// ============================================

export const useSaveRetrospective = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => sprintService.saveRetrospective(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprint', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['sprints'] })
      toast.success('Retrospective saved successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save retrospective')
    },
  })
}

export const useUpdateActionItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, itemId, completed }) => sprintService.updateActionItem(id, itemId, completed),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprint', variables.id] })
      toast.success('Action item updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update action item')
    },
  })
}

export const usePastRetrospectives = (projectId, params = {}) => {
  return useQuery({
    queryKey: ['retrospectives', projectId, params],
    queryFn: async () => {
      const response = await sprintService.getPastRetrospectives(projectId, params)
      return response?.data?.retrospectives || response?.data || response || []
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  })
}

export const useAssignStoriesToSprint = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sprintId, storyIds }) => sprintService.assignStories(sprintId, storyIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprint', variables.sprintId] })
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: ['stories', variables.projectId] })
      }
      toast.success('Stories added to sprint')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign stories')
    },
  })
}

export const useSprintAIPlan = () => {
  return useMutation({
    mutationFn: ({ sprintId, data = {} }) => sprintService.optimizeSprintPlan(sprintId, data),
  })
}

export const useSprintVelocityForecast = () => {
  return useMutation({
    mutationFn: ({ sprintId, data = {} }) => sprintService.predictSprintVelocity(sprintId, data),
  })
}

export const useSprintStorySuggestions = () => {
  return useMutation({
    mutationFn: ({ sprintId, data = {} }) => sprintService.suggestSprintStories(sprintId, data),
  })
}

export const useSprintSimulation = () => {
  return useMutation({
    mutationFn: ({ sprintId, data = {} }) => sprintService.simulateSprintOutcome(sprintId, data),
  })
}

export const useSprintCompletionPrediction = () => {
  return useMutation({
    mutationFn: ({ sprintId, data = {} }) => sprintService.predictSprintCompletion(sprintId, data),
  })
}

export const useAutoGenerateSprintPlan = () => {
  return useMutation({
    mutationFn: (sprintId) => sprintService.autoGeneratePlan(sprintId),
  })
}

export const useAcceptGeneratedPlan = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sprintId, generatedPlan }) => sprintService.acceptGeneratedPlan(sprintId, generatedPlan),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprint', variables.sprintId] })
      queryClient.invalidateQueries({ queryKey: ['sprints'] })
      const message = response?.data?.message || response?.message || 'Sprint plan created successfully!'
      toast.success(message)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept generated plan')
    },
  })
}

