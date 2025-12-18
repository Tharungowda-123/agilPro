import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { cn } from '@/utils'

/**
 * OfflineBanner Component
 * Fixed banner at top showing offline/online status
 * Auto-hides when back online
 */
export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showBanner, setShowBanner] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Hide banner after a short delay when back online
      setTimeout(() => {
        setShowBanner(false)
      }, 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showBanner) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-300',
        isOnline
          ? 'bg-success-500 text-white'
          : 'bg-warning-500 text-white'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="container-custom flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5" />
            <span className="text-sm font-medium">You're back online!</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5" />
            <span className="text-sm font-medium">
              You're offline. Some features may be unavailable.
            </span>
          </>
        )}
      </div>
    </div>
  )
}

