import PropTypes from 'prop-types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils'

/**
 * BurndownChart Component
 * Displays sprint burndown chart with ideal and actual lines
 * 
 * @example
 * <BurndownChart data={burndownData} loading={false} />
 */
export default function BurndownChart({ data = [], loading = false, className = '' }) {
  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" color="primary" />
        </div>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center py-8">
          <p className="text-gray-600">No burndown data available</p>
        </div>
      </Card>
    )
  }

  // Find today's date
  const today = new Date().toISOString().split('T')[0]
  const todayIndex = data.findIndex((d) => d.date === today)

  return (
    <Card className={cn('p-6', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Sprint Burndown</h3>
        <p className="text-sm text-gray-600">Ideal vs Actual story points remaining</p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
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
            labelFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            }}
            formatter={(value) => [value, 'Points']}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => (
              <span style={{ color: '#6b7280', fontSize: '14px' }}>{value}</span>
            )}
          />
          {/* Today reference line */}
          {todayIndex >= 0 && (
            <ReferenceLine
              x={data[todayIndex].date}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Today', position: 'top' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Ideal"
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

BurndownChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      ideal: PropTypes.number.isRequired,
      actual: PropTypes.number.isRequired,
    })
  ),
  loading: PropTypes.bool,
  className: PropTypes.string,
}

