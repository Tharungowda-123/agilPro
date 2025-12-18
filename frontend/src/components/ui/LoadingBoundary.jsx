import { Suspense } from 'react'
import PropTypes from 'prop-types'
import Spinner from './Spinner'
import Skeleton from './Skeleton'

/**
 * LoadingBoundary Component
 * Suspense boundary with loading spinner or skeleton
 * 
 * @example
 * <LoadingBoundary fallback={<Skeleton />}>
 *   <LazyComponent />
 * </LoadingBoundary>
 */
export default function LoadingBoundary({ children, fallback, useSkeleton = false }) {
  const defaultFallback = useSkeleton ? (
    <div className="space-y-4 p-4">
      <Skeleton variant="text" className="h-8 w-3/4" />
      <Skeleton variant="rectangular" className="h-32 w-full" />
      <Skeleton variant="text" className="h-4 w-full" />
      <Skeleton variant="text" className="h-4 w-2/3" />
    </div>
  ) : (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" />
    </div>
  )

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>
}

LoadingBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  useSkeleton: PropTypes.bool,
}

