import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import logger from './logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * File Utilities
 * Helper functions for file operations
 */

/**
 * Generate thumbnail for image
 * @param {string} filePath - Path to original image
 * @param {string} filename - Original filename
 * @returns {Promise<string>} Thumbnail path
 */
export const generateThumbnail = async (filePath, filename) => {
  try {
    const thumbnailsDir = path.join(__dirname, '../../uploads/thumbnails')
    const ext = path.extname(filename)
    const name = path.basename(filename, ext)
    const thumbnailPath = path.join(thumbnailsDir, `thumb_${name}${ext}`)

    // Generate thumbnail (max 200x200)
    await sharp(filePath)
      .resize(200, 200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath)

    // Return relative path for URL
    return `/uploads/thumbnails/thumb_${name}${ext}`
  } catch (error) {
    logger.error('Error generating thumbnail:', error)
    return null
  }
}

/**
 * Compress image if it's an image file
 * @param {string} filePath - Path to file
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} Path to compressed file (or original if not image)
 */
export const compressImage = async (filePath, mimeType) => {
  try {
    // Only compress images
    if (!mimeType.startsWith('image/')) {
      return filePath
    }

    // Skip if already compressed or too small
    const stats = fs.statSync(filePath)
    if (stats.size < 500 * 1024) {
      // Less than 500KB, skip compression
      return filePath
    }

    const ext = path.extname(filePath)
    const compressedPath = filePath.replace(ext, `_compressed${ext}`)

    // Compress image
    await sharp(filePath)
      .jpeg({ quality: 85 })
      .png({ quality: 85 })
      .toFile(compressedPath)

    // Replace original with compressed
    fs.unlinkSync(filePath)
    fs.renameSync(compressedPath, filePath)

    return filePath
  } catch (error) {
    logger.error('Error compressing image:', error)
    return filePath // Return original if compression fails
  }
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get file icon based on MIME type
 * @param {string} mimeType - File MIME type
 * @returns {string} Icon name
 */
export const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'file-text'
  if (mimeType.includes('word')) return 'file-text'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-text'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-text'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive'
  return 'file'
}

/**
 * Check if file is an image
 * @param {string} mimeType - File MIME type
 * @returns {boolean}
 */
export const isImage = (mimeType) => {
  return mimeType.startsWith('image/')
}

/**
 * Delete file from filesystem
 * @param {string} filePath - Path to file
 * @returns {Promise<void>}
 */
export const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '../../', filePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  } catch (error) {
    logger.error('Error deleting file:', error)
    throw error
  }
}

