import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { storyService } from '@/services/api'

/**
 * React Query hooks for user stories
 */
export const useStories = (projectId, params = {}) => {
  const isEnabled = !!projectId
  
  return useQuery({
    queryKey: ['stories', projectId, params],
    queryFn: async () => {
      const response = await storyService.getStories(projectId, params)
      return response?.data?.data || response?.data?.stories || response?.data || response || []
    },
    enabled: isEnabled,
    staleTime: 2 * 60 * 1000,
  })
}

export const useStory = (id) => {
  return useQuery({
    queryKey: ['story', id],
    queryFn: async () => {
      const response = await storyService.getStory(id)
      return response?.data?.story || response?.data || response
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export const useCreateStory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, featureId, type = 'project', ...data }) => {
      const id = type === 'feature' ? featureId : projectId
      return storyService.createStory(id, data, type)
    },
    onSuccess: (response, variables) => {
      const projectId = variables.projectId || response.data?.project?._id || response.data?.project
      queryClient.invalidateQueries({ queryKey: ['stories', projectId] })
      queryClient.invalidateQueries({ queryKey: ['stories'] })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      }
      toast.success('Story created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create story')
    },
  })
}

export const useUpdateStory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => storyService.updateStory(id, data),
    onSuccess: (response, variables) => {
      const updatedStory = response?.data?.story || response?.data || response
      const storyId = variables.id
      
      // Optimistically update the story in cache
      if (updatedStory) {
        queryClient.setQueryData(['story', storyId], updatedStory)
      }
      
      // Invalidate all story-related queries to ensure board and all pages refresh
      queryClient.invalidateQueries({ queryKey: ['stories'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['story', storyId] })
      
      // If status changed to 'done', invalidate additional queries
      const newStatus = variables.data?.status || updatedStory?.status
      const oldStatus = queryClient.getQueryData(['story', storyId])?.status
      
      if (newStatus === 'done' || (newStatus === 'done' && oldStatus !== 'done')) {
        // Invalidate dashboard queries
        queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false })
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'deadlines'] })
        
        // Invalidate project queries
        const projectId = updatedStory?.project?._id || updatedStory?.project || updatedStory?.projectId
        if (projectId) {
          queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
          queryClient.invalidateQueries({ queryKey: ['projects'], exact: false })
        }
        
        // Invalidate sprint queries if story is in a sprint
        const sprintId = updatedStory?.sprint?._id || updatedStory?.sprint || updatedStory?.sprintId
        if (sprintId) {
          queryClient.invalidateQueries({ queryKey: ['sprints', sprintId] })
          queryClient.invalidateQueries({ queryKey: ['sprints'], exact: false })
        }
      }
      
      toast.success('Story updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update story')
    },
  })
}

export const useDeleteStory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => storyService.deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
      toast.success('Story deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete story')
    },
  })
}

export const useAnalyzeStory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => storyService.analyzeStory(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['story', id] })
      queryClient.invalidateQueries({ queryKey: ['stories'] })
      toast.success('Story analyzed with AI')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to analyze story')
    },
  })
}

export const useEstimateComplexity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => storyService.estimateStoryPoints(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['story', id] })
      queryClient.invalidateQueries({ queryKey: ['stories'] })
      toast.success('Story points estimated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to estimate story points')
    },
  })
}

export const useSimilarStories = (id) => {
  return useQuery({
    queryKey: ['story', id, 'similar'],
    queryFn: async () => {
      const response = await storyService.findSimilarStories(id)
      return response?.data?.similarStories || response?.data || response || []
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}
