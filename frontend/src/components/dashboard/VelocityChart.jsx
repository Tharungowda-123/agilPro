import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils'

/**
 * VelocityChart Component
 * Displays sprint velocity comparison (Planned vs Actual)
 * 
 * @example
 * <VelocityChart data={velocityData} loading={false} />
 */
export default function VelocityChart({ data = [], loading = false, className = '' }) {
  const chartData = useMemo(() => {
    // Ensure data is always an array
    if (!data) {
      return []
    }
    if (Array.isArray(data)) {
      return data
    }
    // If data is an object, try to extract history array
    if (data.history && Array.isArray(data.history)) {
      return data.history
    }
    // Fallback to empty array
    return []
  }, [data])

  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" color="primary" />
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Sprint Velocity</h3>
          <p className="text-sm text-gray-600">Planned vs Actual story points</p>
        </div>
        <Link
          to="/reports"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View reports
        </Link>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: '#374151', fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => (
              <span style={{ color: '#6b7280', fontSize: '14px' }}>{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="planned"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Planned"
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Actual"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

VelocityChart.propTypes = {
  data: PropTypes.array,
  loading: PropTypes.bool,
  className: PropTypes.string,
}

