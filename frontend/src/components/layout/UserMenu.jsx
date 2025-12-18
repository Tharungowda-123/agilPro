import { User, Settings, HelpCircle, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import Dropdown from '@/components/ui/Dropdown'

/**
 * UserMenu Component
 * Dropdown menu from user avatar with profile, settings, help, and logout options
 * Displays user name and role
 */
export default function UserMenu({ children }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const menuItems = [
    {
      label: (
        <div className="px-4 py-2 border-b border-gray-200 mb-1">
          <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-500">{user?.email || ''}</p>
        </div>
      ),
      onClick: () => {},
      disabled: true,
      custom: true,
    },
    {
      label: (
        <span className="flex items-center">
          <User className="w-4 h-4 mr-2" />
          Profile
        </span>
      ),
      onClick: () => {
        const userId = user?._id || user?.id
        if (userId) {
          navigate(`/users/${userId}`)
        } else {
          navigate('/settings')
        }
      },
    },
    {
      label: (
        <span className="flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </span>
      ),
      onClick: () => navigate('/settings'),
    },
    {
      label: (
        <span className="flex items-center">
          <HelpCircle className="w-4 h-4 mr-2" />
          Help
        </span>
      ),
      onClick: () => navigate('/help'),
    },
    { type: 'divider' },
    {
      label: (
        <span className="flex items-center">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </span>
      ),
      onClick: () => {
        logout()
        navigate('/login')
      },
      variant: 'danger',
    },
  ]

  return (
    <Dropdown
      trigger={children}
      items={menuItems}
      position="bottom-right"
    />
  )
}

