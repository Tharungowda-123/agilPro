import { useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { axiosInstance as api } from '@/services/api/axiosConfig'
import Button from '@/components/ui/Button'

/**
 * Export Button Component
 * Exports PI Plan to Excel file
 */
export default function ExportButton({ piId, piName }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!piId) {
      toast.error('PI ID is required')
      return
    }

    try {
      setExporting(true)

      const response = await api.get(`/export/pi/${piId}/excel`, {
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const fileName = `PI_Plan_${piName || 'Export'}_${new Date().toISOString().split('T')[0]}.xlsx`
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('PI Plan exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error.response?.data?.message || 'Failed to export PI Plan')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      variant="primary"
      onClick={handleExport}
      disabled={exporting || !piId}
      loading={exporting}
      leftIcon={<Download className="w-4 h-4" />}
    >
      Export to Excel
    </Button>
  )
}
