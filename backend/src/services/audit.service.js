import AuditLog from '../models/AuditLog.js'
import logger from '../utils/logger.js'

/**
 * Audit Service
 * Handles all audit logging operations
 */

/**
 * Get client IP address from request
 */
export const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  )
}

/**
 * Get user agent from request
 */
export const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown'
}

/**
 * Create audit log entry
 * @param {Object} options - Audit log options
 */
export const createAuditLog = async ({
  user,
  action,
  entityType,
  entityId = null,
  entityName = null,
  description,
  changes = {},
  metadata = {},
  req = null,
  organization = null,
}) => {
  try {
    // Get user info
    const userId = user?._id || user?.id || user
    const userName = user?.name || 'Unknown User'
    const userEmail = user?.email || 'unknown@example.com'

    // Get request info if available
    const ipAddress = req ? getClientIP(req) : null
    const userAgent = req ? getUserAgent(req) : null

    // Create audit log entry
    const auditLog = new AuditLog({
      user: userId,
      userName,
      userEmail,
      action,
      entityType,
      entityId,
      entityName,
      description,
      changes,
      metadata,
      ipAddress,
      userAgent,
      organization: organization || user?.organization || null,
    })

    await auditLog.save()

    return auditLog
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    logger.error('Error creating audit log:', error)
    return null
  }
}

/**
 * Log user action
 */
export const logUserAction = async (user, action, entity, changes = {}, req = null) => {
  const description = getActionDescription(action, entity, changes)
  return createAuditLog({
    user,
    action,
    entityType: 'user',
    entityId: entity?._id || entity?.id,
    entityName: entity?.name || entity?.email,
    description,
    changes,
    req,
  })
}

/**
 * Log project action
 */
export const logProjectAction = async (user, action, entity, changes = {}, req = null) => {
  const description = getActionDescription(action, entity, changes)
  return createAuditLog({
    user,
    action,
    entityType: 'project',
    entityId: entity?._id || entity?.id,
    entityName: entity?.name,
    description,
    changes,
    req,
    organization: entity?.organization,
  })
}

/**
 * Log sprint action
 */
export const logSprintAction = async (user, action, entity, changes = {}, req = null) => {
  const description = getActionDescription(action, entity, changes)
  return createAuditLog({
    user,
    action,
    entityType: 'sprint',
    entityId: entity?._id || entity?.id,
    entityName: entity?.name,
    description,
    changes,
    req,
  })
}

/**
 * Log story action
 */
export const logStoryAction = async (user, action, entity, changes = {}, req = null) => {
  const description = getActionDescription(action, entity, changes)
  return createAuditLog({
    user,
    action,
    entityType: 'story',
    entityId: entity?._id || entity?.id,
    entityName: entity?.title || entity?.storyId,
    description,
    changes,
    req,
  })
}

/**
 * Log task action
 */
export const logTaskAction = async (user, action, entity, changes = {}, req = null) => {
  const description = getActionDescription(action, entity, changes)
  return createAuditLog({
    user,
    action,
    entityType: 'task',
    entityId: entity?._id || entity?.id,
    entityName: entity?.title,
    description,
    changes,
    req,
  })
}

/**
 * Log comment action
 */
export const logCommentAction = async (user, action, entity, changes = {}, req = null) => {
  const description = getActionDescription(action, entity, changes)
  return createAuditLog({
    user,
    action,
    entityType: 'comment',
    entityId: entity?._id || entity?.id,
    description,
    changes,
    req,
  })
}

/**
 * Log team action
 */
export const logTeamAction = async (user, action, entity, changes = {}, req = null) => {
  const description = getActionDescription(action, entity, changes)
  return createAuditLog({
    user,
    action,
    entityType: 'team',
    entityId: entity?._id || entity?.id,
    entityName: entity?.name,
    description,
    changes,
    req,
  })
}

/**
 * Log feature action
 */
export const logFeatureAction = async (user, action, entity, changes = {}, req = null) => {
  const description = getActionDescription(action, entity, changes)
  return createAuditLog({
    user,
    action,
    entityType: 'feature',
    entityId: entity?._id || entity?.id,
    entityName: entity?.title,
    description,
    changes,
    req,
  })
}

/**
 * Log meeting action
 */
export const logMeetingAction = async (user, action, entity, changes = {}, req = null) => {
  const description = getActionDescription(action, entity, changes)
  return createAuditLog({
    user,
    action,
    entityType: 'meeting',
    entityId: entity?._id || entity?.id,
    entityName: entity?.title,
    description,
    changes,
    req,
  })
}

/**
 * Log settings action
 */
