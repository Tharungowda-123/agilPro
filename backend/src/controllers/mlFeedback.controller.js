import MLFeedback from '../models/MLFeedback.js'
import { v4 as uuidv4 } from 'uuid'
import logger from '../utils/logger.js'

/**
 * Submit general feedback
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { modelType, predictionId, prediction, actualOutcome, feedback, context } = req.body

    const feedbackDoc = await MLFeedback.create({
      modelType,
      predictionId: predictionId || `${modelType}-${uuidv4()}`,
      prediction,
      actualOutcome,
      feedback: {
        wasAccurate: feedback?.wasAccurate,
        userRating: feedback?.userRating,
        comments: feedback?.comments,
        acceptedByUser: feedback?.acceptedByUser,
      },
      accuracy: feedback?.wasAccurate ? 1.0 : 0.0,
      context: {
        team: context?.team || req.user?.team,
        project: context?.project,
        sprint: context?.sprint,
        user: req.user?._id,
      },
      metadata: {
        predictionTimestamp: new Date(context?.predictionTime || Date.now()),
        outcomeTimestamp: new Date(),
      },
    })

    // Calculate time to outcome
    if (feedbackDoc.metadata.predictionTimestamp) {
      feedbackDoc.metadata.timeToOutcome =
        (feedbackDoc.metadata.outcomeTimestamp - feedbackDoc.metadata.predictionTimestamp) / 1000
      await feedbackDoc.save()
    }

    res.status(201).json({
      status: 'success',
      message: 'Feedback recorded',
      data: feedbackDoc,
    })
  } catch (error) {
    logger.error('Error submitting feedback:', error)
    next(error)
  }
}

/**
 * Task assignment feedback
 */
export const taskAssignmentFeedback = async (req, res, next) => {
  try {
    const { taskId, predictedAssignee, actualAssignee, accepted, reason } = req.body

    const predictionId = `task-assign-${taskId}-${Date.now()}`

    const wasAccurate = predictedAssignee?.userId === actualAssignee

    const feedback = await MLFeedback.create({
      modelType: 'task_assignment',
      predictionId,
      prediction: {
        taskId,
        recommendedUser: predictedAssignee?.userId,
        confidence: predictedAssignee?.confidence,
        reasoning: predictedAssignee?.reasoning,
      },
      actualOutcome: {
        assignedTo: actualAssignee,
        reason,
      },
      feedback: {
        wasAccurate,
        acceptedByUser: accepted !== false, // Default to true if not specified
      },
      accuracy: wasAccurate ? 1.0 : 0.0,
      context: {
        team: req.user?.team,
        project: req.body.projectId,
        user: req.user?._id,
      },
      metadata: {
        predictionTimestamp: new Date(req.body.predictionTime || Date.now()),
        outcomeTimestamp: new Date(),
      },
    })

    // Calculate time to outcome
    if (feedback.metadata.predictionTimestamp) {
      feedback.metadata.timeToOutcome =
        (feedback.metadata.outcomeTimestamp - feedback.metadata.predictionTimestamp) / 1000
      await feedback.save()
    }

    res.status(201).json({
      status: 'success',
      message: 'Feedback recorded',
      data: feedback,
    })
  } catch (error) {
    logger.error('Error recording task assignment feedback:', error)
    next(error)
  }
}

/**
 * Sprint outcome feedback
 */
export const sprintOutcomeFeedback = async (req, res, next) => {
  try {
    const {
      sprintId,
      predictedVelocity,
      actualVelocity,
      predictedCompletion,
      actualCompletion,
      factors,
    } = req.body

    const predictionId = `sprint-outcome-${sprintId}`

    // Calculate accuracy
    const velocityAccuracy =
      predictedVelocity > 0
        ? Math.max(0, 1 - Math.abs(predictedVelocity - actualVelocity) / predictedVelocity)
        : 0
    const completionAccuracy = Math.max(
      0,
      1 - Math.abs((predictedCompletion || 0.9) - (actualCompletion || 0))
    )
    const overallAccuracy = (velocityAccuracy + completionAccuracy) / 2

    const feedback = await MLFeedback.create({
      modelType: 'sprint_planning',
      predictionId,
      prediction: {
        velocity: predictedVelocity,
        completion: predictedCompletion || 0.9,
      },
      actualOutcome: {
        velocity: actualVelocity,
        completion: actualCompletion,
        factors,
      },
      accuracy: overallAccuracy,
      context: {
        sprint: sprintId,
        team: req.user?.team,
        project: req.body.projectId,
      },
      metadata: {
        predictionTimestamp: new Date(req.body.sprintStartDate || Date.now()),
        outcomeTimestamp: new Date(),
      },
    })

    // Calculate time to outcome
    if (feedback.metadata.predictionTimestamp) {
      feedback.metadata.timeToOutcome =
        (feedback.metadata.outcomeTimestamp - feedback.metadata.predictionTimestamp) / 1000
      await feedback.save()
    }

    res.status(201).json({
      status: 'success',
      message: 'Sprint outcome feedback recorded',
      data: feedback,
    })
  } catch (error) {
    logger.error('Error recording sprint outcome feedback:', error)
    next(error)
  }
}

