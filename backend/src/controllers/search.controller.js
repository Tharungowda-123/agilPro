import { Project, Story, Task, User, SavedFilter, SearchHistory, Sprint } from '../models/index.js'
import { successResponse } from '../utils/response.js'
import { normalizeText, fuzzyMatch, buildSearchVector } from '../utils/fuzzySearch.js'
import { BadRequestError, ForbiddenError } from '../utils/errors.js'

const DEFAULT_LIMIT = 5

const buildProjectResult = (project) => ({
  id: project._id,
  type: 'project',
  title: project.name,
  description: project.description,
  key: project.key,
  icon: '📁',
  url: `/projects/${project._id}`,
  matchScore: project.matchScore,
})

const buildSprintResult = (sprint, project) => ({
  id: sprint._id,
  type: 'sprint',
  title: sprint.name,
  description: sprint.goal,
  project: project?.name,
  icon: '🏃',
  url: `/sprints/${sprint._id}`,
  matchScore: sprint.matchScore,
})

const buildStoryResult = (story, project) => ({
  id: story._id,
  type: 'story',
  title: story.title,
  description: story.description,
  project: project?.name,
  sprint: story.sprint?.name,
  icon: '📖',
  url: `/board#story-${story._id}`,
  matchScore: story.matchScore,
})

const buildTaskResult = (task, story) => ({
  id: task._id,
  type: 'task',
  title: task.title,
  description: task.description,
  story: story?.title,
  icon: '✓',
  url: `/board#task-${task._id}`,
  matchScore: task.matchScore,
})

const buildUserResult = (user) => ({
  id: user._id,
  type: 'user',
  title: user.name,
  description: user.email,
  role: user.role,
  icon: '👤',
  url: `/users/${user._id}`,
  matchScore: user.matchScore,
})

const buildProjectQuery = ({ query, filters }) => {
  const conditions = []
  if (filters?.teams?.length) {
    conditions.push({ team: { $in: filters.teams } })
  }
  if (filters?.statuses?.length) {
    conditions.push({ status: { $in: filters.statuses } })
  }
  return conditions.length ? { $and: conditions } : {}
}

const buildStoryQuery = ({ filters }) => {
  const conditions = []
  if (filters?.projects?.length) {
    conditions.push({ project: { $in: filters.projects } })
  }
  if (filters?.statuses?.length) {
    conditions.push({ status: { $in: filters.statuses } })
  }
  if (filters?.priorities?.length) {
    conditions.push({ priority: { $in: filters.priorities } })
  }
  if (filters?.assignees?.length) {
    conditions.push({ assignedTo: { $in: filters.assignees } })
  }
  return conditions.length ? { $and: conditions } : {}
}

const buildTaskQuery = ({ filters }) => {
  const conditions = []
  if (filters?.stories?.length) {
    conditions.push({ story: { $in: filters.stories } })
  }
  if (filters?.statuses?.length) {
    conditions.push({ status: { $in: filters.statuses } })
  }
  if (filters?.priorities?.length) {
    conditions.push({ priority: { $in: filters.priorities } })
  }
  if (filters?.assignees?.length) {
    conditions.push({ assignedTo: { $in: filters.assignees } })
  }
  return conditions.length ? { $and: conditions } : {}
}

const buildUserQuery = ({ filters }) => {
  const conditions = []
  if (filters?.roles?.length) {
    conditions.push({ role: { $in: filters.roles } })
  }
  if (filters?.teams?.length) {
    conditions.push({ team: { $in: filters.teams } })
  }
  if (filters?.isActive !== undefined) {
    conditions.push({ isActive: filters.isActive })
  }
  return conditions.length ? { $and: conditions } : {}
}

const rankResults = (docs, query, fields) => {
  const normalizedQuery = normalizeText(query)
  return docs
    .map((doc) => {
      const vector = buildSearchVector(doc, fields)
      const matchScore = fuzzyMatch(vector, normalizedQuery)
      return { ...doc.toObject(), matchScore }
    })
    .filter((doc) => doc.matchScore >= 0.4)
    .sort((a, b) => b.matchScore - a.matchScore)
}

const buildSprintQuery = ({ filters }) => {
  const conditions = []
  if (filters?.projects?.length) {
    conditions.push({ project: { $in: filters.projects } })
  }
  if (filters?.statuses?.length) {
    conditions.push({ status: { $in: filters.statuses } })
  }
  return conditions.length ? { $and: conditions } : {}
}

