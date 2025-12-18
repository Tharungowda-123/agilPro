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
 * TeamPerformanceChart Component
 * Bar chart comparing team velocities
 * 
 * @example
 * <TeamPerformanceChart data={teamData} />
 */
export default function TeamPerformanceChart({ data = [], className = '' }) {
  return (
    <ResponsiveContainer width="100%" height={300} className={className}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="velocity" fill="#3b82f6" name="Velocity" />
        <Bar dataKey="capacity" fill="#9ca3af" name="Capacity" />
      </BarChart>
    </ResponsiveContainer>
  )
}

TeamPerformanceChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      velocity: PropTypes.number.isRequired,
      capacity: PropTypes.number.isRequired,
    })
  ),
  className: PropTypes.string,
}

