import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import importController from '../controllers/import.controller.js'
import { authenticateToken } from '../middleware/auth.js'
import { authorizeRoles } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

// Configure multer for file upload
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed.'), false)
    }
  },
})

/**
 * Import Routes
 * POST /api/import/excel - Import PI Plan from Excel
 */
router.post(
  '/excel',
  authenticateToken,
  authorizeRoles('admin', 'manager'),
  upload.single('file'),
  importController.importFromExcel
)

export default router

