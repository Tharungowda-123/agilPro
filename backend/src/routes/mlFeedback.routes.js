import express from 'express'
import mlFeedbackController from '../controllers/mlFeedback.controller.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// Submit feedback
router.post('/submit', mlFeedbackController.submitFeedback)

// Task assignment feedback
router.post('/task-assignment', mlFeedbackController.taskAssignmentFeedback)

// Sprint outcome feedback
router.post('/sprint-outcome', mlFeedbackController.sprintOutcomeFeedback)

// Story estimation feedback
router.post('/story-estimation', mlFeedbackController.storyEstimationFeedback)

// Get feedback statistics
router.get('/stats/:modelType', mlFeedbackController.getFeedbackStats)

// Get model performance over time
router.get('/performance/:modelType', mlFeedbackController.getPerformanceTrends)

export default router

