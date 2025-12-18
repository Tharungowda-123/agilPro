import { Lightbulb, ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useSuggestedTasks } from '@/hooks/api/useUsers'
import { useAuthStore } from '@/stores/useAuthStore'
import { cn } from '@/utils'

/**
 * Capacity Forecast Component
 * Shows available capacity and suggested tasks
 */
export default function CapacityForecast({ workload, onTaskClick }) {
  const { user } = useAuthStore()
  const userId = user?._id || user?.id
  const { data: suggestions, isLoading } = useSuggestedTasks(userId, {
    maxSuggestions: 5,
  })

  if (!workload) return null

  const { availablePoints, isOverloaded } = workload

  if (isOverloaded) {
    return null // Don't show suggestions if overloaded
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-primary-600" />
        <h4 className="text-sm font-semibold text-gray-900">AI Recommendations</h4>
      </div>

      {availablePoints > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Based on your remaining capacity of <span className="font-medium">{availablePoints.toFixed(1)} points</span>, here are some suggested tasks:
          </p>

          {isLoading ? (
            <div className="text-sm text-gray-500">Loading suggestions...</div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => onTaskClick?.(suggestion)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge size="sm" variant="outlined">
                          {suggestion.storyPoints} pts
                        </Badge>
                        {suggestion.priority && (
                          <Badge
                            size="sm"
                            variant={
                              suggestion.priority === 'high'
                                ? 'error'
                                : suggestion.priority === 'medium'
                                ? 'warning'
                                : 'success'
                            }
                          >
                            {suggestion.priority}
                          </Badge>
                        )}
                        {suggestion.project && (
                          <span className="text-xs text-gray-500">{suggestion.project.name}</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No suggested tasks available at this time.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-600">You're at full capacity. Great work!</p>
      )}
    </Card>
  )
}

