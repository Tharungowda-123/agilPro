import Joi from 'joi'
import mongoose from 'mongoose'

/**
 * Program Increment Validators
 * Joi schemas for PI validation
 */

export const createPISchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'PI name is required',
      'string.min': 'PI name must be at least 2 characters long',
      'string.max': 'PI name must not exceed 200 characters',
    }),
  description: Joi.string()
    .max(2000)
    .optional()
    .allow('', null),
  startDate: Joi.date()
    .required()
    .messages({
      'any.required': 'Start date is required',
    }),
  endDate: Joi.date()
    .required()
    .greater(Joi.ref('startDate'))
    .messages({
      'any.required': 'End date is required',
      'date.greater': 'End date must be after start date',
    }),
  objectives: Joi.array()
    .items(
      Joi.object({
        description: Joi.string().required(),
        businessValue: Joi.number().integer().min(1).max(10).optional(),
        assignedTo: Joi.string()
          .custom((value, helpers) => {
            if (value && !mongoose.Types.ObjectId.isValid(value)) {
              return helpers.message('Invalid team ID')
            }
            return value
          })
          .optional()
          .allow(null),
        status: Joi.string().valid('committed', 'uncommitted', 'stretch').optional(),
        progress: Joi.number().min(0).max(100).optional(),
      })
    )
    .optional(),
  features: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message('Invalid feature ID')
        }
        return value
      })
    )
    .optional(),
  sprints: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message('Invalid sprint ID')
        }
        return value
      })
    )
    .optional(),
})

export const updatePISchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .optional(),
  description: Joi.string()
    .max(2000)
    .optional()
    .allow('', null),
  startDate: Joi.date()
    .optional(),
  endDate: Joi.date()
    .optional(),
  status: Joi.string()
    .valid('planning', 'active', 'completed')
    .optional(),
  objectives: Joi.array()
    .items(
      Joi.object({
        description: Joi.string().required(),
        businessValue: Joi.number().integer().min(1).max(10).optional(),
        assignedTo: Joi.string()
          .custom((value, helpers) => {
            if (value && !mongoose.Types.ObjectId.isValid(value)) {
              return helpers.message('Invalid team ID')
            }
            return value
          })
          .optional()
          .allow(null),
        status: Joi.string().valid('committed', 'uncommitted', 'stretch').optional(),
        progress: Joi.number().min(0).max(100).optional(),
      })
    )
    .optional(),
  features: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message('Invalid feature ID')
        }
        return value
      })
    )
    .optional(),
  sprints: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message('Invalid sprint ID')
        }
        return value
      })
    )
    .optional(),
})

export const piQuerySchema = Joi.object({
  status: Joi.string()
    .valid('planning', 'active', 'completed')
    .optional(),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional(),
})

