/**
 * Permission Utilities
 * Helper functions for role-based access control
 */

/**
 * Check if user can view a project
 * @param {Object} user - User object with role and team
 * @param {Object} project - Project object with team reference
 * @returns {boolean} True if user can view the project
 */
export const canViewProject = (user, project) => {
  // Admin can view all projects
  if (user.role === 'admin') {
    return true
  }

  // Others can only view projects from their team
  if (user.team && project.team) {
    const userTeamId = user.team._id ? user.team._id.toString() : user.team.toString()
    const projectTeamId = project.team._id ? project.team._id.toString() : project.team.toString()
    return userTeamId === projectTeamId
  }

  // If user has no team or project has no team, deny access
  return false
}

/**
 * Check if user can edit a project
 * @param {Object} user - User object with role and team
 * @param {Object} project - Project object with team reference
 * @returns {boolean} True if user can edit the project
 */
export const canEditProject = (user, project) => {
  // Admin can edit all projects
  if (user.role === 'admin') {
    return true
  }

  // Manager can edit projects from their team
  if (user.role === 'manager' && user.team && project.team) {
    const userTeamId = user.team._id ? user.team._id.toString() : user.team.toString()
    const projectTeamId = project.team._id ? project.team._id.toString() : project.team.toString()
    return userTeamId === projectTeamId
  }

  // Others cannot edit projects
  return false
}

/**
 * Check if user can delete a project
 * @param {Object} user - User object with role
 * @param {Object} project - Project object (not used but kept for consistency)
 * @returns {boolean} True if user can delete the project
 */
export const canDeleteProject = (user, project) => {
  // Only admin can delete projects
  return user.role === 'admin'
}

/**
 * Check if user can assign a task
 * @param {Object} user - User object with role and team
 * @param {Object} task - Task object with story reference
 * @returns {boolean} True if user can assign the task
 */
export const canAssignTask = async (user, task) => {
  // Admin can assign any task
  if (user.role === 'admin') {
    return true
  }

  // Manager can assign tasks from their team's projects
  if (user.role === 'manager' && user.team && task.story) {
    // Need to check if task's story belongs to a project from user's team
    // This requires populating the story's project
    const Story = (await import('../models/Story.js')).default
    const story = await Story.findById(task.story).populate('project', 'team')
    
    if (story && story.project && story.project.team) {
      const userTeamId = user.team._id ? user.team._id.toString() : user.team.toString()
      const projectTeamId = story.project.team._id 
        ? story.project.team._id.toString() 
        : story.project.team.toString()
      return userTeamId === projectTeamId
    }
  }

  // Others cannot assign tasks
  return false
}

/**
 * Check if user can view a team
 * @param {Object} user - User object with role and team
 * @param {Object} team - Team object
 * @returns {boolean} True if user can view the team
 */
export const canViewTeam = (user, team) => {
  // Admin can view all teams
  if (user.role === 'admin') {
    return true
  }

  // Manager, Developer, Viewer can only view their own team
  if (user.team && team) {
    const userTeamId = user.team._id ? user.team._id.toString() : user.team.toString()
    const teamId = team._id ? team._id.toString() : team.toString()
    return userTeamId === teamId
  }

  return false
}

/**
 * Check if user can edit a task
 * @param {Object} user - User object with role, team, and id
 * @param {Object} task - Task object with assignedTo and story reference (can be populated)
 * @returns {boolean} True if user can edit the task
 */
export const canEditTask = (user, task) => {
  // Admin can edit any task
  if (user.role === 'admin') {
    return true
  }

  // Manager can edit tasks from their team's projects
  if (user.role === 'manager' && user.team && task.story) {
    // If story is populated with project, use it directly
    if (task.story.project && task.story.project.team) {
      const userTeamId = user.team._id ? user.team._id.toString() : user.team.toString()
      const projectTeamId = task.story.project.team._id 
        ? task.story.project.team._id.toString() 
        : task.story.project.team.toString()
      return userTeamId === projectTeamId
    }
  }

  // Developer can edit tasks assigned to them
  if (user.role === 'developer' && task.assignedTo) {
    const userId = user._id ? user._id.toString() : user.id.toString()
    const assignedToId = task.assignedTo._id 
      ? task.assignedTo._id.toString() 
      : task.assignedTo.toString()
    return userId === assignedToId
  }

  // Others cannot edit tasks
  return false
}

/**
 * Check if user is manager of a team
 * @param {Object} user - User object with role and team
 * @param {Object} team - Team object
 * @returns {boolean} True if user is manager of the team
 */
export const isManagerOfTeam = (user, team) => {
  if (user.role !== 'manager') {
    return false
  }

  if (!user.team || !team) {
    return false
  }

  const userTeamId = user.team._id ? user.team._id.toString() : user.team.toString()
  const teamId = team._id ? team._id.toString() : team.toString()
  return userTeamId === teamId
}

/**
 * Check if user can manage a resource (admin or manager of resource's team)
 * @param {Object} user - User object with role and team
 * @param {Object} resource - Resource object with team reference
 * @returns {boolean} True if user can manage the resource
 */
export const canManageResource = (user, resource) => {
  // Admin can manage all resources
  if (user.role === 'admin') {
    return true
  }

  // Manager can manage resources from their team
  if (user.role === 'manager' && user.team && resource.team) {
    const userTeamId = user.team._id ? user.team._id.toString() : user.team.toString()
    const resourceTeamId = resource.team._id 
      ? resource.team._id.toString() 
      : resource.team.toString()
    return userTeamId === resourceTeamId
  }

  return false
}

