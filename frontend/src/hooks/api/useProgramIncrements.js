import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { programIncrementService } from '@/services/api'

const normalizePIs = (response) => {
  if (!response) return []
  return response.programIncrements || response.data?.programIncrements || response.data || response
}

export const useProgramIncrements = (projectId, filters = {}) => {
  return useQuery({
    queryKey: ['program-increments', projectId, filters],
    queryFn: async () => {
      const response = await programIncrementService.getProgramIncrements(projectId, filters)
      return normalizePIs(response)
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useProgramIncrement = (piId) => {
  return useQuery({
    queryKey: ['program-increment', piId],
    queryFn: async () => {
      const response = await programIncrementService.getProgramIncrement(piId)
      return response.programIncrement || response.data?.programIncrement || response.data || response
    },
    enabled: !!piId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useCreateProgramIncrement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, data }) => programIncrementService.createProgramIncrement(projectId, data),
    onSuccess: (response, variables) => {
      toast.success('Program Increment created successfully')
      queryClient.invalidateQueries({ queryKey: ['program-increments', variables.projectId] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create Program Increment')
    },
  })
}

export const useUpdateProgramIncrement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ piId, data }) => programIncrementService.updateProgramIncrement(piId, data),
    onSuccess: (response, variables) => {
      toast.success('Program Increment updated successfully')
      queryClient.invalidateQueries({ queryKey: ['program-increment', variables.piId] })
      queryClient.invalidateQueries({ queryKey: ['program-increments'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update Program Increment')
    },
  })
}

export const useDeleteProgramIncrement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ piId }) => programIncrementService.deleteProgramIncrement(piId),
    onSuccess: () => {
      toast.success('Program Increment deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['program-increments'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete Program Increment')
    },
  })
}

export const useOptimizePI = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ piId }) => programIncrementService.optimizePI(piId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['program-increment', variables.piId] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to optimize PI')
    },
  })
}

export const useStartPI = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ piId }) => programIncrementService.startPI(piId),
    onSuccess: (response, variables) => {
      toast.success('Program Increment started successfully')
      queryClient.invalidateQueries({ queryKey: ['program-increment', variables.piId] })
      queryClient.invalidateQueries({ queryKey: ['program-increments'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start Program Increment')
    },
  })
}

export const useCompletePI = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ piId }) => programIncrementService.completePI(piId),
    onSuccess: (response, variables) => {
      toast.success('Program Increment completed successfully')
      queryClient.invalidateQueries({ queryKey: ['program-increment', variables.piId] })
      queryClient.invalidateQueries({ queryKey: ['program-increments'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to complete Program Increment')
    },
  })
}

export const useBreakdownAndAssign = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ piId, featureIds, autoAssign = true }) =>
      programIncrementService.breakdownAndAssign(piId, { featureIds, autoAssign }),
    onSuccess: (response, variables) => {
      toast.success(response.message || 'Features broken down and tasks assigned successfully')
      queryClient.invalidateQueries({ queryKey: ['program-increment', variables.piId] })
      queryClient.invalidateQueries({ queryKey: ['features'] })
      queryClient.invalidateQueries({ queryKey: ['stories'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to break down features and assign tasks')
    },
  })
}

export const useAddFeatureToPI = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ piId, featureId }) => programIncrementService.addFeatureToPI(piId, featureId),
    onSuccess: (response, variables) => {
      toast.success('Feature added to PI successfully')
      queryClient.invalidateQueries({ queryKey: ['program-increment', variables.piId] })
      queryClient.invalidateQueries({ queryKey: ['program-increments'] })
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add feature to PI')
    },
  })
}

export const useAddSprintToPI = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ piId, sprintId }) => programIncrementService.addSprintToPI(piId, sprintId),
    onSuccess: (response, variables) => {
      toast.success('Sprint added to PI successfully')
      queryClient.invalidateQueries({ queryKey: ['program-increment', variables.piId] })
      queryClient.invalidateQueries({ queryKey: ['program-increments'] })
      queryClient.invalidateQueries({ queryKey: ['sprints'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add sprint to PI')
    },
  })
}

export const usePICapacity = (piId) => {
  return useQuery({
    queryKey: ['program-increment', piId, 'capacity'],
    queryFn: async () => {
      const response = await programIncrementService.getPICapacity(piId)
      return response.data || response
    },
    enabled: !!piId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

