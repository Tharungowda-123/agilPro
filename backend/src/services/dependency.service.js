import { Story, Task } from '../models/index.js'
import { BadRequestError, NotFoundError } from '../utils/errors.js'
import logger from '../utils/logger.js'

/**
 * Dependency Service
 * Handles story and task dependencies, circular dependency detection, and critical path calculation
 */

/**
 * Check for circular dependencies using graph traversal (DFS)
 * @param {string} storyId - Story ID
 * @param {string} dependencyId - Dependency story ID to add
 * @returns {Promise<boolean>} True if circular dependency exists
 */
export const checkCircularDependency = async (storyId, dependencyId) => {
  try {
    // If trying to add self as dependency
    if (storyId === dependencyId) {
      return true
    }

    // Use DFS to check if dependencyId has storyId in its dependency chain
    const visited = new Set()
    const stack = [dependencyId]

    while (stack.length > 0) {
      const currentId = stack.pop()

      if (currentId === storyId) {
        // Circular dependency found
        return true
      }

      if (visited.has(currentId)) {
        continue
      }

      visited.add(currentId)

      // Get current story's dependencies
      const currentStory = await Story.findById(currentId).select('dependencies')
      if (currentStory && currentStory.dependencies) {
        for (const depId of currentStory.dependencies) {
          const depIdStr = depId.toString()
          if (!visited.has(depIdStr)) {
            stack.push(depIdStr)
          }
        }
      }
    }

    return false
  } catch (error) {
    logger.error('Error checking circular dependency:', error)
    throw error
  }
}

/**
 * Calculate critical path for stories
 * Uses topological sort to identify critical path
 * @param {Array} stories - Array of story objects
 * @returns {Promise<Array>} Critical path (array of story IDs)
 */
export const calculateCriticalPath = async (stories) => {
  try {
    if (!stories || stories.length === 0) {
      return []
    }

    // Build dependency graph
    const graph = new Map()
    const inDegree = new Map()

    // Initialize
    stories.forEach((story) => {
      const storyId = story._id.toString()
      graph.set(storyId, [])
      inDegree.set(storyId, 0)
    })

    // Build edges
    stories.forEach((story) => {
      const storyId = story._id.toString()
      if (story.dependencies && story.dependencies.length > 0) {
        story.dependencies.forEach((depId) => {
          const depIdStr = depId.toString()
          if (graph.has(depIdStr)) {
            graph.get(depIdStr).push(storyId)
            inDegree.set(storyId, (inDegree.get(storyId) || 0) + 1)
          }
        })
      }
    })

    // Topological sort to find longest path (critical path)
    const queue = []
    const distances = new Map()

    // Find starting nodes (no dependencies)
    inDegree.forEach((degree, storyId) => {
      if (degree === 0) {
        queue.push(storyId)
        distances.set(storyId, 0)
      }
    })

    const criticalPath = []
    const predecessors = new Map()

    while (queue.length > 0) {
      const current = queue.shift()
      criticalPath.push(current)

      const neighbors = graph.get(current) || []
      neighbors.forEach((neighbor) => {
        const newDistance = (distances.get(current) || 0) + 1
        const currentDistance = distances.get(neighbor) || 0

        if (newDistance > currentDistance) {
          distances.set(neighbor, newDistance)
          predecessors.set(neighbor, current)
        }

        inDegree.set(neighbor, inDegree.get(neighbor) - 1)
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor)
        }
      })
    }

    // Reconstruct critical path from longest path
    let maxDistance = 0
    let endNode = null

    distances.forEach((distance, storyId) => {
      if (distance > maxDistance) {
        maxDistance = distance
        endNode = storyId
      }
    })

    // Build path from end to start
    const path = []
    let current = endNode

    while (current) {
      path.unshift(current)
      current = predecessors.get(current)
    }

    return path
  } catch (error) {
    logger.error('Error calculating critical path:', error)
    return []
  }
}

/**
 * Get blocked stories (stories with unresolved dependencies)
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Array of blocked stories
 */
