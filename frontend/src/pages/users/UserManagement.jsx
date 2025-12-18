import { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Key,
  UserCheck,
  UserX,
  Search,
  Filter,
  MoreVertical,
  Activity,
  CheckSquare,
  X,
  Eye,
  Upload,
} from 'lucide-react'
import { useUsers, useCreateUser, useAdminUpdateUser, useResetUserPassword, useDeactivateUser, useActivateUser, useAssignUserToTeam, useBulkUserAction, useUserActivity } from '@/hooks/api/useUsers'
import { useTeams } from '@/hooks/api/useTeams'
import { useRole } from '@/hooks/useRole'
import { useAuthStore } from '@/stores/useAuthStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import FormGroup from '@/components/ui/FormGroup'
import { cn } from '@/utils'
import BulkUserImportModal from '@/components/users/BulkUserImportModal'
// Date formatting helper
const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  if (!date) return 'Never'
  const d = new Date(date)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  if (formatStr === 'MMM d, yyyy') {
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  } else if (formatStr === 'MMM d, yyyy h:mm a') {
    const hours = d.getHours()
    const minutes = d.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
  }
  return d.toLocaleDateString()
}

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'developer', label: 'Developer' },
  { value: 'viewer', label: 'Viewer' },
]

/**
 * User Management Page
 * Admin-only page for managing users with full CRUD operations
 */
