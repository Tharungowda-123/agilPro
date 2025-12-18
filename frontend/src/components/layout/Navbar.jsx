import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/utils'
import ProjectSelector from './ProjectSelector'
import NotificationDropdown from './NotificationDropdown'
import GlobalSearch from '@/components/search/GlobalSearch'
import UserMenu from './UserMenu'
import { useAuthStore } from '@/stores/useAuthStore'
import Avatar from '@/components/ui/Avatar'

/**
 * Navbar Component
 * Top navigation bar with hamburger menu, project selector, search, notifications, and user menu
 * Sticky positioning with shadow on scroll
 */
export default function Navbar({ onMenuClick }) {
  const { user, isAuthenticated } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      <nav
        className={cn(
          'bg-surface border-b theme-border sticky top-0 z-50 transition-shadow duration-200',
          scrolled && 'shadow-md'
        )}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              {/* Hamburger Menu (Mobile) */}
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Project Selector */}
              <ProjectSelector />
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Global Search */}
              <GlobalSearch />

              {/* Notifications */}
              <NotificationDropdown />

              {/* User Menu */}
              <UserMenu>
                <button className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors">
                  <Avatar
                    name={user?.name}
                    src={user?.avatar}
                    size="sm"
                  />
                </button>
              </UserMenu>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
