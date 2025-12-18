import { recordRequestMetrics } from '../services/monitoring.service.js'

export const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6
    recordRequestMetrics({
      durationMs,
      statusCode: res.statusCode,
      route: req.originalUrl,
      method: req.method,
    })
  })

  next()
}