export default function UserManagement() {
  const { isAdmin } = useRole()
  const { user: currentUser } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [passwordUserId, setPasswordUserId] = useState(null)
  const [activityUserId, setActivityUserId] = useState(null)
  const [page, setPage] = useState(1)
  const limit = 20

  // Build query params
  const queryParams = {
    page,
    limit,
    search: searchTerm || undefined,
    role: roleFilter || undefined,
    teamId: teamFilter || undefined,
    includeInactive: includeInactive ? 'true' : undefined,
  }

  const { data: usersData, isLoading, refetch } = useUsers(queryParams)
  const { data: teamsData } = useTeams({ limit: 100 })
  const createUser = useCreateUser()
  const updateUser = useAdminUpdateUser()
  const resetPassword = useResetUserPassword()
  const deactivateUser = useDeactivateUser()
  const activateUser = useActivateUser()
  const assignToTeam = useAssignUserToTeam()
  const bulkAction = useBulkUserAction()

  const users = usersData?.data || usersData || []
  const pagination = usersData?.pagination || {}
  const teams = teamsData?.data || teamsData || []

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </Card>
      </div>
    )
  }

  const handleCreateUser = (userData) => {
    createUser.mutate(userData, {
      onSuccess: () => {
        setShowCreateModal(false)
      },
    })
  }

  const handleUpdateUser = (userData) => {
    updateUser.mutate(
      { id: editingUser._id, data: userData },
      {
        onSuccess: () => {
          setShowEditModal(false)
          setEditingUser(null)
        },
      }
    )
  }

  const handleResetPassword = (newPassword) => {
    resetPassword.mutate(
      { id: passwordUserId, newPassword },
      {
        onSuccess: () => {
          setShowPasswordModal(false)
          setPasswordUserId(null)
        },
      }
    )
  }

  const handleDeactivate = (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      deactivateUser.mutate(userId)
    }
  }

  const handleActivate = (userId) => {
    activateUser.mutate(userId)
  }

  const handleAssignTeam = (userId, teamId) => {
    assignToTeam.mutate({ id: userId, teamId })
  }

  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user')
      return
    }

    if (action === 'deactivate' && selectedUsers.includes(currentUser.id)) {
      alert('You cannot deactivate your own account')
      return
    }

    if (window.confirm(`Are you sure you want to ${action} ${selectedUsers.length} user(s)?`)) {
      bulkAction.mutate(
        { userIds: selectedUsers, action },
        {
          onSuccess: () => {
            setSelectedUsers([])
          },
        }
      )
    }
  }

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map((u) => u._id || u.id))
    }
  }

  const teamOptions = [
    { value: '', label: 'No Team' },
    ...teams.map((team) => ({ value: team._id || team.id, label: team.name })),
  ]

  const handleImportComplete = () => {
    refetch?.()
    setShowImportModal(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => setShowImportModal(true)}
          >
            Import CSV
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Create User
          </Button>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              placeholder="Filter by role"
              options={[{ value: '', label: 'All Roles' }, ...ROLES]}
              value={roleFilter}
              onChange={setRoleFilter}
              className="w-[150px]"
            />
            <Select
              placeholder="Filter by team"
              options={[{ value: '', label: 'All Teams' }, ...teamOptions.slice(1)]}
              value={teamFilter}
              onChange={setTeamFilter}
              className="w-[180px]"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Include inactive</span>
            </label>
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedUsers.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('activate')}
              >
                Activate
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleBulkAction('deactivate')}
              >
                Deactivate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUsers([])}
                leftIcon={<X className="w-4 h-4" />}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner size="lg" color="primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={selectAllUsers}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        <CheckSquare
                          className={cn(
                            'w-4 h-4',
                            selectedUsers.length === users.length
                              ? 'text-primary-600'
                              : 'text-gray-400'
                          )}
                        />
                        Select All
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Team
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Last Login
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => {
                    const isSelected = selectedUsers.includes(user._id || user.id)
                    const isCurrentUser = (user._id || user.id) === currentUser.id

                    return (
                      <tr
                        key={user._id || user.id}
                        className={cn(
                          'hover:bg-gray-50 transition-colors',
                          !user.isActive && 'opacity-60'
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUserSelection(user._id || user.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-700">
                                {(user.name || 'U')[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              {user.skills && user.skills.length > 0 && (
                                <p className="text-xs text-gray-500">
                                  {user.skills.slice(0, 2).join(', ')}
                                  {user.skills.length > 2 && '...'}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              user.role === 'admin'
                                ? 'danger'
                                : user.role === 'manager'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {user.team?.name || 'No Team'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.isActive ? 'success' : 'default'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(user.lastLogin)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActivityUserId(user._id || user.id)
                                setShowActivityModal(true)
                              }}
                              leftIcon={<Activity className="w-4 h-4" />}
                            >
                              Activity
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user)
                                setShowEditModal(true)
                              }}
                              leftIcon={<Edit className="w-4 h-4" />}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPasswordUserId(user._id || user.id)
                                setShowPasswordModal(true)
                              }}
                              leftIcon={<Key className="w-4 h-4" />}
                            >
                              Reset
                            </Button>
                            {user.isActive ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeactivate(user._id || user.id)}
                                disabled={isCurrentUser}
                                leftIcon={<UserX className="w-4 h-4" />}
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleActivate(user._id || user.id)}
                                leftIcon={<UserCheck className="w-4 h-4" />}
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * limit) + 1} to{' '}
                  {Math.min(pagination.page * limit, pagination.total)} of {pagination.total}{' '}
                  users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        teams={teams}
        loading={createUser.isPending}
      />

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingUser(null)
          }}
          onSubmit={handleUpdateUser}
          user={editingUser}
          teams={teams}
          loading={updateUser.isPending}
        />
      )}

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false)
          setPasswordUserId(null)
        }}
        onSubmit={handleResetPassword}
        loading={resetPassword.isPending}
      />

      {/* User Activity Modal */}
      {activityUserId && (
        <UserActivityModal
          isOpen={showActivityModal}
          onClose={() => {
            setShowActivityModal(false)
            setActivityUserId(null)
          }}
          userId={activityUserId}
        />
      )}

      <BulkUserImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onComplete={handleImportComplete}
      />
    </div>
  )
}

