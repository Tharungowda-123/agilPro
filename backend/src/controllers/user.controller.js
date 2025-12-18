import mongoose from 'mongoose'
import crypto from 'crypto'
import { parse } from 'csv-parse/sync'
import { User, Task, Story, Team } from '../models/index.js'
import {
  calculateUserPerformance,
  getCurrentWorkload,
  getAvailableUsers,
} from '../services/user.service.js'
import { logActivity } from '../services/activity.service.js'
import { logUserAction, getChanges } from '../services/audit.service.js'
import { hashPassword } from '../services/auth.service.js'
import { successResponse, paginatedResponse } from '../utils/response.js'
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * User Controller
 * HTTP request handlers for users
 */

/**
 * Get users with filters
 * GET /api/users
 */
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, teamId, role, skills, search, includeInactive } = req.query

    // Build query
    // Admins can see inactive users, others only see active
    const isAdmin = req.user.role === 'admin'
    const query = {}
    
    if (!isAdmin || includeInactive !== 'true') {
      query.isActive = true
    }

    if (teamId) {
      query.team = teamId
    }

    if (role) {
      query.role = role
    }

    if (skills) {
      const skillsArray = skills.split(',').map((s) => s.trim())
      query.skills = { $in: skillsArray }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const limitNum = parseInt(limit)

    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('team', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum)
    const pagination = {
      page: parseInt(page),
      limit: limitNum,
      total,
      totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1,
    }

    return paginatedResponse(res, users, pagination, 'Users retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get single user
 * GET /api/users/:id
 */
export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)
      .select('-password')
      .populate('team', 'name capacity velocity')
      .lean()

    if (!user) {
      throw new NotFoundError('User not found')
    }

    return successResponse(res, { user }, 'User retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Update user
 * PUT /api/users/:id
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Find user
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Check authorization (can only update own profile unless admin/manager)
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager'
    const isOwnProfile = req.user.id === id

    if (!isAdmin && !isOwnProfile) {
      throw new ForbiddenError('You can only update your own profile')
    }

    // Get old values for audit log
    const oldUser = user.toObject()

    // Update user
    Object.assign(user, updateData)
    await user.save()

    // Get changes for audit log
    const changes = getChanges(oldUser, user.toObject(), ['name', 'email', 'role', 'skills', 'availability', 'team'])

    // Log audit
    await logUserAction(req.user, 'user_updated', user, changes, req)

    // Log activity
    await logActivity(
      'updated',
      'project',
      user.team || user._id,
      req.user.id,
      `User profile updated`
    )

    return successResponse(
      res,
      { user: user.toJSON() },
      'User updated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Add skills to user
 * POST /api/users/:id/skills
 */
export const addSkills = async (req, res, next) => {
  try {
    const { id } = req.params
    const { skills } = req.body

    // Find user
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Check authorization
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager'
    const isOwnProfile = req.user.id === id

    if (!isAdmin && !isOwnProfile) {
      throw new ForbiddenError('You can only update your own skills')
    }

    // Add skills (avoid duplicates)
    const existingSkills = user.skills || []
    const newSkills = skills.filter((skill) => !existingSkills.includes(skill))

    user.skills = [...existingSkills, ...newSkills]
    await user.save()

    return successResponse(
      res,
      { user: user.toJSON() },
      `${newSkills.length} skill(s) added successfully`
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Remove skill from user
 * DELETE /api/users/:id/skills/:skill
 */
export const removeSkill = async (req, res, next) => {
  try {
    const { id, skill } = req.params

    // Find user
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Check authorization
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager'
    const isOwnProfile = req.user.id === id

    if (!isAdmin && !isOwnProfile) {
      throw new ForbiddenError('You can only update your own skills')
    }

    // Remove skill
    user.skills = (user.skills || []).filter((s) => s !== skill)
    await user.save()

    return successResponse(res, { user: user.toJSON() }, 'Skill removed successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get user performance
 * GET /api/users/:id/performance
 */
export const getUserPerformance = async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if user exists
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const performance = await calculateUserPerformance(id)

    return successResponse(res, { performance }, 'User performance retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Get user workload
 * GET /api/users/:id/workload
 */
export const getUserWorkload = async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if user exists
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const workload = await getCurrentWorkload(id)

    return successResponse(res, { workload }, 'User workload retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Update user availability
 * PUT /api/users/:id/availability
 */
export const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params
    const { availability } = req.body

    // Find user
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Check authorization
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager'
    const isOwnProfile = req.user.id === id

    if (!isAdmin && !isOwnProfile) {
      throw new ForbiddenError('You can only update your own availability')
    }

    // Update availability
    user.availability = availability
    await user.save()

    return successResponse(
      res,
      { user: user.toJSON() },
      'Availability updated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * ADMIN-ONLY: Create new user
 * POST /api/users/admin/create
 */
export const createUser = async (req, res, next) => {
  try {
    // Only admin can create users
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can create users')
    }

    const { name, email, password, role, skills, availability, teamId } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      throw new BadRequestError('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'developer',
      skills: skills || [],
      availability: availability || 40,
      team: teamId || null,
    })

    await user.save()

    // If team is assigned, update team members
    if (teamId) {
      const team = await Team.findById(teamId)
      if (team) {
        if (!team.members.includes(user._id)) {
          team.members.push(user._id)
          await team.save()
        }
      }
    }

    // Populate team
    await user.populate('team', 'name')

    // Log audit
    await logUserAction(req.user, 'user_created', user, {}, req)

    // Log activity
    await logActivity(
      'created',
      'user',
      user._id,
      req.user.id,
      `User "${user.name}" (${user.email}) created by admin`,
      { role: user.role, teamId: teamId || null }
    )

    return successResponse(
      res,
      { user: user.toJSON() },
      'User created successfully',
      201
    )
  } catch (error) {
    next(error)
  }
}

/**
 * ADMIN-ONLY: Update user details (full update)
 * PUT /api/users/admin/:id
 */
export const adminUpdateUser = async (req, res, next) => {
  try {
    // Only admin can update users
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can update users')
    }

    const { id } = req.params
    const { name, email, role, skills, availability, teamId } = req.body

    // Find user
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Get old values for audit log
    const oldUser = user.toObject()
    const oldRole = user.role

    // Check if email is being changed and if it already exists
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        throw new BadRequestError('User with this email already exists')
      }
      user.email = email.toLowerCase()
    }

    // Update fields
    if (name) user.name = name
    if (role) user.role = role
    if (skills !== undefined) user.skills = skills
    if (availability !== undefined) user.availability = availability

    // Handle team assignment
    const oldTeamId = user.team ? user.team.toString() : null
    if (teamId !== undefined) {
      if (teamId === null || teamId === '') {
        // Remove from team
        if (oldTeamId) {
          const oldTeam = await Team.findById(oldTeamId)
          if (oldTeam) {
            oldTeam.members = oldTeam.members.filter(
              (memberId) => memberId.toString() !== user._id.toString()
            )
            await oldTeam.save()
          }
        }
        user.team = null
      } else if (teamId !== oldTeamId) {
        // Assign to new team
        const newTeam = await Team.findById(teamId)
        if (!newTeam) {
          throw new NotFoundError('Team not found')
        }

        // Remove from old team
        if (oldTeamId) {
          const oldTeam = await Team.findById(oldTeamId)
          if (oldTeam) {
            oldTeam.members = oldTeam.members.filter(
              (memberId) => memberId.toString() !== user._id.toString()
            )
            await oldTeam.save()
          }
        }

        // Add to new team
        if (!newTeam.members.includes(user._id)) {
          newTeam.members.push(user._id)
          await newTeam.save()
        }
        user.team = teamId
      }
    }

    await user.save()
    await user.populate('team', 'name')

    // Get changes for audit log
    const changes = getChanges(oldUser, user.toObject(), ['name', 'email', 'role', 'skills', 'availability', 'team'])
    
    // Log role change separately if changed
    if (role && role !== oldRole) {
      await logUserAction(req.user, 'user_role_changed', user, {
        before: { role: oldRole },
        after: { role: user.role },
      }, req)
    } else {
      // Log general update
      await logUserAction(req.user, 'user_updated', user, changes, req)
    }

    // Log activity
    await logActivity(
      'updated',
      'user',
      user._id,
      req.user.id,
      `User "${user.name}" (${user.email}) updated by admin`,
      { role: user.role, teamId: user.team || null }
    )

    return successResponse(
      res,
      { user: user.toJSON() },
      'User updated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * ADMIN-ONLY: Reset user password
 * POST /api/users/admin/:id/reset-password
 */
export const resetUserPassword = async (req, res, next) => {
  try {
    // Only admin can reset passwords
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can reset passwords')
    }

    const { id } = req.params
    const { newPassword } = req.body

    // Find user
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)
    user.password = hashedPassword
    await user.save()

    // Log audit
    await logUserAction(req.user, 'user_password_reset', user, {}, req)

    // Log activity
    await logActivity(
      'updated',
      'user',
      user._id,
      req.user.id,
      `Password reset for user "${user.name}" (${user.email}) by admin`
    )

    return successResponse(res, {}, 'Password reset successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * ADMIN-ONLY: Deactivate user
 * POST /api/users/admin/:id/deactivate
 */
export const deactivateUser = async (req, res, next) => {
  try {
    // Only admin can deactivate users
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can deactivate users')
    }

    const { id } = req.params

    // Prevent deactivating self
    if (req.user.id === id) {
      throw new BadRequestError('You cannot deactivate your own account')
    }

    // Find user
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    user.isActive = false
    await user.save()

    // Log audit
    await logUserAction(req.user, 'user_deactivated', user, {}, req)

    // Log activity
    await logActivity(
      'updated',
      'user',
      user._id,
      req.user.id,
      `User "${user.name}" (${user.email}) deactivated by admin`
    )

    return successResponse(res, { user: user.toJSON() }, 'User deactivated successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * ADMIN-ONLY: Activate user
 * POST /api/users/admin/:id/activate
 */
export const activateUser = async (req, res, next) => {
  try {
    // Only admin can activate users
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can activate users')
    }

    const { id } = req.params

    // Find user
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    user.isActive = true
    await user.save()

    // Log audit
    await logUserAction(req.user, 'user_activated', user, {}, req)

    // Log activity
    await logActivity(
      'updated',
      'user',
      user._id,
      req.user.id,
      `User "${user.name}" (${user.email}) activated by admin`
    )

    return successResponse(res, { user: user.toJSON() }, 'User activated successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * ADMIN-ONLY: Assign user to team
 * POST /api/users/admin/:id/assign-team
 */
export const assignUserToTeam = async (req, res, next) => {
  try {
    // Only admin can assign users to teams
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can assign users to teams')
    }

    const { id } = req.params
    const { teamId } = req.body

    // Find user
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const oldTeamId = user.team ? user.team.toString() : null

    if (teamId === null || teamId === '') {
      // Remove from team
      if (oldTeamId) {
        const oldTeam = await Team.findById(oldTeamId)
        if (oldTeam) {
          oldTeam.members = oldTeam.members.filter(
            (memberId) => memberId.toString() !== user._id.toString()
          )
          await oldTeam.save()
        }
      }
      user.team = null
    } else {
      // Assign to team
      const team = await Team.findById(teamId)
      if (!team) {
        throw new NotFoundError('Team not found')
      }

      // Remove from old team
      if (oldTeamId && oldTeamId !== teamId) {
        const oldTeam = await Team.findById(oldTeamId)
        if (oldTeam) {
          oldTeam.members = oldTeam.members.filter(
            (memberId) => memberId.toString() !== user._id.toString()
          )
          await oldTeam.save()
        }
      }

      // Add to new team
      if (!team.members.includes(user._id)) {
        team.members.push(user._id)
        await team.save()
      }
      user.team = teamId
    }

    await user.save()
    await user.populate('team', 'name')

    // Log audit
    await logUserAction(req.user, 'user_updated', user, {
      before: { team: oldTeamId },
      after: { team: teamId || null },
    }, req)

    // Log activity
    await logActivity(
      'updated',
      'user',
      user._id,
      req.user.id,
      `User "${user.name}" assigned to team by admin`,
      { teamId: teamId || null, oldTeamId }
    )

    return successResponse(
      res,
      { user: user.toJSON() },
      'User team assignment updated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * ADMIN-ONLY: Bulk user actions
 * POST /api/users/admin/bulk-action
 */
export const bulkUserAction = async (req, res, next) => {
  try {
    // Only admin can perform bulk actions
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can perform bulk actions')
    }

    const { userIds, action } = req.body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestError('User IDs are required')
    }

    if (!action || !['activate', 'deactivate'].includes(action)) {
      throw new BadRequestError('Invalid action. Must be "activate" or "deactivate"')
    }

    // Prevent deactivating self
    if (action === 'deactivate' && userIds.includes(req.user.id)) {
      throw new BadRequestError('You cannot deactivate your own account')
    }

    // Find users
    const users = await User.find({ _id: { $in: userIds } })
    if (users.length !== userIds.length) {
      throw new NotFoundError('Some users were not found')
    }

    // Perform action
    const isActive = action === 'activate'
    await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { isActive } }
    )

    // Log activity for each user
    for (const user of users) {
      await logActivity(
        'updated',
        'user',
        user._id,
        req.user.id,
        `User "${user.name}" (${user.email}) ${action}d by admin (bulk action)`
      )
    }

    return successResponse(
      res,
      { count: users.length },
      `${users.length} user(s) ${action}d successfully`
    )
  } catch (error) {
    next(error)
  }
}

/**
 * ADMIN-ONLY: Get user activity
 * GET /api/users/admin/:id/activity
 */
export const getUserActivity = async (req, res, next) => {
  try {
    // Only admin can view user activity
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can view user activity')
    }

    const { id } = req.params
    const { page = 1, limit = 20 } = req.query

    // Check if user exists
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Get activities
    const { getActivities } = await import('../services/activity.service.js')
    const { activities, pagination } = await getActivities(
      { userId: id },
      { page: parseInt(page), limit: parseInt(limit) }
    )

    return paginatedResponse(res, activities, pagination, 'User activity retrieved successfully')
  } catch (error) {
    next(error)
  }
}

/**
 * Add capacity adjustment (vacation, sick, etc.)
 * POST /api/users/:id/capacity-adjustment
 */
export const addCapacityAdjustment = async (req, res, next) => {
  try {
    // Only manager/admin can add capacity adjustments
    if (!['admin', 'manager'].includes(req.user.role)) {
      throw new ForbiddenError('Only managers and admins can add capacity adjustments')
    }

    const { id } = req.params
    const { type, reason, startDate, endDate, adjustedCapacity } = req.body

    // Find user
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Check team access for managers
    if (req.user.role === 'manager') {
      const userTeamId = user.team?._id || user.team
      const managerTeamId = req.user.team?._id || req.user.team

      if (userTeamId?.toString() !== managerTeamId?.toString()) {
        throw new ForbiddenError('Can only adjust capacity for your team members')
      }
    }

    // Add capacity adjustment
    if (!user.capacityAdjustments) {
      user.capacityAdjustments = []
    }

    user.capacityAdjustments.push({
      type,
      reason,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      adjustedCapacity: adjustedCapacity || 0,
    })

    await user.save()

    // Log activity
    await logActivity(
      'updated',
      'user',
      user._id,
      req.user.id,
      `Capacity adjustment added for user "${user.name}" (${type})`,
      { type, startDate, endDate }
    )

    return successResponse(
      res,
      { user: user.toJSON() },
      'Capacity adjustment added successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Remove capacity adjustment
 * DELETE /api/users/:id/capacity-adjustment/:adjustmentId
 */
export const removeCapacityAdjustment = async (req, res, next) => {
  try {
    // Only manager/admin can remove capacity adjustments
    if (!['admin', 'manager'].includes(req.user.role)) {
      throw new ForbiddenError('Only managers and admins can remove capacity adjustments')
    }

    const { id, adjustmentId } = req.params

    // Find user
    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    // Check team access for managers
    if (req.user.role === 'manager') {
      const userTeamId = user.team?._id || user.team
      const managerTeamId = req.user.team?._id || req.user.team

      if (userTeamId?.toString() !== managerTeamId?.toString()) {
        throw new ForbiddenError('Can only adjust capacity for your team members')
      }
    }

    // Remove adjustment
    if (!user.capacityAdjustments || user.capacityAdjustments.length === 0) {
      throw new BadRequestError('No capacity adjustments found')
    }

    const adjustment = user.capacityAdjustments.id(adjustmentId)
    if (!adjustment) {
      throw new NotFoundError('Capacity adjustment not found')
    }

    user.capacityAdjustments.pull(adjustmentId)
    await user.save()

    // Log activity
    await logActivity(
      'updated',
      'user',
      user._id,
      req.user.id,
      `Capacity adjustment removed for user "${user.name}"`,
      { adjustmentType: adjustment.type }
    )

    return successResponse(
      res,
      { user: user.toJSON() },
      'Capacity adjustment removed successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * ADMIN-ONLY: Download CSV template for bulk user import
 */
export const downloadUserImportTemplate = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can download the template')
    }

    const header = USER_IMPORT_HEADERS.join(',')
    const sampleRow = [
      'Jane Doe',
      'jane.doe@example.com',
      'developer',
      'Platform Team',
      '40',
      '"React;Node"',
      'true',
      'Frontend Engineer',
    ].join(',')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="user-import-template.csv"')
    return res.send(`${header}\n${sampleRow}\n`)
  } catch (error) {
    next(error)
  }
}

/**
 * ADMIN-ONLY: Preview bulk user import CSV
 */
export const previewUserImport = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can import users')
    }

    if (!req.file?.buffer) {
      throw new BadRequestError('CSV file is required')
    }

    let records = []
    try {
      records = parse(req.file.buffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (error) {
      throw new BadRequestError('Invalid CSV format. Please check your file.')
    }

    if (records.length === 0) {
      throw new BadRequestError('CSV file does not contain any rows')
    }

    const emailsInFile = records
      .map((row) => (row.email || '').trim().toLowerCase())
      .filter(Boolean)
    const existingUsers = await User.find({ email: { $in: emailsInFile } }).select('email')
    const existingEmailSet = new Set(existingUsers.map((user) => user.email.toLowerCase()))
    const seenEmails = new Set()
    const teamCache = new Map()

    const validUsers = []
    const errors = []

    for (let index = 0; index < records.length; index++) {
      const row = records[index]
      const { data, errors: rowErrors } = await validateCsvRow(row, {
        rowNumber: index + 2,
        existingEmailSet,
        seenEmails,
        teamCache,
      })

      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
      } else {
        validUsers.push(data)
      }
    }

    return successResponse(
      res,
      {
        preview: {
          totalRows: records.length,
          validCount: validUsers.length,
          invalidCount: errors.length,
          validUsers,
          errors,
        },
      },
      'CSV preview generated successfully'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * ADMIN-ONLY: Confirm bulk user import
 */
export const confirmUserImport = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can import users')
    }

    const { users } = req.body
    if (!Array.isArray(users) || users.length === 0) {
      throw new BadRequestError('Users array is required')
    }

    const emailsInPayload = users
      .map((row) => (row.email || '').trim().toLowerCase())
      .filter(Boolean)
    const existingUsers = await User.find({ email: { $in: emailsInPayload } }).select('email')
    const existingEmailSet = new Set(existingUsers.map((user) => user.email.toLowerCase()))
    const seenEmails = new Set()
    const teamCache = new Map()

    const validUsers = []
    const validationErrors = []

    for (let index = 0; index < users.length; index++) {
      const row = users[index]
      const { data, errors } = await validateCsvRow(row, {
        rowNumber: index + 1,
        existingEmailSet,
        seenEmails,
        teamCache,
      })

      if (errors.length > 0) {
        validationErrors.push(...errors)
      } else {
        validUsers.push(data)
      }
    }

    const createdUsers = []
    const credentials = []
    const creationErrors = []

    for (const userData of validUsers) {
      try {
        const tempPassword = generateTempPassword()
        const hashedPassword = await hashPassword(tempPassword)

        const userDoc = new User({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          availability: userData.availability ?? 40,
          skills: userData.skills || [],
          isActive: userData.isActive,
          title: userData.title || undefined,
          team: userData.teamId || null,
        })

        await userDoc.save()

        if (userData.teamId) {
          await Team.findByIdAndUpdate(
            userData.teamId,
            { $addToSet: { members: userDoc._id } },
            { new: true }
          )
        }

        await logUserAction(req.user, 'user_created', userDoc, {}, req)
        await logActivity(
          'created',
          'user',
          userDoc._id,
          req.user.id,
          'User imported via CSV'
        )

        createdUsers.push({
          id: userDoc._id,
          email: userDoc.email,
          name: userDoc.name,
        })
        credentials.push({
          email: userDoc.email,
          temporaryPassword: tempPassword,
        })
      } catch (error) {
        creationErrors.push({
          rowNumber: userData.rowNumber,
          message: error.message,
        })
        logger.error('Bulk user import creation error:', error)
      }
    }

    return successResponse(
      res,
      {
        summary: {
          totalRows: users.length,
          attempted: validUsers.length,
          created: createdUsers.length,
          validationErrors: validationErrors.length,
          creationErrors: creationErrors.length,
        },
        createdUsers,
        credentials,
        errors: [...validationErrors, ...creationErrors],
      },
      'Bulk user import completed'
    )
  } catch (error) {
    next(error)
  }
}

const USER_IMPORT_HEADERS = [
  'name',
  'email',
  'role',
  'team',
  'availability',
  'skills',
  'isActive',
  'title',
]

const VALID_ROLES = ['admin', 'manager', 'developer', 'viewer']

const validateCsvRow = async (
  row,
  { rowNumber, existingEmailSet = new Set(), seenEmails = new Set(), teamCache = new Map() }
) => {
  const errors = []
  const data = {}

  const name = (row.name || '').trim()
  if (!name) {
    errors.push({ rowNumber, message: 'Name is required' })
  } else {
    data.name = name
  }

  const email = (row.email || '').trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    errors.push({ rowNumber, message: 'Valid email is required' })
  } else {
    if (seenEmails.has(email)) {
      errors.push({ rowNumber, message: `Duplicate email "${email}" in file` })
    }
    if (existingEmailSet.has(email)) {
      errors.push({ rowNumber, message: `Email "${email}" already exists` })
    }
    data.email = email
  }

  const role = (row.role || '').trim().toLowerCase()
  if (!VALID_ROLES.includes(role)) {
    errors.push({ rowNumber, message: `Role must be one of: ${VALID_ROLES.join(', ')}` })
  } else {
    data.role = role
  }

  let availability = row.availability
  if (availability === undefined || availability === null || availability === '') {
    availability = 40
  } else {
    availability = Number(availability)
  }
  if (Number.isNaN(availability)) {
    errors.push({ rowNumber, message: 'Availability must be a number' })
  } else if (availability < 0 || availability > 200) {
    errors.push({ rowNumber, message: 'Availability must be between 0 and 200' })
  } else {
    data.availability = availability
  }

  data.skills = parseSkills(row.skills)
  data.isActive = parseBoolean(row.isActive, true)
  data.title = (row.title || '').trim()

  const teamValue = (row.team || row.teamName || row.teamId || '').trim()
  if (teamValue) {
    const teamMatch = await resolveTeam(teamValue, teamCache)
    if (!teamMatch) {
      errors.push({ rowNumber, message: `Team "${teamValue}" was not found` })
    } else {
      data.teamId = teamMatch.teamId
      data.teamName = teamMatch.teamName
    }
  } else {
    data.teamId = null
    data.teamName = null
  }

  if (errors.length === 0 && email) {
    seenEmails.add(email)
  }

  data.rowNumber = rowNumber
  return { data, errors }
}

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }
  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', 'yes', 'active'].includes(normalized)) {
    return true
  }
  if (['false', '0', 'no', 'inactive'].includes(normalized)) {
    return false
  }
  return defaultValue
}

const parseSkills = (value) => {
  if (!value) return []
  return value
    .split(/[,;|]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
}

const resolveTeam = async (value, cache) => {
  const cacheKey = value.toLowerCase()
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }

  let team = null
  if (mongoose.Types.ObjectId.isValid(value)) {
    team = await Team.findById(value).select('name').lean()
  }
  if (!team) {
    team = await Team.findOne({
      name: { $regex: new RegExp(`^${escapeRegExp(value)}$`, 'i') },
    })
      .select('name')
      .lean()
  }

  const result = team ? { teamId: team._id.toString(), teamName: team.name } : null
  cache.set(cacheKey, result)
  return result
}

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const generateTempPassword = () => {
  const random = crypto.randomBytes(4).toString('hex')
  return `Agile${random}!`
}

