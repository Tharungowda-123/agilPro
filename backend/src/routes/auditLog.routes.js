import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  getAuditLogs,
  getAuditLog,
  getAuditLogStats,
  exportAuditLogsCSV,
} from '../controllers/auditLog.controller.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get audit logs with filtering
router.get('/', getAuditLogs)

// Get audit log by ID
router.get('/:id', getAuditLog)

// Get audit log statistics
router.get('/stats/summary', getAuditLogStats)

// Export audit logs to CSV
router.get('/export/csv', exportAuditLogsCSV)

export default router

