import nodemailer from 'nodemailer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import logger from '../utils/logger.js'
import { User } from '../models/index.js'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Email Service
 * Handles email sending with templates and preferences
 */

// Create transporter
let transporter = null

const createTransporter = () => {
  if (transporter) return transporter

  const isDevelopment = process.env.NODE_ENV === 'development'
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '587')
  const smtpUser = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASSWORD
  const smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@agilesafe.com'

  // In development, use console logging instead of actual SMTP
  if (isDevelopment && !smtpUser) {
    transporter = {
      sendMail: async (options) => {
        logger.info('📧 Email (Development Mode):', {
          to: options.to,
          subject: options.subject,
          preview: options.text?.substring(0, 100) + '...',
        })
        return { messageId: 'dev-' + Date.now() }
      },
    }
    return transporter
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: smtpUser && smtpPassword ? {
      user: smtpUser,
      pass: smtpPassword,
    } : undefined,
  })

  return transporter
}

/**
 * Generate unsubscribe token for user
 */
export const generateUnsubscribeToken = (userId) => {
  return crypto.createHash('sha256').update(`${userId}-${Date.now()}`).digest('hex')
}

/**
 * Load email template
 */
const loadTemplate = (templateName, variables = {}) => {
  try {
    const templatePath = join(__dirname, '../templates/emails', `${templateName}.html`)
    let template = readFileSync(templatePath, 'utf-8')

    // Replace variables
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      template = template.replace(regex, variables[key] || '')
    })

    return template
  } catch (error) {
    logger.error(`Error loading email template ${templateName}:`, error)
    // Return fallback template
    return getFallbackTemplate(templateName, variables)
  }
}

/**
 * Fallback template if file doesn't exist
 */
const getFallbackTemplate = (templateName, variables) => {
  const { title, content, actionUrl, actionText, footer } = variables
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || 'Notification'}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h1 style="color: #2c3e50; margin-top: 0;">${title || 'Notification'}</h1>
        <div style="background: white; padding: 20px; border-radius: 4px; margin: 20px 0;">
          ${content || ''}
        </div>
        ${actionUrl && actionText ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              ${actionText}
            </a>
          </div>
        ` : ''}
        ${footer || ''}
      </div>
    </body>
    </html>
  `
}

/**
 * Send email
 */
