import express from 'express'
import {
  getSprintTemplates,
  createSprintTemplate,
  updateSprintTemplate,
  deleteSprintTemplate,
  setProjectDefaultTemplate,
} from '../controllers/sprintTemplate.controller.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import {
  createSprintTemplateSchema,
  updateSprintTemplateSchema,
  setDefaultTemplateSchema,
} from '../validators/sprintTemplate.validator.js'

const router = express.Router()

router.use(authenticateToken)
router.use(authorizeRoles('manager', 'admin'))

router.get('/', getSprintTemplates)
router.post('/', validate(createSprintTemplateSchema), createSprintTemplate)
router.put('/:id', validate(updateSprintTemplateSchema), updateSprintTemplate)
router.delete('/:id', deleteSprintTemplate)

router.patch(
  '/projects/:projectId/default',
  validate(setDefaultTemplateSchema),
  setProjectDefaultTemplate
)

export default router

