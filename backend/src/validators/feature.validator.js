import Joi from 'joi'
import mongoose from 'mongoose'

/**
 * Feature Validators
 * Joi schemas for feature validation
 */

export const createFeatureSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Feature title is required',
      'string.min': 'Feature title must be at least 2 characters long',
      'string.max': 'Feature title must not exceed 200 characters',
    }),
  description: Joi.string()
    .max(2000)
    .optional()
    .allow('', null),
  businessValue: Joi.string()
    .max(500)
    .optional()
    .allow('', null),
  priority: Joi.string()
    .valid('critical', 'high', 'medium', 'low')
    .optional(),
  status: Joi.string()
    .valid('draft', 'ready', 'in-breakdown', 'broken-down', 'in-progress', 'completed')
    .optional(),
  acceptanceCriteria: Joi.array()
    .items(Joi.string().max(500))
    .optional(),
  projectId: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid project ID')
      }
      return value
    })
    .optional(),
  programIncrement: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid program increment ID')
      }
      return value
    })
    .optional()
    .allow(null),
  estimatedStoryPoints: Joi.number()
    .min(0)
    .optional(),
})

export const updateFeatureSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .optional(),
  description: Joi.string()
    .max(2000)
    .optional()
    .allow('', null),
  businessValue: Joi.string()
    .max(500)
    .optional()
    .allow('', null),
  priority: Joi.string()
    .valid('critical', 'high', 'medium', 'low')
    .optional(),
  status: Joi.string()
    .valid('draft', 'ready', 'in-breakdown', 'broken-down', 'in-progress', 'completed')
    .optional(),
  acceptanceCriteria: Joi.array()
    .items(Joi.string().max(500))
    .optional(),
  programIncrement: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid program increment ID')
      }
      return value
    })
    .optional()
    .allow(null),
  estimatedStoryPoints: Joi.number()
    .min(0)
    .optional(),
})

export const featureQuerySchema = Joi.object({
  project: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid project ID')
      }
      return value
    })
    .optional(),
  priority: Joi.string()
    .valid('critical', 'high', 'medium', 'low')
    .optional(),
  status: Joi.string()
    .valid('draft', 'ready', 'in-breakdown', 'broken-down', 'in-progress', 'completed')
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

