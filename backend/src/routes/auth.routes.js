import express from 'express'
import passport from 'passport'
import {
  register,
  login,
  refreshToken,
  logout,
  googleAuth,
  googleCallback,
  getMe,
  forgotPassword,
  resetPasswordHandler,
} from '../controllers/auth.controller.js'
import { authenticateToken } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js'
import { authLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

/**
 * Auth Routes
 * All authentication endpoints
 */

// Public routes with rate limiting
router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken)
router.post('/logout', logout)
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordHandler)

// Google OAuth routes
router.get('/google', googleAuth)
router.get('/google/callback', googleCallback)

// Protected routes
router.get('/me', authenticateToken, getMe)

export default router

