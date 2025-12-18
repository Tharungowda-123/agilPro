import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Upload, FileDown, AlertTriangle, CheckCircle2, Table } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { useBulkImportPreview, useBulkImportConfirm } from '@/hooks/api/useUsers'
import userService from '@/services/api/userService'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'

export default function BulkUserImportModal({ isOpen, onClose, onComplete }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const previewMutation = useBulkImportPreview()
  const confirmMutation = useBulkImportConfirm()

  useEffect(() => {
    if (!isOpen) {
      setFile(null)
      setPreview(null)
    }
  }, [isOpen])

  const handleDownloadTemplate = async () => {
    try {
      const response = await userService.downloadImportTemplate()
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'user-import-template.csv'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to download template')
    }
  }

  const handlePreview = () => {
    if (!file) {
      toast.error('Please select a CSV file first')
      return
    }
    previewMutation.mutate(file, {
      onSuccess: (response) => {
        const previewData = response?.data?.preview || response?.preview || response
        setPreview(previewData)
      },
    })
  }

  const handleImport = () => {
    if (!preview?.validUsers?.length) {
      toast.error('No valid users to import')
      return
    }
    confirmMutation.mutate(
      { users: preview.validUsers },
      {
        onSuccess: (response) => {
          toast.success(response?.message || 'Users imported successfully')
          onComplete?.(response?.data || response)
          setPreview(null)
          setFile(null)
        },
      }
    )
  }

  const isProcessing = previewMutation.isPending || confirmMutation.isPending
  const validUsers = preview?.validUsers || []
  const errors = preview?.errors || []

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Users" size="lg">
      <div className="space-y-6">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Step 1: Download template</p>
              <p className="text-xs text-gray-500">
                Use the CSV template to ensure proper column order and formatting.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<FileDown className="w-4 h-4" />}
              onClick={handleDownloadTemplate}
            >
              Download CSV
            </Button>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Step 2: Upload CSV</p>
              <p className="text-xs text-gray-500">
                Upload your completed CSV file to preview valid entries and errors.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400">
              <Upload className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {file ? file.name : 'Choose CSV'}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null)
                  setPreview(null)
                }}
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="primary"
              onClick={handlePreview}
              disabled={!file}
              loading={previewMutation.isPending}
            >
              Preview import
            </Button>
            {preview && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  Valid:{' '}
                  <Badge variant="success" size="sm">
                    {preview.validCount || 0}
                  </Badge>
                </span>
                <span>
                  Errors:{' '}
                  <Badge variant="error" size="sm">
                    {preview.invalidCount || 0}
                  </Badge>
                </span>
              </div>
            )}
          </div>

          {preview && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Table className="w-4 h-4 text-primary-500" />
                Preview ({validUsers.length} valid users)
              </div>
              {validUsers.length === 0 ? (
                <Card className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  No valid users found in this CSV file.
                </Card>
              ) : (
                <div className="max-h-60 overflow-auto border border-gray-100 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Role</th>
                        <th className="px-3 py-2 text-left">Team</th>
                        <th className="px-3 py-2 text-left">Availability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validUsers.slice(0, 10).map((user) => (
                        <tr key={`${user.email}-${user.rowNumber}`} className="border-t">
                          <td className="px-3 py-2">{user.name}</td>
                          <td className="px-3 py-2">{user.email}</td>
                          <td className="px-3 py-2 capitalize">{user.role}</td>
                          <td className="px-3 py-2">{user.teamName || '—'}</td>
                          <td className="px-3 py-2">{user.availability ?? 40}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {validUsers.length > 10 && (
                    <p className="text-xs text-gray-500 px-3 py-2">
                      Showing first 10 rows of {validUsers.length}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <AlertTriangle className="w-4 h-4 text-error-500" />
                Detected issues ({errors.length})
              </div>
              <div className="max-h-40 overflow-auto border border-error-100 rounded-lg bg-error-50/30">
                <ul className="text-sm text-error-700 divide-y divide-error-100">
                  {errors.slice(0, 10).map((error, index) => (
                    <li key={`${error.rowNumber}-${index}`} className="px-3 py-2">
                      Row {error.rowNumber}: {error.message}
                    </li>
                  ))}
                </ul>
                {errors.length > 10 && (
                  <p className="text-xs text-error-600 px-3 py-2">
                    Showing first 10 errors of {errors.length}
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {preview ? (
              <span>
                {validUsers.length} user(s) ready to import.{' '}
                {errors.length > 0 && `${errors.length} issue(s) detected.`}
              </span>
            ) : (
              <span>Preview the CSV to continue.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleImport}
              disabled={!preview || validUsers.length === 0}
              loading={confirmMutation.isPending}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Import users
            </Button>
          </div>
        </div>

        {isProcessing && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Spinner size="sm" />
            Processing...
          </div>
        )}
      </div>
    </Modal>
  )
}

BulkUserImportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func,
}


