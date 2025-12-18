import PropTypes from 'prop-types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'

const formatHistory = (history = []) =>
  history.map((value, index) => ({
    label: `Sprint ${index + 1}`,
    value,
  }))

export default function VelocityForecastCard({ data, loading, className = '' }) {
  if (loading) {
    return (
      <Card className={`p-5 ${className}`}>
        <Skeleton className="h-32" />
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className={`p-5 ${className}`}>
        <p className="text-sm text-gray-500">Velocity forecast will appear once the AI service runs.</p>
      </Card>
    )
  }

  const historyChart = formatHistory(data.history)
  const forecastValue = data.forecast?.predicted_velocity ?? '--'
  const confidenceInterval = data.forecast?.confidence_interval
  const confidenceText = Array.isArray(confidenceInterval)
    ? `${confidenceInterval[0]} - ${confidenceInterval[1]} pts`
    : 'N/A'

  return (
    <Card className={`p-5 space-y-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Velocity Forecast</p>
          <h3 className="text-lg font-semibold text-gray-900">
            {data.team?.name || 'Team'}{' '}
            <span className="text-sm text-gray-400 font-normal">(next sprint)</span>
          </h3>
        </div>
        <Badge variant="outlined" size="sm">
          Capacity {data.capacity?.sprintCapacity || '--'} pts
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Predicted Velocity</p>
          <p className="text-2xl font-semibold text-gray-900">{forecastValue} pts</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Confidence Range</p>
          <p className="text-2xl font-semibold text-gray-900">{confidenceText}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Historical Avg</p>
          <p className="text-2xl font-semibold text-gray-900">
            {data.capacity?.historicalAverage || '--'} pts
          </p>
        </div>
      </div>

      {historyChart.length > 0 && (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyChart}>
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <Tooltip
                formatter={(value) => [`${value} pts`, 'Velocity']}
                labelFormatter={(label) => label}
              />
              <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

VelocityForecastCard.propTypes = {
  data: PropTypes.shape({
    team: PropTypes.object,
    capacity: PropTypes.object,
    history: PropTypes.arrayOf(PropTypes.number),
    forecast: PropTypes.object,
  }),
  loading: PropTypes.bool,
  className: PropTypes.string,
}