export const advancedSearch = async (req, res, next) => {
  try {
    const { query, filters = {}, limit = DEFAULT_LIMIT, include = [] } = req.body
    if (!query || !query.trim()) {
      throw new BadRequestError('Search query is required')
    }

    const searchResults = {
      projects: [],
      sprints: [],
      stories: [],
      tasks: [],
      users: [],
      total: 0,
      suggestions: [],
    }

    if (include.includes('project') || include.length === 0) {
      const projects = await Project.find(buildProjectQuery({ query, filters }))
        .limit(limit)
        .lean({ virtuals: true })
      searchResults.projects = rankResults(projects, query, ['name', 'description', 'key']).map(
        buildProjectResult
      )
    }

    if (include.includes('sprint') || include.length === 0) {
      const sprints = await Sprint.find(buildSprintQuery({ filters }))
        .populate('project', 'name')
        .limit(limit)
      searchResults.sprints = rankResults(
        sprints,
        query,
        ['name', 'goal', 'project.name']
      ).map((sprint) => buildSprintResult(sprint, sprint.project))
    }

    if (include.includes('story') || include.length === 0) {
      const stories = await Story.find(buildStoryQuery({ filters }))
        .populate('project', 'name')
        .populate('sprint', 'name')
        .limit(limit)
      searchResults.stories = rankResults(
        stories,
        query,
        ['title', 'description', 'project.name', 'sprint.name']
      ).map((story) => buildStoryResult(story, story.project))
    }

    if (include.includes('task') || include.length === 0) {
      const tasks = await Task.find(buildTaskQuery({ filters }))
        .populate('story', 'title')
        .limit(limit)
      searchResults.tasks = rankResults(tasks, query, ['title', 'description', 'story.title']).map(
        (task) => buildTaskResult(task, task.story)
      )
    }

    if (include.includes('user') || include.length === 0) {
      const users = await User.find(buildUserQuery({ filters }))
        .select('name email role skills team isActive')
        .limit(limit)
      searchResults.users = rankResults(users, query, ['name', 'email', 'role', 'skills']).map(
        buildUserResult
      )
    }

    searchResults.total =
      searchResults.projects.length +
      searchResults.sprints.length +
      searchResults.stories.length +
      searchResults.tasks.length +
      searchResults.users.length

    const titleSuggestions = [
      ...searchResults.projects.map((p) => p.title),
      ...searchResults.sprints.map((s) => s.title),
      ...searchResults.stories.map((s) => s.title),
      ...searchResults.tasks.map((t) => t.title),
      ...searchResults.users.map((u) => u.title),
    ]
      .filter(Boolean)
      .slice(0, 5)

    searchResults.suggestions = Array.from(new Set([query, ...titleSuggestions]))

    await SearchHistory.create({
      user: req.user.id,
      query,
      filters,
      resultsCount: searchResults.total,
      suggestions: searchResults.suggestions,
    })

    return successResponse(res, searchResults, 'Search completed successfully')
  } catch (error) {
    next(error)
  }
}

export const saveFilter = async (req, res, next) => {
  try {
    const { name, description, entityTypes, criteria, shared, isPublic } = req.body
    if (!entityTypes?.length) {
      throw new BadRequestError('At least one entity type is required')
    }

    const filter = await SavedFilter.create({
      name,
      description,
      entityTypes,
      criteria,
      owner: req.user.id,
      shared,
      isPublic: !!isPublic,
    })

    return successResponse(res, { filter }, 'Filter saved successfully', 201)
  } catch (error) {
    next(error)
  }
}

export const getSavedFilters = async (req, res, next) => {
  try {
    const filters = await SavedFilter.find({
      $or: [
        { owner: req.user.id },
        { 'shared.isShared': true, 'shared.sharedWith.user': req.user.id },
        { 'shared.isShared': true, 'shared.sharedWith.team': req.user.team?._id },
        { isPublic: true },
      ],
    })
      .populate('owner', 'name email')
      .sort({ updatedAt: -1 })

    return successResponse(res, { filters }, 'Saved filters retrieved successfully')
  } catch (error) {
    next(error)
  }
}

export const updateSavedFilter = async (req, res, next) => {
  try {
    const { id } = req.params
    const filter = await SavedFilter.findById(id)
    if (!filter) {
      throw new BadRequestError('Filter not found')
    }

    if (filter.owner.toString() !== req.user.id && !filter.isPublic) {
      throw new ForbiddenError('You do not have permission to update this filter')
    }

    Object.assign(filter, req.body)
    await filter.save()

    return successResponse(res, { filter }, 'Filter updated successfully')
  } catch (error) {
    next(error)
  }
}

export const deleteSavedFilter = async (req, res, next) => {
  try {
    const { id } = req.params
    const filter = await SavedFilter.findById(id)
    if (!filter) {
      throw new BadRequestError('Filter not found')
    }

    if (filter.owner.toString() !== req.user.id && !filter.isPublic) {
      throw new ForbiddenError('You do not have permission to delete this filter')
    }

    await filter.deleteOne()

    return successResponse(res, null, 'Filter deleted successfully')
  } catch (error) {
    next(error)
  }
}

export const getRecentSearches = async (req, res, next) => {
  try {
    const history = await SearchHistory.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    return successResponse(res, { history }, 'Recent searches retrieved successfully')
  } catch (error) {
    next(error)
  }
}

export const getSearchSuggestions = async (req, res, next) => {
  try {
    const { query } = req.query
    if (!query) {
      return successResponse(res, { suggestions: [] }, 'Suggestions retrieved successfully')
    }

    const historyMatches = await SearchHistory.find({
      user: req.user.id,
      query: { $regex: query, $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    const projectMatches = await Project.find({
      name: { $regex: query, $options: 'i' },
    })
      .select('name')
      .limit(5)

    const suggestions = Array.from(
      new Set([
        ...historyMatches.map((item) => item.query),
        ...projectMatches.map((project) => project.name),
      ])
    ).slice(0, 8)

    return successResponse(res, { suggestions }, 'Suggestions retrieved successfully')
  } catch (error) {
    next(error)
  }
}

