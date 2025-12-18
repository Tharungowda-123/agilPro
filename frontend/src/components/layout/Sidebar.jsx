import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Folder,
  LayoutGrid,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Building2,
  Activity,
  X,
  LogOut,
  UserCog,
  Target,
} from 'lucide-react'
import { cn } from '@/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRole } from '@/hooks/useRole'
import Avatar from '@/components/ui/Avatar'

// Base menu items with role requirements
const allMenuItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'manager', 'developer', 'viewer'] },
  { path: '/projects', icon: Folder, label: 'Projects', roles: ['admin', 'manager', 'developer', 'viewer'] },
  { path: '/features', icon: Target, label: 'Features', roles: ['admin', 'manager'] },
  { path: '/board', icon: LayoutGrid, label: 'Board', roles: ['admin', 'manager', 'developer', 'viewer'] },
  { path: '/sprints', icon: Calendar, label: 'Sprints', roles: ['admin', 'manager', 'developer', 'viewer'] },
  { path: '/teams', icon: Users, label: 'Team', roles: ['admin', 'manager'] },
  { path: '/organization', icon: Building2, label: 'Organization', roles: ['admin'] },
  { path: '/users', icon: UserCog, label: 'User Management', roles: ['admin'] },
  { path: '/system-health', icon: Activity, label: 'System Health', roles: ['admin'] },
  { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'manager', 'developer', 'viewer'] },
  { path: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'manager', 'developer', 'viewer'] },
]

/**
 * Sidebar Component
 * Vertical navigation menu with logo, navigation items, and user profile section
 * Collapsible on mobile with smooth transitions
 */
export default function Sidebar({ isOpen = false, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { role } = useRole()

  // Filter menu items based on user role
  // Get role from useRole hook or fallback to user.role from auth store
  const userRole = role || user?.role
  
  const menuItems = userRole
    ? allMenuItems.filter((item) => item.roles.includes(userRole))
    : allMenuItems // Show all items if role is not available (during initial load)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r theme-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-auto',
          'lg:top-16', // Account for navbar height on desktop
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full lg:h-[calc(100vh-4rem)]">
          {/* Logo Section */}
          <div className="flex items-center justify-between p-6 border-b theme-border">
            <Link to="/dashboard" className="flex items-center gap-2" onClick={onClose}>
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="font-heading text-xl font-bold text-gray-900 dark:text-white">
                AgileSAFe AI
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-4 px-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || 
                  (item.path === '/dashboard' && location.pathname === '/') ||
                  (item.path === '/users' && location.pathname === '/users' && !location.pathname.match(/^\/users\/[^/]+$/))

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-200 font-medium shadow-sm'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800/70'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5',
                          isActive ? 'text-primary-600 dark:text-primary-300' : 'text-current'
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t theme-border">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
              <Avatar
                name={user?.name}
                src={user?.avatar}
                size="sm"
                online
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
                  {user?.role || 'user'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 mt-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
