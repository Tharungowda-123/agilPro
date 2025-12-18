import Joi from 'joi'
import mongoose from 'mongoose'

/**
 * Team Validators
 * Joi schemas for team validation
 */

export const createTeamSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Team name is required',
      'string.min': 'Team name must be at least 2 characters long',
      'string.max': 'Team name must not exceed 200 characters',
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('', null),
  organization: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid organization ID')
      }
      return value
    })
    .optional()
    .allow(null),
  members: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message('Invalid user ID')
        }
        return value
      })
    )
    .optional(),
  capacity: Joi.number()
    .min(0)
    .optional(),
})

export const updateTeamSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .optional(),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('', null),
  capacity: Joi.number()
    .min(0)
    .optional(),
})

export const addMembersSchema = Joi.object({
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
})

