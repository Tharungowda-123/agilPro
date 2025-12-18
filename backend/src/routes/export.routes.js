import express from 'express'
import exportController from '../controllers/export.controller.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * Export Routes
 * GET /api/export/pi/:piId/excel - Export PI Plan to Excel
 * GET /api/export/template/excel - Download Excel template
 * GET /api/export/dashboard/pdf - Export Dashboard to PDF
 * GET /api/export/projects/excel - Export Projects to Excel
 * GET /api/export/stories/excel - Export Stories to Excel
 * GET /api/export/tasks/excel - Export Tasks to Excel
 * GET /api/export/teams/excel - Export Teams to Excel
 * POST /api/export/custom - Export Custom Report
 * GET /api/export/time-entries/pdf - Export Time Entries to PDF
 * GET /api/export/time-entries/excel - Export Time Entries to Excel
 */
router.get('/pi/:piId/excel', authenticateToken, exportController.exportPIPlan)
router.get('/template/excel', authenticateToken, exportController.downloadTemplate)
router.get('/dashboard/pdf', authenticateToken, exportController.exportDashboardPDF)
router.get('/projects/excel', authenticateToken, exportController.exportProjectsExcel)
router.get('/stories/excel', authenticateToken, exportController.exportStoriesExcel)
router.get('/tasks/excel', authenticateToken, exportController.exportTasksExcel)
router.get('/teams/excel', authenticateToken, exportController.exportTeamsExcel)
router.post('/custom', authenticateToken, exportController.exportCustomReport)
router.get('/time-entries/pdf', authenticateToken, exportController.exportTimeEntriesPDF)
router.get('/time-entries/excel', authenticateToken, exportController.exportTimeEntriesExcel)

export default router