// Create User Modal Component
function CreateUserModal({ isOpen, onClose, onSubmit, teams, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'developer',
    skills: [],
    availability: 40,
    teamId: '',
  })
  const [skillInput, setSkillInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      teamId: formData.teamId || null,
      skills: formData.skills,
    })
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      })
      setSkillInput('')
    }
  }

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    })
  }

  const teamOptions = [
    { value: '', label: 'No Team' },
    ...teams.map((team) => ({ value: team._id || team.id, label: team.name })),
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormGroup label="Name" required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            required
          />
        </FormGroup>

        <FormGroup label="Email" required>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
            required
          />
        </FormGroup>

        <FormGroup label="Password" required>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter password (min 6 characters)"
            required
            minLength={6}
          />
        </FormGroup>

        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Role" required>
            <Select
              options={ROLES}
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
            />
          </FormGroup>

          <FormGroup label="Availability">
            <Input
              type="number"
              value={formData.availability}
              onChange={(e) =>
                setFormData({ ...formData, availability: parseInt(e.target.value) || 0 })
              }
              min="0"
              max="200"
            />
          </FormGroup>
        </div>

        <FormGroup label="Team">
          <Select
            options={teamOptions}
            value={formData.teamId}
            onChange={(value) => setFormData({ ...formData, teamId: value })}
          />
        </FormGroup>

        <FormGroup label="Skills">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
              />
              <Button type="button" onClick={addSkill} variant="outline">
                Add
              </Button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="default" className="flex items-center gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-gray-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </FormGroup>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Edit User Modal Component
function EditUserModal({ isOpen, onClose, onSubmit, user, teams, loading }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'developer',
    skills: user.skills || [],
    availability: user.availability || 40,
    teamId: user.team?._id || user.team || '',
  })
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'developer',
        skills: user.skills || [],
        availability: user.availability || 40,
        teamId: user.team?._id || user.team || '',
      })
    }
  }, [user])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      teamId: formData.teamId || null,
    })
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      })
      setSkillInput('')
    }
  }

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    })
  }

  const teamOptions = [
    { value: '', label: 'No Team' },
    ...teams.map((team) => ({ value: team._id || team.id, label: team.name })),
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormGroup label="Name" required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            required
          />
        </FormGroup>

        <FormGroup label="Email" required>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
            required
          />
        </FormGroup>

        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Role" required>
            <Select
              options={ROLES}
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
            />
          </FormGroup>

          <FormGroup label="Availability">
            <Input
              type="number"
              value={formData.availability}
              onChange={(e) =>
                setFormData({ ...formData, availability: parseInt(e.target.value) || 0 })
              }
              min="0"
              max="200"
            />
          </FormGroup>
        </div>

        <FormGroup label="Team">
          <Select
            options={teamOptions}
            value={formData.teamId}
            onChange={(value) => setFormData({ ...formData, teamId: value })}
          />
        </FormGroup>

        <FormGroup label="Skills">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
              />
              <Button type="button" onClick={addSkill} variant="outline">
                Add
              </Button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="default" className="flex items-center gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-gray-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </FormGroup>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Reset Password Modal Component
function ResetPasswordModal({ isOpen, onClose, onSubmit, loading }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    onSubmit(password)
    setPassword('')
    setConfirmPassword('')
  }

  useEffect(() => {
    if (!isOpen) {
      setPassword('')
      setConfirmPassword('')
      setError('')
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset User Password" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormGroup label="New Password" required>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password (min 6 characters)"
            required
            minLength={6}
          />
        </FormGroup>

        <FormGroup label="Confirm Password" required>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            minLength={6}
          />
        </FormGroup>

        {error && <p className="text-sm text-error-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Reset Password
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// User Activity Modal Component
function UserActivityModal({ isOpen, onClose, userId }) {
  const [page, setPage] = useState(1)
  const { data: activityData, isLoading } = useUserActivity(userId, { page, limit: 20 })

  const activities = activityData?.data || activityData || []
  const pagination = activityData?.pagination || {}

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Activity" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Spinner size="lg" color="primary" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No activity found</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity._id || activity.id}
                className="p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.createdAt, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <Badge variant="default" className="ml-2">
                    {activity.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

