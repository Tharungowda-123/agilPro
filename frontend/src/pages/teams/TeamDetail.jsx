import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Plus, Trash2, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  useTeam,
  useUpdateTeam,
  useAddTeamMembers,
  useRemoveTeamMember,
  useTeamPerformance,
  useCapacityTrends,
} from '@/hooks/api/useTeams'
import { useUsers } from '@/hooks/api/useUsers'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import TeamFormModal from '@/components/teams/TeamFormModal'
import Spinner from '@/components/ui/Spinner'
import CapacityPlanning from './CapacityPlanning'
import TeamCalendar from './TeamCalendar'
import { cn } from '@/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

/**
 * TeamDetail Page
 * Display team details with tabs for Members, Performance, and Capacity
 */
export default function TeamDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('members')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Prevent fetching if id is undefined
  const validId = id && id !== 'undefined' ? id : null
  const { data: team, isLoading } = useTeam(validId)
  const { data: teamPerformanceData, isLoading: teamPerformanceLoading } = useTeamPerformance(validId)
  const { data: capacityTrendsData } = useCapacityTrends(validId, { limit: 8 })
  const { data: usersData } = useUsers()
  const users = usersData?.data || usersData || []
  const updateTeam = useUpdateTeam()

  if (!validId) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Invalid team ID</p>
        <Button variant="primary" onClick={() => navigate('/teams')} className="mt-4">
          Back to Teams
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Team not found</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outlined"
            onClick={() => navigate('/teams')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            {team.description && (
              <p className="text-gray-600 mt-1">{team.description}</p>
            )}
          </div>
        </div>
        <Button
          variant="outlined"
          onClick={() => setIsEditModalOpen(true)}
          leftIcon={<Edit className="w-4 h-4" />}
        >
          Edit Team
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'members', label: 'Members' },
            { id: 'performance', label: 'Performance' },
            { id: 'capacity', label: 'Capacity' },
            { id: 'calendar', label: 'Calendar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'members' && (
          <MembersTab team={team} users={users} teamId={validId} />
        )}
        {activeTab === 'performance' && (
          <PerformanceTab
            team={team}
            teamId={validId}
            performance={teamPerformanceData?.performance}
            velocityHistory={capacityTrendsData?.trends || []}
            loading={teamPerformanceLoading}
          />
        )}
        {activeTab === 'capacity' && <CapacityPlanningTab teamId={id} />}
        {activeTab === 'calendar' && (
          <TeamCalendarTab teamId={id} members={team.members || []} />
        )}
      </div>

      {/* Edit Modal */}
      <TeamFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        team={team}
      />
    </div>
  )
}

