import cron from 'node-cron'
import AuditLog from '../models/AuditLog.js'
import logger from '../utils/logger.js'

/**
 * Audit Log Archival Job
 * Archives audit logs older than 1 year
 * Runs daily at 2:00 AM
 */
export const startAuditLogArchivalJob = () => {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Starting audit log archival job...')

      // Calculate date 1 year ago
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      // Find logs older than 1 year that are not archived
      const result = await AuditLog.updateMany(
        {
          createdAt: { $lt: oneYearAgo },
          archived: false,
        },
        {
          $set: {
            archived: true,
            archivedAt: new Date(),
          },
        }
      )

      logger.info(`Audit log archival job completed. Archived ${result.modifiedCount} logs.`)
    } catch (error) {
      logger.error('Error in audit log archival job:', error)
    }
  })

  logger.info('Audit log archival job scheduled (runs daily at 2:00 AM)')
}

