import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'
import FormGroup from '@/components/ui/FormGroup'
import { useTeam } from '@/hooks/api/useTeams'
import { cn, generateId } from '@/utils'

const MEETING_TYPES = [
  { value: 'planning', label: 'Sprint Planning' },
  { value: 'review', label: 'Sprint Review' },
  { value: 'retrospective', label: 'Retrospective' },
  { value: 'refinement', label: 'Backlog Refinement' },
  { value: 'custom', label: 'Custom' },
]

const FREQUENCIES = [
  { value: 'none', label: 'Do not repeat' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
]

const getTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

export default function ScheduleMeetingModal({ isOpen, onClose, onSubmit, isSubmitting, sprint }) {
  const [form, setForm] = useState({
    type: 'planning',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    durationMinutes: 60,
    timezone: getTimezone(),
    location: '',
    videoConferenceLink: '',
    sendInvites: true,
    recurrenceEnabled: false,
    recurrenceFrequency: 'none',
    recurrenceOccurrences: 4,
    initialNotes: '',
  })
  const [inviteeIds, setInviteeIds] = useState([])
  const [inviteeEmails, setInviteeEmails] = useState([''])
  const [agendaItems, setAgendaItems] = useState([])
  const teamId = sprint?.project?.team?._id || sprint?.project?.team
  const { data: team } = useTeam(teamId)

  useEffect(() => {
    if (sprint?.name) {
      setForm((prev) => ({
        ...prev,
        title: `${prev.type === 'custom' ? 'Sprint Meeting' : capitalize(prev.type)} – ${sprint.name}`,
      }))
    }
  }, [sprint])

  const members = useMemo(() => team?.members || [], [team])

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'type' && sprint?.name) {
        next.title = `${value === 'custom' ? 'Sprint Meeting' : capitalize(value)} – ${sprint.name}`
      }
      return next
    })
  }

  const hasInvitees = inviteeIds.length > 0 || inviteeEmails.some((email) => email && email.includes('@'))

  const toggleInvitee = (memberId) => {
    setInviteeIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    )
  }

  const handleEmailChange = (index, value) => {
    setInviteeEmails((prev) => {
      const copy = [...prev]
      copy[index] = value
      return copy
    })
  }

  const addEmailField = () => {
    setInviteeEmails((prev) => [...prev, ''])
  }

  const addAgendaItem = () => {
    setAgendaItems((prev) => [
      ...prev,
      { id: generateId(), title: '', description: '', durationMinutes: 10 },
    ])
  }

  const updateAgendaItem = (id, field, value) => {
    setAgendaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const removeAgendaItem = (id) => {
    setAgendaItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.startTime) return
    const payload = {
      type: form.type,
      title: form.title || `${capitalize(form.type)} Meeting`,
      description: form.description,
      startTime: new Date(form.startTime).toISOString(),
      timezone: form.timezone,
      location: form.location,
      videoConferenceLink: form.videoConferenceLink,
      durationMinutes: form.durationMinutes,
      sendInvites: form.sendInvites,
      initialNotes: form.initialNotes,
      inviteeIds,
      inviteeEmails: inviteeEmails.filter((email) => email && email.includes('@')),
      agendaItems: agendaItems
        .filter((item) => item.title?.trim())
        .map((item, index) => ({
          title: item.title.trim(),
          description: item.description?.trim(),
          durationMinutes: Number(item.durationMinutes) || 0,
          order: index,
        })),
      recurrence: {
        enabled: form.recurrenceEnabled,
        frequency: form.recurrenceFrequency,
        endAfterOccurrences: form.recurrenceOccurrences,
      },
    }
    if (form.endTime) {
      payload.endTime = new Date(form.endTime).toISOString()
    }
    onSubmit(payload)
  }

  const timezoneOptions = useMemo(() => {
    if (Intl?.supportedValuesOf) {
      return Intl.supportedValuesOf('timeZone')
    }
    return [getTimezone()]
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule sprint meeting" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup label="Meeting type">
            <select
              className="input-field"
              value={form.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {MEETING_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="Title">
            <Input value={form.title} onChange={(e) => handleChange('title', e.target.value)} required />
          </FormGroup>
        </div>

        <FormGroup label="Description / agenda overview">
          <TextArea
            rows={3}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Outline key talking points"
          />
        </FormGroup>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup label="Start time">
            <Input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup label="End time (optional)">
            <Input type="datetime-local" value={form.endTime} onChange={(e) => handleChange('endTime', e.target.value)} />
          </FormGroup>
          <FormGroup label="Location">
            <Input value={form.location} onChange={(e) => handleChange('location', e.target.value)} />
          </FormGroup>
          <FormGroup label="Video conference link">
            <Input
              type="url"
              value={form.videoConferenceLink}
              onChange={(e) => handleChange('videoConferenceLink', e.target.value)}
              placeholder="https://example.com/meet"
            />
          </FormGroup>
        </div>

        <FormGroup label="Time zone">
          <select className="input-field" value={form.timezone} onChange={(e) => handleChange('timezone', e.target.value)}>
            {timezoneOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </FormGroup>

        <div className="border border-gray-100 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Invite team members</p>
            <Checkbox
              label="Select all"
              checked={members.length > 0 && inviteeIds.length === members.length}
              onChange={(e) =>
                setInviteeIds(e.target.checked ? members.map((member) => member._id) : [])
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {members.map((member) => (
              <label
                key={member._id}
                className={cn(
                  'flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer transition',
                  inviteeIds.includes(member._id) ? 'border-primary-500 bg-primary-50/50' : 'border-gray-200'
                )}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={inviteeIds.includes(member._id)}
                  onChange={() => toggleInvitee(member._id)}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </label>
            ))}
            {members.length === 0 && (
              <p className="text-sm text-gray-500 col-span-2">No team members detected for this project.</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Additional emails</p>
            {inviteeEmails.map((email, index) => (
              <Input
                key={`email-${index}`}
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
              />
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addEmailField}>
              + Add email address
            </Button>
          </div>
        </div>

        <div className="border border-gray-100 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Agenda builder</p>
            <Button type="button" size="sm" variant="outline" onClick={addAgendaItem}>
              + Add agenda item
            </Button>
          </div>
          {agendaItems.length === 0 && (
            <p className="text-sm text-gray-500">Add agenda checkpoints to keep the meeting focused.</p>
          )}
          {agendaItems.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-6">
                <Input
                  placeholder="Discuss backlog health"
                  value={item.title}
                  onChange={(e) => updateAgendaItem(item.id, 'title', e.target.value)}
                />
              </div>
              <div className="md:col-span-4">
                <Input
                  placeholder="Details"
                  value={item.description}
                  onChange={(e) => updateAgendaItem(item.id, 'description', e.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={item.durationMinutes}
                  onChange={(e) => updateAgendaItem(item.id, 'durationMinutes', e.target.value)}
                />
                <span className="text-xs text-gray-500">min</span>
                <button
                  type="button"
                  className="text-xs text-error-500"
                  onClick={() => removeAgendaItem(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-gray-100 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Recurrence</p>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.recurrenceEnabled}
              onChange={(e) => handleChange('recurrenceEnabled', e.target.checked)}
            />
            <span className="text-sm text-gray-600">Repeat this meeting</span>
          </label>
          {form.recurrenceEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                className="input-field"
                value={form.recurrenceFrequency}
                onChange={(e) => handleChange('recurrenceFrequency', e.target.value)}
              >
                {FREQUENCIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min="1"
                max="52"
                label="Occurrences"
                value={form.recurrenceOccurrences}
                onChange={(e) => handleChange('recurrenceOccurrences', e.target.value)}
              />
            </div>
          )}
        </div>

        <FormGroup label="Meeting notes (optional)">
          <TextArea
            rows={3}
            value={form.initialNotes}
            onChange={(e) => handleChange('initialNotes', e.target.value)}
            placeholder="Add pre-reading notes for participants"
          />
        </FormGroup>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <Checkbox
            checked={form.sendInvites}
            onChange={(e) => handleChange('sendInvites', e.target.checked)}
          />
          Send calendar invites via email
        </label>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} disabled={!hasInvitees}>
            Schedule meeting
          </Button>
        </div>
      </form>
    </Modal>
  )
}

ScheduleMeetingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  sprint: PropTypes.object,
}

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1)

