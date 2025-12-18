import { User, Notification, Story, Task } from '../models/index.js'
import logger from '../utils/logger.js'

const BADGE_CONFIG = {
  first_task_completed: {
    key: 'first_task_completed',
    name: 'First Ship',
    description: 'Completed your first task',
    icon: '🚀',
    points: 50,
    criteria: (stats) => stats.tasksCompleted >= 1,
  },
  ten_tasks_completed: {
    key: 'ten_tasks_completed',
    name: 'Task Crusher',
    description: 'Completed 10 tasks',
    icon: '🧠',
    points: 100,
    criteria: (stats) => stats.tasksCompleted >= 10,
  },
  hundred_tasks_completed: {
    key: 'hundred_tasks_completed',
    name: 'Centurion',
    description: 'Completed 100 tasks',
    icon: '🏅',
    points: 200,
    criteria: (stats) => stats.tasksCompleted >= 100,
  },
  perfect_sprint: {
    key: 'perfect_sprint',
    name: 'Perfect Sprint',
    description: 'Completed a sprint without any late tasks',
    icon: '✨',
    points: 150,
    criteria: (stats) => stats.perfectSprints >= 1,
  },
  speed_demon: {
    key: 'speed_demon',
    name: 'Speed Demon',
    description: 'Completed a task in record time',
    icon: '⚡',
    points: 100,
    criteria: (stats) => stats.fastestTaskHours && stats.fastestTaskHours <= 4,
  },
  team_player: {
    key: 'team_player',
    name: 'Team Player',
    description: 'Shared 25 helpful comments',
    icon: '🤝',
    points: 80,
    criteria: (stats) => stats.helpfulComments >= 25,
  },
}

const POINT_VALUES = {
  taskCompleted: 10,
  commentPosted: 2,
  perfectSprintBonus: 40,
}

const ensureGamificationState = (user) => {
  if (!user.gamification) {
    user.gamification = {}
  }
  if (!user.gamification.stats) {
    user.gamification.stats = {
      tasksCompleted: 0,
      commentsAuthored: 0,
      perfectSprints: 0,
      helpfulComments: 0,
    }
  }
  if (!Array.isArray(user.gamification.badges)) {
    user.gamification.badges = []
  }
  if (!user.gamification.settings) {
    user.gamification.settings = { showOnLeaderboard: true }
  }
}

const addPoints = (user, amount) => {
  if (!amount) return
  user.gamification.points = Math.max(0, (user.gamification.points || 0) + amount)
}

const createAchievementNotification = async (userId, badge) => {
  try {
    await Notification.create({
      user: userId,
      type: 'achievement',
      title: `Unlocked: ${badge.name}`,
      message: badge.description || 'New achievement unlocked!',
      entityType: 'achievement',
      entityId: userId,
    })
  } catch (error) {
    logger.error('Failed to create achievement notification', error)
  }
}

const tryAwardBadge = async (user, badgeConfig, metadata = {}) => {
  const alreadyHasBadge = (user.gamification.badges || []).some(
    (badge) => badge.key === badgeConfig.key
  )
  if (alreadyHasBadge || !badgeConfig.criteria(user.gamification.stats)) {
    return false
  }

  user.gamification.badges.push({
    key: badgeConfig.key,
    name: badgeConfig.name,
    description: badgeConfig.description,
    icon: badgeConfig.icon,
    earnedAt: new Date(),
    metadata,
  })
  addPoints(user, badgeConfig.points || 0)
  await createAchievementNotification(user._id, badgeConfig)
  return true
}

const evaluateBadges = async (user) => {
  let changed = false
  for (const badge of Object.values(BADGE_CONFIG)) {
    const awarded = await tryAwardBadge(user, badge)
    if (awarded) {
      changed = true
    }
  }
  return changed
}

