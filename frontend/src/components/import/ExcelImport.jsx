import { useState } from 'react'
import { Upload, Download, FileSpreadsheet, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { axiosInstance as api } from '@/services/api/axiosConfig'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

/**
 * Excel Import Component
 * Allows users to import PI Plans from Excel files
 */
export default function ExcelImport({ projectId, piId, onImportComplete, autoBreakdown = true, autoAssign = true, autoScheduleSprints = true }) {
  const [file, setFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/export/template/excel', {
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'PI_Plan_Template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Template downloaded')
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error('Failed to download template')
    }
  }

  const handleFileSelect = (selectedFile) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload an Excel file (.xlsx, .xls)')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setResult(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    if (!projectId) {
      toast.error('Project ID is required')
      return
    }

    try {
      setImporting(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)
      if (piId) {
        formData.append('piId', piId)
      }
      formData.append('autoBreakdown', autoBreakdown)
      formData.append('autoAssign', autoAssign)
      formData.append('autoScheduleSprints', autoScheduleSprints)

      const response = await api.post('/import/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setResult(response.data.data)
      const imported = response.data.data.imported || {}
      const breakdown = response.data.data.breakdown || {}
      const sprintScheduling = response.data.data.sprintScheduling || {}
      
      let message = `Imported ${imported.features || 0} features, ${imported.stories || 0} stories, ${imported.tasks || 0} tasks`
      if (imported.tasksAssigned > 0) {
        message += `, ${imported.tasksAssigned} tasks assigned`
      }
      if (sprintScheduling.sprintsCreated > 0) {
        message += `, ${sprintScheduling.sprintsCreated} sprints created`
      }
      if (sprintScheduling.storiesScheduled > 0) {
        message += `, ${sprintScheduling.storiesScheduled} stories scheduled`
      }
      toast.success(message)

      if (onImportComplete) {
        onImportComplete(response.data.data)
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error.response?.data?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Download Template */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">Need a template?</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Download our Excel template with example data and instructions.
            </p>
            <Button
              variant="outlined"
              size="sm"
              onClick={downloadTemplate}
              leftIcon={<Download className="w-4 h-4" />}
              className="mt-3"
            >
              Download Template
            </Button>
          </div>
        </div>
      </Card>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        }`}
      >
        <input
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileInput}
          className="hidden"
          id="excel-file-input"
        />
        <label htmlFor="excel-file-input" className="cursor-pointer">
          <Upload
            className={`w-12 h-12 mx-auto mb-4 ${
              isDragging
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          />
          {file ? (
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <Button
                variant="outlined"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  removeFile()
                }}
                leftIcon={<X className="w-4 h-4" />}
                className="mt-3"
              >
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {isDragging ? 'Drop file here' : 'Drag & drop Excel file here'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                or click to browse (.xlsx, .xls)
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Import Button */}
      {file && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={importing}
            loading={importing}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            {importing ? 'Importing...' : 'Import PI Plan'}
          </Button>
        </div>
      )}

      {/* Import Result */}
      {result && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Import Results
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {result.imported?.features || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Features</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {result.imported?.stories || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stories</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {result.imported?.tasks || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tasks</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {result.imported?.tasksAssigned || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned</p>
            </div>
          </div>
          
          {(result.sprintScheduling?.sprintsCreated > 0 || result.sprintScheduling?.storiesScheduled > 0) && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {result.sprintScheduling.sprintsCreated > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {result.sprintScheduling.sprintsCreated}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sprints Created</p>
                </div>
              )}
              {result.sprintScheduling.storiesScheduled > 0 && (
                <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {result.sprintScheduling.storiesScheduled}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stories Scheduled</p>
                </div>
              )}
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                Errors ({result.errors.length})
              </h4>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 max-h-40 overflow-y-auto bg-red-50 dark:bg-red-900/20 p-3 rounded">
                {result.errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

