import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import {
  listCustomReports,
  createCustomReport,
  getCustomReport,
  updateCustomReport,
  deleteCustomReport,
  runCustomReport,
  previewCustomReport,
  getWidgetLibrary,
} from '../controllers/report.controller.js'
import {
  createReportSchema,
  updateReportSchema,
  previewReportSchema,
} from '../validators/report.validator.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/widgets', getWidgetLibrary)
router.get('/custom', listCustomReports)
router.post('/custom', validate(createReportSchema), createCustomReport)
router.post('/custom/preview', validate(previewReportSchema), previewCustomReport)
router.get('/custom/:id', getCustomReport)
router.put('/custom/:id', validate(updateReportSchema), updateCustomReport)
router.delete('/custom/:id', deleteCustomReport)
router.post('/custom/:id/run', runCustomReport)

export default router