export const logSettingsAction = async (user, action, description, changes = {}, req = null) => {
  return createAuditLog({
    user,
    action,
    entityType: 'settings',
    description,
    changes,
    req,
  })
}

/**
 * Get action description
 */
const getActionDescription = (action, entity, changes) => {
  const entityName = entity?.name || entity?.title || entity?.email || entity?.storyId || 'Unknown'

  switch (action) {
    case 'user_created':
      return `User "${entityName}" was created`
    case 'user_updated':
      return `User "${entityName}" was updated`
    case 'user_deleted':
      return `User "${entityName}" was deleted`
    case 'user_role_changed':
      return `User "${entityName}" role changed from "${changes.before?.role}" to "${changes.after?.role}"`
    case 'user_activated':
      return `User "${entityName}" was activated`
    case 'user_deactivated':
      return `User "${entityName}" was deactivated`
    case 'project_created':
      return `Project "${entityName}" was created`
    case 'project_updated':
      return `Project "${entityName}" was updated`
    case 'project_deleted':
      return `Project "${entityName}" was deleted`
    case 'sprint_created':
      return `Sprint "${entityName}" was created`
    case 'sprint_updated':
      return `Sprint "${entityName}" was updated`
    case 'sprint_started':
      return `Sprint "${entityName}" was started`
    case 'sprint_completed':
      return `Sprint "${entityName}" was completed`
    case 'story_created':
      return `Story "${entityName}" was created`
    case 'story_updated':
      return `Story "${entityName}" was updated`
    case 'story_assigned':
      return `Story "${entityName}" was assigned`
    case 'story_status_changed':
      return `Story "${entityName}" status changed from "${changes.before?.status}" to "${changes.after?.status}"`
    case 'task_created':
      return `Task "${entityName}" was created`
    case 'task_updated':
      return `Task "${entityName}" was updated`
    case 'task_assigned':
      return `Task "${entityName}" was assigned`
    case 'task_reassigned':
      return `Task "${entityName}" was reassigned from "${changes.before?.assignedTo}" to "${changes.after?.assignedTo}"`
    case 'task_status_changed':
      return `Task "${entityName}" status changed from "${changes.before?.status}" to "${changes.after?.status}"`
    case 'comment_created':
      return `Comment was added`
    case 'comment_updated':
      return `Comment was updated`
    case 'comment_deleted':
      return `Comment was deleted`
    case 'team_created':
      return `Team "${entityName}" was created`
    case 'team_updated':
      return `Team "${entityName}" was updated`
    case 'team_member_added':
      return `Member added to team "${entityName}"`
    case 'team_member_removed':
      return `Member removed from team "${entityName}"`
    case 'feature_created':
      return `Feature "${entityName}" was created`
    case 'feature_updated':
      return `Feature "${entityName}" was updated`
    case 'meeting_scheduled':
      return `Meeting "${entityName}" was scheduled`
    case 'meeting_updated':
      return `Meeting "${entityName}" was updated`
    case 'meeting_cancelled':
      return `Meeting "${entityName}" was cancelled`
    case 'meeting_notes_added':
      return `Notes were added to meeting "${entityName}"`
    case 'meeting_agenda_updated':
      return `Agenda for meeting "${entityName}" was updated`
    case 'report_created':
      return `Custom report "${entityName}" was created`
    case 'report_updated':
      return `Custom report "${entityName}" was updated`
    case 'report_deleted':
      return `Custom report "${entityName}" was deleted`
    case 'settings_updated':
      return `Settings were updated`
    case 'email_preferences_updated':
      return `Email preferences were updated`
    case 'login':
      return `User logged in`
    case 'logout':
      return `User logged out`
    case 'export_generated':
      return `Export "${entityName}" was generated`
    case 'report_generated':
      return `Report "${entityName}" was generated`
    default:
      return `${action} performed on ${entityName}`
  }
}

/**
 * Get changes between old and new objects
 */
export const getChanges = (oldObj, newObj, fieldsToTrack = []) => {
  const changes = {
    before: {},
    after: {},
  }

  if (!oldObj || !newObj) {
    return changes
  }

  // If specific fields to track are provided, only track those
  const fields = fieldsToTrack.length > 0 ? fieldsToTrack : Object.keys(newObj)

  fields.forEach((field) => {
    const oldValue = oldObj[field]
    const newValue = newObj[field]

    // Skip if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      return
    }

    // Skip if both are undefined/null
    if (!oldValue && !newValue) {
      return
    }

    changes.before[field] = oldValue
    changes.after[field] = newValue
  })

  return changes
}

