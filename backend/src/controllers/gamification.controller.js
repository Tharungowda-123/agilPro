import { successResponse } from '../utils/response.js'
import { BadRequestError } from '../utils/errors.js'
import {
  getLeaderboardData,
  getGamificationSummary,
  updateGamificationSettings,
} from '../services/gamification.service.js'

export const getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10, teamId = null } = req.query
    const parsedLimit = Math.min(50, Math.max(3, parseInt(limit, 10) || 10))
    const leaderboard = await getLeaderboardData({ limit: parsedLimit, teamId })
    return successResponse(res, { leaderboard }, 'Leaderboard retrieved successfully')
  } catch (error) {
    next(error)
  }
}

export const getMyGamification = async (req, res, next) => {
  try {
    const summary = await getGamificationSummary(req.user.id)
    if (!summary) {
      throw new BadRequestError('Unable to load gamification summary')
    }
    return successResponse(res, { gamification: summary }, 'Gamification summary retrieved')
  } catch (error) {
    next(error)
  }
}

export const updateGamificationPreferences = async (req, res, next) => {
  try {
    const { showOnLeaderboard, leaderboardAlias } = req.body
    const settings = await updateGamificationSettings({
      userId: req.user.id,
      settings: {
        ...(showOnLeaderboard !== undefined ? { showOnLeaderboard } : {}),
        ...(leaderboardAlias !== undefined ? { leaderboardAlias } : {}),
      },
    })
    return successResponse(res, { settings }, 'Gamification preferences updated')
  } catch (error) {
    next(error)
  }
}

