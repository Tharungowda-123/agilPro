import PropTypes from 'prop-types'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

/**
 * StoryStatusPieChart Component
 * Pie chart showing story distribution by status
 * 
 * @example
 * <StoryStatusPieChart data={statusData} />
 */
export default function StoryStatusPieChart({ data = [], className = '' }) {
  const COLORS = {
    backlog: '#9ca3af',
    ready: '#3b82f6',
    in_progress: '#f59e0b',
    review: '#a855f7',
    done: '#10b981',
  }

  return (
    <ResponsiveContainer width="100%" height={300} className={className}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9ca3af'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

StoryStatusPieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
  className: PropTypes.string,
}

