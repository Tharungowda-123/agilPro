import mongoose from 'mongoose'
import { SprintTemplate, Project, Story } from '../models/index.js'
import { NotFoundError } from '../utils/errors.js'

const STORY_STATUS_DEFAULTS = ['ready', 'backlog']
const STORY_PRIORITIES_DEFAULTS = ['high', 'medium']

const buildStoryQuery = (projectId, criteria = {}) => {
  const query = {
    project: projectId,
    $or: [{ sprint: null }, { sprint: { $exists: false } }],
  }

  if (criteria.includeCompleted === false) {
    query.status = { $nin: ['done'] }
  }

  if (criteria.statuses && criteria.statuses.length > 0) {
    query.status = { $in: criteria.statuses }
  } else if (!criteria.includeAllStatuses) {
    query.status = { $in: STORY_STATUS_DEFAULTS }
  }

  if (criteria.priorities && criteria.priorities.length > 0) {
    query.priority = { $in: criteria.priorities }
  } else if (!criteria.includeAllPriorities) {
    query.priority = { $in: STORY_PRIORITIES_DEFAULTS }
  }

  if (criteria.labels && criteria.labels.length > 0) {
    query.labels = { $in: criteria.labels }
  }

  if (criteria.minStoryPoints || criteria.maxStoryPoints) {
    query.storyPoints = {}
    if (criteria.minStoryPoints) {
      query.storyPoints.$gte = criteria.minStoryPoints
    }
    if (criteria.maxStoryPoints) {
      query.storyPoints.$lte = criteria.maxStoryPoints
    }
  }

  if (criteria.includeUnassignedOnly) {
    query.assignedTo = { $exists: false }
  }

  return query
}

const buildStorySort = (criteria = {}) => {
  const sort = {}
  const direction = criteria.sortOrder === 'asc' ? 1 : -1

  switch (criteria.sortBy) {
    case 'storyPoints':
      sort.storyPoints = direction
      break;
    case 'createdAt':
      sort.createdAt = direction
      break;
    default:
      sort.priority = direction
      break;
  }

  sort.createdAt = sort.createdAt || -1

  return sort
}

export const getAccessibleTemplates = async ({ projectId, teamId, user }) => {
  const filters = []

  if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
    filters.push({ project: projectId })
  }

  if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {
    filters.push({ sharedWithTeams: teamId })
  }

  filters.push({ createdBy: user.id })
  filters.push({ isGlobal: true })

  if (user.team) {
    filters.push({ sharedWithTeams: user.team._id || user.team })
  }

  const query = { $or: filters }

  return SprintTemplate.find(query)
    .populate('project', 'name key')
    .populate('sharedWithTeams', 'name')
    .populate('createdBy', 'name email')
    .lean()
}

export const applyTemplateToSprintData = async ({
  templateId,
  sprintData,
  projectId,
  autoSelectStories = true,
}) => {
  const template = await SprintTemplate.findById(templateId)
  if (!template) {
    throw new NotFoundError('Sprint template not found')
  }

  const payload = { ...sprintData }

  if (!payload.project) {
    payload.project = projectId || template.project
  }

  // Dates
  if (template.durationDays) {
    const start = payload.startDate ? new Date(payload.startDate) : new Date()
    const end = new Date(start)
    end.setDate(end.getDate() + template.durationDays)
    payload.startDate = start
    payload.endDate = end
  }

  if (template.capacity && !payload.capacity) {
    payload.capacity = template.capacity
  }

  payload.appliedTemplate = template._id

  let selectedStories = []
  if (autoSelectStories && template.storyCriteria?.autoSelect) {
    const query = buildStoryQuery(payload.project, template.storyCriteria)
    const sort = buildStorySort(template.storyCriteria)
    const limit = template.storyCriteria.limit || 20

    const stories = await Story.find(query).sort(sort).limit(limit * 2).lean()

    let totalPoints = 0
    for (const story of stories) {
      const storyPoints = story.storyPoints || 0
      if (template.capacity && totalPoints + storyPoints > template.capacity) {
        continue
      }
      selectedStories.push(story._id)
      totalPoints += storyPoints
      if (selectedStories.length >= limit) {
        break
      }
    }
  }

  if (selectedStories.length > 0) {
    payload.stories = selectedStories
  }

  template.lastUsedAt = new Date()
  await template.save()

  return { payload, template }
}


