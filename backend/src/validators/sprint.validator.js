import Joi from 'joi'
import mongoose from 'mongoose'

/**
 * Sprint Validators
 * Joi schemas for sprint validation
 */

/**
 * Create sprint schema
 */
export const createSprintSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Sprint name is required',
      'string.min': 'Sprint name must be at least 2 characters long',
      'string.max': 'Sprint name must not exceed 200 characters',
    }),
  goal: Joi.string()
    .max(500)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Goal must not exceed 500 characters',
    }),
  startDate: Joi.date().optional(),
  endDate: Joi.date()
    .greater(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.greater': 'End date must be after start date',
    }),
  capacity: Joi.number()
    .min(0)
    .optional()
    .default(0),
  templateId: Joi.string()
    .optional()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid template ID')
      }
      return value
    }),
  autoSelectStories: Joi.boolean().optional().default(true),
})

/**
 * Update sprint schema
 */
export const updateSprintSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Sprint name must be at least 2 characters long',
      'string.max': 'Sprint name must not exceed 200 characters',
    }),
  goal: Joi.string()
    .max(500)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Goal must not exceed 500 characters',
    }),
  startDate: Joi.date()
    .optional(),
  endDate: Joi.date()
    .optional(),
  capacity: Joi.number()
    .min(0)
    .optional(),
  status: Joi.string()
    .valid('planned', 'active', 'completed')
    .optional(),
})

/**
 * Assign stories to sprint schema
 */
export const assignStoriesSchema = Joi.object({
  storyIds: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message('Invalid story ID')
        }
        return value
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one story ID is required',
      'any.required': 'Story IDs are required',
    }),
})

/**
 * Sprint query params validation schema
 */
export const sprintQuerySchema = Joi.object({
  projectId: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid project ID')
      }
      return value
    })
    .optional(),
  status: Joi.string()
    .valid('planned', 'active', 'completed')
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

/**
 * Save retrospective schema
 */
export const saveRetrospectiveSchema = Joi.object({
  whatWentWell: Joi.array()
    .items(Joi.string().max(500))
    .optional()
    .default([])
    .messages({
      'array.base': 'What went well must be an array',
    }),
  whatDidntGoWell: Joi.array()
    .items(Joi.string().max(500))
    .optional()
    .default([])
    .messages({
      'array.base': 'What didn\'t go well must be an array',
    }),
  actionItems: Joi.array()
    .items(
      Joi.object({
        item: Joi.string().max(500).required().messages({
          'string.empty': 'Action item text is required',
          'string.max': 'Action item must not exceed 500 characters',
          'any.required': 'Action item text is required',
        }),
        completed: Joi.boolean().optional().default(false),
      })
    )
    .optional()
    .default([])
    .messages({
      'array.base': 'Action items must be an array',
    }),
})

/**
 * Update action item schema
 */
export const updateActionItemSchema = Joi.object({
  completed: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'Completed status must be a boolean',
      'any.required': 'Completed status is required',
    }),
})

