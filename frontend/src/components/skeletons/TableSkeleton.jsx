import Skeleton from '@/components/ui/Skeleton'

/**
 * TableSkeleton Component
 * Skeleton loader matching table layout
 */
export default function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* Header */}
        <thead>
          <tr className="border-b border-gray-200">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton variant="text" className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        {/* Body */}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-4">
                  <Skeleton variant="text" className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
}

