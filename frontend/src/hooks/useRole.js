import { useAuthStore } from '@/stores/useAuthStore'
import {
  hasRole,
  isAdmin,
  isManager,
  isDeveloper,
  isViewer,
  canCreateProject,
  canEditProject,
  canDeleteProject,
  canCreateSprint,
  canAssignTask,
  canEditTask,
  canManageStories,
  canDeleteStory,
  canViewReports,
  canManageUsers,
  canManageTeams,
  hasWriteAccess,
  isReadOnly,
  getRoleDisplayName,
  getRoleColor,
} from '@/utils/roles'

/**
 * useRole Hook
 * Provides role-based access control utilities
 * 
 * @example
 * const { user, isAdmin, canCreateProject } = useRole()
 * if (canCreateProject) {
 *   // Show create button
 * }
 */
export function useRole() {
  const { user } = useAuthStore()

  return {
    user,
    role: user?.role,
    hasRole: (roles) => hasRole(user, roles),
    isAdmin: isAdmin(user),
    isManager: isManager(user),
    isDeveloper: isDeveloper(user),
    isViewer: isViewer(user),
    canCreateProject: canCreateProject(user),
    canEditProject: (project) => canEditProject(user, project),
    canDeleteProject: canDeleteProject(user),
    canCreateSprint: canCreateSprint(user),
    canAssignTask: canAssignTask(user),
    canEditTask: (task) => canEditTask(user, task),
    canManageStories: canManageStories(user),
    canDeleteStory: canDeleteStory(user),
    canViewReports: canViewReports(user),
    canManageUsers: canManageUsers(user),
    canManageTeams: canManageTeams(user),
    hasWriteAccess: hasWriteAccess(user),
    isReadOnly: isReadOnly(user),
    getRoleDisplayName: () => getRoleDisplayName(user?.role),
    getRoleColor: () => getRoleColor(user?.role),
  }
}

