import express from 'express'
import { redis, cacheUtils } from '../config/redis.js'
import { authenticateToken } from '../middleware/auth.js'
import { authorizeRoles } from '../middleware/auth.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * Cache Management Routes
 * Admin-only endpoints for cache statistics and management
 */

// Get cache statistics (admin only)
router.get('/stats', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const info = await redis.info('stats')
    const dbsize = await redis.dbsize()
    const keys = await redis.keys('*')

    // Parse info string
    const stats = {}
    info.split('\r\n').forEach((line) => {
      const [key, value] = line.split(':')
      if (key && value) {
        stats[key] = value
      }
    })

    // Count keys by prefix
    const keysByPrefix = {}
    keys.forEach((key) => {
      const prefix = key.split(':')[0]
      keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1
    })

    // Calculate hit rate
    const hits = parseInt(stats.keyspace_hits || '0', 10)
    const misses = parseInt(stats.keyspace_misses || '0', 10)
    const total = hits + misses
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : '0%'

    res.status(200).json({
      status: 'success',
      data: {
        totalKeys: dbsize,
        keysByPrefix,
        hitRate,
        hits,
        misses,
        stats,
      },
    })
  } catch (error) {
    logger.error('Error getting cache stats:', error)
    res.status(500).json({ status: 'error', message: 'Failed to get cache stats' })
  }
})

// Clear all cache (admin only)
router.delete('/clear', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    await redis.flushdb()
    logger.info('Cache cleared by admin')
    res.status(200).json({
      status: 'success',
      message: 'Cache cleared successfully',
    })
  } catch (error) {
    logger.error('Error clearing cache:', error)
    res.status(500).json({ status: 'error', message: 'Failed to clear cache' })
  }
})

// Clear specific pattern
router.delete(
  '/clear/:pattern',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const pattern = req.params.pattern + '*'
      const deletedCount = await cacheUtils.delPattern(pattern)
      logger.info(`Cache pattern cleared: ${pattern} (${deletedCount} keys)`)
      res.status(200).json({
        status: 'success',
        message: `Cleared ${deletedCount} cache keys`,
        deletedCount,
      })
    } catch (error) {
      logger.error('Error clearing cache pattern:', error)
      res.status(500).json({ status: 'error', message: 'Failed to clear cache pattern' })
    }
  }
)

export default router

