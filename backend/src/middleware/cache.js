import { cacheUtils } from '../config/redis.js'
import logger from '../utils/logger.js'

/**
 * Cache middleware - caches response for specified time
 */
export const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'cache',
    generateKey = null, // Custom key generator
    skipCache = null, // Function to skip caching
  } = options

  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next()
    }

    // Check if we should skip caching
    if (skipCache && skipCache(req)) {
      return next()
    }

    try {
      // Generate cache key
      const cacheKey = generateKey
        ? generateKey(req)
        : `${keyPrefix}:${req.originalUrl}:${JSON.stringify(req.query)}`

      // Check cache
      const cachedData = await cacheUtils.get(cacheKey)

      if (cachedData) {
        logger.debug(`Cache HIT: ${cacheKey}`)
        return res.status(200).json({
          ...cachedData,
          _cached: true,
          _cacheKey: cacheKey,
        })
      }

      logger.debug(`Cache MISS: ${cacheKey}`)

      // Store original res.json
      const originalJson = res.json.bind(res)

      // Override res.json to cache response
      res.json = function (data) {
        // Only cache successful responses
        if (res.statusCode === 200 && !data._cached) {
          cacheUtils.set(cacheKey, data, ttl).catch((err) => {
            logger.error('Failed to cache response:', err)
          })
        }
        return originalJson(data)
      }

      next()
    } catch (error) {
      logger.error('Cache middleware error:', error)
      next() // Continue without caching
    }
  }
}

/**
 * ML Prediction Cache Middleware
 */
export const mlCacheMiddleware = (modelType, ttl = 600) => {
  return async (req, res, next) => {
    try {
      // Generate cache key from request body
      const bodyStr = JSON.stringify(req.body, Object.keys(req.body).sort())
      const bodyHash = require('crypto').createHash('md5').update(bodyStr).digest('hex')
      const cacheKey = `ml:${modelType}:${bodyHash}`

      // Check cache
      const cachedPrediction = await cacheUtils.get(cacheKey)

      if (cachedPrediction) {
        logger.info(`ML Cache HIT: ${modelType}`)
        const ttlValue = await cacheUtils.ttl(cacheKey)
        return res.status(200).json({
          ...cachedPrediction,
          _cached: true,
          _cacheAge: ttlValue,
        })
      }

      logger.info(`ML Cache MISS: ${modelType}`)

      // Store original res.json
      const originalJson = res.json.bind(res)

      // Override res.json to cache prediction
      res.json = function (data) {
        if (res.statusCode === 200 && data.status === 'success' && !data._cached) {
          cacheUtils.set(cacheKey, data, ttl).catch((err) => {
            logger.error('Failed to cache ML prediction:', err)
          })
        }
        return originalJson(data)
      }

      next()
    } catch (error) {
      logger.error('ML cache middleware error:', error)
      next()
    }
  }
}

/**
 * Cache invalidation middleware
 */
export const invalidateCacheMiddleware = (patterns = []) => {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res)

    // Override res.json to invalidate cache after successful mutation
    res.json = async function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate specified cache patterns
        for (const pattern of patterns) {
          const resolvedPattern = typeof pattern === 'function' ? pattern(req) : pattern

          const deletedCount = await cacheUtils.delPattern(resolvedPattern)
          if (deletedCount > 0) {
            logger.debug(`Invalidated ${deletedCount} cache keys matching: ${resolvedPattern}`)
          }
        }
      }
      return originalJson(data)
    }
    next()
  }
}