export const getBlockedStories = async (projectId) => {
  try {
    // Get all stories for the project
    const stories = await Story.find({ project: projectId }).select('_id title status dependencies')

    const blockedStories = []

    for (const story of stories) {
      if (!story.dependencies || story.dependencies.length === 0) {
        continue
      }

      // Check if all dependencies are completed
      const dependencyIds = story.dependencies.map((dep) => dep.toString())
      const dependencies = await Story.find({
        _id: { $in: dependencyIds },
      }).select('status')

      const allCompleted = dependencies.every((dep) => dep.status === 'done')

      if (!allCompleted) {
        blockedStories.push({
          storyId: story._id,
          title: story.title,
          status: story.status,
          incompleteDependencies: dependencies
            .filter((dep) => dep.status !== 'done')
            .map((dep) => dep._id),
        })
      }
    }

    return blockedStories
  } catch (error) {
    logger.error('Error getting blocked stories:', error)
    throw error
  }
}

/**
 * Get dependency chain for a story (all stories that depend on this story)
 * @param {string} storyId - Story ID
 * @returns {Promise<Array>} Array of dependent story IDs
 */
export const getDependentStories = async (storyId) => {
  try {
    const dependentStories = await Story.find({
      dependencies: storyId,
    }).select('_id title status')

    return dependentStories.map((story) => ({
      storyId: story._id,
      title: story.title,
      status: story.status,
    }))
  } catch (error) {
    logger.error('Error getting dependent stories:', error)
    throw error
  }
}

/**
 * Check for circular task dependencies
 * @param {string} taskId
 * @param {string} dependencyId
 * @returns {Promise<boolean>}
 */
export const checkTaskCircularDependency = async (taskId, dependencyId) => {
  if (taskId === dependencyId) {
    return true
  }

  const stack = [dependencyId]
  const visited = new Set()

  while (stack.length > 0) {
    const currentId = stack.pop()
    if (!currentId) continue

    if (currentId === taskId) {
      return true
    }

    if (visited.has(currentId)) {
      continue
    }

    visited.add(currentId)

    const currentTask = await Task.findById(currentId).select('dependencies')
    if (currentTask?.dependencies?.length) {
      currentTask.dependencies.forEach((depId) => {
        const depIdStr = depId.toString()
        if (!visited.has(depIdStr)) {
          stack.push(depIdStr)
        }
      })
    }
  }

  return false
}

/**
 * Build dependency graph data for tasks
 * @param {string} taskId
 * @returns {Promise<Object>}
 */
