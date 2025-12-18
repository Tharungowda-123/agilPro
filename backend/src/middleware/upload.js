import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import { BadRequestError } from '../utils/errors.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Create thumbnails directory for images
const thumbnailsDir = path.join(__dirname, '../../uploads/thumbnails')
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true })
}

// Allowed file types
const allowedMimeTypes = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain',
  'text/csv',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
]

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB per story/task

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    // Sanitize filename
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_')
    cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`)
  },
})

// File filter
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      new BadRequestError(
        `File type ${file.mimetype} is not allowed. Allowed types: images, PDFs, documents, zip files.`
      ),
      false
    )
  }
}

// Create multer instance for file attachments
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
})

// CSV upload (memory storage)
const csvFileFilter = (req, file, cb) => {
  const mimetype = file.mimetype
  const isCsv =
    mimetype === 'text/csv' ||
    mimetype === 'application/vnd.ms-excel' ||
    file.originalname.toLowerCase().endsWith('.csv')
  if (isCsv) {
    cb(null, true)
  } else {
    cb(new BadRequestError('Only CSV files are allowed'), false)
  }
}

export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
})

// Middleware to check total attachment size
export const checkTotalSize = async (req, res, next) => {
  try {
    const { storyId, taskId } = req.params

    // Get existing attachments
    const { Story, Task } = await import('../models/index.js')
    let entity = null

    if (storyId) {
      entity = await Story.findById(storyId).select('attachments')
    } else if (taskId) {
      entity = await Task.findById(taskId).select('attachments')
    }

    if (!entity) {
      return next()
    }

    // Calculate current total size
    const currentTotalSize = entity.attachments.reduce((sum, att) => sum + (att.size || 0), 0)

    // Calculate new files size
    const newFilesSize = (req.files || []).reduce((sum, file) => sum + file.size, 0)

    // Check if total exceeds limit
    if (currentTotalSize + newFilesSize > MAX_TOTAL_SIZE) {
      return next(
        new BadRequestError(
          `Total attachment size would exceed ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit. Current: ${(currentTotalSize / 1024 / 1024).toFixed(2)}MB, New: ${(newFilesSize / 1024 / 1024).toFixed(2)}MB`
        )
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}

export { MAX_FILE_SIZE, MAX_TOTAL_SIZE }

