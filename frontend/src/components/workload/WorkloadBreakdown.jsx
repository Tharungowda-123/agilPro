import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/utils'

/**
 * Workload Breakdown Component
 * Shows breakdown by status, priority, and project
 */
export default function WorkloadBreakdown({ workload }) {
  if (!workload || !workload.breakdown) return null

  const { byStatus, byPriority, byProject } = workload.breakdown

  // Prepare chart data
  const statusData = [
    { name: 'To Do', value: byStatus.todo.points, count: byStatus.todo.tasks + byStatus.todo.stories },
    {
      name: 'In Progress',
      value: byStatus['in-progress'].points,
      count: byStatus['in-progress'].tasks + byStatus['in-progress'].stories,
    },
    {
      name: 'Review',
      value: byStatus.review.points,
      count: byStatus.review.tasks + byStatus.review.stories,
    },
  ]

  const priorityData = [
    { name: 'High', value: byPriority.high.points, count: byPriority.high.tasks + byPriority.high.stories },
    {
      name: 'Medium',
      value: byPriority.medium.points,
      count: byPriority.medium.tasks + byPriority.medium.stories,
    },
    { name: 'Low', value: byPriority.low.points, count: byPriority.low.tasks + byPriority.low.stories },
  ]

  const COLORS = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
    todo: '#6b7280',
    'in-progress': '#3b82f6',
    review: '#8b5cf6',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* By Status */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">By Status</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {statusData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{
                    backgroundColor:
                      item.name === 'To Do'
                        ? COLORS.todo
                        : item.name === 'In Progress'
                        ? COLORS['in-progress']
                        : COLORS.review,
                  }}
                />
                <span className="text-gray-700">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="font-medium text-gray-900">{item.value.toFixed(1)} pts</span>
                <span className="text-gray-500 ml-2">({item.count})</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* By Priority */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">By Priority</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={priorityData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value.toFixed(1)}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {priorityData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === 'High'
                      ? COLORS.high
                      : entry.name === 'Medium'
                      ? COLORS.medium
                      : COLORS.low
                  }
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {priorityData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{
                    backgroundColor:
                      item.name === 'High'
                        ? COLORS.high
                        : item.name === 'Medium'
                        ? COLORS.medium
                        : COLORS.low,
                  }}
                />
                <span className="text-gray-700">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="font-medium text-gray-900">{item.value.toFixed(1)} pts</span>
                <span className="text-gray-500 ml-2">({item.count})</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* By Project */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">By Project</h4>
        <div className="space-y-3">
          {byProject && byProject.length > 0 ? (
            byProject.map((project, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-900">{project.name}</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {project.points.toFixed(1)} pts
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({project.tasks + project.stories})
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No project data</p>
          )}
        </div>
      </Card>
    </div>
  )
}

