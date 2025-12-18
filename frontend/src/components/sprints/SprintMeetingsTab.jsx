import { useMemo, useState } from 'react'
import {
  CalendarClock,
  Users,
  Clock,
  MapPin,
  Video,
  StickyNote,
  RefreshCw,
  Mail,
  Plus,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/layout/EmptyState'
import { useRole } from '@/hooks/useRole'
import {
  useSprintMeetings,
  useCreateMeeting,
  useAddMeetingNote,
  useResendMeetingInvites,
} from '@/hooks/api/useMeetings'
import ScheduleMeetingModal from '@/components/sprints/ScheduleMeetingModal'
import { formatDateTime } from '@/utils'

const TYPE_LABELS = {
  planning: 'Sprint Planning',
  review: 'Sprint Review',
  retrospective: 'Retrospective',
  refinement: 'Backlog Refinement',
  custom: 'Custom Meeting',
}

const statusVariantMap = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'error',
}

export default function SprintMeetingsTab({ sprint }) {
  const { isManager, isAdmin } = useRole()
  const canManage = isManager || isAdmin
  const sprintId = sprint?._id || sprint?.id
  const { data: meetings = [], isLoading } = useSprintMeetings(sprintId)
  const createMeeting = useCreateMeeting()
  const addNote = useAddMeetingNote()
  const resendInvites = useResendMeetingInvites()
  const [isModalOpen, setModalOpen] = useState(false)
  const [noteDrafts, setNoteDrafts] = useState({})

  const summary = useMemo(() => {
    if (!meetings || meetings.length === 0) {
      return {
        planning: null,
        review: null,
        retrospective: null,
        total: 0,
      }
    }
    const map = {
      planning: meetings.find((m) => m.type === 'planning') || null,
      review: meetings.find((m) => m.type === 'review') || null,
      retrospective: meetings.find((m) => m.type === 'retrospective') || null,
      total: meetings.length,
    }
    return map
  }, [meetings])

  const handleCreate = (formData) => {
    createMeeting.mutate(
      { sprintId, data: formData },
      {
        onSuccess: () => {
          setModalOpen(false)
        },
      }
    )
  }

  const handleAddNote = (meetingId) => {
    const content = noteDrafts[meetingId]
    if (!content?.trim()) return

    addNote.mutate(
      { meetingId, data: { content }, sprintId },
      {
        onSuccess: () => {
          setNoteDrafts((prev) => ({ ...prev, [meetingId]: '' }))
        },
      }
    )
  }

  const handleResendInvites = (meetingId) => {
    resendInvites.mutate({ meetingId, sprintId })
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Sprint Meetings</h3>
          <p className="text-sm text-gray-500">
            Coordinate planning, review, and retrospective ceremonies with your team.
          </p>
        </div>
        {canManage && (
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
            Schedule Meeting
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['planning', 'review', 'retrospective'].map((type) => (
          <Card key={type} className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{TYPE_LABELS[type]}</p>
              {summary[type] && (
                <Badge size="sm" variant={statusVariantMap[summary[type].status] || 'default'}>
                  {summary[type].status}
                </Badge>
              )}
            </div>
            {summary[type] ? (
              <>
                <p className="text-base font-semibold text-gray-900">
                  {formatDateTime(summary[type].startTime)}
                </p>
                <p className="text-xs text-gray-500 truncate">{summary[type].location || 'Virtual'}</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Not scheduled</p>
            )}
          </Card>
        ))}
        <Card className="p-5 space-y-2">
          <p className="text-sm text-gray-500">Upcoming Meetings</p>
          <p className="text-3xl font-bold text-gray-900">{summary.total || 0}</p>
          <p className="text-xs text-gray-500">Across this sprint</p>
        </Card>
      </div>

      {/* Meeting list */}
      {meetings.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="w-16 h-16 text-gray-300" />}
          title="No meetings scheduled"
          description="Create sprint planning, review, or retrospective meetings to keep everyone aligned."
          action={
            canManage && (
              <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Schedule meeting
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <Card key={meeting._id} className="p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-gray-900">{meeting.title}</h4>
                    <Badge size="sm" variant={statusVariantMap[meeting.status] || 'default'}>
                      {meeting.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{TYPE_LABELS[meeting.type] || 'Sprint Meeting'}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatDateTime(meeting.startTime)} &mdash; {formatDateTime(meeting.endTime)}
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {meeting.location}
                      </div>
                    )}
                    {meeting.videoConferenceLink && (
                      <a
                        href={meeting.videoConferenceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                      >
                        <Video className="w-4 h-4" />
                        Join call
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canManage && (
                    <Button
                      size="sm"
                      variant="outlined"
                      leftIcon={<Mail className="w-4 h-4" />}
                      onClick={() => handleResendInvites(meeting._id)}
                      loading={resendInvites.isPending && resendInvites.variables?.meetingId === meeting._id}
                    >
                      Resend invites
                    </Button>
                  )}
                </div>
              </div>

              {meeting.agendaItems?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-primary-500" />
                    Agenda
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {meeting.agendaItems.map((item) => (
                      <li
                        key={`${meeting._id}-agenda-${item.order}`}
                        className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{item.title}</p>
                          {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                        </div>
                        {item.durationMinutes > 0 && (
                          <span className="text-xs text-gray-500">{item.durationMinutes} min</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-500" />
                  Invitees
                </p>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  {meeting.invitees?.map((invitee) => (
                    <Badge key={invitee.email || invitee._id} variant="info" size="sm">
                      {invitee.user?.name || invitee.email}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <StickyNote className="w-4 h-4 text-primary-500" />
                  Meeting Notes
                </div>
                {meeting.notes?.length > 0 ? (
                  <div className="space-y-2 rounded-lg border border-gray-100 p-3 bg-gray-50">
                    {meeting.notes.map((note, index) => (
                      <div key={`${meeting._id}-note-${index}`}>
                        <p className="text-sm text-gray-800">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {note.author?.name || 'Team member'} • {formatDateTime(note.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No notes yet.</p>
                )}
                <div className="space-y-2">
                  <TextArea
                    rows={2}
                    placeholder="Add meeting notes..."
                    value={noteDrafts[meeting._id] || ''}
                    onChange={(e) =>
                      setNoteDrafts((prev) => ({
                        ...prev,
                        [meeting._id]: e.target.value,
                      }))
                    }
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<StickyNote className="w-4 h-4" />}
                      onClick={() => handleAddNote(meeting._id)}
                      disabled={!noteDrafts[meeting._id]?.trim()}
                      loading={addNote.isPending && addNote.variables?.meetingId === meeting._id}
                    >
                      Add note
                    </Button>
                  </div>
                </div>
              </div>

              {meeting.recurrence?.enabled && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <RefreshCw className="w-3 h-3" />
                  Recurs {meeting.recurrence.frequency} · {meeting.recurrence.generatedDates?.length || 0} upcoming
                  instances
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ScheduleMeetingModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMeeting.isPending}
        sprint={sprint}
      />
    </div>
  )
}

