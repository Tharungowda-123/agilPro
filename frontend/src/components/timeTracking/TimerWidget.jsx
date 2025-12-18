import { useState, useEffect } from 'react'
import { Play, Pause, Square, Clock } from 'lucide-react'
import { useActiveTimer, useStartTimer, useStopTimer, usePauseTimer, useResumeTimer } from '@/hooks/api/useTimeEntries'
import Button from '@/components/ui/Button'
import { cn } from '@/utils'

/**
 * Timer Widget Component
 * Displays and controls timer for tasks
 */
export default function TimerWidget({ taskId, onTimeLogged }) {
  const { data: activeTimer, isLoading } = useActiveTimer()
  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()
  const pauseTimer = usePauseTimer()
  const resumeTimer = useResumeTimer()

  const [elapsedTime, setElapsedTime] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Check if this task has an active timer
  const taskTimer = activeTimer && activeTimer.task?._id === taskId ? activeTimer : null

  // Update elapsed time every second
  useEffect(() => {
    if (!taskTimer || !taskTimer.isActive || isPaused) {
      return
    }

    const interval = setInterval(() => {
      const startTime = new Date(taskTimer.startTime || taskTimer.createdAt)
      const now = new Date()
      const elapsed = (now - startTime) / (1000 * 60 * 60) // Convert to hours
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [taskTimer, isPaused])

  // Load timer state from localStorage on mount
  useEffect(() => {
    if (!taskTimer) {
      const savedTimer = localStorage.getItem(`timer_${taskId}`)
      if (savedTimer) {
        try {
          const timerData = JSON.parse(savedTimer)
          const startTime = new Date(timerData.startTime)
          const now = new Date()
          const elapsed = (now - startTime) / (1000 * 60 * 60)
          setElapsedTime(elapsed)
        } catch (e) {
          // Invalid data, clear it
          localStorage.removeItem(`timer_${taskId}`)
        }
      }
    }
  }, [taskId, taskTimer])

  const handleStart = async () => {
    try {
      await startTimer.mutateAsync(taskId)
      // Save to localStorage
      localStorage.setItem(
        `timer_${taskId}`,
        JSON.stringify({ startTime: new Date().toISOString(), taskId })
      )
    } catch (error) {
      // Error handled by hook
    }
  }

  const handlePause = async () => {
    if (!taskTimer) return
    try {
      await pauseTimer.mutateAsync(taskTimer._id)
      setIsPaused(true)
      // Save paused state
      const savedTimer = localStorage.getItem(`timer_${taskId}`)
      if (savedTimer) {
        const timerData = JSON.parse(savedTimer)
        timerData.paused = true
        timerData.pausedAt = new Date().toISOString()
        localStorage.setItem(`timer_${taskId}`, JSON.stringify(timerData))
      }
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleResume = async () => {
    if (!taskTimer) return
    try {
      await resumeTimer.mutateAsync(taskTimer._id)
      setIsPaused(false)
      // Update localStorage
      const savedTimer = localStorage.getItem(`timer_${taskId}`)
      if (savedTimer) {
        const timerData = JSON.parse(savedTimer)
        const pausedAt = new Date(timerData.pausedAt || timerData.startTime)
        const now = new Date()
        const pausedDuration = (now - pausedAt) / (1000 * 60 * 60)
        timerData.startTime = new Date(now - pausedDuration * 60 * 60 * 1000).toISOString()
        delete timerData.paused
        delete timerData.pausedAt
        localStorage.setItem(`timer_${taskId}`, JSON.stringify(timerData))
      }
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleStop = async () => {
    if (!taskTimer) return
    try {
      await stopTimer.mutateAsync(taskTimer._id)
      setIsPaused(false)
      setElapsedTime(0)
      localStorage.removeItem(`timer_${taskId}`)
      if (onTimeLogged) {
        onTimeLogged()
      }
    } catch (error) {
      // Error handled by hook
    }
  }

  const formatTime = (hours) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    const s = Math.floor(((hours - h) * 60 - m) * 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const displayTime = taskTimer && taskTimer.isActive && !isPaused
    ? elapsedTime
    : taskTimer?.hours || elapsedTime || 0

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading timer...</div>
  }

  return (
    <div className="space-y-3">
      {/* Timer Display */}
      <div className="flex items-center gap-4">
        <div className="flex-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Elapsed Time</span>
            </div>
            <span className="text-2xl font-mono font-bold text-gray-900">
              {formatTime(displayTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center gap-2">
        {taskTimer && taskTimer.isActive ? (
          <>
            {isPaused ? (
              <Button
                variant="primary"
                onClick={handleResume}
                leftIcon={<Play className="w-4 h-4" />}
                disabled={resumeTimer.isPending}
              >
                Resume
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={handlePause}
                leftIcon={<Pause className="w-4 h-4" />}
                disabled={pauseTimer.isPending}
              >
                Pause
              </Button>
            )}
            <Button
              variant="error"
              onClick={handleStop}
              leftIcon={<Square className="w-4 h-4" />}
              disabled={stopTimer.isPending}
            >
              Stop
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            onClick={handleStart}
            leftIcon={<Play className="w-4 h-4" />}
            disabled={startTimer.isPending}
          >
            Start Timer
          </Button>
        )}
      </div>

      {taskTimer && !taskTimer.isActive && taskTimer.hours > 0 && (
        <p className="text-xs text-gray-500">
          Last session: {taskTimer.hours.toFixed(2)} hours
        </p>
      )}
    </div>
  )
}

