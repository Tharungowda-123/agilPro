import { TimeEntry, Task } from '../models/index.js'
import logger from '../utils/logger.js'

/**
 * TimeEntry Service
 * Business logic for time tracking operations
 */

/**
 * Start timer for a task
 * @param {string} taskId - Task ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created time entry
 */
export const startTimer = async (taskId, userId) => {
  try {
    // Check if task exists
    const task = await Task.findById(taskId)
    if (!task) {
      throw new Error('Task not found')
    }

    // Check if user already has an active timer
    const activeTimer = await TimeEntry.findOne({
      user: userId,
      isActive: true,
    })

    if (activeTimer) {
      throw new Error('You already have an active timer. Please stop it first.')
    }

    // Create new time entry with active timer
    const timeEntry = new TimeEntry({
      task: taskId,
      user: userId,
      hours: 0,
      date: new Date(),
      entryType: 'timer',
      startTime: new Date(),
      isActive: true,
    })

    await timeEntry.save()

    // Populate references
    await timeEntry.populate('task', 'title story')
    await timeEntry.populate('user', 'name email')

    return timeEntry
  } catch (error) {
    logger.error('Error starting timer:', error)
    throw error
  }
}

/**
 * Stop timer and calculate hours
 * @param {string} timeEntryId - Time entry ID
 * @returns {Promise<Object>} Updated time entry
 */
export const stopTimer = async (timeEntryId) => {
  try {
    const timeEntry = await TimeEntry.findById(timeEntryId)

    if (!timeEntry) {
      throw new Error('Time entry not found')
    }

    if (!timeEntry.isActive) {
      throw new Error('Timer is not active')
    }

    // Calculate hours
    const endTime = new Date()
    const startTime = timeEntry.startTime || timeEntry.createdAt
    const hours = (endTime - startTime) / (1000 * 60 * 60) // Convert to hours

    // Update time entry
    timeEntry.endTime = endTime
    timeEntry.hours = Math.round(hours * 100) / 100 // Round to 2 decimal places
    timeEntry.isActive = false

    await timeEntry.save()

    // Update task's actual hours
    const task = await Task.findById(timeEntry.task)
    if (task) {
      task.actualHours = (task.actualHours || 0) + timeEntry.hours
      await task.save()
    }

    // Populate references
    await timeEntry.populate('task', 'title story')
    await timeEntry.populate('user', 'name email')

    return timeEntry
  } catch (error) {
    logger.error('Error stopping timer:', error)
    throw error
  }
}

/**
 * Pause timer (mark as inactive but keep entry)
 * @param {string} timeEntryId - Time entry ID
 * @returns {Promise<Object>} Updated time entry
 */
export const pauseTimer = async (timeEntryId) => {
  try {
    const timeEntry = await TimeEntry.findById(timeEntryId)

    if (!timeEntry) {
      throw new Error('Time entry not found')
    }

    if (!timeEntry.isActive) {
      throw new Error('Timer is not active')
    }

    // Calculate hours so far
    const currentTime = new Date()
    const startTime = timeEntry.startTime || timeEntry.createdAt
    const hours = (currentTime - startTime) / (1000 * 60 * 60)

    // Update time entry
    timeEntry.hours = Math.round(hours * 100) / 100
    timeEntry.isActive = false

    await timeEntry.save()

    // Populate references
    await timeEntry.populate('task', 'title story')
    await timeEntry.populate('user', 'name email')

    return timeEntry
  } catch (error) {
    logger.error('Error pausing timer:', error)
    throw error
  }
}

/**
 * Resume timer (reactivate paused timer)
 * @param {string} timeEntryId - Time entry ID
 * @returns {Promise<Object>} Updated time entry
 */
