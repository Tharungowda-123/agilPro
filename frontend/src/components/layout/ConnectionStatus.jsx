import { useState } from 'react'
import { Wifi, WifiOff, Loader } from 'lucide-react'
import { useSocketStore } from '@/stores/socketStore'
import Tooltip from '@/components/ui/Tooltip'
import { cn } from '@/utils'

/**
 * ConnectionStatus Component
 * Small indicator in bottom-right corner showing socket connection status
 * Shows: Connected (green dot), Disconnected (red dot), Reconnecting (yellow pulse)
 * Tooltip with status message
 */
export default function ConnectionStatus({ className = '' }) {
  const { isConnected, isReconnecting } = useSocketStore()
  const [showTooltip, setShowTooltip] = useState(false)

  const getStatus = () => {
    if (isReconnecting) {
      return {
        icon: Loader,
        color: 'text-warning-500',
        bgColor: 'bg-warning-50',
        message: 'Reconnecting...',
        pulse: true,
      }
    }
    if (isConnected) {
      return {
        icon: Wifi,
        color: 'text-success-500',
        bgColor: 'bg-success-50',
        message: 'Connected',
        pulse: false,
      }
    }
    return {
      icon: WifiOff,
      color: 'text-error-500',
      bgColor: 'bg-error-50',
      message: 'Disconnected',
      pulse: false,
    }
  }

  const status = getStatus()
  const Icon = status.icon

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        className
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Tooltip
        content={status.message}
        position="top"
        isOpen={showTooltip}
      >
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full shadow-md cursor-pointer transition-all',
            status.bgColor,
            status.color,
            status.pulse && 'animate-pulse'
          )}
        >
          <Icon
            className={cn(
              'w-5 h-5',
              status.pulse && 'animate-spin'
            )}
          />
        </div>
      </Tooltip>
    </div>
  )
}

