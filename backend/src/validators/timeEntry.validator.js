import Joi from 'joi'

/**
 * TimeEntry Validators
 * Joi schemas for time entry validation
 */

export const createTimeEntrySchema = Joi.object({
  hours: Joi.number()
    .min(0)
    .max(24)
    .required()
    .messages({
      'number.min': 'Hours must be 0 or greater',
      'number.max': 'Hours cannot exceed 24',
      'any.required': 'Hours is required',
    }),
  date: Joi.date()
    .optional()
    .default(() => new Date())
    .messages({
      'date.base': 'Date must be a valid date',
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .allow('', null),
})

export const updateTimeEntrySchema = Joi.object({
  hours: Joi.number()
    .min(0)
    .max(24)
    .optional()
    .messages({
      'number.min': 'Hours must be 0 or greater',
      'number.max': 'Hours cannot exceed 24',
    }),
  date: Joi.date()
    .optional()
    .messages({
      'date.base': 'Date must be a valid date',
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .allow('', null),
})