// Members Tab
function MembersTab({ team, users, teamId }) {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const addMembers = useAddTeamMembers()
  const removeMember = useRemoveTeamMember()

  const memberIdSet = useMemo(() => {
    const set = new Set()
    ;(team.members || []).forEach((member) => {
      // Handle both populated objects and string IDs
      let memberId = null
      if (typeof member === 'string') {
        memberId = member
      } else if (member?._id) {
        memberId = member._id
      } else if (member?.id) {
        memberId = member.id
      } else if (member?.user?._id) {
        memberId = member.user._id
      } else if (member?.user?.id) {
        memberId = member.user.id
      }
      if (memberId) {
        set.add(memberId.toString())
      }
    })
    return set
  }, [team.members])

  const availableUsers = useMemo(() => {
    return (users || []).filter((user) => {
      const userId = (user?._id || user?.id)?.toString()
      return userId && !memberIdSet.has(userId)
    })
  }, [users, memberIdSet])

  const handleAddMembers = (selectedUserIds) => {
    if (!teamId || !selectedUserIds || selectedUserIds.length === 0) {
      toast.error('Please select at least one user to add')
      return
    }
    
    // Ensure all IDs are strings
    const userIds = selectedUserIds.map(id => id?.toString()).filter(Boolean)
    
    if (userIds.length === 0) {
      toast.error('Invalid user IDs selected')
      return
    }
    
    addMembers.mutate(
      { id: teamId, userIds },
      {
        onSuccess: () => {
          setIsAddMemberOpen(false)
          toast.success(`Added ${userIds.length} member(s) to team`)
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message || 'Failed to add members')
        }
      }
    )
  }

  const handleRemoveMember = (userId) => {
    if (!teamId || !userId) {
      toast.error('Invalid team or user ID')
      return
    }
    
    // Ensure userId is a string
    const userIdStr = userId?.toString()
    if (!userIdStr) {
      toast.error('Invalid user ID')
      return
    }
    
    if (!confirm(`Are you sure you want to remove this member from the team?`)) {
      return
    }
    
    removeMember.mutate(
      { id: teamId, userId: userIdStr },
      {
        onSuccess: () => {
          toast.success('Member removed from team')
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message || 'Failed to remove member')
        }
      }
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          <p className="text-sm text-gray-600">{team.members?.length || 0} members</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsAddMemberOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Member
        </Button>
      </div>

      {team.members && team.members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.members.map((member, index) => {
          // Handle both populated objects and IDs
          const memberId = member?._id || member?.id || member?.user?._id || member?.user?.id || member
          const memberIdStr = memberId?.toString()
          
          // Try to find user details from populated member or users list
          let memberData = member
          if (typeof member === 'string' || !member?.name) {
            // Member is just an ID, find in users list
            memberData = users?.find((u) => {
              const userId = (u._id || u.id)?.toString()
              return userId === memberIdStr
            })
          }
          
          // Fallback to member object if user not found
          if (!memberData && member && typeof member === 'object') {
            memberData = member
          }
          
          const memberName = memberData?.name || member?.name || 'Unknown User'
          const memberAvatar = memberData?.avatar || member?.avatar
          const memberRole = memberData?.role || member?.role
          const memberEmail = memberData?.email || member?.email
          const memberSkills = memberData?.skills || member?.skills || []
          
          return (
            <div
              key={memberIdStr || `member-${index}`}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar name={memberName} size="lg" src={memberAvatar} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 break-words">{memberName}</h4>
                  {memberRole && (
                    <Badge variant="outlined" size="sm" className="mt-1">
                      {memberRole}
                    </Badge>
                  )}
                  {memberEmail && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{memberEmail}</p>
                  )}
                </div>
              </div>

              {/* Skills */}
              {memberSkills && memberSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {memberSkills.slice(0, 3).map((skill, idx) => (
                    <Badge key={idx} variant="outlined" size="sm">
                      {skill}
                    </Badge>
                  ))}
                  {memberSkills.length > 3 && (
                    <Badge variant="outlined" size="sm">
                      +{memberSkills.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Workload */}
              {(memberData?.workload || member?.workload) && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Workload</span>
                    <span>
                      {(memberData?.workload?.current || member?.workload?.current || 0)}/{(memberData?.workload?.capacity || member?.workload?.capacity || 0)} pts
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full transition-all"
                      style={{
                        width: `${((memberData?.workload?.current || member?.workload?.current || 0) / (memberData?.workload?.capacity || member?.workload?.capacity || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Performance */}
              {(memberData?.performance || member?.performance) && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Completion Rate</span>
                    <span className="font-medium">{memberData?.performance || member?.performance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        (memberData?.performance || member?.performance || 0) >= 80
                          ? 'bg-success-500'
                          : (memberData?.performance || member?.performance || 0) >= 60
                          ? 'bg-warning-500'
                          : 'bg-gray-400'
                      )}
                      style={{ width: `${memberData?.performance || member?.performance || 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <Button variant="outlined" size="sm" className="flex-1">
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  size="sm"
                  className="text-error-600 hover:bg-error-50"
                  onClick={() => {
                    if (memberIdStr) {
                      handleRemoveMember(memberIdStr)
                    } else {
                      console.error('Cannot remove member: invalid member ID', member)
                    }
                  }}
                  disabled={removeMember.isPending || !memberIdStr}
                  title="Remove member from team"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )
          })}
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-gray-600 mb-4">No members in this team yet.</p>
          <Button
            variant="primary"
            onClick={() => setIsAddMemberOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add First Member
          </Button>
        </div>
      )}

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        users={availableUsers}
        onSubmit={handleAddMembers}
        loading={addMembers.isPending}
      />
    </div>
  )
}

// Performance Tab
function PerformanceTab({ team, performance, velocityHistory, loading, teamId }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!performance) {
    return (
      <div className="p-6 border border-gray-200 rounded-xl bg-gray-50">
        <p className="text-sm text-gray-600">No performance data available for this team yet.</p>
      </div>
    )
  }

  const avgVelocity = performance.velocity || 0
  const completionRate = Math.round(performance.completionRate || 0)
  const avgStoryPoints = performance.totalPoints || 0

  const velocityChartData = (velocityHistory || []).map((entry, index) => ({
    sprint: entry.sprintName || `Sprint ${index + 1}`,
    actual: entry.completed || entry.velocity || 0,
    planned: entry.committed || entry.capacity || 0,
  }))

  const memberChartData = (performance.memberPerformance || []).map((member) => ({
    name: member.name?.split(' ')[0] || 'Member',
    completed: Math.round(member.completedPoints || 0),
    committed: Math.round(member.totalPoints || 0),
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
        <Link
          to={teamId ? `/reports?teamId=${teamId}` : '/reports'}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View reports
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Average Velocity</p>
          <p className="text-2xl font-bold text-gray-900">{avgVelocity.toFixed(1)} pts</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
          <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Story Points</p>
          <p className="text-2xl font-bold text-gray-900">{performance.totalPoints || 0}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Members</p>
          <p className="text-2xl font-bold text-gray-900">{performance.memberPerformance?.length || team.members?.length || 0}</p>
        </div>
      </div>

      {/* Velocity Trend Chart */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Velocity Trend (Last Sprints)</h4>
        {velocityChartData.length === 0 ? (
          <p className="text-sm text-gray-500">No completed sprints yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={velocityChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprint" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual" />
              <Line type="monotone" dataKey="planned" stroke="#9ca3af" strokeDasharray="5 5" name="Committed" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Member Contribution Chart */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Member Contribution</h4>
        {memberChartData.length === 0 ? (
          <p className="text-sm text-gray-500">No member performance data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memberChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#3b82f6" name="Completed Points" />
              <Bar dataKey="committed" fill="#9ca3af" name="Committed Points" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// Capacity Planning Tab
function CapacityPlanningTab({ teamId }) {
  return <CapacityPlanning teamId={teamId} />
}

function TeamCalendarTab({ teamId, members }) {
  return <TeamCalendar teamId={teamId} members={members} />
}

function AddMemberModal({ isOpen, onClose, users = [], onSubmit, loading }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setSelectedIds([])
    }
  }, [isOpen])

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users
    const lower = searchTerm.toLowerCase()
    return users.filter((user) => {
      const name = user?.name?.toLowerCase() || ''
      const email = user?.email?.toLowerCase() || ''
      return name.includes(lower) || email.includes(lower)
    })
  }, [users, searchTerm])

  const toggleSelection = (userId) => {
    const userIdStr = userId?.toString()
    if (!userIdStr) return
    
    setSelectedIds((prev) =>
      prev.includes(userIdStr) ? prev.filter((id) => id !== userIdStr) : [...prev, userIdStr]
    )
  }

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one user to add')
      return
    }
    onSubmit(selectedIds)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Members" size="lg">
      <div className="space-y-4">
        {users.length === 0 ? (
          <p className="text-sm text-gray-600">
            All available users are already part of this team.
          </p>
        ) : (
          <>
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            />
            <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg divide-y">
              {filteredUsers.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No users match your search.</p>
              ) : (
                filteredUsers.map((user) => {
                  const userId = (user?._id || user?.id)?.toString()
                  if (!userId) return null
                  
                  return (
                    <label
                      key={userId}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(userId)}
                        onChange={() => toggleSelection(userId)}
                        className="rounded border-gray-300"
                      />
                      <Avatar name={user.name || 'User'} size="sm" src={user.avatar} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Unknown User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email || 'No email'}</p>
                      </div>
                      {user.role && (
                        <Badge variant="outlined" size="sm">
                          {user.role}
                        </Badge>
                      )}
                    </label>
                  )
                })
              )}
            </div>
          </>
        )}
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={selectedIds.length === 0 || users.length === 0}
            loading={loading}
          >
            Add {selectedIds.length > 0 ? `${selectedIds.length} member(s)` : 'Members'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