export const recordTaskCompletion = async ({ userId, task }) => {
  try {
    if (!userId) return
    const user = await User.findById(userId)
    if (!user) return

    ensureGamificationState(user)
    user.gamification.stats.tasksCompleted =
      (user.gamification.stats.tasksCompleted || 0) + 1

    if (task?.createdAt && task?.completedAt) {
      const completionHours =
        (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) /
        (1000 * 60 * 60)
      if (
        completionHours > 0 &&
        (!user.gamification.stats.fastestTaskHours ||
          completionHours < user.gamification.stats.fastestTaskHours)
      ) {
        user.gamification.stats.fastestTaskHours = completionHours
      }
    }

    addPoints(user, POINT_VALUES.taskCompleted)
    const badgesChanged = await evaluateBadges(user)
    if (!badgesChanged) {
      user.gamification.lastUpdated = new Date()
    }
    await user.save()
  } catch (error) {
    logger.error('recordTaskCompletion error', error)
  }
}

export const recordCommentContribution = async ({ userId }) => {
  try {
    if (!userId) return
    const user = await User.findById(userId)
    if (!user) return

    ensureGamificationState(user)
    user.gamification.stats.commentsAuthored =
      (user.gamification.stats.commentsAuthored || 0) + 1
    user.gamification.stats.helpfulComments =
      (user.gamification.stats.helpfulComments || 0) + 1
    addPoints(user, POINT_VALUES.commentPosted)
    const badgesChanged = await evaluateBadges(user)
    if (!badgesChanged) {
      user.gamification.lastUpdated = new Date()
    }
    await user.save()
  } catch (error) {
    logger.error('recordCommentContribution error', error)
  }
}

const awardPerfectSprintBadge = async ({ userId, sprintName }) => {
  const user = await User.findById(userId)
  if (!user) return
  ensureGamificationState(user)
  user.gamification.stats.perfectSprints =
    (user.gamification.stats.perfectSprints || 0) + 1
  addPoints(user, POINT_VALUES.perfectSprintBonus)
  await evaluateBadges(user)
  await user.save()
}

export const recordPerfectSprintContributors = async (sprint) => {
  try {
    if (!sprint) return
    const stories = await Story.find({ sprint: sprint._id }).select('_id')
    if (!stories.length) return

    const storyIds = stories.map((story) => story._id)
    const tasks = await Task.find({ story: { $in: storyIds } })
    if (!tasks.length) return

    const allDone = tasks.every((task) => task.status === 'done')
    if (!allDone) return

    const allOnTime = tasks.every((task) => {
      if (!task.dueDate) return true
      if (!task.completedAt) return false
      return task.completedAt <= task.dueDate
    })
    if (!allOnTime) return

    const userIds = [
      ...new Set(
        tasks
          .map((task) => task.assignedTo)
          .filter((userId) => !!userId)
          .map((id) => id.toString())
      ),
    ]

    await Promise.all(
      userIds.map((id) =>
        awardPerfectSprintBadge({
          userId: id,
          sprintName: sprint.name,
        })
      )
    )
  } catch (error) {
    logger.error('recordPerfectSprintContributors error', error)
  }
}

export const getLeaderboardData = async ({ limit = 10, teamId = null }) => {
  const query = {
    role: 'developer',
    'gamification.settings.showOnLeaderboard': { $ne: false },
  }
  if (teamId) {
    query.team = teamId
  }

  const users = await User.find(query)
    .select('name avatar role gamification team')
    .populate('team', 'name')
    .sort({ 'gamification.points': -1 })
    .limit(limit)
    .lean()

  return users.map((user, index) => ({
    rank: index + 1,
    userId: user._id,
    name: user.gamification?.settings?.leaderboardAlias || user.name,
    avatar: user.avatar,
    team: user.team?.name || null,
    points: user.gamification?.points || 0,
    badges: user.gamification?.badges || [],
  }))
}

export const getGamificationSummary = async (userId) => {
  const user = await User.findById(userId)
    .select('name avatar gamification role')
    .lean()
  if (!user) {
    return null
  }
  return {
    userId: user._id,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    points: user.gamification?.points || 0,
    badges: user.gamification?.badges || [],
    stats: user.gamification?.stats || {},
    settings: user.gamification?.settings || {},
  }
}

export const updateGamificationSettings = async ({ userId, settings }) => {
  const user = await User.findById(userId)
  if (!user) {
    throw new Error('User not found')
  }
  ensureGamificationState(user)
  user.gamification.settings = {
    ...user.gamification.settings,
    ...settings,
  }
  await user.save()
  return user.gamification.settings
}

