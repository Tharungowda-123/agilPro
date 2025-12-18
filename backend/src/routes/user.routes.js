import express from 'express'
import {
  getUsers,
  getUser,
  updateUser,
  addSkills,
  removeSkill,
  getUserPerformance,
  getUserWorkload,
  updateAvailability,
  createUser,
  adminUpdateUser,
  resetUserPassword,
  deactivateUser,
  activateUser,
  assignUserToTeam,
  bulkUserAction,
  getUserActivity,
  addCapacityAdjustment,
  removeCapacityAdjustment,
  downloadUserImportTemplate,
  previewUserImport,
  confirmUserImport,
} from '../controllers/user.controller.js'
import {
  getDeveloperWorkloadHandler,
  getHistoricalWorkloadHandler,
  getSuggestedTasksHandler,
} from '../controllers/workload.controller.js'
import {
  getEmailPreferences,
  updateEmailPreferences,
  unsubscribeFromEmails,
} from '../controllers/emailPreferences.controller.js'
import { getUserActivities } from '../controllers/activity.controller.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { uploadCsv } from '../middleware/upload.js'
import { validate, validateQuery } from '../middleware/validation.js'
import {
  updateUserSchema,
  addSkillsSchema,
  updateAvailabilitySchema,
  userQuerySchema,
  createUserSchema,
  adminUpdateUserSchema,
  resetPasswordSchema,
  assignTeamSchema,
  bulkActionSchema,
  capacityAdjustmentSchema,
  bulkImportConfirmSchema,
} from '../validators/user.validator.js'

const router = express.Router()

/**
 * User Routes
 * All user management endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// GET /api/users - List users with filters
router.get('/', validateQuery(userQuerySchema), getUsers)

// GET /api/users/:userId/activities - Get user activities (must be before /:id)
router.get('/:userId/activities', getUserActivities)

// GET /api/users/:id - Get single user
router.get('/:id', getUser)

// PUT /api/users/:id - Update user profile
router.put('/:id', validate(updateUserSchema), updateUser)

// POST /api/users/:id/skills - Add skills
router.post('/:id/skills', validate(addSkillsSchema), addSkills)

// DELETE /api/users/:id/skills/:skill - Remove skill
router.delete('/:id/skills/:skill', removeSkill)

// GET /api/users/:id/performance - Get user performance
router.get('/:id/performance', getUserPerformance)

// GET /api/users/:id/workload - Get user workload
router.get('/:id/workload', getUserWorkload)

// GET /api/users/:id/workload/detailed - Get detailed developer workload
router.get('/:id/workload/detailed', getDeveloperWorkloadHandler)

// GET /api/users/:id/workload/history - Get historical workload
router.get('/:id/workload/history', getHistoricalWorkloadHandler)

// GET /api/users/:id/workload/suggestions - Get suggested tasks
router.get('/:id/workload/suggestions', getSuggestedTasksHandler)

// Email preferences routes
// GET /api/users/:id/email-preferences - Get email preferences
router.get('/:id/email-preferences', getEmailPreferences)

// PUT /api/users/:id/email-preferences - Update email preferences
router.put('/:id/email-preferences', updateEmailPreferences)

// PUT /api/users/:id/availability - Update availability
router.put('/:id/availability', validate(updateAvailabilitySchema), updateAvailability)

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

// POST /api/users/unsubscribe/:token - Unsubscribe from emails (public)
router.post('/unsubscribe/:token', unsubscribeFromEmails)

// ============================================
// ADMIN-ONLY ROUTES
// ============================================

// POST /api/users/admin/create - Create new user (admin only)
router.post(
  '/admin/create',
  authorizeRoles('admin'),
  validate(createUserSchema),
  createUser
)

// PUT /api/users/admin/:id - Update user (admin only)
router.put(
  '/admin/:id',
  authorizeRoles('admin'),
  validate(adminUpdateUserSchema),
  adminUpdateUser
)

// POST /api/users/admin/:id/reset-password - Reset user password (admin only)
router.post(
  '/admin/:id/reset-password',
  authorizeRoles('admin'),
  validate(resetPasswordSchema),
  resetUserPassword
)

// POST /api/users/admin/:id/deactivate - Deactivate user (admin only)
router.post('/admin/:id/deactivate', authorizeRoles('admin'), deactivateUser)

// POST /api/users/admin/:id/activate - Activate user (admin only)
router.post('/admin/:id/activate', authorizeRoles('admin'), activateUser)

// POST /api/users/admin/:id/assign-team - Assign user to team (admin only)
router.post(
  '/admin/:id/assign-team',
  authorizeRoles('admin'),
  validate(assignTeamSchema),
  assignUserToTeam
)

// POST /api/users/admin/bulk-action - Bulk user actions (admin only)
router.post(
  '/admin/bulk-action',
  authorizeRoles('admin'),
  validate(bulkActionSchema),
  bulkUserAction
)

router.get('/admin/import/template', authorizeRoles('admin'), downloadUserImportTemplate)
router.post(
  '/admin/import/preview',
  authorizeRoles('admin'),
  uploadCsv.single('file'),
  previewUserImport
)
router.post(
  '/admin/import/confirm',
  authorizeRoles('admin'),
  validate(bulkImportConfirmSchema),
  confirmUserImport
)

// GET /api/users/admin/:id/activity - Get user activity (admin only)
router.get('/admin/:id/activity', authorizeRoles('admin'), getUserActivity)

// POST /api/users/:id/capacity-adjustment - Add capacity adjustment (manager/admin only)
router.post(
  '/:id/capacity-adjustment',
  authorizeRoles('admin', 'manager'),
  validate(capacityAdjustmentSchema),
  addCapacityAdjustment
)

// DELETE /api/users/:id/capacity-adjustment/:adjustmentId - Remove capacity adjustment (manager/admin only)
router.delete(
  '/:id/capacity-adjustment/:adjustmentId',
  authorizeRoles('admin', 'manager'),
  removeCapacityAdjustment
)

export default router

