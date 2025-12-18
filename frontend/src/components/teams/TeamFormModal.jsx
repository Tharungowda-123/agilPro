import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import FormGroup from '@/components/ui/FormGroup'
import Avatar from '@/components/ui/Avatar'
import { useCreateTeam, useUpdateTeam } from '@/hooks/api/useTeams'
import { useUsers } from '@/hooks/api/useUsers'
import { toast } from 'react-hot-toast'

/**
 * TeamFormModal Component
 * Modal for creating or editing a team
 * 
 * @example
 * <TeamFormModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   team={team} // Optional, for edit mode
 * />
 */
export default function TeamFormModal({ isOpen, onClose, team = null }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberIds: [],
    capacityPerSprint: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')

  const { data: usersData } = useUsers()
  const users = usersData?.data || usersData || []
  const createTeam = useCreateTeam()
  const updateTeam = useUpdateTeam()

  useEffect(() => {
    if (team) {
      const memberIds = team.members?.map((m) => {
        const id = m._id || m.id || m
        return id?.toString()
      }).filter(Boolean) || []
      
      setFormData({
        name: team.name || '',
        description: team.description || '',
        memberIds,
        capacityPerSprint: team.capacityPerSprint || 0,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        memberIds: [],
        capacityPerSprint: 0,
      })
      setSearchTerm('')
    }
  }, [team, isOpen])

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Team name is required')
      return
    }

    const submitData = {
      ...formData,
      capacityPerSprint: Number(formData.capacityPerSprint),
    }

    if (team) {
      updateTeam.mutate(
        { id: team.id, data: submitData },
        {
          onSuccess: () => {
            onClose()
            toast.success('Team updated!')
          },
        }
      )
    } else {
      createTeam.mutate(submitData, {
        onSuccess: () => {
          onClose()
          toast.success('Team created!')
        },
      })
    }
  }

  const handleToggleMember = (userId) => {
    const userIdStr = userId?.toString()
    if (!userIdStr) return
    
    setFormData((prev) => {
      const currentIds = prev.memberIds.map(id => id?.toString())
      const isSelected = currentIds.includes(userIdStr)
      
      return {
      ...prev,
        memberIds: isSelected
          ? prev.memberIds.filter((id) => id?.toString() !== userIdStr)
          : [...prev.memberIds, userIdStr],
      }
    })
  }

  const filteredUsers = users?.filter((user) => {
    if (!searchTerm) return true
    const lower = searchTerm.toLowerCase()
    const name = user.name?.toLowerCase() || ''
    const email = user.email?.toLowerCase() || ''
    return name.includes(lower) || email.includes(lower)
  }) || []

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={team ? 'Edit Team' : 'Create Team'}>
      <div className="space-y-4">
        <FormGroup label="Team Name" required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter team name"
          />
        </FormGroup>

        <FormGroup label="Description">
          <TextArea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter team description"
            rows={4}
          />
        </FormGroup>

        <FormGroup label="Capacity per Sprint (Story Points)">
          <Input
            type="number"
            value={formData.capacityPerSprint}
            onChange={(e) => setFormData({ ...formData, capacityPerSprint: e.target.value })}
            placeholder="0"
            min="0"
          />
        </FormGroup>

        <FormGroup label="Members">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-3"
          />
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No users found</p>
            ) : (
              filteredUsers.map((user) => {
                const userId = (user._id || user.id)?.toString()
                if (!userId) return null
                
                const memberIds = formData.memberIds.map(id => id?.toString())
                const isSelected = memberIds.includes(userId)
                
                return (
                <label
                    key={userId}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleMember(userId)}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      onClick={(e) => e.stopPropagation()}
                  />
                    <Avatar name={user.name || 'User'} size="sm" src={user.avatar} />
                  <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user.name || 'Unknown User'}</p>
                    {user.email && (
                      <p className="text-xs text-gray-500">{user.email}</p>
                    )}
                  </div>
                </label>
                )
              })
            )}
          </div>
          {formData.memberIds.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {formData.memberIds.length} member{formData.memberIds.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </FormGroup>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={createTeam.isPending || updateTeam.isPending}
          >
            {team ? 'Update Team' : 'Create Team'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

TeamFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  team: PropTypes.object,
}

