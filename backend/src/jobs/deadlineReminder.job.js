import cron from 'node-cron'
import { checkDeadlineReminders } from '../services/deadlineReminder.service.js'
import logger from '../utils/logger.js'

/**
 * Deadline Reminder Job
 * Runs daily to check for tasks with approaching deadlines
 */

let job = null

/**
 * Start the deadline reminder cron job
 * Runs daily at 9:00 AM
 */
export const startDeadlineReminderJob = () => {
  if (job) {
    logger.info('Deadline reminder job already running')
    return
  }

  // Run daily at 9:00 AM
  job = cron.schedule('0 9 * * *', async () => {
    try {
      logger.info('Running deadline reminder check...')
      const result = await checkDeadlineReminders()
      logger.info(`Deadline reminder check completed. ${result.remindersSent} reminders sent.`)
    } catch (error) {
      logger.error('Error in deadline reminder job:', error)
    }
  })

  logger.info('Deadline reminder job started (runs daily at 9:00 AM)')
}

/**
 * Stop the deadline reminder cron job
 */
export const stopDeadlineReminderJob = () => {
  if (job) {
    job.stop()
    job = null
    logger.info('Deadline reminder job stopped')
  }
}

