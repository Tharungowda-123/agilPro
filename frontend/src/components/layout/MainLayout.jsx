import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import ConnectionStatus from './ConnectionStatus'
import OfflineBanner from './OfflineBanner'
import { useSocket } from '@/hooks/useSocket'
import { cn } from '@/utils'

/**
 * MainLayout Component
 * Overall page structure with Sidebar + Navbar + Main content area
 * Responsive with collapsible sidebar on mobile
 * Initializes socket connection for real-time features
 */
export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Initialize socket connection
  useSocket()

  return (
    <div className="min-h-screen bg-app text-[var(--color-text)] transition-colors duration-300">
      <OfflineBanner />
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex relative">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300',
            'lg:ml-64' // Add left margin to account for fixed sidebar (w-64 = 256px)
          )}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Connection Status Indicator */}
      <ConnectionStatus />
    </div>
  )
}
