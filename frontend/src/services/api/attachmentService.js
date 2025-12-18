import axiosInstance from './axiosConfig'

/**
 * Attachment Service
 * API calls for file attachments
 */

const attachmentService = {
  /**
   * Upload files to story
   * @param {string} storyId - Story ID
   * @param {FormData} formData - FormData with files
   * @param {Function} onUploadProgress - Progress callback
   * @returns {Promise} Upload response
   */
  uploadStoryAttachments: async (storyId, formData, onUploadProgress) => {
    const response = await axiosInstance.post(
      `/stories/${storyId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onUploadProgress(percentCompleted)
          }
        },
      }
    )
    return response.data
  },

  /**
   * Upload files to task
   * @param {string} taskId - Task ID
   * @param {FormData} formData - FormData with files
   * @param {Function} onUploadProgress - Progress callback
   * @returns {Promise} Upload response
   */
  uploadTaskAttachments: async (taskId, formData, onUploadProgress) => {
    const response = await axiosInstance.post(
      `/tasks/${taskId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onUploadProgress(percentCompleted)
          }
        },
      }
    )
    return response.data
  },

  /**
   * Delete attachment from story
   * @param {string} storyId - Story ID
   * @param {string} attachmentId - Attachment ID
   * @returns {Promise} Delete response
   */
  deleteStoryAttachment: async (storyId, attachmentId) => {
    const response = await axiosInstance.delete(
      `/stories/${storyId}/attachments/${attachmentId}`
    )
    return response.data
  },

  /**
   * Delete attachment from task
   * @param {string} taskId - Task ID
   * @param {string} attachmentId - Attachment ID
   * @returns {Promise} Delete response
   */
  deleteTaskAttachment: async (taskId, attachmentId) => {
    const response = await axiosInstance.delete(
      `/tasks/${taskId}/attachments/${attachmentId}`
    )
    return response.data
  },

  /**
   * Download attachment
   * @param {string} storyId - Story ID (optional)
   * @param {string} taskId - Task ID (optional)
   * @param {string} attachmentId - Attachment ID
   * @returns {Promise} Download response
   */
  downloadAttachment: async (storyId, taskId, attachmentId) => {
    const url = storyId
      ? `/stories/${storyId}/attachments/${attachmentId}/download`
      : `/tasks/${taskId}/attachments/${attachmentId}/download`
    
    const response = await axiosInstance.get(url, {
      responseType: 'blob',
    })
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data])
    const url_blob = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url_blob
    link.download = attachmentId // You might want to get filename from headers
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url_blob)
    
    return response.data
  },
}

export default attachmentService

