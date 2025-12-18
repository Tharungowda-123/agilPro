import Joi from 'joi'
import mongoose from 'mongoose'

const objectIdValidator = (value, helpers) => {
  if (!value) return value
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid')
  }
  return value
}

const agendaItemSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().allow('', null),
  owner: Joi.string().custom(objectIdValidator).allow(null),
  durationMinutes: Joi.number().min(0).max(480).optional(),
  order: Joi.number().min(0).optional(),
})

const recurrenceSchema = Joi.object({
  enabled: Joi.boolean().default(false),
  frequency: Joi.string().valid('none', 'daily', 'weekly', 'biweekly', 'monthly').default('none'),
  interval: Joi.number().min(1).max(12).default(1),
  endAfterOccurrences: Joi.number().min(1).max(52).default(4),
  endDate: Joi.date().optional(),
  weekdays: Joi.array().items(Joi.number().min(0).max(6)).optional(),
})

export const createMeetingSchema = Joi.object({
  type: Joi.string().valid('planning', 'review', 'retrospective', 'refinement', 'custom').required(),
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().allow('', null),
  startTime: Joi.date().required(),
  endTime: Joi.date().greater(Joi.ref('startTime')).optional(),
  durationMinutes: Joi.number().min(15).max(600).optional(),
  timezone: Joi.string().allow('', null),
  location: Joi.string().allow('', null),
  videoConferenceLink: Joi.string().uri().allow('', null),
  inviteeIds: Joi.array().items(Joi.string().custom(objectIdValidator)).min(1).optional(),
  inviteeEmails: Joi.array().items(Joi.string().email()).min(1).optional(),
  agendaItems: Joi.array().items(agendaItemSchema).optional(),
  recurrence: recurrenceSchema.optional(),
  sendInvites: Joi.boolean().optional(),
  initialNotes: Joi.string().allow('', null),
})

export const updateMeetingSchema = Joi.object({
  type: Joi.string().valid('planning', 'review', 'retrospective', 'refinement', 'custom'),
  title: Joi.string().trim().min(3).max(200),
  description: Joi.string().allow('', null),
  startTime: Joi.date(),
  endTime: Joi.date().greater(Joi.ref('startTime')),
  location: Joi.string().allow('', null),
  videoConferenceLink: Joi.string().uri().allow('', null),
  status: Joi.string().valid('scheduled', 'completed', 'cancelled'),
  inviteeIds: Joi.array().items(Joi.string().custom(objectIdValidator)),
  inviteeEmails: Joi.array().items(Joi.string().email()),
  agendaItems: Joi.array().items(agendaItemSchema),
  recurrence: recurrenceSchema,
})

export const addAgendaItemSchema = agendaItemSchema

export const addMeetingNoteSchema = Joi.object({
  content: Joi.string().trim().min(2).max(2000).required(),
})

