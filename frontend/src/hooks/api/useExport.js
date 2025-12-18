import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import exportService, { downloadBlob } from '@/services/api/exportService'

/**
 * Export hooks for PDF and Excel generation
 */

/**
 * Export dashboard to PDF
 */
export const useExportDashboardPDF = () => {
  return useMutation({
    mutationFn: async (params = {}) => {
      const blob = await exportService.exportDashboardPDF(params)
      const filename = `dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`
      downloadBlob(blob, filename)
      return blob
    },
    onSuccess: () => {
      toast.success('Dashboard exported to PDF successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export dashboard')
    },
  })
}

/**
 * Export projects to Excel
 */
export const useExportProjectsExcel = () => {
  return useMutation({
    mutationFn: async () => {
      const blob = await exportService.exportProjectsExcel()
      const filename = `projects-export-${new Date().toISOString().split('T')[0]}.xlsx`
      downloadBlob(blob, filename)
      return blob
    },
    onSuccess: () => {
      toast.success('Projects exported to Excel successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export projects')
    },
  })
}

/**
 * Export stories to Excel
 */
export const useExportStoriesExcel = () => {
  return useMutation({
    mutationFn: async (params = {}) => {
      const blob = await exportService.exportStoriesExcel(params)
      const filename = `stories-export-${new Date().toISOString().split('T')[0]}.xlsx`
      downloadBlob(blob, filename)
      return blob
    },
    onSuccess: () => {
      toast.success('Stories exported to Excel successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export stories')
    },
  })
}

/**
 * Export tasks to Excel
 */
export const useExportTasksExcel = () => {
  return useMutation({
    mutationFn: async (params = {}) => {
      const blob = await exportService.exportTasksExcel(params)
      const filename = `tasks-export-${new Date().toISOString().split('T')[0]}.xlsx`
      downloadBlob(blob, filename)
      return blob
    },
    onSuccess: () => {
      toast.success('Tasks exported to Excel successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export tasks')
    },
  })
}

/**
 * Export teams to Excel
 */
export const useExportTeamsExcel = () => {
  return useMutation({
    mutationFn: async () => {
      const blob = await exportService.exportTeamsExcel()
      const filename = `teams-export-${new Date().toISOString().split('T')[0]}.xlsx`
      downloadBlob(blob, filename)
      return blob
    },
    onSuccess: () => {
      toast.success('Teams exported to Excel successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export teams')
    },
  })
}

/**
 * Export custom report
 */
export const useExportCustomReport = () => {
  return useMutation({
    mutationFn: async (data) => {
      const blob = await exportService.exportCustomReport(data)
      const extension = data.format === 'pdf' ? 'pdf' : 'xlsx'
      const filename = `custom-report-${new Date().toISOString().split('T')[0]}.${extension}`
      downloadBlob(blob, filename)
      return blob
    },
    onSuccess: () => {
      toast.success('Custom report exported successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export custom report')
    },
  })
}

export const useExportTimeEntriesPDF = () => {
  return useMutation({
    mutationFn: async (params = {}) => {
      const blob = await exportService.exportTimeEntriesPDF(params)
      const filename = `time-entries-${params.dateFrom || 'start'}-${params.dateTo || 'end'}.pdf`
      downloadBlob(blob, filename)
      return blob
    },
    onSuccess: () => {
      toast.success('Time entries exported to PDF successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export time entries PDF')
    },
  })
}

export const useExportTimeEntriesExcel = () => {
  return useMutation({
    mutationFn: async (params = {}) => {
      const blob = await exportService.exportTimeEntriesExcel(params)
      const filename = `time-entries-${params.dateFrom || 'start'}-${params.dateTo || 'end'}.xlsx`
      downloadBlob(blob, filename)
      return blob
    },
    onSuccess: () => {
      toast.success('Time entries exported to Excel successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export time entries Excel')
    },
  })
}

