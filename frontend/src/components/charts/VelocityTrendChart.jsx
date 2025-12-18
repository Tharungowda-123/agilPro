import PropTypes from 'prop-types'
import { useState } from 'react'
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
import Button from '@/components/ui/Button'

/**
 * VelocityTrendChart Component
 * Line chart showing velocity trends over sprints
 * 
 * @example
 * <VelocityTrendChart data={velocityData} teams={teams} />
 */
export default function VelocityTrendChart({ data = [], teams = [], className = '' }) {
  const [showPlanned, setShowPlanned] = useState(true)
  const [selectedTeams, setSelectedTeams] = useState(teams.map((t) => t.id))

  const toggleTeam = (teamId) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => toggleTeam(team.id)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedTeams.includes(team.id)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>
        <Button
          variant="outlined"
          size="sm"
          onClick={() => setShowPlanned(!showPlanned)}
        >
          {showPlanned ? 'Hide' : 'Show'} Planned
        </Button>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="sprint" />
          <YAxis />
          <Tooltip />
          <Legend />
          {selectedTeams.map((teamId) => {
            const team = teams.find((t) => t.id === teamId)
            if (!team) return null
            return (
              <Line
                key={`${teamId}-actual`}
                type="monotone"
                dataKey={`team_${teamId}_actual`}
                stroke={team.color || '#3b82f6'}
                strokeWidth={2}
                name={`${team.name} (Actual)`}
              />
            )
          })}
          {showPlanned && (
            <Line
              type="monotone"
              dataKey="planned"
              stroke="#9ca3af"
              strokeDasharray="5 5"
              strokeWidth={2}
              name="Planned"
            />
          )}
          <Line
            type="monotone"
            dataKey="average"
            stroke="#10b981"
            strokeDasharray="3 3"
            strokeWidth={1}
            name="Average"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

VelocityTrendChart.propTypes = {
  data: PropTypes.array.isRequired,
  teams: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      color: PropTypes.string,
    })
  ),
  className: PropTypes.string,
}

