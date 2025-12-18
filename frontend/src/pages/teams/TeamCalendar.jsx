import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns'
import {
  Calendar as CalendarIcon,
  Cloud,
  PlusCircle,
  Users,
  Umbrella,
  Sun,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  useTeamCalendar,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  useSyncTeamCalendar,
  useTeamAvailabilityForecast,
  useTeamAvailabilityDashboard,
} from '@/hooks/api/useTeams'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const EVENT_TYPE_LABELS = {
  vacation: 'Vacation',
  sick: 'Sick Leave',
  holiday: 'Holiday',
  training: 'Training',
  'out-of-office': 'Out of Office',
  custom: 'Custom',
}

const EVENT_COLORS = {
  vacation: 'bg-primary-100 text-primary-800',
  sick: 'bg-error-100 text-error-800',
  holiday: 'bg-warning-100 text-warning-800',
  training: 'bg-success-100 text-success-800',
  'out-of-office': 'bg-gray-100 text-gray-800',
  custom: 'bg-gray-100 text-gray-800',
}

const defaultFormState = (dateString) => ({
  title: '',
  description: '',
  type: 'vacation',
  scope: 'member',
  user: '',
  startDate: dateString || format(new Date(), 'yyyy-MM-dd'),
  endDate: dateString || format(new Date(), 'yyyy-MM-dd'),
  capacityImpact: 100,
})

