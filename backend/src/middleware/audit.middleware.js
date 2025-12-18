import { logUserAction } from '../services/audit.service.js'

/**
 * Audit Middleware
 * Middleware to automatically log certain actions
 */

/**
 * Middleware to log login actions
 */
export const auditLogin = async (req, res, next) => {
  // This will be called after successful authentication
  // The user will be available in req.user
  if (req.user) {
    await logUserAction(req.user, 'login', req.user, {}, req)
  }
  next()
}

/**
 * Middleware to log logout actions
 */
export const auditLogout = async (req, res, next) => {
  if (req.user) {
    await logUserAction(req.user, 'logout', req.user, {}, req)
  }
  next()
}

