import Skeleton from '@/components/ui/Skeleton'
import Card from '@/components/ui/Card'

/**
 * StoryCardSkeleton Component
 * Skeleton loader matching StoryCard layout
 */
export default function StoryCardSkeleton() {
  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Skeleton variant="text" className="h-5 w-1/3 mb-2" />
          <Skeleton variant="text" className="h-5 w-2/3" />
        </div>
        <Skeleton variant="rectangular" className="h-5 w-16 rounded-full" />
      </div>

      {/* Description */}
      <div className="mb-3 space-y-2">
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-4/5" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="circle" className="w-6 h-6" />
          <Skeleton variant="text" className="h-4 w-20" />
        </div>
        <Skeleton variant="rectangular" className="h-5 w-12 rounded" />
      </div>
    </Card>
  )
}

