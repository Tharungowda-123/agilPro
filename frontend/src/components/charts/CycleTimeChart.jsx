import PropTypes from 'prop-types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

/**
 * CycleTimeChart Component
 * Bar chart showing cycle time and lead time metrics
 * 
 * @example
 * <CycleTimeChart cycleTimeData={cycleData} leadTimeData={leadData} />
 */
export default function CycleTimeChart({
  cycleTimeData = [],
  leadTimeData = [],
  showLeadTime = true,
  className = '',
}) {
  const combinedData = cycleTimeData.map((item, index) => ({
    ...item,
    leadTime: leadTimeData[index]?.value || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={300} className={className}>
      <BarChart data={combinedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#3b82f6" name="Cycle Time (days)" />
        {showLeadTime && (
          <Bar dataKey="leadTime" fill="#10b981" name="Lead Time (days)" />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

CycleTimeChart.propTypes = {
  cycleTimeData: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
  leadTimeData: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
  showLeadTime: PropTypes.bool,
  className: PropTypes.string,
}

