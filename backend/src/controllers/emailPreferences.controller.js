import { User } from '../models/index.js'
import { generateUnsubscribeToken } from '../services/email.service.js'
import { successResponse } from '../utils/response.js'
import { NotFoundError, ForbiddenError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Email Preferences Controller
 * HTTP request handlers for email notification preferences
 */

/**
 * Get email preferences
 * GET /api/users/:id/email-preferences
 */
export const getEmailPreferences = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Users can only view their own preferences
    if (id !== userId && req.user.role !== 'admin') {
      throw new ForbiddenError('You can only view your own preferences')
    }

    const user = await User.findById(id).select('preferences.emailNotifications')
    if (!user) {
      throw new NotFoundError('User not found')
    }

    return successResponse(
      res,
      { preferences: user.preferences?.emailNotifications || {} },
      'Email preferences retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Update email preferences
 * PUT /api/users/:id/email-preferences
 */
export const updateEmailPreferences = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { enabled, frequency, events } = req.body

    // Users can only update their own preferences
    if (id !== userId && req.user.role !== 'admin') {
      throw new ForbiddenError('You can only update your own preferences')
    }

    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Initialize preferences if not exists
    if (!user.preferences) {
      user.preferences = {}
    }
    if (!user.preferences.emailNotifications) {
      user.preferences.emailNotifications = {}
    }

    // Update preferences
    if (enabled !== undefined) {
      user.preferences.emailNotifications.enabled = enabled
    }
    if (frequency) {
      user.preferences.emailNotifications.frequency = frequency
    }
    if (events) {
      user.preferences.emailNotifications.events = {
        ...user.preferences.emailNotifications.events,
        ...events,
      }
    }

    // Generate unsubscribe token if not exists
    if (!user.preferences.emailNotifications.unsubscribeToken) {
      user.preferences.emailNotifications.unsubscribeToken = generateUnsubscribeToken(user._id)
    }

    await user.save()

    return successResponse(
      res,
      { preferences: user.preferences.emailNotifications },
      'Email preferences updated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Unsubscribe from emails
 * POST /api/users/unsubscribe/:token
 */
export const unsubscribeFromEmails = async (req, res, next) => {
  try {
    const { token } = req.params

    const user = await User.findOne({
      'preferences.emailNotifications.unsubscribeToken': token,
    })

    if (!user) {
      throw new NotFoundError('Invalid unsubscribe token')
    }

    // Disable email notifications
    if (!user.preferences) {
      user.preferences = {}
    }
    if (!user.preferences.emailNotifications) {
      user.preferences.emailNotifications = {}
    }
    user.preferences.emailNotifications.enabled = false

    await user.save()

    return successResponse(
      res,
      { message: 'You have been unsubscribed from email notifications' },
      'Unsubscribed successfully'
    )
  } catch (error) {
    next(error)
  }
}

