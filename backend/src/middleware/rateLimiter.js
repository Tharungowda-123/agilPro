import rateLimit from 'express-rate-limit'
import logger from '../utils/logger.js'

/**
 * Rate Limiting Middleware
 * Different rate limits for different routes
 */

/**
 * General API rate limiter
 * 100 requests per 5 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    })
  },
})

/**
 * Auth routes rate limiter
 * 5 requests per 5 minutes (stricter for security)
 */
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
    })
  },
})

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per hour
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Strict rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    })
  },
})