export const resumeTimer = async (timeEntryId) => {
  try {
    const timeEntry = await TimeEntry.findById(timeEntryId)

    if (!timeEntry) {
      throw new Error('Time entry not found')
    }

    // Check if user already has an active timer
    const activeTimer = await TimeEntry.findOne({
      user: timeEntry.user,
      isActive: true,
      _id: { $ne: timeEntryId },
    })

    if (activeTimer) {
      throw new Error('You already have an active timer. Please stop it first.')
    }

    // Reactivate timer
    timeEntry.startTime = new Date()
    timeEntry.isActive = true

    await timeEntry.save()

    // Populate references
    await timeEntry.populate('task', 'title story')
    await timeEntry.populate('user', 'name email')

    return timeEntry
  } catch (error) {
    logger.error('Error resuming timer:', error)
    throw error
  }
}

/**
 * Get active timer for user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Active time entry or null
 */
export const getActiveTimer = async (userId) => {
  try {
    const timeEntry = await TimeEntry.findOne({
      user: userId,
      isActive: true,
    })
      .populate('task', 'title story')
      .populate('user', 'name email')

    return timeEntry
  } catch (error) {
    logger.error('Error getting active timer:', error)
    throw error
  }
}

/**
 * Create manual time entry
 * @param {Object} data - Time entry data
 * @returns {Promise<Object>} Created time entry
 */
export const createTimeEntry = async (data) => {
  try {
    // Check if task exists
    const task = await Task.findById(data.task)
    if (!task) {
      throw new Error('Task not found')
    }

    const timeEntry = new TimeEntry({
      ...data,
      entryType: 'manual',
      isActive: false,
    })

    await timeEntry.save()

    // Update task's actual hours
    task.actualHours = (task.actualHours || 0) + timeEntry.hours
    await task.save()

    // Populate references
    await timeEntry.populate('task', 'title story')
    await timeEntry.populate('user', 'name email')

    return timeEntry
  } catch (error) {
    logger.error('Error creating time entry:', error)
    throw error
  }
}

/**
 * Get time entries for a task
 * @param {string} taskId - Task ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Time entries
 */
export const getTimeEntriesForTask = async (taskId, options = {}) => {
  try {
    const { page = 1, limit = 50 } = options
    const skip = (page - 1) * limit

    const timeEntries = await TimeEntry.find({ task: taskId })
      .populate('user', 'name email avatar')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)

    const total = await TimeEntry.countDocuments({ task: taskId })

    return {
      timeEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    logger.error('Error getting time entries for task:', error)
    throw error
  }
}

/**
 * Get time entries for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (dateFrom, dateTo, taskId, projectId)
 * @returns {Promise<Array>} Time entries
 */
