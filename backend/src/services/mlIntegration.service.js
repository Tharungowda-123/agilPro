import axios from 'axios'
import crypto from 'crypto'
import logger from '../utils/logger.js'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
const ML_SERVICE_TIMEOUT = parseInt(process.env.ML_SERVICE_TIMEOUT || '30000', 10)
// Support both variable names to match different env templates
const ML_SERVICE_API_KEY = process.env.ML_SERVICE_API_KEY || process.env.ML_API_KEY || ''
const CACHE_TTL_MS = 5 * 60 * 1000

const responseCache = new Map()

const cacheKeyFor = (endpoint, method, payload) => {
  const payloadHash = crypto.createHash('md5').update(JSON.stringify(payload || {})).digest('hex')
  return `${method}:${endpoint}:${payloadHash}`
}

const readCache = (key) => {
  const cached = responseCache.get(key)
  if (!cached) return null
  const expired = Date.now() - cached.timestamp > CACHE_TTL_MS
  if (expired) {
    responseCache.delete(key)
    return null
  }
  return cached.value
}

const writeCache = (key, value) => {
  responseCache.set(key, { value, timestamp: Date.now() })
}

const callMLService = async (endpoint, data = {}, method = 'POST', { cache = false } = {}) => {
  const url = `${ML_SERVICE_URL}${endpoint}`
  const cacheKey = cache ? cacheKeyFor(endpoint, method, data) : null

  if (cache && cacheKey) {
    const cached = readCache(cacheKey)
    if (cached) {
      logger.debug(`ML service cache hit for ${endpoint}`)
      return cached
    }
  }

  const config = {
    method,
    url,
    data,
    timeout: ML_SERVICE_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      ...(ML_SERVICE_API_KEY ? { 'x-api-key': ML_SERVICE_API_KEY } : {}),
    },
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      logger.info(`Calling ML service: ${method} ${url} (attempt ${attempt})`)
      const response = await axios(config)
      if (cache && cacheKey) writeCache(cacheKey, response.data)
      return response.data
    } catch (error) {
      const retryable = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(error.code)
      logger.error(`ML service error (${endpoint}): ${error.message}`)

      if (attempt === 2 || !retryable) {
        if (error.response) {
          throw new Error(error.response.data?.message || error.response.data?.detail || 'ML service error')
        }
        throw new Error('Failed to communicate with ML service')
      }
    }
  }

  throw new Error('ML service request failed')
}

/**
 * Analyze feature (NLP analysis only)
 * @param {Object} featureData - Feature data
 * @returns {Promise<Object>} Analysis with complexity, personas, requirements
 */
export const analyzeFeature = async (featureData) => {
  try {
    return await callMLService('/api/ml/features/analyze', {
      title: featureData.title,
      description: featureData.description,
      business_value: featureData.businessValue || '',
      acceptance_criteria: featureData.acceptanceCriteria || [],
    })
  } catch (error) {
    logger.error('Error analyzing feature:', error)
    throw error
  }
}

/**
 * Break down feature into stories with tasks
 * @param {Object} featureData - Feature data
 * @returns {Promise<Object>} Complete breakdown with stories and tasks
 */
export const breakDownFeature = async (featureData) => {
  try {
    return await callMLService('/api/ml/features/breakdown', {
      title: featureData.title,
      description: featureData.description,
      business_value: featureData.businessValue || '',
      acceptance_criteria: featureData.acceptanceCriteria || [],
    })
  } catch (error) {
    logger.error('Error breaking down feature:', error)
    throw error
  }
}

/**
 * Optimize PI feature distribution across sprints
 * @param {Object} piData - PI data with features, sprints, dependencies
 * @returns {Promise<Object>} Optimization result with feature assignments
 */
export const optimizePIFeatures = async (piData) => {
  try {
    return await callMLService('/api/ml/pi/optimize', piData)
  } catch (error) {
    logger.error('Error optimizing PI:', error)
    throw error
  }
}

/**
 * Auto-generate sprint plan
 * @param {Object} sprintData - Sprint data with capacity, team members, available stories
 * @returns {Promise<Object>} Generated sprint plan
 */
export const autoGenerateSprintPlan = async (sprintData) => {
  try {
    return await callMLService('/api/ml/sprints/auto-generate', {
      sprint_id: sprintData.sprintId,
      capacity: sprintData.capacity,
      team_members: sprintData.teamMembers,
      available_stories: sprintData.availableStories,
    })
  } catch (error) {
    logger.error('Error auto-generating sprint plan:', error)
    throw error
  }
}

/**
 * Analyze feature with advanced NLP
 * @param {Object} featureData - Feature data
 * @returns {Promise<Object>} NLP analysis results
 */
export const analyzeFeatureNLP = async (featureData) => {
  try {
    return await callMLService('/api/ml/features/analyze-nlp', {
      feature_id: featureData.featureId || featureData.feature_id,
      title: featureData.title,
      description: featureData.description,
      business_value: featureData.businessValue || featureData.business_value || '',
    })
  } catch (error) {
    logger.error('NLP Analysis failed:', error)
    throw error
  }
}

/**
 * Analyze story complexity
 * @param {Object} storyData - Story data
 * @returns {Promise<Object>} Complexity analysis
 */
export const analyzeStoryComplexity = async (storyData) => {
  try {
    return await callMLService('/api/ml/stories/analyze-complexity', {
      title: storyData.title,
      description: storyData.description,
      acceptance_criteria: storyData.acceptanceCriteria || [],
    })
  } catch (error) {
    logger.error('Error analyzing story complexity:', error)
    throw error
  }
}

