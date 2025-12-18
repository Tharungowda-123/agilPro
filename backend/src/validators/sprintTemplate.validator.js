import Joi from 'joi'
import mongoose from 'mongoose'

const objectId = (value, helpers) => {
  if (!value || mongoose.Types.ObjectId.isValid(value)) {
    return value
  }
  return helpers.message('Invalid identifier')
}

const storyCriteriaSchema = Joi.object({
  statuses: Joi.array().items(Joi.string()).optional(),
  priorities: Joi.array().items(Joi.string()).optional(),
  labels: Joi.array().items(Joi.string()).optional(),
  minStoryPoints: Joi.number().min(0).optional(),
  maxStoryPoints: Joi.number().min(0).optional(),
  limit: Joi.number().integer().min(1).max(200).default(20),
  includeUnassignedOnly: Joi.boolean().optional(),
  autoSelect: Joi.boolean().default(true),
  includeCompleted: Joi.boolean().default(false),
  includeAllStatuses: Joi.boolean().default(false),
  includeAllPriorities: Joi.boolean().default(false),
  sortBy: Joi.string()
    .valid('priority', 'storyPoints', 'createdAt')
    .default('priority'),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc'),
})

export const createSprintTemplateSchema = Joi.object({
  name: Joi.string().min(3).max(120).required(),
  description: Joi.string().max(500).allow('', null),
  projectId: Joi.string().custom(objectId).optional(),
  durationDays: Joi.number().integer().min(1).max(60).required(),
  capacity: Joi.number().min(0).optional(),
  storyCriteria: storyCriteriaSchema.optional(),
  sharedWithTeams: Joi.array().items(Joi.string().custom(objectId)).default([]),
  isGlobal: Joi.boolean().default(false),
  setAsDefault: Joi.boolean().default(false),
})

export const updateSprintTemplateSchema = Joi.object({
  name: Joi.string().min(3).max(120).optional(),
  description: Joi.string().max(500).allow('', null).optional(),
  durationDays: Joi.number().integer().min(1).max(60).optional(),
  capacity: Joi.number().min(0).optional(),
  storyCriteria: storyCriteriaSchema.optional(),
  sharedWithTeams: Joi.array().items(Joi.string().custom(objectId)).optional(),
  isGlobal: Joi.boolean().optional(),
})

export const setDefaultTemplateSchema = Joi.object({
  templateId: Joi.string().custom(objectId).allow(null, '').optional(),
})