export default function TeamCalendar({ teamId, members = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formState, setFormState] = useState(defaultFormState())
  const [editingEvent, setEditingEvent] = useState(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const rangeParams = useMemo(
    () => ({
      startDate: monthStart.toISOString(),
      endDate: monthEnd.toISOString(),
    }),
    [monthStart, monthEnd]
  )

  const { data: calendarData, isLoading } = useTeamCalendar(teamId, rangeParams)
  const events = calendarData?.events || []
  const { data: forecast } = useTeamAvailabilityForecast(teamId, rangeParams)
  const { data: dashboard } = useTeamAvailabilityDashboard(teamId)

  const createEvent = useCreateCalendarEvent()
  const updateEvent = useUpdateCalendarEvent()
  const deleteEvent = useDeleteCalendarEvent()
  const syncCalendar = useSyncTeamCalendar()

  const daysInMonth = useMemo(
    () =>
      eachDayOfInterval({
        start: monthStart,
        end: monthEnd,
      }),
    [monthStart]
  )

  const eventsByDay = useMemo(() => {
    return daysInMonth.map((day) => {
      const dayEvents = events.filter((event) => {
        const start = new Date(event.startDate)
        const end = new Date(event.endDate)
        return start <= day && day <= end
      })
      return {
        date: day,
        events: dayEvents,
      }
    })
  }, [daysInMonth, events])

  const memberAvailability = useMemo(() => {
    return members.map((member) => {
      const memberId = member._id || member.id
      const unavailable = events.some((event) => {
        if (event.scope === 'team') return true
        if (!event.user) return false
        const userId = event.user._id || event.user.id
        return userId?.toString() === memberId?.toString()
      })
      return {
        name: member.name,
        avatar: member.avatar,
        unavailable,
      }
    })
  }, [members, events])

  const openModal = (day) => {
    setEditingEvent(null)
    setFormState(defaultFormState(format(day || new Date(), 'yyyy-MM-dd')))
    setIsModalOpen(true)
  }

  const openEditModal = (event) => {
    setEditingEvent(event)
    setFormState({
      title: event.title,
      description: event.description || '',
      type: event.type,
      scope: event.scope,
      user: event.user?._id || event.user?.id || '',
      startDate: format(new Date(event.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(event.endDate), 'yyyy-MM-dd'),
      capacityImpact: event.capacityImpact ?? 100,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEvent(null)
    setFormState(defaultFormState())
  }

  const handleSaveEvent = () => {
    const payload = {
      ...formState,
      capacityImpact: Number(formState.capacityImpact),
      user: formState.scope === 'team' ? null : formState.user || null,
    }

    if (editingEvent) {
      updateEvent.mutate(
        { teamId, eventId: editingEvent._id, data: payload },
        { onSuccess: closeModal }
      )
    } else {
      createEvent.mutate(
        { teamId, data: payload },
        { onSuccess: closeModal }
      )
    }
  }

  const handleDeleteEvent = (event) => {
    deleteEvent.mutate(
      { teamId, eventId: event._id },
      { onSuccess: closeModal }
    )
  }

  const handleSync = () => {
    syncCalendar.mutate({ teamId })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-gray-500">Team Calendar</p>
          <h2 className="text-2xl font-semibold text-gray-900">Availability & Capacity</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outlined" size="sm" onClick={() => openModal(new Date())} leftIcon={<PlusCircle className="w-4 h-4" />}>
            Add Event
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSync}
            disabled={syncCalendar.isPending}
            leftIcon={<Cloud className="w-4 h-4" />}
          >
            {syncCalendar.isPending ? 'Syncing...' : 'Sync Google Calendar'}
          </Button>
        </div>
      </div>

      <AvailabilityDashboard dashboard={dashboard} />

      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outlined"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Prev
            </Button>
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <Button
              variant="outlined"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
          <Button variant="text" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
        </div>

        <CalendarGrid eventsByDay={eventsByDay} onDayClick={openModal} onEventClick={openEditModal} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability Forecast</h3>
          <AvailabilityChart forecast={forecast || []} />
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
          <div className="space-y-3 max-h-[360px] overflow-y-auto">
            {memberAvailability.map((member) => (
              <div key={member.name} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.unavailable ? 'Unavailable' : 'Available'}</p>
                </div>
                <Badge variant={member.unavailable ? 'error' : 'success'}>
                  {member.unavailable ? 'Away' : 'Open'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EventList events={events} onEdit={openEditModal} />
        <HolidayPreview upcoming={dashboard?.upcomingHolidays || []} />
      </div>

      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={closeModal}
          formState={formState}
          setFormState={setFormState}
          members={members}
          onSave={handleSaveEvent}
          onDelete={editingEvent ? () => handleDeleteEvent(editingEvent) : null}
          isSaving={createEvent.isPending || updateEvent.isPending}
        />
      )}
    </div>
  )
}

function CalendarGrid({ eventsByDay, onDayClick, onEventClick }) {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500 uppercase">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {eventsByDay.map((entry) => (
          <button
            key={entry.date.toISOString()}
            type="button"
            onClick={() => onDayClick(entry.date)}
            className={`min-h-[120px] border rounded-lg p-2 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              isToday(entry.date) ? 'border-primary-500' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">{format(entry.date, 'd')}</span>
              {isToday(entry.date) && (
                <Badge size="sm" variant="primary">
                  Today
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              {entry.events.slice(0, 3).map((event) => (
                <div
                  key={event._id}
                  className={`text-xs rounded px-2 py-1 cursor-pointer ${EVENT_COLORS[event.type] || EVENT_COLORS.custom}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick(event)
                  }}
                >
                  <p className="font-medium truncate">{event.title}</p>
                  <p className="text-[10px] opacity-80">
                    {event.scope === 'team'
                      ? 'Whole team'
                      : event.user?.name || 'Member'}
                  </p>
                </div>
              ))}
              {entry.events.length > 3 && (
                <p className="text-[10px] text-gray-500 mt-1">
                  +{entry.events.length - 3} more
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function EventList({ events, onEdit }) {
  const upcoming = [...events]
    .filter((event) => new Date(event.endDate) >= new Date())
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 5)

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
      </div>
      <div className="space-y-3">
        {upcoming.length === 0 && (
          <p className="text-sm text-gray-500">No upcoming events in this window.</p>
        )}
        {upcoming.map((event) => (
          <div
            key={event._id}
            className="flex items-center justify-between border border-gray-100 rounded p-3"
          >
            <div>
              <p className="font-medium text-gray-900">{event.title}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(event.startDate), 'MMM d')} -{' '}
                {format(new Date(event.endDate), 'MMM d')}
              </p>
              <p className="text-xs text-gray-500">
                {event.scope === 'team' ? 'Whole team' : event.user?.name || 'Member'}
              </p>
            </div>
            <Button variant="text" size="sm" onClick={() => onEdit(event)}>
              Edit
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function HolidayPreview({ upcoming }) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Sun className="w-5 h-5 text-warning-500" />
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Holidays</h3>
      </div>
      <div className="space-y-3">
        {upcoming.length === 0 && (
          <p className="text-sm text-gray-500">No holidays scheduled.</p>
        )}
        {upcoming.map((event) => (
          <div key={event._id} className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 text-warning-700 rounded-full">
              <Umbrella className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{event.title}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(event.startDate), 'MMM d')} -{' '}
                {format(new Date(event.endDate), 'MMM d')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AvailabilityChart({ forecast }) {
  if (!forecast || forecast.length === 0) {
    return <p className="text-sm text-gray-500">Not enough data to project availability.</p>
  }

  const chartData = forecast.slice(0, 14).map((entry) => ({
    date: format(new Date(entry.date), 'MMM d'),
    available: Number(entry.availableCapacity.toFixed(2)),
    total: Number(entry.totalCapacity.toFixed(2)),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="available" stroke="#10b981" strokeWidth={2} name="Available" />
        <Line type="monotone" dataKey="total" stroke="#94a3b8" strokeWidth={2} name="Total" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function AvailabilityDashboard({ dashboard }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <DashboardCard
        icon={<Users className="w-5 h-5" />}
        title="Team Members"
        value={dashboard?.totalMembers || 0}
      />
      <DashboardCard
        icon={<Umbrella className="w-5 h-5" />}
        title="Unavailable Today"
        value={dashboard?.currentlyUnavailable || 0}
        description={
          dashboard?.unavailableMembers?.length
            ? dashboard.unavailableMembers.join(', ')
            : 'All hands available'
        }
      />
      <DashboardCard
        icon={<Sun className="w-5 h-5" />}
        title="Next Holiday"
        value={
          dashboard?.upcomingHolidays?.[0]
            ? format(new Date(dashboard.upcomingHolidays[0].startDate), 'MMM d')
            : 'None'
        }
        description={dashboard?.upcomingHolidays?.[0]?.title}
      />
      <DashboardCard
        icon={<Cloud className="w-5 h-5" />}
        title="Last Sync"
        value={
          dashboard?.nextSync
            ? format(new Date(dashboard.nextSync), 'MMM d, HH:mm')
            : 'Not synced'
        }
        description="Google Calendar"
      />
    </div>
  )
}

function DashboardCard({ icon, title, value, description }) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 text-primary-600">{icon}</div>
      <p className="text-sm text-gray-500 mt-2">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>}
    </div>
  )
}

function EventModal({
  isOpen,
  onClose,
  formState,
  setFormState,
  members,
  onSave,
  onDelete,
  isSaving,
}) {
  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Team Calendar Event">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <Input
            value={formState.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <Input
            value={formState.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Optional notes"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={formState.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={formState.scope}
              onChange={(e) => handleChange('scope', e.target.value)}
            >
              <option value="member">Single Member</option>
              <option value="team">Entire Team</option>
            </select>
          </div>
        </div>
        {formState.scope === 'member' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={formState.user}
              onChange={(e) => handleChange('user', e.target.value)}
            >
              <option value="">Select member</option>
              {members.map((member) => (
                <option key={member._id || member.id} value={member._id || member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <Input
              type="date"
              value={formState.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <Input
              type="date"
              value={formState.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacity Impact (% of capacity removed)
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formState.capacityImpact}
            onChange={(e) => handleChange('capacityImpact', e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between pt-4">
          {onDelete ? (
            <Button variant="text" onClick={onDelete} className="text-error-600">
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

