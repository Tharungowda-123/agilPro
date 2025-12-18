import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import auditLogService from '@/services/api/auditLogService'
import { downloadBlob } from '@/services/api/exportService'

/**
 * Audit Log hooks
 */

/**
 * Get audit logs with filtering
 */
export const useAuditLogs = (params = {}) => {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: () => auditLogService.getAuditLogs(params),
    enabled: true,
  })
}

/**
 * Get audit log by ID
 */
export const useAuditLog = (id) => {
  return useQuery({
    queryKey: ['auditLog', id],
    queryFn: () => auditLogService.getAuditLog(id),
    enabled: !!id,
  })
}

/**
 * Get audit log statistics
 */
export const useAuditLogStats = (params = {}) => {
  return useQuery({
    queryKey: ['auditLogStats', params],
    queryFn: () => auditLogService.getAuditLogStats(params),
  })
}

/**
 * Export audit logs to CSV
 */
export const useExportAuditLogsCSV = () => {
  return useMutation({
    mutationFn: async (params = {}) => {
      const blob = await auditLogService.exportAuditLogsCSV(params)
      const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      downloadBlob(blob, filename)
      return blob
    },
    onSuccess: () => {
      toast.success('Audit logs exported to CSV successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export audit logs')
    },
  })
}

