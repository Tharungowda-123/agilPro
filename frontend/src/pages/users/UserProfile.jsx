import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Edit, Mail, Phone, Globe, Calendar, Star, Award, Trophy, Plus, X, Save, Trash2 } from 'lucide-react'
import { useUser, useUserPerformance, useUserActivity, useUpdateUser } from '@/hooks/api/useUsers'
import { useLeaderboard, useUpdateGamificationPreferences } from '@/hooks/api/useGamification'
import { useAuthStore } from '@/stores/useAuthStore'
import { userService } from '@/services/api'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import EditProfileModal from '@/components/users/EditProfileModal'
import Spinner from '@/components/ui/Spinner'
import { toast } from 'react-hot-toast'
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
 * UserProfile Page
 * Display user profile with tabs for Overview, Skills, Performance, and Activity
 */
export default function UserProfile() {
  const { id } = useParams()
  const { user: currentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const { data: user, isLoading, refetch } = useUser(id)
  const { data: performanceData } = useUserPerformance(id)
  const currentUserId = currentUser?._id || currentUser?.id
  const isOwnProfile = currentUserId && (currentUserId.toString() === id.toString())
  const updatePreferences = useUpdateGamificationPreferences()

  const handleLeaderboardToggle = (showOnLeaderboard) => {
    updatePreferences.mutate(
      { showOnLeaderboard },
      {
        onSuccess: () => {
          refetch()
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-gray-600">User not found</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <div className="flex items-start gap-6 pb-6 border-b border-gray-200">
        <Avatar name={user.name} size="xl" src={user.avatar} />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            {user.role && (
              <Badge variant="outlined" size="md">
                {user.role}
              </Badge>
            )}
            {typeof user.gamification?.points === 'number' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-semibold">
                <Star className="w-4 h-4" />
                {user.gamification.points} pts
              </span>
            )}
          </div>
          {user.email && (
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
          )}
          {isOwnProfile && (
            <Button
              variant="outlined"
              onClick={() => setIsEditModalOpen(true)}
              leftIcon={<Edit className="w-4 h-4" />}
              className="mt-4"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'skills', label: 'Skills' },
            { id: 'performance', label: 'Performance' },
            { id: 'activity', label: 'Activity' },
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
        {activeTab === 'overview' && (
          <OverviewTab
            user={user}
            userId={id}
            isOwnProfile={isOwnProfile}
            onToggleLeaderboard={handleLeaderboardToggle}
            loadingSettings={updatePreferences.isPending}
            onUpdate={refetch}
          />
        )}
        {activeTab === 'skills' && (
          <SkillsTab user={user} userId={id} isOwnProfile={isOwnProfile} onUpdate={refetch} />
        )}
        {activeTab === 'performance' && (
          <PerformanceTab user={user} userId={id} performanceData={performanceData} />
        )}
        {activeTab === 'activity' && <ActivityTab user={user} userId={id} />}
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          onSuccess={() => {
            refetch()
          }}
        />
      )}
    </div>
  )
}

// Overview Tab
function OverviewTab({ user, userId, isOwnProfile, onToggleLeaderboard, loadingSettings, onUpdate }) {
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [bio, setBio] = useState(user.bio || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [timezone, setTimezone] = useState(user.timezone || '')
  const updateUser = useUpdateUser()

  const badges = user.gamification?.badges || []
  const showOnLeaderboard = user.gamification?.settings?.showOnLeaderboard !== false

  const handleSaveBio = () => {
    updateUser.mutate(
      {
        id: userId,
        data: { bio },
      },
      {
        onSuccess: () => {
          setIsEditingBio(false)
          onUpdate()
          toast.success('Bio updated successfully')
        },
      }
    )
  }

  const handleSaveContact = () => {
    updateUser.mutate(
      {
        id: userId,
        data: { phone, timezone },
      },
      {
        onSuccess: () => {
          setIsEditingContact(false)
          onUpdate()
          toast.success('Contact information updated successfully')
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {user.gamification && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-500" />
                Achievements & Points
              </h3>
              <p className="text-sm text-gray-600">Celebrate milestones and track progress</p>
            </div>
            {isOwnProfile && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onToggleLeaderboard(!showOnLeaderboard)}
                loading={loadingSettings}
              >
                {showOnLeaderboard ? 'Hide from Leaderboard' : 'Join Leaderboard'}
              </Button>
            )}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 text-2xl font-bold text-primary-600">
              <Star className="w-6 h-6" />
              {user.gamification?.points || 0}
            </div>
            <div className="text-sm text-gray-500">
              Total points · {badges.length} badge{badges.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {badges.length > 0 ? (
              badges.slice(0, 6).map((badge) => (
                <div
                  key={badge.key}
                  className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <span className="text-2xl">{badge.icon || '🏅'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{badge.name}</p>
                    <p className="text-xs text-gray-500">
                      {badge.description || 'Achievement unlocked'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No badges earned yet</p>
            )}
          </div>
        </div>
      )}

      {/* Bio */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Bio</h3>
          {isOwnProfile && !isEditingBio && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingBio(true)}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Edit
            </Button>
          )}
        </div>
        {isEditingBio ? (
          <div className="space-y-3">
            <TextArea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outlined" size="sm" onClick={() => {
                setIsEditingBio(false)
                setBio(user.bio || '')
              }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveBio}
                loading={updateUser.isPending}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">
            {user.bio || 'No bio available'}
          </p>
        )}
      </div>

      {/* Contact Information */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          {isOwnProfile && !isEditingContact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingContact(true)}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Edit
            </Button>
          )}
        </div>
        {isEditingContact ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <Input value={user.email || ''} disabled placeholder="Email" />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                type="tel"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Timezone</label>
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="UTC-5 (EST)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outlined" size="sm" onClick={() => {
                setIsEditingContact(false)
                setPhone(user.phone || '')
                setTimezone(user.timezone || '')
              }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveContact}
                loading={updateUser.isPending}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {user.email && (
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.timezone && (
              <div className="flex items-center gap-2 text-gray-700">
                <Globe className="w-4 h-4 text-gray-400" />
                <span>{user.timezone}</span>
              </div>
            )}
            {!user.phone && !user.timezone && (
              <p className="text-sm text-gray-400">No contact information available</p>
            )}
          </div>
        )}
      </div>

      {/* Team Membership */}
      {user.teams && Array.isArray(user.teams) && user.teams.length > 0 && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Team Membership</h3>
          <div className="space-y-2">
            {user.teams.map((team) => {
              const teamId = team._id || team.id
              const teamName = team.name || team.team?.name || 'Unknown Team'
              const teamRole = team.role || 'Member'
              return (
                <div key={teamId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-900">{teamName}</span>
                  <Badge variant="outlined" size="sm">{teamRole}</Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Current Assignments */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Assignments</h3>
        <div className="space-y-2">
          {user.currentAssignments && Array.isArray(user.currentAssignments) && user.currentAssignments.length > 0 ? (
            user.currentAssignments.map((assignment) => {
              const assignmentId = assignment._id || assignment.id
              return (
                <div key={assignmentId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
                    <p className="text-xs text-gray-500">{assignment.project}</p>
                  </div>
                  <Badge variant="outlined" size="sm">{assignment.status}</Badge>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-gray-400">No current assignments</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Skills Tab
function SkillsTab({ user, userId, isOwnProfile, onUpdate }) {
  const [isAddingSkill, setIsAddingSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillCategory, setNewSkillCategory] = useState('Other')
  const [newSkillProficiency, setNewSkillProficiency] = useState(50)
  const [editingSkill, setEditingSkill] = useState(null)
  const updateUser = useUpdateUser()

  // Normalize skills - handle both array of strings and array of objects
  const normalizedSkills = Array.isArray(user.skills)
    ? user.skills.map((skill) => {
        if (typeof skill === 'string') {
          return { name: skill, category: 'Other', proficiency: 50 }
        }
        return {
          name: skill.name || skill.skill || '',
          category: skill.category || 'Other',
          proficiency: skill.proficiency || skill.level || 50,
        }
      })
    : []

  const skillCategories = {
    Frontend: normalizedSkills.filter((s) => s.category === 'Frontend'),
    Backend: normalizedSkills.filter((s) => s.category === 'Backend'),
    DevOps: normalizedSkills.filter((s) => s.category === 'DevOps'),
    Design: normalizedSkills.filter((s) => s.category === 'Design'),
    Other: normalizedSkills.filter((s) => !s.category || s.category === 'Other'),
  }

  const getProficiencyColor = (level) => {
    if (level >= 80) return 'bg-success-500'
    if (level >= 60) return 'bg-warning-500'
    return 'bg-gray-400'
  }

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) {
      toast.error('Please enter a skill name')
      return
    }

    const newSkill = {
      name: newSkillName.trim(),
      category: newSkillCategory,
      proficiency: newSkillProficiency,
    }

    const updatedSkills = [...normalizedSkills, newSkill]

    updateUser.mutate(
      {
        id: userId,
        data: {
          skills: updatedSkills,
        },
      },
      {
        onSuccess: () => {
          setNewSkillName('')
          setNewSkillCategory('Other')
          setNewSkillProficiency(50)
          setIsAddingSkill(false)
          onUpdate()
          toast.success('Skill added successfully')
        },
      }
    )
  }

  const handleUpdateSkill = async (skillIndex, updatedSkill) => {
    const updatedSkills = [...normalizedSkills]
    updatedSkills[skillIndex] = updatedSkill

    updateUser.mutate(
      {
        id: userId,
        data: {
          skills: updatedSkills,
        },
      },
      {
        onSuccess: () => {
          setEditingSkill(null)
          onUpdate()
          toast.success('Skill updated successfully')
        },
      }
    )
  }

  const handleDeleteSkill = async (skillIndex) => {
    if (!window.confirm('Are you sure you want to remove this skill?')) {
      return
    }

    const updatedSkills = normalizedSkills.filter((_, index) => index !== skillIndex)

    updateUser.mutate(
      {
        id: userId,
        data: {
          skills: updatedSkills,
        },
      },
      {
        onSuccess: () => {
          onUpdate()
          toast.success('Skill removed successfully')
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
          <p className="text-sm text-gray-600">Your technical skills and proficiencies</p>
        </div>
        {isOwnProfile && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddingSkill(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Skill
          </Button>
        )}
      </div>

      {/* Add Skill Form */}
      {isAddingSkill && isOwnProfile && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
          <h4 className="font-semibold text-gray-900">Add New Skill</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Skill name (e.g., React, Python)"
            />
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="DevOps">DevOps</option>
              <option value="Design">Design</option>
              <option value="Other">Other</option>
            </select>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={newSkillProficiency}
                onChange={(e) => setNewSkillProficiency(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12">{newSkillProficiency}%</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outlined" size="sm" onClick={() => setIsAddingSkill(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddSkill} loading={updateUser.isPending}>
              Add Skill
            </Button>
          </div>
        </div>
      )}

      {/* Skills by Category */}
      {Object.entries(skillCategories).map(([category, skills]) => {
        if (skills.length === 0 && !isAddingSkill) return null
        return (
          <div key={category} className="p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">{category}</h4>
            {skills.length === 0 ? (
              <p className="text-sm text-gray-400">No skills in this category</p>
            ) : (
              <div className="space-y-3">
                {skills.map((skill, index) => {
                  const skillIndex = normalizedSkills.findIndex((s) => s.name === skill.name && s.category === skill.category)
                  const isEditing = editingSkill === skillIndex

                  return (
                    <div key={`${skill.name}-${index}`} className="space-y-2">
                      {isEditing && isOwnProfile ? (
                        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Input
                              value={skill.name}
                              onChange={(e) => {
                                const updated = { ...skill, name: e.target.value }
                                handleUpdateSkill(skillIndex, updated)
                              }}
                              placeholder="Skill name"
                            />
                            <select
                              value={skill.category}
                              onChange={(e) => {
                                const updated = { ...skill, category: e.target.value }
                                handleUpdateSkill(skillIndex, updated)
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="Frontend">Frontend</option>
                              <option value="Backend">Backend</option>
                              <option value="DevOps">DevOps</option>
                              <option value="Design">Design</option>
                              <option value="Other">Other</option>
                            </select>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={skill.proficiency}
                                onChange={(e) => {
                                  const updated = { ...skill, proficiency: parseInt(e.target.value) }
                                  handleUpdateSkill(skillIndex, updated)
                                }}
                                className="flex-1"
                              />
                              <span className="text-sm text-gray-600 w-12">{skill.proficiency}%</span>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outlined"
                              size="sm"
                              onClick={() => setEditingSkill(null)}
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                              <span className="text-xs text-gray-600">{skill.proficiency}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={cn('h-2 rounded-full transition-all', getProficiencyColor(skill.proficiency))}
                                style={{ width: `${skill.proficiency}%` }}
                              />
                            </div>
                          </div>
                          {isOwnProfile && (
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingSkill(skillIndex)}
                                leftIcon={<Edit className="w-3 h-3" />}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSkill(skillIndex)}
                                className="text-error-600 hover:text-error-700"
                                leftIcon={<Trash2 className="w-3 h-3" />}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {normalizedSkills.length === 0 && !isAddingSkill && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg text-center py-12">
          <p className="text-gray-500">No skills added yet</p>
          {isOwnProfile && (
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => setIsAddingSkill(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Your First Skill
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Performance Tab
function PerformanceTab({ user, userId, performanceData }) {
  const stats = user.gamification?.stats || performanceData?.stats || {}
  const history = performanceData?.history || performanceData?.performanceHistory || []
  const teamAverage = performanceData?.teamAverage || []

  // Transform history data for charts
  const chartData = history.length > 0
    ? history.map((item) => ({
        month: item.month || item.period || item.date?.substring(0, 7) || 'N/A',
        tasks: item.tasksCompleted || item.tasks || 0,
        points: item.storyPoints || item.points || 0,
      }))
    : []

  const metricCards = [
    { label: 'Tasks Completed', value: stats.tasksCompleted || performanceData?.tasksCompleted || 0 },
    { label: 'Perfect Sprints', value: stats.perfectSprints || performanceData?.perfectSprints || 0 },
    {
      label: 'Fastest Completion',
      value: stats.fastestTaskHours || performanceData?.fastestTaskHours
        ? `${(stats.fastestTaskHours || performanceData.fastestTaskHours).toFixed(1)}h`
        : '—',
    },
    { label: 'Helpful Comments', value: stats.helpfulComments || performanceData?.helpfulComments || 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((metric) => (
          <div key={metric.label} className="p-4 bg-white border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={2} name="Tasks" />
              <Line type="monotone" dataKey="points" stroke="#10b981" strokeWidth={2} name="Story Points" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparison Chart */}
      {teamAverage.length > 0 && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Comparison to Team Average</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamAverage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="userPoints" fill="#3b82f6" name="Your Points" />
              <Bar dataKey="teamAverage" fill="#9ca3af" name="Team Average" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length === 0 && teamAverage.length === 0 && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg text-center py-12">
          <p className="text-gray-500">No performance data available yet</p>
        </div>
      )}

      <LeaderboardWidget />
    </div>
  )
}

function LeaderboardWidget() {
  const { data: leaderboardData, isLoading } = useLeaderboard({ limit: 5 })

  // Ensure leaderboard is always an array
  const leaderboard = Array.isArray(leaderboardData)
    ? leaderboardData
    : Array.isArray(leaderboardData?.data)
    ? leaderboardData.data
    : Array.isArray(leaderboardData?.leaderboard)
    ? leaderboardData.leaderboard
    : []

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary-500" />
          <h4 className="text-lg font-semibold text-gray-900">Developer Leaderboard</h4>
        </div>
        <p className="text-xs text-gray-500">Top performers (opt-in only)</p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Spinner size="sm" />
        </div>
      ) : leaderboard.length === 0 ? (
        <p className="text-sm text-gray-400">Leaderboard disabled or no participants yet.</p>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div
              key={entry.userId || entry._id || entry.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {entry.rank}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{entry.name}</p>
                  {entry.team && <p className="text-xs text-gray-500">{entry.team}</p>}
                </div>
              </div>
              <span className="text-sm font-semibold text-primary-600">{entry.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Activity Tab
function ActivityTab({ user, userId }) {
  const { data: activityData, isLoading } = useUserActivity(userId, { page: 1, limit: 20 })

  const activities = Array.isArray(activityData?.data)
    ? activityData.data
    : Array.isArray(activityData)
    ? activityData
    : []

  const formatTime = (dateString) => {
    if (!dateString) return 'Unknown time'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="md" color="primary" />
        </div>
      ) : activities.length === 0 ? (
        <div className="p-4 bg-white border border-gray-200 rounded-lg text-center py-12">
          <p className="text-gray-500">No activity found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => {
            const activityId = activity._id || activity.id
            const description = activity.description || activity.action || 'Activity'
            const createdAt = activity.createdAt || activity.created_at || activity.timestamp

            return (
              <div key={activityId} className="p-3 bg-white border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-900">
                  {description}
                </p>
                {activity.type && (
                  <Badge variant="outlined" size="sm" className="mt-2">
                    {activity.type}
                  </Badge>
                )}
                <p className="text-xs text-gray-500 mt-1">{formatTime(createdAt)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

