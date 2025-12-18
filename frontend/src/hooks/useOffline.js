import { useState, useEffect } from 'react'

/**
 * useOffline Hook
 * Detects when user is offline/online
 * 
 * @returns {boolean} - true if offline, false if online
 * 
 * @example
 * const isOffline = useOffline();
 * if (isOffline) {
 *   // Show offline message
 * }
 */
export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOffline
}

export default useOffline