export const getTimeEntriesForUser = async (userId, options = {}) => {
  try {
    const { dateFrom, dateTo, taskId, projectId, page = 1, limit = 100 } = options
    const skip = (page - 1) * limit

    // Build query
    const query = { user: userId }

    if (taskId) {
      query.task = taskId
    }

    if (dateFrom || dateTo) {
      query.date = {}
      if (dateFrom) {
        query.date.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        query.date.$lte = new Date(dateTo)
      }
    }

    let timeEntries = await TimeEntry.find(query)
      .populate('task', 'title story')
      .populate({
        path: 'task',
        populate: {
          path: 'story',
          select: 'title storyId project',
          populate: {
            path: 'project',
            select: 'name',
          },
        },
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)

    // Filter by project if specified
    if (projectId) {
      timeEntries = timeEntries.filter((entry) => {
        const project = entry.task?.story?.project
        return project && (project._id?.toString() === projectId || project.toString() === projectId)
      })
    }

    const total = await TimeEntry.countDocuments(query)

    return {
      timeEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    logger.error('Error getting time entries for user:', error)
    throw error
  }
}

/**
 * Update time entry
 * @param {string} timeEntryId - Time entry ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated time entry
 */
export const updateTimeEntry = async (timeEntryId, data) => {
  try {
    const timeEntry = await TimeEntry.findById(timeEntryId)

    if (!timeEntry) {
      throw new Error('Time entry not found')
    }

    // Calculate hours difference if hours changed
    const oldHours = timeEntry.hours
    const newHours = data.hours

    // Update time entry
    Object.assign(timeEntry, data)
    await timeEntry.save()

    // Update task's actual hours if hours changed
    if (newHours !== undefined && newHours !== oldHours) {
      const task = await Task.findById(timeEntry.task)
      if (task) {
        task.actualHours = Math.max(0, (task.actualHours || 0) - oldHours + newHours)
        await task.save()
      }
    }

    // Populate references
    await timeEntry.populate('task', 'title story')
    await timeEntry.populate('user', 'name email')

    return timeEntry
  } catch (error) {
    logger.error('Error updating time entry:', error)
    throw error
  }
}

/**
 * Delete time entry
 * @param {string} timeEntryId - Time entry ID
 * @returns {Promise<void>}
 */
export const deleteTimeEntry = async (timeEntryId) => {
  try {
    const timeEntry = await TimeEntry.findById(timeEntryId)

    if (!timeEntry) {
      throw new Error('Time entry not found')
    }

    // Update task's actual hours
    const task = await Task.findById(timeEntry.task)
    if (task) {
      task.actualHours = Math.max(0, (task.actualHours || 0) - timeEntry.hours)
      await task.save()
    }

    // Delete time entry
    await TimeEntry.findByIdAndDelete(timeEntryId)
  } catch (error) {
    logger.error('Error deleting time entry:', error)
    throw error
  }
}

/**
 * Get time tracking summary for user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (dateFrom, dateTo)
 * @returns {Promise<Object>} Time tracking summary
 */
export const getTimeTrackingSummary = async (userId, options = {}) => {
  try {
    const { dateFrom, dateTo } = options

    // Build query
    const query = { user: userId }

    if (dateFrom || dateTo) {
      query.date = {}
      if (dateFrom) {
        query.date.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        query.date.$lte = new Date(dateTo)
      }
    }

    // Get all time entries
    const timeEntries = await TimeEntry.find(query)
      .populate('task', 'title story')
      .populate({
        path: 'task',
        populate: {
          path: 'story',
          select: 'title storyId project',
          populate: {
            path: 'project',
            select: 'name',
          },
        },
      })

    // Calculate totals
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)

    // Group by date
    const byDate = {}
    timeEntries.forEach((entry) => {
      const dateKey = entry.date.toISOString().split('T')[0]
      if (!byDate[dateKey]) {
        byDate[dateKey] = 0
      }
      byDate[dateKey] += entry.hours
    })

    // Group by project
    const byProject = {}
    timeEntries.forEach((entry) => {
      const project = entry.task?.story?.project
      if (project) {
        const projectId = project._id?.toString() || project.toString()
        const projectName = project.name || 'Unknown'
        if (!byProject[projectId]) {
          byProject[projectId] = { name: projectName, hours: 0 }
        }
        byProject[projectId].hours += entry.hours
      }
    })

    // Group by task
    const byTask = {}
    timeEntries.forEach((entry) => {
      const taskId = entry.task?._id?.toString() || entry.task?.toString()
      if (taskId) {
        const taskTitle = entry.task?.title || 'Unknown'
        if (!byTask[taskId]) {
          byTask[taskId] = { title: taskTitle, hours: 0 }
        }
        byTask[taskId].hours += entry.hours
      }
    })

    // Get today's total
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEntries = timeEntries.filter(
      (entry) => entry.date >= today
    )
    const todayHours = todayEntries.reduce((sum, entry) => sum + entry.hours, 0)

    // Get this week's total
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
    const weekEntries = timeEntries.filter((entry) => entry.date >= weekStart)
    const weekHours = weekEntries.reduce((sum, entry) => sum + entry.hours, 0)

    return {
      totalHours,
      todayHours,
      weekHours,
      byDate,
      byProject: Object.values(byProject),
      byTask: Object.values(byTask),
      entryCount: timeEntries.length,
    }
  } catch (error) {
    logger.error('Error getting time tracking summary:', error)
    throw error
  }
}

