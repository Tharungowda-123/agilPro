import Skeleton from '@/components/ui/Skeleton'
import Card from '@/components/ui/Card'

/**
 * DashboardSkeleton Component
 * Skeleton loader matching Dashboard layout
 */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-6">
        <Skeleton variant="text" className="h-8 w-64 mb-2" />
        <Skeleton variant="text" className="h-5 w-96" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton variant="text" className="h-4 w-24 mb-4" />
            <Skeleton variant="text" className="h-8 w-16 mb-2" />
            <Skeleton variant="text" className="h-4 w-32" />
          </Card>
        ))}
      </div>

      {/* Charts and Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Skeleton */}
        <Card className="p-6">
          <Skeleton variant="text" className="h-6 w-48 mb-4" />
          <Skeleton variant="rectangular" className="h-64 w-full rounded" />
        </Card>

        {/* Activity Feed Skeleton */}
        <Card className="p-6">
          <Skeleton variant="text" className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton variant="circle" className="w-10 h-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="h-4 w-full" />
                  <Skeleton variant="text" className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

