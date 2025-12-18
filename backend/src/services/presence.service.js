import logger from '../utils/logger.js'

/**
 * Presence Service
 * Tracks which users are viewing which entities
 */

// Data structure: Map<entityType:entityId, Set<userId>>
const presenceMap = new Map()

/**
 * Get presence key
 * @param {string} entityType - Entity type (project, sprint, story, task)
 * @param {string} entityId - Entity ID
 * @returns {string} Presence key
 */
const getPresenceKey = (entityType, entityId) => {
  return `${entityType}:${entityId}`
}

/**
 * Add user to entity presence
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @param {string} userId - User ID
 */
export const addUser = (entityType, entityId, userId) => {
  const key = getPresenceKey(entityType, entityId)

  if (!presenceMap.has(key)) {
    presenceMap.set(key, new Set())
  }

  presenceMap.get(key).add(userId)
  logger.debug(`User ${userId} added to presence: ${key}`)
}

/**
 * Remove user from entity presence
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @param {string} userId - User ID
 */
export const removeUser = (entityType, entityId, userId) => {
  const key = getPresenceKey(entityType, entityId)

  if (presenceMap.has(key)) {
    presenceMap.get(key).delete(userId)

    // Clean up empty sets
    if (presenceMap.get(key).size === 0) {
      presenceMap.delete(key)
    }

    logger.debug(`User ${userId} removed from presence: ${key}`)
  }
}

/**
 * Get users viewing an entity
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @returns {Array<string>} Array of user IDs
 */
export const getUsers = (entityType, entityId) => {
  const key = getPresenceKey(entityType, entityId)

  if (!presenceMap.has(key)) {
    return []
  }

  return Array.from(presenceMap.get(key))
}

/**
 * Remove user from all entities (on disconnect)
 * @param {string} userId - User ID
 */
export const removeUserFromAll = (userId) => {
  let removed = 0

  for (const [key, users] of presenceMap.entries()) {
    if (users.has(userId)) {
      users.delete(userId)
      removed++

      // Clean up empty sets
      if (users.size === 0) {
        presenceMap.delete(key)
      }
    }
  }

  if (removed > 0) {
    logger.debug(`User ${userId} removed from ${removed} presence entries`)
  }
}

/**
 * Get all presence data (for debugging)
 * @returns {Object} Presence data
 */
export const getAllPresence = () => {
  const result = {}

  for (const [key, users] of presenceMap.entries()) {
    result[key] = Array.from(users)
  }

  return result
}

