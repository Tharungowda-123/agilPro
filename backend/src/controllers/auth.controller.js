import passport from 'passport'
import { User } from '../models/index.js'
import {
  registerUser,
  loginUser,
  generateTokens,
  generatePasswordResetToken,
  resetPassword,
  isTokenBlacklisted,
  blacklistToken,
} from '../services/auth.service.js'
import { cacheUtils } from '../config/redis.js'
import { verifyRefreshToken } from '../config/jwt.js'
import { successResponse, errorResponse } from '../utils/response.js'
import { BadRequestError, UnauthorizedError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Auth Controller
 * HTTP request handlers for authentication
 */

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    // Register user
    const result = await registerUser({ name, email, password })

    return successResponse(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      'User registered successfully',
      201
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    
    logger.info('Login attempt:', { email: email?.toLowerCase() })

    // Login user
    const result = await loginUser(email, password)
    
    logger.info('Login successful:', { userId: result.user._id, email: result.user.email })

    return successResponse(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      'Login successful'
    )
  } catch (error) {
    logger.warn('Login failed:', { email: req.body?.email, error: error.message })
    next(error)
  }
}

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body

    if (!token) {
      throw new BadRequestError('Refresh token is required')
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      throw new UnauthorizedError('Refresh token has been revoked')
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token)

    // Find user
    const user = await User.findById(decoded.id)

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive')
    }

    // Generate new access token
    const tokens = generateTokens(user)

    return successResponse(
      res,
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken, // Optionally issue new refresh token
      },
      'Token refreshed successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN
    const { refreshToken: refreshTokenFromBody } = req.body

    if (token) {
      // Blacklist access token for remaining TTL (assume 15 min tokens)
      await cacheUtils.set(`blacklist:${token}`, true, 900) // 15 minutes
    }

    if (refreshTokenFromBody) {
      // Blacklist refresh token (7 days expiry)
      const expiryTime = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
      blacklistToken(refreshTokenFromBody, expiryTime)
    }

    // Clear user session from cache
    if (req.user && req.user.id) {
      await cacheUtils.del(`session:${req.user.id}`)
    }

    return successResponse(res, null, 'Logout successful')
  } catch (error) {
    next(error)
  }
}

/**
 * Initiate Google OAuth
 * GET /api/auth/google
 */
export const googleAuth = (req, res, next) => {
  try {
    // Check if Google OAuth is configured
    const googleClientID = process.env.GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (
      !googleClientID ||
      !googleClientSecret ||
      googleClientID === 'your_google_client_id' ||
      googleClientSecret === 'your_google_client_secret'
    ) {
      return errorResponse(
        res,
        'Google OAuth is not configured',
        503
      )
    }

    // Use passport authenticate
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    })(req, res, next)
  } catch (error) {
    next(error)
  }
}

/**
 * Handle Google OAuth callback
 * GET /api/auth/google/callback
 */
export const googleCallback = async (req, res, next) => {
  try {
    // Authenticate with Google
    passport.authenticate('google', { session: false }, async (err, user) => {
      if (err) {
        logger.error('Google OAuth error:', err)
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`
        )
      }

      if (!user) {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`
        )
      }

      try {
        // Generate tokens
        const tokens = generateTokens(user)

        // Redirect to frontend with tokens
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
        const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`

        res.redirect(redirectUrl)
      } catch (error) {
        logger.error('Error generating tokens for Google OAuth:', error)
        res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=token_generation_failed`
        )
      }
    })(req, res, next)
  } catch (error) {
    next(error)
  }
}

/**
 * Get current user
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    // User is attached by authenticateToken middleware
    const user = await User.findById(req.user.id).select('-password')

    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    return successResponse(res, { user: user.toJSON() }, 'User retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    // Generate reset token (this will also log/email the token)
    await generatePasswordResetToken(email)

    // Always return success (don't reveal if email exists)
    return successResponse(
      res,
      null,
      'If an account exists with this email, a password reset link has been sent'
    )
  } catch (error) {
    // If it's a NotFoundError, still return success (security best practice)
    if (error.name === 'NotFoundError') {
      return successResponse(
        res,
        null,
        'If an account exists with this email, a password reset link has been sent'
      )
    }
    next(error)
  }
}

/**
 * Reset password
 * POST /api/auth/reset-password
 */
export const resetPasswordHandler = async (req, res, next) => {
  try {
    const { token, password } = req.body

    // Reset password
    await resetPassword(token, password)

    return successResponse(res, null, 'Password reset successfully')
  } catch (error) {
    next(error)
  }
}