/**
 * Story estimation feedback
 */
export const storyEstimationFeedback = async (req, res, next) => {
  try {
    const { storyId, predictedPoints, actualHours, actualPoints, factors } = req.body

    const predictionId = `story-est-${storyId}-${Date.now()}`

    // Calculate accuracy (simple: how close was the estimate)
    const maxPoints = Math.max(predictedPoints || 1, actualPoints || 1)
    const accuracy = Math.max(0, 1 - Math.abs((predictedPoints || 0) - (actualPoints || 0)) / maxPoints)

    const feedback = await MLFeedback.create({
      modelType: 'story_estimation',
      predictionId,
      prediction: {
        storyPoints: predictedPoints,
      },
      actualOutcome: {
        storyPoints: actualPoints,
        actualHours,
        factors,
      },
      accuracy,
      context: {
        project: req.body.projectId,
        team: req.user?.team,
        user: req.user?._id,
      },
      metadata: {
        predictionTimestamp: new Date(req.body.predictionTime || Date.now()),
        outcomeTimestamp: new Date(),
      },
    })

    // Calculate time to outcome
    if (feedback.metadata.predictionTimestamp) {
      feedback.metadata.timeToOutcome =
        (feedback.metadata.outcomeTimestamp - feedback.metadata.predictionTimestamp) / 1000
      await feedback.save()
    }

    res.status(201).json({
      status: 'success',
      message: 'Story estimation feedback recorded',
      data: feedback,
    })
  } catch (error) {
    logger.error('Error recording story estimation feedback:', error)
    next(error)
  }
}

/**
 * Get feedback statistics for a model type
 */
export const getFeedbackStats = async (req, res, next) => {
  try {
    const { modelType } = req.params

    const stats = await MLFeedback.aggregate([
      { $match: { modelType } },
      {
        $group: {
          _id: null,
          averageAccuracy: { $avg: '$accuracy' },
          totalPredictions: { $sum: 1 },
          acceptedPredictions: {
            $sum: { $cond: [{ $ifNull: ['$feedback.acceptedByUser', false] }, 1, 0] },
          },
        },
      },
    ])

    const acceptanceRate =
      stats[0] && stats[0].totalPredictions > 0
        ? stats[0].acceptedPredictions / stats[0].totalPredictions
        : 0

    res.status(200).json({
      status: 'success',
      data: {
        modelType,
        averageAccuracy: stats[0]?.averageAccuracy || 0,
        totalPredictions: stats[0]?.totalPredictions || 0,
        acceptanceRate,
      },
    })
  } catch (error) {
    logger.error('Error getting feedback stats:', error)
    next(error)
  }
}

/**
 * Get model performance trends over time
 */
export const getPerformanceTrends = async (req, res, next) => {
  try {
    const { modelType } = req.params
    const { timeframe = 90 } = req.query // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(timeframe))

    const trends = await MLFeedback.aggregate([
      {
        $match: {
          modelType,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            week: { $week: '$createdAt' },
          },
          averageAccuracy: { $avg: '$accuracy' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } },
    ])

    res.status(200).json({
      status: 'success',
      data: trends,
    })
  } catch (error) {
    logger.error('Error getting performance trends:', error)
    next(error)
  }
}

// Default export
export default {
  submitFeedback,
  taskAssignmentFeedback,
  sprintOutcomeFeedback,
  storyEstimationFeedback,
  getFeedbackStats,
  getPerformanceTrends,
}

