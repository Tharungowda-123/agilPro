import { useState, useEffect } from 'react'
import { Plus, Users, FolderKanban, TrendingUp } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTeams } from '@/hooks/api/useTeams'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/layout/EmptyState'
import TeamFormModal from '@/components/teams/TeamFormModal'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils'

/**
 * TeamsList Page
 * Display all teams in a grid layout
 */
export default function TeamsList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: teamsData, isLoading } = useTeams()
  const teams = teamsData?.data || teamsData || []
  const modalParam = searchParams.get('modal')

  useEffect(() => {
    if (modalParam === 'createTeam') {
      setIsCreateModalOpen(true)
    }
  }, [modalParam])

  const handleOpenModal = () => {
    setIsCreateModalOpen(true)
    const next = new URLSearchParams(searchParams)
    next.set('modal', 'createTeam')
    setSearchParams(next, { replace: true })
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    if (modalParam === 'createTeam') {
      const next = new URLSearchParams(searchParams)
      next.delete('modal')
      setSearchParams(next, { replace: true })
    }
  }

  const handleTeamClick = (teamId) => {
    const id = teamId?._id || teamId?.id || teamId
    if (id) {
      navigate(`/teams/${id}`)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Teams</h1>
          <p className="text-gray-600">Manage your development teams</p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Team
        </Button>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" color="primary" />
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No teams yet"
          description="Create your first team to get started"
          action={
            <Button variant="primary" onClick={handleOpenModal}>
              Create Team
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const teamId = team._id || team.id
            return (
            <Card
              key={teamId}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleTeamClick(teamId)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{team.description}</p>
                  )}
                </div>
              </div>

              {/* Members */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-2">
                  {team.members?.slice(0, 5).map((member) => (
                    <Avatar
                      key={member.id}
                      name={member.name}
                      size="sm"
                      src={member.avatar}
                      className="border-2 border-white"
                    />
                  ))}
                </div>
                {team.members && team.members.length > 5 && (
                  <span className="text-sm text-gray-500">
                    +{team.members.length - 5} more
                  </span>
                )}
                <span className="text-sm text-gray-600 ml-auto">
                  {team.members?.length || 0} members
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                    <FolderKanban className="w-3 h-3" />
                    <span>Projects</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {team.currentProjects || 0}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Velocity</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {team.averageVelocity || 0} pts
                  </p>
                </div>
              </div>

              {/* Performance Indicator */}
              {team.performance && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Performance</span>
                    <Badge
                      variant={
                        team.performance >= 80
                          ? 'success'
                          : team.performance >= 60
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {team.performance}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        team.performance >= 80
                          ? 'bg-success-500'
                          : team.performance >= 60
                          ? 'bg-warning-500'
                          : 'bg-gray-400'
                      )}
                      style={{ width: `${team.performance}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
            )
          })}
        </div>
      )}

      {/* Create Team Modal */}
      <TeamFormModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

