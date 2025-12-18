import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { reportService } from '@/services/api'

export const useReportWidgets = () => {
  return useQuery({
    queryKey: ['report-widgets'],
    queryFn: async () => {
      const response = await reportService.getWidgets()
      return response?.data?.widgets || response?.widgets || []
    },
    staleTime: 60 * 60 * 1000,
  })
}

export const useCustomReports = () => {
  return useQuery({
    queryKey: ['custom-reports'],
    queryFn: async () => {
      const response = await reportService.getReports()
      return response?.data?.reports || response?.reports || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useCustomReport = (id, options = {}) => {
  return useQuery({
    queryKey: ['custom-report', id],
    queryFn: async () => {
      const response = await reportService.getReport(id)
      return response?.data?.report || response?.report
    },
    enabled: !!id,
    ...options,
  })
}

export const useCreateCustomReport = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => reportService.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] })
      toast.success('Report saved successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save report')
    },
  })
}

export const useUpdateCustomReport = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => reportService.updateReport(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] })
      queryClient.invalidateQueries({ queryKey: ['custom-report', variables.id] })
      toast.success('Report updated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update report')
    },
  })
}

export const useDeleteCustomReport = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => reportService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] })
      toast.success('Report deleted')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete report')
    },
  })
}

export const usePreviewCustomReport = () => {
  return useMutation({
    mutationFn: (data) => reportService.previewReport(data),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to preview report')
    },
  })
}

export const useRunCustomReport = () => {
  return useMutation({
    mutationFn: ({ id, data }) => reportService.runReport(id, data),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to run report')
    },
  })
}

export const useReportWidgetDatasets = (widgets = [], filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['report-datasets', JSON.stringify(widgets), JSON.stringify(filters)],
    queryFn: async () => {
      if (!widgets || widgets.length === 0) return []
      const response = await reportService.previewReport({ widgets, filters })
      return response?.data?.datasets || response?.datasets || []
    },
    enabled: Array.isArray(widgets) && widgets.length > 0,
    ...options,
  })
}