export const sendEmail = async (to, subject, html, text = null) => {
  try {
    const mailTransporter = createTransporter()
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@agilesafe.com'

    const mailOptions = {
      from: `AgileSAFe <${from}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    }

    const result = await mailTransporter.sendMail(mailOptions)
    logger.info(`Email sent to ${to}: ${subject}`)
    return result
  } catch (error) {
    logger.error('Error sending email:', error)
    throw error
  }
}

/**
 * Check if user wants email for this event
 */
const shouldSendEmail = async (userId, eventType) => {
  try {
    const user = await User.findById(userId).select('preferences')
    if (!user || !user.preferences?.emailNotifications?.enabled) {
      return false
    }

    const eventMap = {
      'task_assigned': 'taskAssigned',
      'task_status_changed': 'taskStatusChanged',
      'story_assigned': 'storyAssigned',
      'mention': 'mention',
      'comment_added': 'commentAdded',
      'sprint_started': 'sprintStarted',
      'sprint_completed': 'sprintCompleted',
      'deadline_approaching': 'deadlineApproaching',
      'high_risk_detected': 'highRiskDetected',
    }

    const eventKey = eventMap[eventType]
    if (!eventKey) return true // Default to true for unknown events

    return user.preferences?.emailNotifications?.events?.[eventKey] !== false
  } catch (error) {
    logger.error('Error checking email preferences:', error)
    return true // Default to sending if error
  }
}

/**
 * Get unsubscribe URL
 */
const getUnsubscribeUrl = (userId, token) => {
  const baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  return `${baseUrl}/settings/notifications?unsubscribe=${token}`
}

/**
 * Send task assigned email
 */
export const sendTaskAssignedEmail = async (userId, task, project) => {
  if (!(await shouldSendEmail(userId, 'task_assigned'))) return

  const user = await User.findById(userId).select('name email preferences')
  if (!user || !user.email) return

  const baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  const taskUrl = `${baseUrl}/tasks/${task._id}`
  const unsubscribeToken = user.preferences?.emailNotifications?.unsubscribeToken || generateUnsubscribeToken(userId)
  
  // Save token if not exists
  if (!user.preferences?.emailNotifications?.unsubscribeToken) {
    user.preferences = user.preferences || {}
    user.preferences.emailNotifications = user.preferences.emailNotifications || {}
    user.preferences.emailNotifications.unsubscribeToken = unsubscribeToken
    await user.save()
  }

  const html = loadTemplate('task-assigned', {
    userName: user.name,
    taskTitle: task.title,
    taskId: task.id || task._id,
    projectName: project?.name || 'Project',
    taskUrl,
    actionText: 'View Task',
    unsubscribeUrl: getUnsubscribeUrl(userId, unsubscribeToken),
  })

  await sendEmail(
    user.email,
    `New Task Assigned: ${task.title}`,
    html
  )
}

/**
 * Send task status changed email
 */
export const sendTaskStatusChangedEmail = async (userId, task, oldStatus, newStatus, project) => {
  if (!(await shouldSendEmail(userId, 'task_status_changed'))) return

  const user = await User.findById(userId).select('name email preferences')
  if (!user || !user.email) return

  const baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  const taskUrl = `${baseUrl}/tasks/${task._id}`
  const unsubscribeToken = user.preferences?.emailNotifications?.unsubscribeToken

  const html = loadTemplate('task-status-changed', {
    userName: user.name,
    taskTitle: task.title,
    oldStatus,
    newStatus,
    projectName: project?.name || 'Project',
    taskUrl,
    actionText: 'View Task',
    unsubscribeUrl: unsubscribeToken ? getUnsubscribeUrl(userId, unsubscribeToken) : '',
  })

  await sendEmail(
    user.email,
    `Task Status Updated: ${task.title}`,
    html
  )
}

/**
 * Send story assigned email
 */
export const sendStoryAssignedEmail = async (userId, story, project) => {
  if (!(await shouldSendEmail(userId, 'story_assigned'))) return

  const user = await User.findById(userId).select('name email preferences')
  if (!user || !user.email) return

  const baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  const storyUrl = `${baseUrl}/stories/${story._id}`
  const unsubscribeToken = user.preferences?.emailNotifications?.unsubscribeToken

  const html = loadTemplate('story-assigned', {
    userName: user.name,
    storyTitle: story.title,
    storyId: story.storyId || story.id,
    projectName: project?.name || 'Project',
    storyUrl,
    actionText: 'View Story',
    unsubscribeUrl: unsubscribeToken ? getUnsubscribeUrl(userId, unsubscribeToken) : '',
  })

  await sendEmail(
    user.email,
    `New Story Assigned: ${story.title}`,
    html
  )
}

/**
 * Send mention email
 */
export const sendMentionEmail = async (userId, mentionedBy, comment, entityType, entityId, entityTitle) => {
  if (!(await shouldSendEmail(userId, 'mention'))) return

  const user = await User.findById(userId).select('name email preferences')
  if (!user || !user.email) return

  const baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  const entityUrl = `${baseUrl}/${entityType}s/${entityId}`
  const unsubscribeToken = user.preferences?.emailNotifications?.unsubscribeToken

  const html = loadTemplate('mention', {
    userName: user.name,
    mentionedByName: mentionedBy.name,
    commentContent: comment.content?.substring(0, 200) || '',
    entityType: entityType === 'story' ? 'story' : 'task',
    entityTitle: entityTitle || `${entityType} ${entityId}`,
    entityUrl,
    actionText: 'View Comment',
    unsubscribeUrl: unsubscribeToken ? getUnsubscribeUrl(userId, unsubscribeToken) : '',
  })

  await sendEmail(
    user.email,
    `${mentionedBy.name} mentioned you in a comment`,
    html
  )
}

/**
 * Send comment added email
 */
export const sendCommentAddedEmail = async (userId, comment, entityType, entityId, entityTitle, project) => {
  if (!(await shouldSendEmail(userId, 'comment_added'))) return

  const user = await User.findById(userId).select('name email preferences')
  if (!user || !user.email) return

  const baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  const entityUrl = `${baseUrl}/${entityType}s/${entityId}`
  const unsubscribeToken = user.preferences?.emailNotifications?.unsubscribeToken

  const html = loadTemplate('comment-added', {
    userName: user.name,
    commentAuthorName: comment.user?.name || 'Someone',
    commentContent: comment.content?.substring(0, 200) || '',
    entityType: entityType === 'story' ? 'story' : 'task',
    entityTitle: entityTitle || `${entityType} ${entityId}`,
    projectName: project?.name || 'Project',
    entityUrl,
    actionText: 'View Comment',
    unsubscribeUrl: unsubscribeToken ? getUnsubscribeUrl(userId, unsubscribeToken) : '',
  })

  await sendEmail(
    user.email,
    `New comment on ${entityType}: ${entityTitle}`,
    html
  )
}

/**
 * Send sprint started email
 */
export const sendSprintStartedEmail = async (userId, sprint, project) => {
  if (!(await shouldSendEmail(userId, 'sprint_started'))) return

  const user = await User.findById(userId).select('name email preferences')
  if (!user || !user.email) return

  const baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  const sprintUrl = `${baseUrl}/sprints/${sprint._id}`
  const unsubscribeToken = user.preferences?.emailNotifications?.unsubscribeToken

  const html = loadTemplate('sprint-started', {
    userName: user.name,
    sprintName: sprint.name,
    projectName: project?.name || 'Project',
    startDate: sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : '',
    endDate: sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : '',
    sprintUrl,
    actionText: 'View Sprint',
    unsubscribeUrl: unsubscribeToken ? getUnsubscribeUrl(userId, unsubscribeToken) : '',
  })

  await sendEmail(
    user.email,
    `Sprint Started: ${sprint.name}`,
    html
  )
}

/**
 * Send sprint completed email
 */
export const sendSprintCompletedEmail = async (userId, sprint, project) => {
  if (!(await shouldSendEmail(userId, 'sprint_completed'))) return

  const user = await User.findById(userId).select('name email preferences')
  if (!user || !user.email) return

  const baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  const sprintUrl = `${baseUrl}/sprints/${sprint._id}`
  const unsubscribeToken = user.preferences?.emailNotifications?.unsubscribeToken

  const html = loadTemplate('sprint-completed', {
    userName: user.name,
    sprintName: sprint.name,
    projectName: project?.name || 'Project',
    sprintUrl,
    actionText: 'View Sprint',
    unsubscribeUrl: unsubscribeToken ? getUnsubscribeUrl(userId, unsubscribeToken) : '',
  })

  await sendEmail(
    user.email,
    `Sprint Completed: ${sprint.name}`,
    html
  )
}

/**
 * Send meeting invitation email
 */
export const sendMeetingInviteEmail = async ({ to, meeting, sprint, project, organizer }) => {
  if (!to) return

  const baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  const meetingUrl = `${baseUrl}/sprints/${sprint?._id || sprint?.id || ''}?tab=meetings`
  const start = meeting.startTime ? new Date(meeting.startTime).toLocaleString() : ''
  const end = meeting.endTime ? new Date(meeting.endTime).toLocaleString() : ''

  const html = loadTemplate('meeting-invite', {
    title: meeting.title,
    userName: '',
    content: `
      <p>You have been invited to a sprint ${meeting.type} meeting.</p>
      <p><strong>Sprint:</strong> ${sprint?.name || ''}</p>
      <p><strong>Project:</strong> ${project?.name || ''}</p>
      <p><strong>Organizer:</strong> ${organizer?.name || 'Sprint Manager'}</p>
      <p><strong>When:</strong> ${start} - ${end} (${meeting.timezone || 'UTC'})</p>
      ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
      ${
        meeting.videoConferenceLink
          ? `<p><strong>Video Conference:</strong> <a href="${meeting.videoConferenceLink}">${meeting.videoConferenceLink}</a></p>`
          : ''
      }
      ${meeting.description ? `<p><strong>Agenda:</strong><br/>${meeting.description}</p>` : ''}
    `,
    actionText: 'Open Sprint',
    actionUrl: meetingUrl,
  })

  await sendEmail(to, `Meeting Invitation: ${meeting.title}`, html)
}

/**
 * Send deadline approaching email
 */
export const sendDeadlineApproachingEmail = async (userId, task, daysUntil, project) => {
  if (!(await shouldSendEmail(userId, 'deadline_approaching'))) return

  const user = await User.findById(userId).select('name email preferences')
  if (!user || !user.email) return

  const baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  const taskUrl = `${baseUrl}/tasks/${task._id}`
  const unsubscribeToken = user.preferences?.emailNotifications?.unsubscribeToken

  const html = loadTemplate('deadline-approaching', {
    userName: user.name,
    taskTitle: task.title,
    daysUntil,
    dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
    projectName: project?.name || 'Project',
    taskUrl,
    actionText: 'View Task',
    unsubscribeUrl: unsubscribeToken ? getUnsubscribeUrl(userId, unsubscribeToken) : '',
  })

  await sendEmail(
    user.email,
    `Deadline Approaching: ${task.title} (${daysUntil} day${daysUntil > 1 ? 's' : ''} left)`,
    html
  )
}

/**
 * Send high risk detected email
 */
export const sendHighRiskDetectedEmail = async (userId, risk, project) => {
  if (!(await shouldSendEmail(userId, 'high_risk_detected'))) return

  const user = await User.findById(userId).select('name email preferences')
  if (!user || !user.email) return

  const baseUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'
  const projectUrl = `${baseUrl}/projects/${project?._id}`
  const unsubscribeToken = user.preferences?.emailNotifications?.unsubscribeToken

  const html = loadTemplate('high-risk-detected', {
    userName: user.name,
    riskDescription: risk.description || 'High risk detected',
    riskSeverity: risk.severity || 'high',
    projectName: project?.name || 'Project',
    projectUrl,
    actionText: 'View Project',
    unsubscribeUrl: unsubscribeToken ? getUnsubscribeUrl(userId, unsubscribeToken) : '',
  })

  await sendEmail(
    user.email,
    `High Risk Detected: ${project?.name || 'Project'}`,
    html
  )
}

