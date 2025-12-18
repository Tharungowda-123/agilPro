import { useState } from 'react'
import { Paperclip, Upload, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import attachmentService from '@/services/api/attachmentService'
import FileUpload from './FileUpload'
import FileList from './FileList'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'

/**
 * Attachment Section Component
 * Complete attachment management for stories and tasks
 */
export default function AttachmentSection({
  attachments = [],
  entityType = 'story', // 'story' or 'task'
  entityId,
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUpload, setShowUpload] = useState(false)
  const queryClient = useQueryClient()

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ files }) => {
      setIsUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

      if (entityType === 'story') {
        return await attachmentService.uploadStoryAttachments(
          entityId,
          formData,
          (progress) => setUploadProgress(progress)
        )
      } else {
        return await attachmentService.uploadTaskAttachments(
          entityId,
          formData,
          (progress) => setUploadProgress(progress)
        )
      }
    },
    onSuccess: (data) => {
      toast.success('Files uploaded successfully!')
      setShowUpload(false)
      setIsUploading(false)
      setUploadProgress(0)
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [entityType === 'story' ? 'story' : 'task', entityId] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload files')
      setIsUploading(false)
      setUploadProgress(0)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (attachment) => {
      if (entityType === 'story') {
        return await attachmentService.deleteStoryAttachment(entityId, attachment._id || attachment.id)
      } else {
        return await attachmentService.deleteTaskAttachment(entityId, attachment._id || attachment.id)
      }
    },
    onSuccess: () => {
      toast.success('Attachment deleted successfully!')
      queryClient.invalidateQueries({ queryKey: [entityType === 'story' ? 'story' : 'task', entityId] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete attachment')
    },
  })

  const handleUpload = (files) => {
    uploadMutation.mutate({ files })
  }

  const handleDownload = async (attachment) => {
    try {
      await attachmentService.downloadAttachment(
        entityType === 'story' ? entityId : null,
        entityType === 'task' ? entityId : null,
        attachment._id || attachment.id
      )
    } catch (error) {
      toast.error('Failed to download file')
    }
  }

  const handleDelete = (attachment) => {
    deleteMutation.mutate(attachment)
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
            {attachments && attachments.length > 0 && (
              <span className="text-sm text-gray-500">({attachments.length})</span>
            )}
          </div>
          {!showUpload && (
            <Button
              variant="outlined"
              size="sm"
              onClick={() => setShowUpload(true)}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Upload Files
            </Button>
          )}
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Upload Files</h4>
              <button
                type="button"
                onClick={() => {
                  setShowUpload(false)
                  setIsUploading(false)
                  setUploadProgress(0)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isUploading ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Uploading...</span>
                  <span className="text-gray-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <FileUpload onUpload={handleUpload} maxFiles={10} maxSize={10 * 1024 * 1024} />
            )}
          </div>
        )}

        {/* File List */}
        <FileList
          attachments={attachments}
          onDownload={handleDownload}
          onDelete={handleDelete}
          entityType={entityType}
          entityId={entityId}
        />
      </div>
    </Card>
  )
}

