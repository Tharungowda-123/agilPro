import Joi from 'joi'
import mongoose from 'mongoose'

/**
 * User Validators
 * Joi schemas for user validation
 */

export const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  avatar: Joi.string()
    .uri()
    .optional()
    .allow('', null),
  preferences: Joi.object({
    emailNotifications: Joi.boolean().optional(),
    inAppNotifications: Joi.boolean().optional(),
    theme: Joi.string().valid('light', 'dark').optional(),
  }).optional(),
})

export const addSkillsSchema = Joi.object({
  skills: Joi.array()
    .items(Joi.string().max(50))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one skill is required',
      'any.required': 'Skills are required',
    }),
})

export const updateAvailabilitySchema = Joi.object({
  availability: Joi.number()
    .min(0)
    .max(200)
    .required()
    .messages({
      'number.min': 'Availability must be at least 0',
      'number.max': 'Availability must not exceed 200',
      'any.required': 'Availability is required',
    }),
})

export const userQuerySchema = Joi.object({
  teamId: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid team ID')
      }
      return value
    })
    .optional(),
  role: Joi.string()
    .valid('admin', 'manager', 'developer', 'viewer')
    .optional(),
  skills: Joi.string()
    .optional(),
  search: Joi.string()
    .max(100)
    .optional()
    .allow(''),
  includeInactive: Joi.string()
    .valid('true', 'false')
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

export const createUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
  role: Joi.string()
    .valid('admin', 'manager', 'developer', 'viewer')
    .default('developer')
    .optional(),
  skills: Joi.array()
    .items(Joi.string().max(50))
    .optional(),
  availability: Joi.number()
    .min(0)
    .max(200)
    .default(40)
    .optional(),
  teamId: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid team ID')
      }
      return value
    })
    .optional()
    .allow(null, ''),
})

export const adminUpdateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
  role: Joi.string()
    .valid('admin', 'manager', 'developer', 'viewer')
    .optional(),
  skills: Joi.array()
    .items(Joi.string().max(50))
    .optional(),
  availability: Joi.number()
    .min(0)
    .max(200)
    .optional(),
  teamId: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid team ID')
      }
      return value
    })
    .optional()
    .allow(null, ''),
})

export const resetPasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'New password is required',
    }),
})

export const assignTeamSchema = Joi.object({
  teamId: Joi.string()
    .custom((value, helpers) => {
      if (value && value !== '' && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid team ID')
      }
      return value
    })
    .optional()
    .allow(null, ''),
})

export const bulkActionSchema = Joi.object({
  userIds: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message('Invalid user ID')
        }
        return value
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one user ID is required',
      'any.required': 'User IDs are required',
    }),
  action: Joi.string()
    .valid('activate', 'deactivate')
    .required()
    .messages({
      'any.only': 'Action must be either "activate" or "deactivate"',
      'any.required': 'Action is required',
    }),
})

export const capacityAdjustmentSchema = Joi.object({
  type: Joi.string()
    .valid('vacation', 'sick', 'training', 'other')
    .required()
    .messages({
      'any.only': 'Type must be one of: vacation, sick, training, other',
      'any.required': 'Type is required',
    }),
  reason: Joi.string()
    .max(500)
    .optional()
    .allow('', null),
  startDate: Joi.date()
    .required()
    .messages({
      'date.base': 'Start date is required',
      'any.required': 'Start date is required',
    }),
  endDate: Joi.date()
    .greater(Joi.ref('startDate'))
    .required()
    .messages({
      'date.base': 'End date is required',
      'date.greater': 'End date must be after start date',
      'any.required': 'End date is required',
    }),
  adjustedCapacity: Joi.number()
    .min(0)
    .optional()
    .default(0)
    .messages({
      'number.min': 'Adjusted capacity must be 0 or greater',
    }),
})

export const bulkImportConfirmSchema = Joi.object({
  users: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        role: Joi.string().valid('admin', 'manager', 'developer', 'viewer').required(),
        availability: Joi.number().min(0).max(200).optional(),
        skills: Joi.array().items(Joi.string().max(50)).optional(),
        isActive: Joi.boolean().optional(),
        title: Joi.string().allow('', null),
        teamId: Joi.string()
          .allow(null, '')
          .custom((value, helpers) => {
            if (value && !mongoose.Types.ObjectId.isValid(value)) {
              return helpers.message('Invalid team ID')
            }
            return value
          })
          .optional(),
        teamName: Joi.string().allow('', null),
        rowNumber: Joi.number().optional(),
      })
    )
    .min(1)
    .required(),
})

export const reassignTaskSchema = Joi.object({
  taskId: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid task ID')
      }
      return value
    })
    .required()
    .messages({
      'any.required': 'Task ID is required',
    }),
  newUserId: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid user ID')
      }
      return value
    })
    .required()
    .messages({
      'any.required': 'New user ID is required',
    }),
})

