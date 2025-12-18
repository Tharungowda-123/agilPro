import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { featureService } from '@/services/api'
import { axiosInstance } from '@/services/api'

const normalizeFeatures = (response) => {
  if (!response) return []
  return (
    response.features ||
    response.data?.features ||
    response.data ||
    response
  )
}

export const useFeatures = (filters = {}) => {
  return useQuery({
    queryKey: ['features', filters],
    queryFn: async () => {
      const response = await featureService.getFeatures(filters)
      return normalizeFeatures(response)
    },
    staleTime: 2 * 60 * 1000,
  })
}

// Legacy hook for project-specific features
export const useFeaturesByProject = (projectId) => {
  return useQuery({
    queryKey: ['features', projectId],
    queryFn: async () => {
      const response = await featureService.getFeaturesByProject(projectId)
      return normalizeFeatures(response)
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useCreateFeature = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, data }) => {
      // Support both standalone and project-specific creation
      if (projectId) {
        return featureService.createFeatureInProject(projectId, data)
      }
      return featureService.createFeature({ ...data, projectId: data.projectId })
    },
    onSuccess: (response, variables) => {
      toast.success('Feature created successfully')
      const projectId = variables.projectId || variables.data?.projectId
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['features', { project: projectId }] })
        queryClient.invalidateQueries({ queryKey: ['features', projectId] })
      }
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create feature')
    },
  })
}

export const useUpdateFeature = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ featureId, data }) => featureService.updateFeature(featureId, data),
    onSuccess: (response, variables) => {
      toast.success('Feature updated successfully')
      queryClient.invalidateQueries({ queryKey: ['features'] })
      queryClient.invalidateQueries({ queryKey: ['feature', variables.featureId] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update feature')
    },
  })
}

export const useDeleteFeature = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ featureId, deleteChildren = false }) => {
      const url = deleteChildren ? `/features/${featureId}?deleteChildren=true` : `/features/${featureId}`
      return axiosInstance.delete(url).then((res) => res.data)
    },
    onSuccess: () => {
      toast.success('Feature deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete feature')
    },
  })
}

export const useFeature = (featureId) => {
  return useQuery({
    queryKey: ['feature', featureId],
    queryFn: async () => {
      const response = await featureService.getFeature(featureId)
      return response.feature || response.data?.feature || response.data || response
    },
    enabled: !!featureId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useFeatureProgress = (featureId) => {
  return useQuery({
    queryKey: ['feature-progress', featureId],
    queryFn: async () => {
      const response = await featureService.getFeatureProgress(featureId)
      return response.data || response
    },
    enabled: !!featureId,
    staleTime: 30 * 1000, // 30 seconds for progress data
  })
}

export const useAddStoryToFeature = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ featureId, storyId }) => featureService.addStoryToFeature(featureId, storyId),
    onSuccess: (response, variables) => {
      toast.success('Story added to feature successfully')
      queryClient.invalidateQueries({ queryKey: ['feature', variables.featureId] })
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add story to feature')
    },
  })
}

export const useAnalyzeFeature = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ featureId }) => featureService.analyzeFeature(featureId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feature', variables.featureId] })
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to analyze feature')
    },
  })
}

export const useBreakdownFeature = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ featureId }) => featureService.breakDownFeature(featureId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feature', variables.featureId] })
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to break down feature')
    },
  })
}

export const useAcceptBreakdown = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ featureId, storyIds, createAll }) =>
      featureService.acceptBreakdown(featureId, { storyIds, createAll }),
    onSuccess: (response, variables) => {
      const storiesCount = response?.stories?.length || 0
      const tasksCount = response?.tasksCount || 0
      toast.success(`Created ${storiesCount} stories with ${tasksCount} tasks successfully! ⚡`)
      queryClient.invalidateQueries({ queryKey: ['feature', variables.featureId] })
      queryClient.invalidateQueries({ queryKey: ['features'] })
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept breakdown')
    },
  })
}

export const useAutoBreakdownAndCreate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ featureId }) => featureService.autoBreakdownAndCreate(featureId),
    onSuccess: (response, variables) => {
      const storiesCount = response?.stories?.length || 0
      const tasksCount = response?.tasksCount || 0
      toast.success(`Created ${storiesCount} stories and ${tasksCount} tasks in 3 seconds! ⚡`, {
        duration: 5000,
      })
      queryClient.invalidateQueries({ queryKey: ['feature', variables.featureId] })
      queryClient.invalidateQueries({ queryKey: ['features'] })
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to auto-breakdown feature')
    },
  })
}

