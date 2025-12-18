import Joi from 'joi'

/**
 * Comment Validators
 * Joi schemas for comment validation
 */

export const createCommentSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.empty': 'Comment content is required',
      'string.min': 'Comment must be at least 1 character long',
      'string.max': 'Comment must not exceed 5000 characters',
    }),
  parentCommentId: Joi.string().hex().length(24).optional().messages({
    'string.length': 'Parent comment ID must be a valid identifier',
  }),
})

export const updateCommentSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.empty': 'Comment content is required',
      'string.min': 'Comment must be at least 1 character long',
      'string.max': 'Comment must not exceed 5000 characters',
    }),
})

export const commentReactionSchema = Joi.object({
  emoji: Joi.string()
    .valid('👍', '❤️', '😂', '🎉')
    .required()
    .messages({
      'any.only': 'Unsupported reaction emoji',
      'any.required': 'Emoji is required',
    }),
})

export const threadResolutionSchema = Joi.object({
  resolved: Joi.boolean().required(),
})

export const pinCommentSchema = Joi.object({
  pinned: Joi.boolean().required(),
})