/**
 * Estimate story points
 * @param {Object} storyData - Story data
 * @returns {Promise<Object>} Story point estimation
 */
export const estimateStoryPoints = async (storyData) => {
  try {
    return await callMLService('/api/ml/stories/estimate-points', {
      complexity_score: storyData.complexityScore,
      title: storyData.title,
      description: storyData.description,
    })
  } catch (error) {
    logger.error('Error estimating story points:', error)
    throw error
  }
}

/**
 * Find similar stories
 * @param {string} storyId - Story ID
 * @returns {Promise<Array>} Array of similar stories with similarity scores
 */
export const extractStoryRequirements = async (description) => {
  try {
    const response = await callMLService('/api/ml/stories/extract-requirements', { description })
    return response.requirements_extracted || []
  } catch (error) {
    logger.error('Error extracting story requirements:', error)
    throw error
  }
}

export const findSimilarStories = async (storyData) => {
  try {
    const response = await callMLService('/api/ml/stories/find-similar', {
      description: storyData.description,
    })
    return response.similar_stories || []
  } catch (error) {
    logger.error('Error finding similar stories:', error)
    throw error
  }
}

/**
 * Get task assignment recommendations
 * @param {Object} taskData - Task data
 * @param {Array} teamMembers - Array of team member IDs
 * @returns {Promise<Array>} Array of recommendations with confidence scores
 */
export const getTaskAssignmentRecommendations = async (taskData, teamMembers) => {
  try {
    const response = await callMLService(
      '/api/ml/tasks/recommend-assignee',
      {
        task_id: taskData.id || taskData._id,
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        estimated_hours: taskData.estimatedHours,
        story_points: taskData.storyPoints,
        team_members: teamMembers,
      },
      'POST',
      { cache: true }
    )
    return response.recommendations || []
  } catch (error) {
    logger.error('Error getting task assignment recommendations:', error)
    throw error
  }
}

/**
 * Optimize sprint
 * @param {Object} sprintData - Sprint data
 * @returns {Promise<Object>} Sprint optimization suggestions
 */
export const optimizeSprintPlan = async (sprintData, teamMembers, backlog) => {
  try {
    return await callMLService('/api/ml/sprints/optimize-plan', {
      sprint_id: sprintData.sprintId,
      sprint_capacity: sprintData.capacity,
      team_members: teamMembers,
      available_stories: backlog,
    })
  } catch (error) {
    logger.error('Error optimizing sprint plan:', error)
    throw error
  }
}

export const predictSprintVelocity = async (payload = {}) => {
  try {
    return await callMLService('/api/ml/sprints/predict-velocity', payload)
  } catch (error) {
    logger.error('Error predicting sprint velocity:', error)
    throw error
  }
}

export const suggestSprintStories = async (payload = {}) => {
  try {
    return await callMLService('/api/ml/sprints/suggest-stories', payload)
  } catch (error) {
    logger.error('Error suggesting sprint stories:', error)
    throw error
  }
}

export const simulateSprintOutcome = async (payload = {}) => {
  try {
    return await callMLService('/api/ml/sprints/simulate', payload)
  } catch (error) {
    logger.error('Error simulating sprint outcome:', error)
    throw error
  }
}

export const predictVelocity = async (teamId, sprintCapacity) => {
  try {
    return await callMLService(
      '/api/ml/velocity/forecast',
      { team_id: teamId, sprint_capacity: sprintCapacity },
      'POST',
      { cache: true }
    )
  } catch (error) {
    logger.error('Error predicting velocity:', error)
    throw error
  }
}

export const predictCompletion = async (teamId, remainingPoints, sprintCapacity) => {
  try {
    return await callMLService('/api/ml/velocity/predict-completion', {
      team_id: teamId,
      remaining_story_points: remainingPoints,
      sprint_capacity: sprintCapacity,
    })
  } catch (error) {
    logger.error('Error predicting completion:', error)
    throw error
  }
}

export const analyzeProjectRisks = async (projectId) => {
  try {
    return await callMLService(
      '/api/ml/risks/analyze-project',
      { project_id: projectId },
      'POST',
      { cache: true }
    )
  } catch (error) {
    logger.error('Error analyzing project risks:', error)
    throw error
  }
}

export const analyzeSprintRisks = async (sprintId) => {
  try {
    return await callMLService('/api/ml/risks/analyze-sprint', { sprint_id: sprintId })
  } catch (error) {
    logger.error('Error analyzing sprint risks:', error)
    throw error
  }
}

export const detectBottlenecks = async (teamId) => {
  try {
    const response = await callMLService(
      '/api/ml/risks/detect-bottlenecks',
      { team_id: teamId },
      'POST',
      { cache: true }
    )
    return response.bottlenecks || []
  } catch (error) {
    logger.error('Error detecting bottlenecks:', error)
    throw error
  }
}

export const submitTaskAssignmentFeedback = async (payload = {}) => {
  try {
    return await callMLService('/api/ml/tasks/feedback', payload)
  } catch (error) {
    logger.error('Error submitting task feedback:', error)
    throw error
  }
}

export const fetchTaskModelStats = async () => {
  try {
    return await callMLService('/api/ml/tasks/model-stats', {}, 'GET', { cache: true })
  } catch (error) {
    logger.error('Error fetching task model stats:', error)
    throw error
  }
}

