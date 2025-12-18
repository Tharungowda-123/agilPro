import { Task } from '../models/index.js'
import { sendDeadlineApproachingEmail } from './email.service.js'
import logger from '../utils/logger.js'

/**
 * Deadline Reminder Service
 * Checks for tasks with approaching deadlines and sends email reminders
 */

/**
 * Check and send deadline reminders
 * Should be called daily via cron job
 */
export const checkDeadlineReminders = async () => {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)

    // Find tasks with due date tomorrow (1 day before)
    const tasks = await Task.find({
      dueDate: {
        $gte: tomorrow,
        $lt: dayAfter,
      },
      status: { $ne: 'done' },
      assignedTo: { $exists: true },
    })
      .populate('assignedTo', '_id')
      .populate('story', 'project')
      .populate({
        path: 'story',
        populate: { path: 'project', select: 'name' },
      })

    logger.info(`Found ${tasks.length} tasks with deadlines approaching`)

    // Send email for each task
    for (const task of tasks) {
      try {
        if (task.assignedTo) {
          const project = task.story?.project
          await sendDeadlineApproachingEmail(
            task.assignedTo._id || task.assignedTo,
            task,
            1,
            project
          )
        }
      } catch (error) {
        logger.error(`Error sending deadline reminder for task ${task._id}:`, error)
      }
    }

    return { remindersSent: tasks.length }
  } catch (error) {
    logger.error('Error checking deadline reminders:', error)
    throw error
  }
}

