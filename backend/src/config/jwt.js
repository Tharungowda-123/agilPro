import jwt from 'jsonwebtoken'
import logger from '../utils/logger.js'

/**
 * JWT Configuration
 * Handles token generation and verification
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production'

// Token expiry times (in seconds)
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRY || 15 * 60 // 15 minutes
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || 7 * 24 * 60 * 60 // 7 days

/**
 * Generate access token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    })
  } catch (error) {
    logger.error('Error generating access token:', error)
    throw error
  }
}

/**
 * Generate refresh token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    })
  } catch (error) {
    logger.error('Error generating refresh token:', error)
    throw error
  }
}

/**
 * Verify access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired')
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token')
    }
    throw error
  }
}

/**
 * Alias for verifyToken (for backward compatibility)
 */
export const verifyAccessToken = verifyToken

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET)
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired')
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token')
    }
    throw error
  }
}

export { JWT_SECRET, JWT_REFRESH_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY }


