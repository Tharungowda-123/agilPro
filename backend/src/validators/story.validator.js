import Joi from 'joi'
import mongoose from 'mongoose'

/**
 * Story Validators
 * Joi schemas for story validation
 */

export const createStorySchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Story title is required',
      'string.min': 'Story title must be at least 2 characters long',
      'string.max': 'Story title must not exceed 200 characters',
    }),
  description: Joi.string()
    .max(2000)
    .optional()
    .allow('', null),
  feature: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid feature ID')
      }
      return value
    })
    .optional()
    .allow(null),
  sprint: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid sprint ID')
      }
      return value
    })
    .optional()
    .allow(null),
  storyPoints: Joi.number()
    .integer()
    .min(0)
    .optional(),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional(),
  status: Joi.string()
    .valid('backlog', 'ready', 'in-progress', 'review', 'done', 'todo')
    .optional()
    .custom((value, helpers) => {
      // Map 'todo' to 'backlog' for backward compatibility
      if (value === 'todo') {
        return 'backlog'
      }
      return value
    }),
  assignedTo: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid user ID')
      }
      return value
    })
    .optional()
    .allow(null),
  acceptanceCriteria: Joi.array()
    .items(Joi.string().max(500))
    .optional(),
})

export const updateStorySchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .optional(),
  description: Joi.string()
    .max(2000)
    .optional()
    .allow('', null),
  feature: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid feature ID')
      }
      return value
    })
    .optional()
    .allow(null),
  sprint: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid sprint ID')
      }
      return value
    })
    .optional()
    .allow(null),
  storyPoints: Joi.number()
    .integer()
    .min(0)
    .optional(),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional(),
  status: Joi.string()
    .valid('backlog', 'ready', 'in-progress', 'review', 'done', 'todo')
    .optional()
    .custom((value, helpers) => {
      // Map 'todo' to 'backlog' for backward compatibility
      if (value === 'todo') {
        return 'backlog'
      }
      return value
    }),
  assignedTo: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid user ID')
      }
      return value
    })
    .optional()
    .allow(null),
  acceptanceCriteria: Joi.array()
    .items(Joi.string().max(500))
    .optional(),
})

export const storyQuerySchema = Joi.object({
  projectId: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid project ID')
      }
      return value
    })
    .optional(),
  sprintId: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid sprint ID')
      }
      return value
    })
    .optional(),
  status: Joi.string()
    .valid('backlog', 'ready', 'in-progress', 'review', 'done', 'todo')
    .optional()
    .custom((value, helpers) => {
      // Map 'todo' to 'backlog' for backward compatibility
      if (value === 'todo') {
        return 'backlog'
      }
      return value
    }),
  assignedTo: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid user ID')
      }
      return value
    })
    .optional(),
  search: Joi.string()
    .max(100)
    .optional()
    .allow(''),
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

export const addDependencySchema = Joi.object({
  dependencyId: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid dependency story ID')
      }
      return value
    })
    .required()
    .messages({
      'any.required': 'Dependency story ID is required',
    }),
})

