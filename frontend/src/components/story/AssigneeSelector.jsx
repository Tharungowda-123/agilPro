import { useState } from 'react'
import PropTypes from 'prop-types'
import { Search, User, X } from 'lucide-react'
import Dropdown from '@/components/ui/Dropdown'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'
import { cn } from '@/utils'

/**
 * AssigneeSelector Component
 * Dropdown for selecting story/task assignee
 * 
 * @example
 * <AssigneeSelector
 *   value={assigneeId}
 *   onChange={setAssigneeId}
 *   users={users}
 *   placeholder="Assign to..."
 * />
 */
export default function AssigneeSelector({
  value,
  onChange,
  users = [],
  placeholder = 'Assign to...',
  className = '',
}) {
  const [searchTerm, setSearchTerm] = useState('')

  // Normalize user IDs - handle both _id and id formats
  const selectedUser = users.find((u) => {
    const userId = u._id || u.id
    return userId && value && userId.toString() === value.toString()
  })
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (userId) => {
    onChange(userId === value ? null : userId)
  }

  const trigger = (
    <button
      className={cn(
        'flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors w-full text-left',
        className
      )}
    >
      {selectedUser ? (
        <>
          <Avatar name={selectedUser.name} size="sm" src={selectedUser.avatar} />
          <span className="text-sm text-gray-900 flex-1">{selectedUser.name}</span>
          <X
            className="w-4 h-4 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
          />
        </>
      ) : (
        <>
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 flex-1">{placeholder}</span>
        </>
      )}
    </button>
  )

  const items = [
    {
      custom: true,
      label: (
        <div className="p-2">
          <Input
            placeholder="Search users..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="mb-2"
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors flex items-center gap-2',
                !value && 'bg-primary-50 text-primary-600'
              )}
            >
              <User className="w-4 h-4" />
              <span>Unassigned</span>
            </button>
            {filteredUsers.map((user) => {
              const userId = user._id || user.id
              return (
              <button
                key={userId}
                type="button"
                onClick={() => handleSelect(userId)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors flex items-center gap-2',
                  value && userId && value.toString() === userId.toString() && 'bg-primary-50 text-primary-600'
                )}
              >
                <Avatar name={user.name} size="sm" src={user.avatar} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  {user.email && (
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  )}
                </div>
              </button>
            )
            })}
          </div>
        </div>
      ),
    },
  ]

  return <Dropdown trigger={trigger} items={items} position="bottom-left" />
}

AssigneeSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string,
      avatar: PropTypes.string,
    })
  ),
  placeholder: PropTypes.string,
  className: PropTypes.string,
}

