import { useState } from 'react'
import { Download, Trash2, Image, FileText, Archive, File, Eye, User, Calendar } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { cn } from '@/utils'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * File List Component
 * Displays list of attachments with preview and actions
 */
export default function FileList({
  attachments = [],
  onDownload,
  onDelete,
  entityType = 'story', // 'story' or 'task'
  entityId,
}) {
  const { user } = useAuthStore()
  const [previewImage, setPreviewImage] = useState(null)

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return Image
    if (mimeType === 'application/pdf') return FileText
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return Archive
    return File
  }

  const isImage = (mimeType) => {
    return mimeType.startsWith('image/')
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes'
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date) => {
    if (!date) return 'Unknown'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const canDelete = (attachment) => {
    if (!attachment.uploadedBy) return false
    const uploadedById = attachment.uploadedBy._id || attachment.uploadedBy
    const userId = user?._id || user?.id
    const isUploader = uploadedById.toString() === userId?.toString()
    const isAdmin = user?.role === 'admin'
    const isManager = user?.role === 'manager'
    return isUploader || isAdmin || isManager
  }

  const handlePreview = (attachment) => {
    if (isImage(attachment.mimeType)) {
      setPreviewImage(attachment)
    } else {
      // For non-images, trigger download
      handleDownload(attachment)
    }
  }

  const handleDownload = (attachment) => {
    if (onDownload) {
      onDownload(attachment)
    }
  }

  const handleDelete = (attachment) => {
    if (window.confirm(`Are you sure you want to delete "${attachment.originalName}"?`)) {
      if (onDelete) {
        onDelete(attachment)
      }
    }
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No attachments</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {attachments.map((attachment) => {
          const Icon = getFileIcon(attachment.mimeType)
          const imageUrl = attachment.thumbnail || attachment.url
          const showThumbnail = isImage(attachment.mimeType) && imageUrl

          return (
            <div
              key={attachment._id || attachment.id}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              {/* Thumbnail/Icon */}
              {showThumbnail ? (
                <div
                  className="w-16 h-16 flex-shrink-0 cursor-pointer"
                  onClick={() => handlePreview(attachment)}
                >
                  <img
                    src={imageUrl}
                    alt={attachment.originalName}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded flex-shrink-0">
                  <Icon className="w-8 h-8 text-gray-600" />
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.originalName || attachment.filename}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{formatFileSize(attachment.size)}</span>
                  {attachment.uploadedBy && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>
                          {attachment.uploadedBy.name || attachment.uploadedBy.email || 'Unknown'}
                        </span>
                      </div>
                    </>
                  )}
                  {attachment.uploadedAt && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(attachment.uploadedAt)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {isImage(attachment.mimeType) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreview(attachment)}
                    leftIcon={<Eye className="w-4 h-4" />}
                  >
                    Preview
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download
                </Button>
                {canDelete(attachment) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attachment)}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    className="text-error-600 hover:text-error-700 hover:bg-error-50"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          title={previewImage.originalName || previewImage.filename}
          size="large"
        >
          <div className="flex items-center justify-center">
            <img
              src={previewImage.url}
              alt={previewImage.originalName}
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outlined" onClick={() => handleDownload(previewImage)}>
              Download
            </Button>
            <Button variant="primary" onClick={() => setPreviewImage(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

