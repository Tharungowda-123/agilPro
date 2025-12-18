import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { projectService } from '@/services/api'

/**
 * React Query hooks for projects
 */
export const useProjects = (params = {}) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const response = await projectService.getProjects(params)
      // Backend returns { data: [...], pagination: {...} }
      return response?.data || response
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useProject = (id) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await projectService.getProject(id)
      return response?.data?.project || response?.data || response
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => projectService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create project')
    },
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => projectService.updateProject(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] })
      toast.success('Project updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update project')
    },
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete project')
    },
  })
}

export const useProjectMetrics = (id) => {
  return useQuery({
    queryKey: ['project', id, 'metrics'],
    queryFn: () => projectService.getProjectMetrics(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

