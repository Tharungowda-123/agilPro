import Joi from 'joi'
import mongoose from 'mongoose'

const widgetSchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().allow('', null),
  metric: Joi.string().required(),
  chartType: Joi.string().valid('stat', 'bar', 'line', 'pie', 'table').required(),
  position: Joi.object({
    x: Joi.number().min(0).default(0),
    y: Joi.number().min(0).default(0),
    w: Joi.number().min(1).default(4),
    h: Joi.number().min(1).default(3),
  }).optional(),
  settings: Joi.object().optional(),
})

const filterSchema = Joi.object({
  dateRange: Joi.string().default('30d'),
  customRange: Joi.object({
    start: Joi.date().required(),
    end: Joi.date().required(),
  }).optional(),
  projects: Joi.array().items(
    Joi.string().custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid project ID')
      }
      return value
    })
  ),
  teams: Joi.array().items(
    Joi.string().custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid team ID')
      }
      return value
    })
  ),
  statuses: Joi.array().items(Joi.string()),
})

const sharedSchema = Joi.object({
  scope: Joi.string().valid('private', 'team', 'organization', 'custom').default('private'),
  teams: Joi.array().items(
    Joi.string().custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid team ID')
      }
      return value
    })
  ),
  users: Joi.array().items(
    Joi.string().custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid user ID')
      }
      return value
    })
  ),
})

const scheduleSchema = Joi.object({
  enabled: Joi.boolean().default(false),
  frequency: Joi.string().valid('daily', 'weekly', 'monthly').default('weekly'),
  dayOfWeek: Joi.number().min(0).max(6).default(1),
  dayOfMonth: Joi.number().min(1).max(31).default(1),
  timeOfDay: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .default('09:00'),
  recipients: Joi.array().items(Joi.string().email()).default([]),
})

export const createReportSchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  description: Joi.string().allow('', null),
  widgets: Joi.array().items(widgetSchema).min(1).required(),
  filters: filterSchema.optional(),
  sharedWith: sharedSchema.optional(),
  schedule: scheduleSchema.optional(),
})

export const updateReportSchema = Joi.object({
  name: Joi.string().min(3).max(200).optional(),
  description: Joi.string().allow('', null),
  widgets: Joi.array().items(widgetSchema).min(1).optional(),
  filters: filterSchema.optional(),
  sharedWith: sharedSchema.optional(),
  schedule: scheduleSchema.optional(),
})

export const previewReportSchema = Joi.object({
  widgets: Joi.array().items(widgetSchema).min(1).required(),
  filters: filterSchema.optional(),
})


