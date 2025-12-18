import Joi from 'joi'
import mongoose from 'mongoose'

/**
 * Task Validators
 * Joi schemas for task validation
 */

export const createTaskSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Task title is required',
      'string.min': 'Task title must be at least 2 characters long',
      'string.max': 'Task title must not exceed 200 characters',
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('', null),
  assignedTo: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid user ID')
      }
      return value
    })
    .optional()
    .allow(null),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional(),
  estimatedHours: Joi.number()
    .min(0)
    .optional(),
  dueDate: Joi.date()
    .optional()
    .allow(null),
  dependencies: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message('Invalid task dependency ID')
        }
        return value
      })
    )
    .optional(),
})

export const updateTaskSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .optional(),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('', null),
  assignedTo: Joi.any()
    .optional()
    .allow(null, '')
    .custom((value, helpers) => {
      // Handle null or empty
      if (value === null || value === '' || value === 'null') {
        return null
      }
      
      // Handle object with _id or id
      if (value && typeof value === 'object') {
        const id = value._id || value.id
        if (id && mongoose.Types.ObjectId.isValid(id)) {
          return id.toString()
        }
        return helpers.message('Invalid user ID in object')
      }
      
      // Handle string
      if (typeof value === 'string') {
        if (mongoose.Types.ObjectId.isValid(value)) {
          return value
        }
        return helpers.message('Invalid user ID')
      }
      
      // Try to convert to string
      const idStr = String(value)
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        return idStr
      }
      
      return helpers.message('Invalid user ID format')
    }),
  status: Joi.string()
    .valid('todo', 'in-progress', 'done')
    .optional(),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional(),
  estimatedHours: Joi.alternatives()
    .try(
      Joi.number().min(0),
      Joi.string().custom((value, helpers) => {
        const num = parseFloat(value)
        if (isNaN(num)) {
          return helpers.message('estimatedHours must be a number')
        }
        if (num < 0) {
          return helpers.message('estimatedHours must be >= 0')
        }
        return num
      }),
      Joi.valid(null)
    )
    .optional()
    .allow(null),
  actualHours: Joi.alternatives()
    .try(
      Joi.number().min(0),
      Joi.string().custom((value, helpers) => {
        const num = parseFloat(value)
        if (isNaN(num)) {
          return helpers.message('actualHours must be a number')
        }
        if (num < 0) {
          return helpers.message('actualHours must be >= 0')
        }
        return num
      }),
      Joi.valid(null)
    )
    .optional()
    .allow(null),
  dueDate: Joi.date()
    .optional()
    .allow(null),
  dependencies: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message('Invalid task dependency ID')
        }
        return value
      })
    )
    .optional(),
})

export const assignTaskSchema = Joi.object({
  userId: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid user ID')
      }
      return value
    })
    .required()
    .messages({
      'any.required': 'User ID is required',
    }),
})

export const taskCommitSchema = Joi.object({
  commitUrl: Joi.string().uri().optional(),
  sha: Joi.string()
    .pattern(/^[0-9a-f]{7,40}$/i)
    .optional(),
  repo: Joi.string().optional(), // expects repo name if owner provided separately
}).custom((value, helpers) => {
  if (!value.commitUrl && !value.sha) {
    return helpers.message('Either commitUrl or sha is required')
  }
  return value
}, 'commit reference validation')

export const taskCommitScanSchema = Joi.object({
  repo: Joi.string().optional(),
  owner: Joi.string().optional(),
})

export const taskDependencySchema = Joi.object({
  dependencyId: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid dependency ID')
      }
      return value
    })
    .required()
    .messages({
      'any.required': 'Dependency ID is required',
    }),
})

