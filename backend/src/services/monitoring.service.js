import os from 'os'
import path from 'path'
import checkDiskSpace from 'check-disk-space'
import mongoose from 'mongoose'

const metrics = {
  requestCount: 0,
  totalResponseTime: 0,
  maxResponseTime: 0,
  errorCount: 0,
  requestHistory: [],
  slowRequests: [],
  recentErrors: [],
  db: {
    totalQueries: 0,
    totalDuration: 0,
    slowQueries: [],
    recentQueries: [],
  },
}

const SLOW_REQUEST_THRESHOLD = Number(process.env.SLOW_REQUEST_THRESHOLD_MS || 1500)
const SLOW_QUERY_THRESHOLD = Number(process.env.SLOW_QUERY_THRESHOLD_MS || 250)
const MAX_HISTORY = 100
const MAX_SLOW_ENTRIES = 25

export const recordRequestMetrics = ({ durationMs, statusCode, route, method }) => {
  metrics.requestCount += 1
  metrics.totalResponseTime += durationMs
  metrics.maxResponseTime = Math.max(metrics.maxResponseTime, durationMs)

  metrics.requestHistory.push({
    timestamp: Date.now(),
    durationMs,
    statusCode,
    route,
    method,
  })

  if (metrics.requestHistory.length > MAX_HISTORY) {
    metrics.requestHistory.shift()
  }

  if (statusCode >= 500) {
    metrics.errorCount += 1
  }

  if (durationMs >= SLOW_REQUEST_THRESHOLD) {
    metrics.slowRequests.push({
      timestamp: Date.now(),
      durationMs,
      statusCode,
      route,
      method,
    })
    if (metrics.slowRequests.length > MAX_SLOW_ENTRIES) {
      metrics.slowRequests.shift()
    }
  }
}

export const recordErrorMetrics = ({ error, route, method, user }) => {
  metrics.recentErrors.push({
    timestamp: Date.now(),
    message: error?.message,
    name: error?.name,
    route,
    method,
    user,
  })
  if (metrics.recentErrors.length > MAX_HISTORY) {
    metrics.recentErrors.shift()
  }
}

export const recordDbQueryMetrics = ({ durationMs, collection, operation, query }) => {
  metrics.db.totalQueries += 1
  metrics.db.totalDuration += durationMs

  const entry = {
    timestamp: Date.now(),
    durationMs,
    collection,
    operation,
    query,
  }

  metrics.db.recentQueries.push(entry)
  if (metrics.db.recentQueries.length > MAX_HISTORY) {
    metrics.db.recentQueries.shift()
  }

  if (durationMs >= SLOW_QUERY_THRESHOLD) {
    metrics.db.slowQueries.push(entry)
    if (metrics.db.slowQueries.length > MAX_SLOW_ENTRIES) {
      metrics.db.slowQueries.shift()
    }
  }
}

export const getMetricsSnapshot = async () => {
  const avgResponseTime =
    metrics.requestCount === 0 ? 0 : metrics.totalResponseTime / metrics.requestCount
  const errorRate =
    metrics.requestCount === 0 ? 0 : metrics.errorCount / metrics.requestCount

  const memoryUsage = process.memoryUsage()
  const loadAverages = os.loadavg()
  const cpuCount = os.cpus()?.length || 1

  const diskPath = process.platform === 'win32' ? path.parse(process.cwd()).root : '/'
  const diskInfo = await checkDiskSpace(diskPath)
  const diskUsed = diskInfo.size - diskInfo.free
  const diskUsagePercent = diskInfo.size > 0 ? (diskUsed / diskInfo.size) * 100 : 0

  const { User } = await import('../models/index.js')
  const activeUsers = await User.countDocuments({ isActive: true })

  const avgQueryDuration =
    metrics.db.totalQueries === 0
      ? 0
      : metrics.db.totalDuration / metrics.db.totalQueries

  return {
    api: {
      averageResponseTime: avgResponseTime,
      maxResponseTime: metrics.maxResponseTime,
      requestRatePerMinute: getRequestRatePerMinute(),
      errorRate,
      totalRequests: metrics.requestCount,
      errorCount: metrics.errorCount,
    },
    system: {
      uptime: process.uptime(),
      memory: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        memoryUsagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      cpu: {
        load1: loadAverages[0],
        load5: loadAverages[1],
        load15: loadAverages[2],
        usagePercent: (loadAverages[0] / cpuCount) * 100,
      },
      disk: {
        total: diskInfo.size,
        free: diskInfo.free,
        used: diskUsed,
        usagePercent: diskUsagePercent,
      },
      activeUsers,
    },
    database: {
      totalQueries: metrics.db.totalQueries,
      averageQueryDuration: avgQueryDuration,
      slowQueryCount: metrics.db.slowQueries.length,
    },
    recent: {
      slowRequests: metrics.slowRequests.slice(-10).reverse(),
      slowQueries: metrics.db.slowQueries.slice(-10).reverse(),
      errors: metrics.recentErrors.slice(-10).reverse(),
    },
    alerts: buildAlerts({
      avgResponseTime,
      errorRate,
      memoryUsagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      diskUsagePercent,
    }),
  }
}

const getRequestRatePerMinute = () => {
  const threshold = Date.now() - 60 * 1000
  return metrics.requestHistory.filter((entry) => entry.timestamp >= threshold).length
}

const buildAlerts = ({ avgResponseTime, errorRate, memoryUsagePercent, diskUsagePercent }) => {
  const alerts = []
  if (avgResponseTime > SLOW_REQUEST_THRESHOLD) {
    alerts.push({
      type: 'performance',
      severity: 'warning',
      message: `Average API response time ${avgResponseTime.toFixed(0)}ms exceeds threshold.`,
    })
  }
  if (errorRate > 0.05) {
    alerts.push({
      type: 'errors',
      severity: 'critical',
      message: `Error rate ${(errorRate * 100).toFixed(2)}% is above 5%.`,
    })
  }
  if (memoryUsagePercent > 85) {
    alerts.push({
      type: 'memory',
      severity: 'warning',
      message: `Memory usage at ${memoryUsagePercent.toFixed(1)}%.`,
    })
  }
  if (diskUsagePercent > 85) {
    alerts.push({
      type: 'disk',
      severity: 'warning',
      message: `Disk usage at ${diskUsagePercent.toFixed(1)}%.`,
    })
  }
  return alerts
}

let queryInstrumentationEnabled = false
export const initializeQueryMonitoring = () => {
  if (queryInstrumentationEnabled) {
    return
  }

  const originalExec = mongoose.Query.prototype.exec

  mongoose.Query.prototype.exec = async function execWithMonitoring(...args) {
    const start = process.hrtime.bigint()
    try {
      const result = await originalExec.apply(this, args)
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6
      recordDbQueryMetrics({
        durationMs,
        collection: this.model?.collection?.name,
        operation: this.op,
        query: this.getQuery(),
      })
      return result
    } catch (error) {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6
      recordDbQueryMetrics({
        durationMs,
        collection: this.model?.collection?.name,
        operation: this.op,
        query: this.getQuery(),
      })
      throw error
    }
  }

  queryInstrumentationEnabled = true
}

export const getSlowQueries = () => metrics.db.slowQueries.slice(-20).reverse()
export const getRecentErrors = () => metrics.recentErrors.slice(-20).reverse()
export const getRequestHistory = () => metrics.requestHistory.slice(-50).reverse()

