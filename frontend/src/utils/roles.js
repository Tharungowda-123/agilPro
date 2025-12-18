/**
 * Role-Based Access Control Utilities
 * Helper functions for checking user roles and permissions
 */

/**
 * User roles
 */
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DEVELOPER: 'developer',
  VIEWER: 'viewer',
}

/**
 * Check if user has a specific role
 * @param {Object} user - User object
 * @param {string|string[]} roles - Role(s) to check
 * @returns {boolean}
 */
export const hasRole = (user, roles) => {
  if (!user || !user.role) return false
  const userRole = user.role.toLowerCase()
  const rolesArray = Array.isArray(roles) ? roles : [roles]
  return rolesArray.some((role) => role.toLowerCase() === userRole)
}

/**
 * Check if user is admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isAdmin = (user) => hasRole(user, ROLES.ADMIN)

/**
 * Check if user is manager
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isManager = (user) => hasRole(user, ROLES.MANAGER)

/**
 * Check if user is developer
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isDeveloper = (user) => hasRole(user, ROLES.DEVELOPER)

/**
 * Check if user is viewer
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isViewer = (user) => hasRole(user, ROLES.VIEWER)

/**
 * Check if user can create projects
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canCreateProject = (user) => {
  return isAdmin(user) || isManager(user)
}

/**
 * Check if user can edit project
 * @param {Object} user - User object
 * @param {Object} project - Project object
 * @returns {boolean}
 */
export const canEditProject = (user, project) => {
  if (isAdmin(user)) return true
  if (isManager(user)) {
    // Manager can edit projects from their team
    const userTeamId = user.team?._id || user.team
    const projectTeamId = project?.team?._id || project?.team
    return userTeamId && projectTeamId && userTeamId.toString() === projectTeamId.toString()
  }
  return false
}

/**
 * Check if user can delete project
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canDeleteProject = (user) => {
  return isAdmin(user)
}

/**
 * Check if user can create sprints
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canCreateSprint = (user) => {
  return isAdmin(user) || isManager(user)
}

/**
 * Check if user can assign tasks
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canAssignTask = (user) => {
  return isAdmin(user) || isManager(user)
}

/**
 * Check if user can edit task
 * @param {Object} user - User object
 * @param {Object} task - Task object
 * @returns {boolean}
 */
export const canEditTask = (user, task) => {
  if (isAdmin(user)) return true
  if (isManager(user)) return true // Manager can edit team tasks
  if (isDeveloper(user)) {
    // Developer can only edit tasks assigned to them
    const userId = user._id || user.id
    const assignedToId = task?.assignedTo?._id || task?.assignedTo
    return userId && assignedToId && userId.toString() === assignedToId.toString()
  }
  return false
}

/**
 * Check if user can create/edit stories
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canManageStories = (user) => {
  return isAdmin(user) || isManager(user)
}

/**
 * Check if user can delete stories
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canDeleteStory = (user) => {
  return isAdmin(user) || isManager(user)
}

/**
 * Check if user can view reports
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canViewReports = (user) => {
  return true // All authenticated users can view reports
}

/**
 * Check if user can manage users
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canManageUsers = (user) => {
  return isAdmin(user)
}

/**
 * Check if user can manage teams
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const canManageTeams = (user) => {
  return isAdmin(user) || isManager(user)
}

/**
 * Check if user has write access (can create/edit/delete)
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const hasWriteAccess = (user) => {
  return isAdmin(user) || isManager(user) || isDeveloper(user)
}

/**
 * Check if user has read-only access
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isReadOnly = (user) => {
  return isViewer(user)
}

/**
 * Get role display name
 * @param {string} role - Role string
 * @returns {string}
 */
export const getRoleDisplayName = (role) => {
  const roleMap = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.MANAGER]: 'Manager',
    [ROLES.DEVELOPER]: 'Developer',
    [ROLES.VIEWER]: 'Viewer',
  }
  return roleMap[role?.toLowerCase()] || role || 'Unknown'
}

/**
 * Get role color for badges
 * @param {string} role - Role string
 * @returns {string}
 */
export const getRoleColor = (role) => {
  const colorMap = {
    [ROLES.ADMIN]: 'red',
    [ROLES.MANAGER]: 'blue',
    [ROLES.DEVELOPER]: 'green',
    [ROLES.VIEWER]: 'gray',
  }
  return colorMap[role?.toLowerCase()] || 'gray'
}

