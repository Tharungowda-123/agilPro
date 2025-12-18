import bcrypt from 'bcryptjs'
import { User } from '../models/index.js'
import { generateAccessToken, generateRefreshToken } from '../config/jwt.js'
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Auth Service
 * Business logic for authentication
 */

// In-memory token blacklist (use Redis in production)
const tokenBlacklist = new Map()

/**
 * Generate access and refresh tokens for user
 * @param {Object} user - User object
 * @returns {Object} Object containing accessToken and refreshToken
 */
export const generateTokens = (user) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  return {
    accessToken,
    refreshToken,
  }
}

/**
 * Hash password with bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
export const comparePassword = async (password, hash) => {
  if (!password || !hash) {
    logger.error('Password comparison failed: Missing password or hash', {
      hasPassword: !!password,
      hasHash: !!hash,
      hashLength: hash?.length
    })
    return false
  }

  try {
    const result = await bcrypt.compare(password, hash)
    logger.debug('Password comparison result', { 
      match: result,
      hashPrefix: hash.substring(0, 7) // First 7 chars should be $2a$12$
    })
    return result
  } catch (error) {
    logger.error('Password comparison error', { error: error.message })
    return false
  }
}

/**
 * Find or create user from Google profile
 * @param {Object} profile - Google OAuth profile
 * @returns {Promise<Object>} User object
 */
export const findOrCreateGoogleUser = async (profile) => {
  try {
    // Find user by Google ID
    let user = await User.findOne({ googleId: profile.id })

    if (user) {
      // Update last login
      user.lastLogin = new Date()
      await user.save()
      return user
    }

    // Find user by email and link Google account
    user = await User.findOne({ email: profile.emails[0].value })

    if (user) {
      user.googleId = profile.id
      if (!user.avatar && profile.photos[0]?.value) {
        user.avatar = profile.photos[0].value
      }
      user.isEmailVerified = true
      user.lastLogin = new Date()
      await user.save()
      return user
    }

    // Create new user
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      avatar: profile.photos[0]?.value,
      role: 'developer', // Default role
      isEmailVerified: true, // Google emails are verified
      lastLogin: new Date(),
    })

    await user.save()
    logger.info(`New user created via Google OAuth: ${user.email}`)
    return user
  } catch (error) {
    logger.error('Error in findOrCreateGoogleUser:', error)
    throw error
  }
}

/**
 * Add token to blacklist
 * @param {string} token - Token to blacklist
 * @param {number} expiryTime - Expiry time in milliseconds (optional)
 */
export const blacklistToken = (token, expiryTime = null) => {
  if (expiryTime) {
    // Store token with expiry time
    tokenBlacklist.set(token, Date.now() + expiryTime)
    
    // Clean up expired tokens periodically
    setTimeout(() => {
      tokenBlacklist.delete(token)
    }, expiryTime)
  } else {
    // Store token indefinitely (until server restart)
    tokenBlacklist.set(token, true)
  }
}

/**
 * Check if token is blacklisted
 * @param {string} token - Token to check
 * @returns {boolean} True if token is blacklisted
 */
export const isTokenBlacklisted = (token) => {
  const blacklisted = tokenBlacklist.get(token)
  
  if (!blacklisted) {
    return false
  }
  
  // If it's a timestamp, check if it's expired
  if (typeof blacklisted === 'number') {
    if (Date.now() > blacklisted) {
      tokenBlacklist.delete(token)
      return false
    }
  }
  
  return true
}

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User object and tokens
 */
export const registerUser = async (userData) => {
  const { name, email, password } = userData

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    throw new BadRequestError('User with this email already exists')
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create user
  const user = new User({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'developer', // Default role
  })

  await user.save()

  // Generate tokens
  const tokens = generateTokens(user)

  // Update last login
  user.lastLogin = new Date()
  await user.save()

  return {
    user: user.toJSON(),
    ...tokens,
  }
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object and tokens
 */
export const loginUser = async (email, password) => {
  // Find user by email (include password field)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

  if (!user) {
    logger.warn('Login attempt failed: User not found', { email: email.toLowerCase() })
    throw new UnauthorizedError('Invalid email or password')
  }

  // Check if user is active
  if (!user.isActive) {
    logger.warn('Login attempt failed: Account deactivated', { userId: user._id, email: user.email })
    throw new UnauthorizedError('Account is deactivated')
  }

  // Debug: Check if password field exists
  if (!user.password) {
    logger.error('Login attempt failed: User has no password set', { userId: user._id, email: user.email })
    throw new UnauthorizedError('Invalid email or password')
  }

  // Compare password
  logger.debug('Comparing password', { 
    userId: user._id, 
    email: user.email,
    hasPassword: !!user.password,
    passwordLength: user.password?.length,
    passwordStartsWith: user.password?.substring(0, 7) // First 7 chars of hash (should be $2a$12$)
  })
  
  const isPasswordValid = await comparePassword(password, user.password)

  if (!isPasswordValid) {
    logger.warn('Login attempt failed: Invalid password', { userId: user._id, email: user.email })
    throw new UnauthorizedError('Invalid email or password')
  }

  // Generate tokens
  const tokens = generateTokens(user)

  // Update last login
  user.lastLogin = new Date()
  await user.save()

  return {
    user: user.toJSON(),
    ...tokens,
  }
}

/**
 * Generate password reset token
 * @param {string} email - User email
 * @returns {Promise<string>} Reset token
 */
export const generatePasswordResetToken = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) {
    // Don't reveal if user exists or not (security best practice)
    throw new NotFoundError('If an account exists with this email, a password reset link has been sent')
  }

  // Generate reset token (JWT with 1 hour expiry)
  const jwt = await import('jsonwebtoken')
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  const resetToken = jwt.default.sign(
    { id: user._id.toString(), type: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  )

  // In production, store reset token in database with expiry
  // For now, we'll just log it
  logger.info(`Password reset token for ${email}: ${resetToken}`)
  console.log(`\n🔐 Password Reset Token for ${email}:`)
  console.log(`Token: ${resetToken}`)
  console.log(`Reset URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}\n`)

  return resetToken
}

/**
 * Reset password using reset token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success message
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const jwt = await import('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const decoded = jwt.default.verify(token, JWT_SECRET)

    if (decoded.type !== 'password_reset') {
      throw new UnauthorizedError('Invalid reset token')
    }

    const user = await User.findById(decoded.id)

    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    user.password = hashedPassword
    await user.save()

    return { message: 'Password reset successfully' }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Reset token has expired')
    } else if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid reset token')
    }
    throw error
  }
}

