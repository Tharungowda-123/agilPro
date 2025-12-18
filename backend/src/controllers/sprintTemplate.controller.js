import mongoose from 'mongoose'
import { SprintTemplate, Project } from '../models/index.js'
import { successResponse } from '../utils/response.js'
import { NotFoundError, ForbiddenError } from '../utils/errors.js'
import { getAccessibleTemplates } from '../services/sprintTemplate.service.js'

export const getSprintTemplates = async (req, res, next) => {
  try {
    const { projectId, teamId } = req.query

    const resolvedProjectId =
      projectId && mongoose.Types.ObjectId.isValid(projectId) ? projectId : null

    let project = null
    if (resolvedProjectId) {
      project = await Project.findById(resolvedProjectId).select(
        'defaultSprintTemplate team'
      )
    }

    const templates = await getAccessibleTemplates({
      projectId: resolvedProjectId,
      teamId: teamId || project?.team?._id || project?.team,
      user: req.user,
    })

    const defaultTemplateId = project?.defaultSprintTemplate?.toString()
    const formattedTemplates = templates.map((template) => ({
      ...template,
      isDefaultForProject:
        defaultTemplateId && template._id.toString() === defaultTemplateId,
    }))

    return successResponse(
      res,
      { templates: formattedTemplates, defaultTemplateId },
      'Sprint templates retrieved successfully'
    )
  } catch (error) {
    next(error)
  }
}

export const createSprintTemplate = async (req, res, next) => {
  try {
    const {
      name,
      description,
      projectId,
      durationDays,
      capacity,
      storyCriteria,
      sharedWithTeams = [],
      isGlobal = false,
      setAsDefault = false,
    } = req.body

    let project = null
    if (projectId) {
      project = await Project.findById(projectId)
      if (!project) {
        throw new NotFoundError('Project not found')
      }
    }

    if (isGlobal && req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can create global templates')
    }

    const template = new SprintTemplate({
      name,
      description,
      durationDays,
      capacity,
      storyCriteria,
      project: project?._id,
      organization: project?.organization || req.user.organization,
      sharedWithTeams,
      isGlobal,
      createdBy: req.user.id,
    })

    await template.save()

    if (setAsDefault && project) {
      project.defaultSprintTemplate = template._id
      await project.save()
    }

    await template.populate('project', 'name key')
    await template.populate('sharedWithTeams', 'name')

    return successResponse(res, { template }, 'Sprint template created successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const updateSprintTemplate = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const template = await SprintTemplate.findById(id)
    if (!template) {
      throw new NotFoundError('Sprint template not found')
    }

    if (
      template.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      throw new ForbiddenError('You can only edit templates you created')
    }

    if (updateData.isGlobal && req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can mark templates as global')
    }

    Object.assign(template, updateData)
    await template.save()

    await template.populate('project', 'name key')
    await template.populate('sharedWithTeams', 'name')

    return successResponse(res, { template }, 'Sprint template updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteSprintTemplate = async (req, res, next) => {
  try {
    const { id } = req.params

    const template = await SprintTemplate.findById(id)
    if (!template) {
      throw new NotFoundError('Sprint template not found')
    }

    if (
      template.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      throw new ForbiddenError('You can only delete templates you created')
    }

    await Project.updateMany(
      { defaultSprintTemplate: template._id },
      { $unset: { defaultSprintTemplate: 1 } }
    )

    await SprintTemplate.findByIdAndDelete(id)

    return successResponse(res, null, 'Sprint template deleted successfully')
  } catch (error) {
    next(error)
  }
}

export const setProjectDefaultTemplate = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { templateId } = req.body

    const project = await Project.findById(projectId).populate('team', '_id')
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    if (templateId) {
      const template = await SprintTemplate.findById(templateId)
      if (!template) {
        throw new NotFoundError('Sprint template not found')
      }

      const teamId = project.team?._id || project.team
      const isAccessible =
        template.isGlobal ||
        template.createdBy.toString() === req.user.id ||
        (teamId &&
          (template.sharedWithTeams || []).some(
            (team) => team.toString() === teamId.toString()
          )) ||
        (template.project &&
          template.project.toString() === project._id.toString())

      if (!isAccessible) {
        throw new ForbiddenError('Template is not available for this project')
      }

      project.defaultSprintTemplate = templateId
    } else {
      project.defaultSprintTemplate = undefined
    }

    await project.save()

    return successResponse(
      res,
      { project },
      templateId
        ? 'Default sprint template set successfully'
        : 'Default sprint template cleared successfully'
    )
  } catch (error) {
    next(error)
  }
}

