import { useState, useEffect } from 'react'
import { User, Check, X, Sparkles, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils'
import { useTeams } from '@/hooks/api/useTeams'
import { useAssignTask } from '@/hooks/api/useTasks'
import { toast } from 'react-hot-toast'

/**
 * Task Assignment Suggestions Component
 * Shows AI recommendations for task assignments with ability to accept or change
 */
export default function TaskAssignmentSuggestions({
  task,
  recommendations = [],
  onAssign,
  onCancel,
  projectId,
  loading = false,
}) {
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const { data: teamsData } = useTeams()
  const assignTask = useAssignTask()

  useEffect(() => {
    // Get team members from project
    if (teamsData) {
      const teams = Array.isArray(teamsData?.data) ? teamsData.data : teamsData || []
      const projectTeam = teams.find((t) => t.projects?.includes(projectId))
      if (projectTeam && projectTeam.members) {
        setTeamMembers(projectTeam.members)
      }
    }
  }, [teamsData, projectId])

  useEffect(() => {
    // Set top recommendation as default
    if (recommendations.length > 0 && !selectedUserId) {
      const topRec = recommendations[0]
      setSelectedUserId(topRec.userId || topRec.user?._id || topRec.user?.id)
    }
  }, [recommendations, selectedUserId])

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error('Please select a team member')
      return
    }

    try {
      await assignTask.mutateAsync({
        taskId: task.id || task._id,
        userId: selectedUserId,
      })
      toast.success('Task assigned successfully!')
      onAssign?.(selectedUserId)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign task')
    }
  }

  const topRecommendation = recommendations[0]
  const selectedUser = teamMembers.find((m) => (m._id || m.id) === selectedUserId) ||
    recommendations.find((r) => (r.userId || r.user?._id || r.user?.id) === selectedUserId)?.user

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{task.description}</p>
          )}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="sm" color="primary" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Getting AI recommendations...</span>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">No recommendations available</p>
        </div>
      ) : (
        <>
          {/* Top Recommendation */}
          {topRecommendation && (
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium text-primary-900 dark:text-primary-100">AI Recommendation</span>
                <Badge className="bg-primary-600 text-white">
                  {Math.round((topRecommendation.confidence || 0) * 100)}% match
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                {topRecommendation.user?.avatar ? (
                  <img
                    src={topRecommendation.user.avatar}
                    alt={topRecommendation.userName || topRecommendation.user?.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {topRecommendation.userName || topRecommendation.user?.name || 'Unknown User'}
                  </p>
                  {topRecommendation.reasoning && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{topRecommendation.reasoning}</p>
                  )}
                  {topRecommendation.skill_match_score && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Skill Match: {topRecommendation.skill_match_score}/10</span>
                      {topRecommendation.workload_percentage && (
                        <span className="text-xs text-gray-500">
                          Workload: {topRecommendation.workload_percentage}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedUserId(topRecommendation.userId || topRecommendation.user?._id || topRecommendation.user?.id)
                    handleAssign()
                  }}
                  loading={assignTask.isPending}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Assign
                </Button>
              </div>
            </div>
          )}

          {/* Change Assignment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Or assign to someone else:</label>
            <Select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select team member...</option>
              {teamMembers.map((member) => {
                const memberId = member._id || member.id
                return (
                  <option key={memberId} value={memberId}>
                    {member.name || member.email}
                    {member.role && ` (${member.role})`}
                  </option>
                )
              })}
            </Select>
          </div>

          {/* All Recommendations */}
          {recommendations.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Other recommendations:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recommendations.slice(1).map((rec, index) => {
                  const recUserId = rec.userId || rec.user?._id || rec.user?.id
                  return (
                    <div
                      key={recUserId || index}
                      className={cn(
                        'p-2 rounded border cursor-pointer transition-colors',
                        selectedUserId === recUserId
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                      onClick={() => setSelectedUserId(recUserId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {rec.user?.avatar ? (
                            <img
                              src={rec.user.avatar}
                              alt={rec.userName || rec.user?.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {rec.userName || rec.user?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Math.round((rec.confidence || 0) * 100)}% match
                            </p>
                          </div>
                        </div>
                        {selectedUserId === recUserId && (
                          <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="primary"
              onClick={handleAssign}
              loading={assignTask.isPending}
              disabled={!selectedUserId}
              className="flex-1"
              leftIcon={<Check className="w-4 h-4" />}
            >
              Assign Task
            </Button>
            {onCancel && (
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  )
}

