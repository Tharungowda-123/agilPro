import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { taskService } from '@/services/api'

/**
 * React Query hooks for tasks
 */
export const useTasks = (storyId) => {
  return useQuery({
    queryKey: ['tasks', storyId],
    queryFn: async () => {
      const response = await taskService.getTasks(storyId)
      return response?.data?.tasks || response?.data || response || []
    },
    enabled: !!storyId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useTask = (id) => {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await taskService.getTask(id)
      return response?.data?.task || response?.data || response
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ storyId, ...data }) => taskService.createTask(storyId, data),
    onSuccess: (response, variables) => {
      const storyId = variables.storyId || response.data?.story?._id || response.data?.story
      queryClient.invalidateQueries({ queryKey: ['tasks', storyId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create task')
    },
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => taskService.updateTask(id, data),
    onSuccess: (response, variables) => {
      const updatedTask = response?.data?.task || response?.data || response
      
      // Optimistically update the task in cache
      if (updatedTask) {
        queryClient.setQueryData(['task', variables.id], updatedTask)
      }
      
      // Only invalidate related queries (not the task itself since we updated it)
      // Use exact: false to avoid invalidating all dashboard queries
      queryClient.invalidateQueries({ 
        queryKey: ['tasks'],
        exact: false,
        refetchType: 'active' // Only refetch active queries
      })
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard', 'deadlines'],
        exact: true,
        refetchType: 'active'
      })
      
      // If status changed to 'done', invalidate dashboard stats and project queries
      if (variables.data?.status === 'done' || updatedTask?.status === 'done') {
        queryClient.invalidateQueries({ 
          queryKey: ['dashboard', 'stats'],
          exact: true,
          refetchType: 'active'
        })
        
        // Invalidate story queries to update task counts
        if (updatedTask?.story?._id || updatedTask?.storyId) {
          const storyId = updatedTask.story._id || updatedTask.storyId
          queryClient.invalidateQueries({ 
            queryKey: ['stories', storyId],
            exact: true,
            refetchType: 'active'
          })
          queryClient.invalidateQueries({ 
            queryKey: ['stories'],
            exact: false,
            refetchType: 'active'
          })
        }
        
        // Invalidate project queries if story has project
        if (updatedTask?.story?.project?._id || updatedTask?.story?.project) {
          const projectId = updatedTask.story.project._id || updatedTask.story.project
          queryClient.invalidateQueries({ 
            queryKey: ['projects', projectId],
            exact: true,
            refetchType: 'active'
          })
        }
      }
      
      toast.success('Task updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update task')
    },
  })
}

export const useAssignTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, userId }) => taskService.assignTask(id, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'deadlines'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.id, 'recommendations'] })
      toast.success('Task assigned successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign task')
    },
  })
}

export const useTaskRecommendations = (taskId) => {
  return useQuery({
    queryKey: ['task', taskId, 'recommendations'],
    queryFn: async () => {
      const response = await taskService.getAssignmentRecommendations(taskId)
      return response?.data?.recommendations || response?.data || response || []
    },
    enabled: !!taskId,
    staleTime: 30 * 1000, // 30 seconds - refresh more frequently
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })
}

export const useTaskDependencyGraph = (taskId) => {
  return useQuery({
    queryKey: ['task', taskId, 'dependency-graph'],
    queryFn: async () => {
      const response = await taskService.getDependencyGraph(taskId)
      return response?.data?.graph || response?.data || {}
    },
    enabled: !!taskId,
    staleTime: 60 * 1000,
  })
}

export const useTaskDependencyImpact = (taskId) => {
  return useQuery({
    queryKey: ['task', taskId, 'dependency-impact'],
    queryFn: async () => {
      const response = await taskService.getDependencyImpact(taskId)
      return response?.data?.impact || response?.data || {}
    },
    enabled: !!taskId,
    staleTime: 60 * 1000,
  })
}

export const useAddTaskDependency = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, dependencyId }) => taskService.addDependency(taskId, dependencyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId, 'dependency-graph'] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId, 'dependency-impact'] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
      toast.success('Dependency added')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add dependency')
    },
  })
}

export const useRemoveTaskDependency = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, dependencyId }) => taskService.removeDependency(taskId, dependencyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId, 'dependency-graph'] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId, 'dependency-impact'] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
      toast.success('Dependency removed')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove dependency')
    },
  })
}

export const useTaskCommits = (taskId) => {
  return useQuery({
    queryKey: ['task', taskId, 'commits'],
    queryFn: async () => {
      const response = await taskService.getTaskCommits(taskId)
      return response?.data?.commits || response?.data || []
    },
    enabled: !!taskId,
    staleTime: 30 * 1000,
  })
}

export const useLinkTaskCommit = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, data }) => taskService.linkTaskCommit(taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId, 'commits'] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
      toast.success('Commit linked successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to link commit')
    },
  })
}

export const useScanTaskCommits = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, data }) => taskService.scanTaskCommits(taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId, 'commits'] })
      toast.success('Scan completed')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to scan commits')
    },
  })
}

export const useSubmitTaskFeedback = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, data }) => taskService.submitAIRecommendationFeedback(taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId, 'recommendations'] })
      toast.success('Thanks for the feedback!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send feedback')
    },
  })
}

export const useTaskModelStats = () => {
  return useQuery({
    queryKey: ['tasks', 'model-stats'],
    queryFn: async () => {
      const response = await taskService.getTaskModelStats()
      return response?.data?.stats || response?.data || response || {}
    },
    staleTime: 5 * 60 * 1000,
  })
}