export const buildTaskDependencyGraph = async (taskId) => {
  const originTask = await Task.findById(taskId).populate('story', '_id')
  if (!originTask) {
    throw new NotFoundError('Task not found')
  }

  const storyId = originTask.story?._id || originTask.story
  const tasks = await Task.find({ story: storyId })
    .select('title status dependencies priority dueDate estimatedHours')
    .lean()

  const taskMap = new Map()
  tasks.forEach((task) => {
    taskMap.set(task._id.toString(), task)
  })

  const adjacency = new Map() // dependency -> dependents
  const inDegree = new Map()

  tasks.forEach((task) => {
    const taskKey = task._id.toString()
    inDegree.set(taskKey, inDegree.get(taskKey) || 0)
    adjacency.set(taskKey, adjacency.get(taskKey) || [])
  })

  tasks.forEach((task) => {
    const taskKey = task._id.toString()
    const deps = (task.dependencies || []).map((dep) => dep.toString())
    deps.forEach((depId) => {
      if (adjacency.has(depId)) {
        adjacency.get(depId).push(taskKey)
        inDegree.set(taskKey, (inDegree.get(taskKey) || 0) + 1)
      }
    })
  })

  const queue = []
  const distances = new Map()
  const levels = new Map()

  inDegree.forEach((degree, key) => {
    if (degree === 0) {
      queue.push(key)
      distances.set(key, 0)
      levels.set(key, 0)
    }
  })

  const predecessors = new Map()

  while (queue.length > 0) {
    const current = queue.shift()
    const neighbors = adjacency.get(current) || []

    neighbors.forEach((neighbor) => {
      const newDistance = (distances.get(current) || 0) + 1
      if (newDistance > (distances.get(neighbor) || 0)) {
        distances.set(neighbor, newDistance)
        predecessors.set(neighbor, current)
        levels.set(neighbor, newDistance)
      }

      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1)
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor)
      }
    })
  }

  let maxDistance = -1
  let endNode = null
  distances.forEach((distance, key) => {
    if (distance > maxDistance) {
      maxDistance = distance
      endNode = key
    }
  })

  const criticalPath = []
  let pointer = endNode
  while (pointer) {
    criticalPath.unshift(pointer)
    pointer = predecessors.get(pointer)
  }

  const criticalSet = new Set(criticalPath)
  const nodes = []
  const blockedTasks = []

  tasks.forEach((task) => {
    const id = task._id.toString()
    const dependencies = (task.dependencies || []).map((dep) => dep.toString())
    const isBlocked = dependencies.some((depId) => {
      const depTask = taskMap.get(depId)
      return depTask && depTask.status !== 'done'
    })

    const node = {
      id,
      label: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      dependencyCount: dependencies.length,
      isBlocked,
      isCritical: criticalSet.has(id),
      isCurrent: id === taskId,
      level: levels.get(id) ?? dependencies.length ?? 0,
    }

    if (isBlocked) {
      blockedTasks.push({
        id,
        title: task.title,
        unmetDependencies: dependencies.filter((depId) => {
          const depTask = taskMap.get(depId)
          return depTask && depTask.status !== 'done'
        }),
      })
    }

    nodes.push(node)
  })

  const edges = []
  tasks.forEach((task) => {
    const targetId = task._id.toString()
    const deps = (task.dependencies || []).map((dep) => dep.toString())
    deps.forEach((depId) => {
      edges.push({
        source: depId,
        target: targetId,
        isCritical: criticalSet.has(depId) && criticalSet.has(targetId),
      })
    })
  })

  return {
    storyId,
    nodes,
    edges,
    criticalPath,
    blockedTasks,
    stats: {
      totalTasks: nodes.length,
      blockedTasks: blockedTasks.length,
      criticalCount: criticalPath.length,
    },
  }
}

/**
 * Get dependency impact analysis for a task
 * @param {string} taskId
 * @returns {Promise<Object>}
 */
export const getTaskDependencyImpact = async (taskId) => {
  const originTask = await Task.findById(taskId).populate('story', '_id')
  if (!originTask) {
    throw new NotFoundError('Task not found')
  }

  const storyId = originTask.story?._id || originTask.story
  const tasks = await Task.find({ story: storyId })
    .select('title status dependencies priority')
    .lean()

  const taskMap = new Map()
  const forwardGraph = new Map()
  const reverseGraph = new Map()

  tasks.forEach((task) => {
    const id = task._id.toString()
    taskMap.set(id, task)
    forwardGraph.set(id, [])
    reverseGraph.set(id, (task.dependencies || []).map((dep) => dep.toString()))
  })

  tasks.forEach((task) => {
    const id = task._id.toString()
    const deps = reverseGraph.get(id) || []
    deps.forEach((depId) => {
      if (forwardGraph.has(depId)) {
        forwardGraph.get(depId).push(id)
      }
    })
  })

  const downstream = []
  const downstreamVisited = new Set([taskId])
  const queue = [taskId]

  while (queue.length > 0) {
    const current = queue.shift()
    const neighbors = forwardGraph.get(current) || []
    neighbors.forEach((neighbor) => {
      if (!downstreamVisited.has(neighbor)) {
        downstreamVisited.add(neighbor)
        queue.push(neighbor)
        const task = taskMap.get(neighbor)
        downstream.push({
          id: neighbor,
          title: task?.title,
          status: task?.status,
        })
      }
    })
  }

  const upstreamVisited = new Set([taskId])
  const upstream = []
  const traverseUpstream = (current) => {
    const parents = reverseGraph.get(current) || []
    parents.forEach((parentId) => {
      if (!upstreamVisited.has(parentId)) {
        upstreamVisited.add(parentId)
        const parentTask = taskMap.get(parentId)
        upstream.push({
          id: parentId,
          title: parentTask?.title,
          status: parentTask?.status,
        })
        traverseUpstream(parentId)
      }
    })
  }
  traverseUpstream(taskId)

  return {
    storyId,
    blockers: upstream,
    impacted: downstream,
    impactScore: downstream.length,
  }
}

