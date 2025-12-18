import PropTypes from 'prop-types'
import { cn } from '@/utils'

/**
 * RiskHeatmap Component
 * Grid visualization of risk levels across projects/sprints
 * 
 * @example
 * <RiskHeatmap data={riskData} />
 */
export default function RiskHeatmap({ data = [], className = '' }) {
  const getRiskColor = (level) => {
    switch (level) {
      case 'high':
        return 'bg-error-500'
      case 'medium':
        return 'bg-warning-500'
      case 'low':
        return 'bg-success-500'
      default:
        return 'bg-gray-200'
    }
  }

  if (data.length === 0) {
    return (
      <div className={cn('p-8 text-center text-gray-400', className)}>
        No risk data available
      </div>
    )
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="inline-block min-w-full">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${data[0]?.risks?.length || 1}, minmax(80px, 1fr))` }}>
          {/* Header */}
          <div className="font-semibold text-sm text-gray-700">Project/Sprint</div>
          {data[0]?.risks?.map((_, index) => (
            <div key={index} className="font-semibold text-sm text-gray-700 text-center">
              Risk {index + 1}
            </div>
          ))}

          {/* Rows */}
          {data.map((item) => (
            <>
              <div className="text-sm text-gray-900 font-medium">{item.name}</div>
              {item.risks.map((risk, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-12 rounded flex items-center justify-center text-white text-xs font-medium',
                    getRiskColor(risk.level)
                  )}
                  title={`${item.name} - ${risk.type}: ${risk.level}`}
                >
                  {risk.level.charAt(0).toUpperCase()}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}

RiskHeatmap.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      risks: PropTypes.arrayOf(
        PropTypes.shape({
          level: PropTypes.oneOf(['low', 'medium', 'high']).isRequired,
          type: PropTypes.string.isRequired,
        })
      ),
    })
  ),
  className: PropTypes.string,
}

