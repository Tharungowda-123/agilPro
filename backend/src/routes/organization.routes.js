import express from 'express'
import {
  getOrganization,
  updateOrganization,
  getOrganizationTeams,
} from '../controllers/organization.controller.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = express.Router()

/**
 * Organization Routes
 * All organization management endpoints
 * Note: Only admins can access organization endpoints
 */

// All routes require authentication
router.use(authenticateToken)

// All routes require admin role
router.use(authorizeRoles('admin'))

// GET /api/organization - Get organization details
router.get('/', getOrganization)

// PUT /api/organization - Update organization
router.put('/', updateOrganization)

// GET /api/organization/teams - Get all organization teams
router.get('/teams', getOrganizationTeams)

export default router

