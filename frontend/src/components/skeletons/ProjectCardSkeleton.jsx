import Skeleton from '@/components/ui/Skeleton'
import Card from '@/components/ui/Card'

/**
 * ProjectCardSkeleton Component
 * Skeleton loader matching ProjectCard layout
 */
export default function ProjectCardSkeleton() {
  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton variant="text" className="h-6 w-3/4 mb-2" />
          <Skeleton variant="text" className="h-4 w-1/2" />
        </div>
        <Skeleton variant="rectangular" className="h-6 w-20 rounded-full" />
      </div>

      {/* Description */}
      <div className="mb-4 space-y-2">
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-5/6" />
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton variant="text" className="h-4 w-20" />
          <Skeleton variant="text" className="h-4 w-12" />
        </div>
        <Skeleton variant="rectangular" className="h-2 w-full rounded-full" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="text" className="h-4 w-24" />
        <Skeleton variant="text" className="h-4 w-20" />
      </div>

      {/* Team Members */}
      <div className="flex items-center gap-2">
        <Skeleton variant="circle" className="w-8 h-8" />
        <Skeleton variant="circle" className="w-8 h-8" />
        <Skeleton variant="circle" className="w-8 h-8" />
        <Skeleton variant="circle" className="w-8 h-8" />
      </div>
    </Card>
  )
}

