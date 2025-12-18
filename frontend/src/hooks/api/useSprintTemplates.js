import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { sprintTemplateService } from '@/services/api'

export const useSprintTemplates = (projectId, params = {}) => {
  return useQuery({
    queryKey: ['sprint-templates', projectId, params],
    queryFn: async () => {
      const response = await sprintTemplateService.getTemplates({
        projectId,
        ...params,
      })
      const templates = response?.templates || response?.data?.templates || []
      return {
        templates,
        defaultTemplateId: response?.defaultTemplateId,
      }
    },
    enabled: true,
    staleTime: 2 * 60 * 1000,
  })
}

export const useCreateSprintTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => sprintTemplateService.createTemplate(data),
    onSuccess: (response, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['sprint-templates', variables.projectId],
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ['sprint-templates'] })
      }
      toast.success('Sprint template created!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create template')
    },
  })
}

export const useUpdateSprintTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => sprintTemplateService.updateTemplate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-templates'] })
      if (variables?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['sprint-templates', variables.projectId],
        })
      }
      toast.success('Template updated!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update template')
    },
  })
}

export const useDeleteSprintTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }) => sprintTemplateService.deleteTemplate(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-templates'] })
      if (variables?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['sprint-templates', variables.projectId],
        })
      }
      toast.success('Template deleted')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete template')
    },
  })
}

export const useSetDefaultSprintTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, templateId }) =>
      sprintTemplateService.setDefaultTemplate(projectId, templateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sprint-templates', variables.projectId],
      })
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] })
      toast.success(
        variables.templateId
          ? 'Default sprint template updated'
          : 'Default sprint template cleared'
      )
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update default template')
    },
  })
}

