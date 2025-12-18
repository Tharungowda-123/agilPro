import Redis from 'ioredis'
import logger from '../utils/logger.js'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

redis.on('connect', () => {
  logger.info('✓ Redis connected')
})

redis.on('error', (err) => {
  logger.error('Redis connection error:', err)
  // Don't throw - allow app to continue without cache
})

redis.on('ready', () => {
  logger.info('✓ Redis ready')
})

// Connect to Redis (non-blocking)
redis.connect().catch((err) => {
  logger.warn('Redis connection failed, continuing without cache:', err.message)
})

// Utility functions
const cacheUtils = {
  /**
   * Get cached data
   */
  async get(key) {
    try {
      const data = await redis.get(key)
      if (data) {
        return JSON.parse(data)
      }
      return null
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error)
      return null
    }
  },

  /**
   * Set cache with TTL
   */
  async set(key, value, ttlSeconds = 300) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
      return true
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error)
      return false
    }
  },

  /**
   * Delete cache
   */
  async del(key) {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error)
      return false
    }
  },

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
      return keys.length
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error)
      return 0
    }
  },

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      const exists = await redis.exists(key)
      return exists === 1
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  },

  /**
   * Get TTL for key
   */
  async ttl(key) {
    try {
      return await redis.ttl(key)
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error)
      return -1
    }
  },

  /**
   * Increment counter
   */
  async incr(key) {
    try {
      return await redis.incr(key)
    } catch (error) {
      logger.error(`Cache incr error for key ${key}:`, error)
      return 0
    }
  },

  /**
   * Set hash field
   */
  async hset(key, field, value) {
    try {
      await redis.hset(key, field, JSON.stringify(value))
      return true
    } catch (error) {
      logger.error(`Cache hset error for key ${key}:`, error)
      return false
    }
  },

  /**
   * Get hash field
   */
  async hget(key, field) {
    try {
      const data = await redis.hget(key, field)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error(`Cache hget error for key ${key}:`, error)
      return null
    }
  },
}

export { redis, cacheUtils }

