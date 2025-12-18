import Joi from 'joi'
import mongoose from 'mongoose'

/**
 * Project Validators
 * Joi schemas for project validation
 */

/**
 * Create project schema
 */
export const createProjectSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Project name is required',
      'string.min': 'Project name must be at least 2 characters long',
      'string.max': 'Project name must not exceed 200 characters',
    }),
  key: Joi.string()
    .uppercase()
    .pattern(/^[A-Z0-9]+$/)
    .max(20)
    .optional()
    .messages({
      'string.pattern.base': 'Project key must contain only uppercase letters and numbers',
      'string.max': 'Project key must not exceed 20 characters',
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
  organization: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid organization ID')
      }
      return value
    })
    .optional(),
  team: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid team ID')
      }
      return value
    })
    .optional()
    .allow(null),
  startDate: Joi.date()
    .optional()
    .allow(null),
  endDate: Joi.date()
    .greater(Joi.ref('startDate'))
    .optional()
    .allow(null)
    .messages({
      'date.greater': 'End date must be after start date',
    }),
  status: Joi.string()
    .valid('planning', 'active', 'on-hold', 'completed')
    .optional(),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional(),
  goals: Joi.array()
    .items(Joi.string().max(200))
    .optional(),
  budget: Joi.number()
    .min(0)
    .optional()
    .allow(null),
})

/**
 * Update project schema (all fields optional)
 */
export const updateProjectSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Project name must be at least 2 characters long',
      'string.max': 'Project name must not exceed 200 characters',
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
  team: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid team ID')
      }
      return value
    })
    .optional()
    .allow(null),
  startDate: Joi.date()
    .optional()
    .allow(null),
  endDate: Joi.date()
    .optional()
    .allow(null),
  status: Joi.string()
    .valid('planning', 'active', 'on-hold', 'completed')
    .optional(),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional(),
  goals: Joi.array()
    .items(Joi.string().max(200))
    .optional(),
  budget: Joi.number()
    .min(0)
    .optional()
    .allow(null),
})

/**
 * Query params validation schema
 */
export const projectQuerySchema = Joi.object({
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
  status: Joi.string()
    .valid('planning', 'active', 'on-hold', 'completed')
    .optional(),
  search: Joi.string()
    .max(100)
    .optional()
    .allow(''),
  teamId: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid team ID')
      }
      return value
    })
    .optional(),
  sortBy: Joi.string()
    .valid('name', 'createdAt', 'status', 'priority', 'startDate')
    .default('createdAt')
    .optional(),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional(),
})

