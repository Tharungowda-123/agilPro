import { useState, useRef, useCallback } from 'react'
import { Upload, X, File, Image, FileText, Archive, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/utils'

/**
 * File Upload Component
 * Drag-and-drop file upload with preview
 */
export default function FileUpload({ onUpload, onRemove, maxFiles = 10, maxSize = 10 * 1024 * 1024 }) {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState([])
  const fileInputRef = useRef(null)

  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ]

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return Image
    if (file.type === 'application/pdf') return FileText
    if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) return Archive
    return File
  }

  const validateFile = (file) => {
    const errors = []

    // Check file size
    if (file.size > maxSize) {
      errors.push(`${file.name}: File size exceeds ${formatFileSizeLocal(maxSize)}`)
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`${file.name}: File type not allowed`)
    }

    return errors
  }

  const handleFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles)
    const newErrors = []
    const validFiles = []

    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed`)
      setErrors(newErrors)
      return
    }

    // Validate each file
    fileArray.forEach((file) => {
      const fileErrors = validateFile(file)
      if (fileErrors.length > 0) {
        newErrors.push(...fileErrors)
      } else {
        validFiles.push(file)
      }
    })

    if (newErrors.length > 0) {
      setErrors(newErrors)
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles]
      setFiles(updatedFiles)
      setErrors([])
      if (onUpload) {
        onUpload(validFiles)
      }
    }
  }, [files, maxFiles, maxSize, onUpload])

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
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }

  const handleFileSelect = (e) => {
    const selectedFiles = e.target.files
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = (index) => {
    const updatedFiles = [...files]
    const removed = updatedFiles.splice(index, 1)[0]
    setFiles(updatedFiles)
    if (onRemove) {
      onRemove(removed, index)
    }
  }

  const formatFileSizeLocal = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept={allowedTypes.join(',')}
        />
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-700 mb-2">
          Drag and drop files here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            browse
          </button>
        </p>
        <p className="text-sm text-gray-500">
          Max {maxFiles} files, {formatFileSizeLocal(maxSize)} per file
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Supported: Images, PDFs, Documents, Zip files
        </p>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-error-900 mb-1">Upload Errors:</p>
              <ul className="text-sm text-error-700 list-disc list-inside space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected Files ({files.length})</p>
          <div className="space-y-2">
            {files.map((file, index) => {
              const Icon = getFileIcon(file)
              const isImage = file.type.startsWith('image/')
              const previewUrl = isImage ? URL.createObjectURL(file) : null

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  {isImage && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded">
                      <Icon className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSizeLocal(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-1 text-gray-400 hover:text-error-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

