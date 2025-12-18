import { Story, Task } from '../models/index.js'
import { logActivity } from '../services/activity.service.js'
import { successResponse } from '../utils/response.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js'
import { generateThumbnail, compressImage, deleteFile, formatFileSize } from '../utils/fileUtils.js'
import logger from '../utils/logger.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Attachment Controller
 * HTTP request handlers for file attachments
 */

/**
 * Upload files to story
 * POST /api/stories/:storyId/attachments
 */
export const uploadStoryAttachments = async (req, res, next) => {
  try {
    const { storyId } = req.params
    const files = req.files || []

    if (!files || files.length === 0) {
      throw new BadRequestError('No files uploaded')
    }

    // Find story
    const story = await Story.findById(storyId)
    if (!story) {
      throw new NotFoundError('Story not found')
    }

    // Process each file
    const attachments = []
    for (const file of files) {
      // Compress image if needed
      const processedPath = await compressImage(file.path, file.mimetype)

      // Generate thumbnail for images
      let thumbnail = null
      if (file.mimetype.startsWith('image/')) {
        thumbnail = await generateThumbnail(processedPath, file.filename)
      }

      // Create attachment object
      const attachment = {
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/${file.filename}`,
        url: `/api/uploads/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: req.user.id,
        thumbnail: thumbnail ? `/api${thumbnail}` : undefined,
      }

      attachments.push(attachment)
    }

    // Add attachments to story
    story.attachments.push(...attachments)
    await story.save()

    // Populate uploadedBy
    await story.populate('attachments.uploadedBy', 'name email avatar')

    // Log activity
    await logActivity(
      'updated',
      'story',
      story._id,
      req.user.id,
      `${attachments.length} file(s) uploaded to story`
    )

    return successResponse(
      res,
      { attachments: story.attachments.slice(-attachments.length) },
      'Files uploaded successfully',
      201
    )
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          const fs = await import('fs')
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path)
          }
        } catch (e) {
          logger.error('Error cleaning up file:', e)
        }
      }
    }
    next(error)
  }
}

/**
 * Upload files to task
 * POST /api/tasks/:taskId/attachments
 */
export const uploadTaskAttachments = async (req, res, next) => {
  try {
    const { taskId } = req.params
    const files = req.files || []

    if (!files || files.length === 0) {
      throw new BadRequestError('No files uploaded')
    }

    // Find task
    const task = await Task.findById(taskId)
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    // Process each file
    const attachments = []
    for (const file of files) {
      // Compress image if needed
      const processedPath = await compressImage(file.path, file.mimetype)

      // Generate thumbnail for images
      let thumbnail = null
      if (file.mimetype.startsWith('image/')) {
        thumbnail = await generateThumbnail(processedPath, file.filename)
      }

      // Create attachment object
      const attachment = {
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/${file.filename}`,
        url: `/api/uploads/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: req.user.id,
        thumbnail: thumbnail ? `/api${thumbnail}` : undefined,
      }

      attachments.push(attachment)
    }

    // Add attachments to task
    task.attachments.push(...attachments)
    await task.save()

    // Populate uploadedBy
    await task.populate('attachments.uploadedBy', 'name email avatar')

    // Log activity
    await logActivity(
      'updated',
      'task',
      task._id,
      req.user.id,
      `${attachments.length} file(s) uploaded to task`
    )

    return successResponse(
      res,
      { attachments: task.attachments.slice(-attachments.length) },
      'Files uploaded successfully',
      201
    )
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          const fs = await import('fs')
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path)
          }
        } catch (e) {
          logger.error('Error cleaning up file:', e)
        }
      }
    }
    next(error)
  }
}

/**
 * Delete attachment from story
 * DELETE /api/stories/:storyId/attachments/:attachmentId
 */
export const deleteStoryAttachment = async (req, res, next) => {
  try {
    const { storyId, attachmentId } = req.params

    // Find story
    const story = await Story.findById(storyId)
    if (!story) {
      throw new NotFoundError('Story not found')
    }

    // Find attachment
    const attachment = story.attachments.id(attachmentId)
    if (!attachment) {
      throw new NotFoundError('Attachment not found')
    }

    // Check permissions (uploader, admin, or manager)
    const isUploader = attachment.uploadedBy.toString() === req.user.id
    const isAdmin = req.user.role === 'admin'
    const isManager = req.user.role === 'manager'

    if (!isUploader && !isAdmin && !isManager) {
      throw new ForbiddenError('You can only delete your own attachments or must be admin/manager')
    }

    // Delete file from filesystem
    await deleteFile(attachment.path)
    if (attachment.thumbnail) {
      await deleteFile(attachment.thumbnail)
    }

    // Remove attachment from story
    story.attachments.pull(attachmentId)
    await story.save()

    // Log activity
    await logActivity(
      'updated',
      'story',
      story._id,
      req.user.id,
      `Attachment "${attachment.originalName}" deleted`
    )

    return successResponse(res, null, 'Attachment deleted successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Delete attachment from task
 * DELETE /api/tasks/:taskId/attachments/:attachmentId
 */
export const deleteTaskAttachment = async (req, res, next) => {
  try {
    const { taskId, attachmentId } = req.params

    // Find task
    const task = await Task.findById(taskId)
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    // Find attachment
    const attachment = task.attachments.id(attachmentId)
    if (!attachment) {
      throw new NotFoundError('Attachment not found')
    }

    // Check permissions (uploader, admin, or manager)
    const isUploader = attachment.uploadedBy.toString() === req.user.id
    const isAdmin = req.user.role === 'admin'
    const isManager = req.user.role === 'manager'

    if (!isUploader && !isAdmin && !isManager) {
      throw new ForbiddenError('You can only delete your own attachments or must be admin/manager')
    }

    // Delete file from filesystem
    await deleteFile(attachment.path)
    if (attachment.thumbnail) {
      await deleteFile(attachment.thumbnail)
    }

    // Remove attachment from task
    task.attachments.pull(attachmentId)
    await task.save()

    // Log activity
    await logActivity(
      'updated',
      'task',
      task._id,
      req.user.id,
      `Attachment "${attachment.originalName}" deleted`
    )

    return successResponse(res, null, 'Attachment deleted successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Download attachment
 * GET /api/stories/:storyId/attachments/:attachmentId/download
 * GET /api/tasks/:taskId/attachments/:attachmentId/download
 */
export const downloadAttachment = async (req, res, next) => {
  try {
    const { storyId, taskId, attachmentId } = req.params

    let entity = null
    if (storyId) {
      entity = await Story.findById(storyId)
    } else if (taskId) {
      entity = await Task.findById(taskId)
    }

    if (!entity) {
      throw new NotFoundError('Story or Task not found')
    }

    // Find attachment
    const attachment = entity.attachments.id(attachmentId)
    if (!attachment) {
      throw new NotFoundError('Attachment not found')
    }

    // Get file path
    const fs = await import('fs')
    const filePath = path.join(__dirname, '../../', attachment.path)

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError('File not found on server')
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`)
    res.setHeader('Content-Type', attachment.mimeType)

    // Send file
    return res.sendFile(path.resolve(filePath))
  } catch (error) {
    next(error)
  }
}

