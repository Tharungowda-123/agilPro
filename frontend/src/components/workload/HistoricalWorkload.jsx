import Card from '@/components/ui/Card'
import {
  LineChart,
  Line,
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
 * Historical Workload Component
 * Shows weekly capacity usage graph and comparison
 */
export default function HistoricalWorkload({ history, currentWorkload }) {
  if (!history || history.length === 0) {
    return (
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Historical Workload</h4>
        <p className="text-sm text-gray-400 text-center py-8">No historical data available</p>
      </Card>
    )
  }

  // Prepare chart data
  const chartData = history.map((item) => ({
    sprint: item.sprintName || `Sprint ${item.sprintId}`,
    capacity: item.capacity,
    assigned: item.assigned,
    utilization: item.utilization,
  }))

  // Add current workload if available
  if (currentWorkload) {
    chartData.push({
      sprint: 'Current',
      capacity: currentWorkload.capacity,
      assigned: currentWorkload.assignedPoints,
      utilization: currentWorkload.utilization,
    })
  }

  return (
    <Card className="p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">Historical Workload Trends</h4>
      <div className="space-y-4">
        {/* Utilization Trend */}
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">Utilization %</h5>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprint" />
              <YAxis domain={[0, 120]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="utilization"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Utilization %"
              />
              <Line
                type="monotone"
                dataKey="capacity"
                stroke="#9ca3af"
                strokeDasharray="5 5"
                name="Capacity"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Capacity vs Assigned */}
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">Capacity vs Assigned</h5>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprint" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="capacity" fill="#9ca3af" name="Capacity" />
              <Bar dataKey="assigned" fill="#3b82f6" name="Assigned" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-xs font-medium text-gray-700">Sprint</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-gray-700">Capacity</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-gray-700">Assigned</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-gray-700">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 px-2 text-gray-900">{item.sprint}</td>
                  <td className="py-2 px-2 text-right text-gray-600">{item.capacity.toFixed(1)}</td>
                  <td className="py-2 px-2 text-right text-gray-900">{item.assigned.toFixed(1)}</td>
                  <td className="py-2 px-2 text-right">
                    <span
                      className={item.utilization >= 100 ? 'text-error-600' : item.utilization >= 80 ? 'text-warning-600' : 'text-success-600'}
                    >
                      {item.utilization}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}

