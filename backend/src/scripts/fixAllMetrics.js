/**
 * Fix All Metrics Script
 * 
 * This script fixes:
 * 1. Stories with all tasks done but not marked as 'done'
 * 2. Sprint velocity (0 points issue)
 * 3. Project progress (0% issue)
 * 
 * Run with: node backend/src/scripts/fixAllMetrics.js
 */

import mongoose from 'mongoose'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '../../.env') })

// Import models and services
import Project from '../models/Project.js'
import Story from '../models/Story.js'
import Task from '../models/Task.js'
import Sprint from '../models/Sprint.js'
import { updateProjectProgress } from '../services/project.service.js'
import { updateSprintVelocity } from '../services/sprint.service.js'
import logger from '../utils/logger.js'

const fixAllMetrics = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agilpro'
    await mongoose.connect(mongoUri)
    logger.info('Connected to MongoDB')

    let fixedStories = 0
    let updatedSprints = 0
    let updatedProjects = 0

    // Step 1: Fix stories with all tasks done
    logger.info('\n=== Step 1: Fixing stories with all tasks completed ===')
    const allStories = await Story.find({ status: { $ne: 'done' } })
    logger.info(`Found ${allStories.length} incomplete stories to check`)

    for (const story of allStories) {
      try {
        const tasks = await Task.find({ story: story._id })
        
        if (tasks.length === 0) continue

        const allTasksDone = tasks.every(t => t.status === 'done')
        
        if (allTasksDone) {
          story.status = 'done'
          story.completedAt = new Date()
          await story.save()
          fixedStories++
          logger.info(`  ✓ Fixed story "${story.title}" (${story.storyPoints} points)`)
        }
      } catch (error) {
        logger.error(`Error fixing story ${story._id}:`, error.message)
      }
    }

    // Step 2: Update sprint velocity
    logger.info('\n=== Step 2: Updating sprint velocity ===')
    const sprints = await Sprint.find({})
    logger.info(`Found ${sprints.length} sprints to update`)

    for (const sprint of sprints) {
      try {
        const velocity = await updateSprintVelocity(sprint._id.toString())
        if (velocity > 0 || sprint.status === 'completed') {
          updatedSprints++
          logger.info(`  ✓ Updated sprint "${sprint.name}": ${velocity} points`)
        }
      } catch (error) {
        logger.error(`Error updating sprint ${sprint._id}:`, error.message)
      }
    }

    // Step 3: Update project progress
    logger.info('\n=== Step 3: Updating project progress ===')
    const projects = await Project.find({ isArchived: false })
    logger.info(`Found ${projects.length} projects to update`)

    for (const project of projects) {
      try {
        const progress = await updateProjectProgress(project._id.toString())
        updatedProjects++
        logger.info(`  ✓ Updated project "${project.name}": ${progress}%`)
      } catch (error) {
        logger.error(`Error updating project ${project._id}:`, error.message)
      }
    }

    logger.info(`\n=== Summary ===`)
    logger.info(`Stories auto-completed: ${fixedStories}`)
    logger.info(`Sprints updated: ${updatedSprints}`)
    logger.info(`Projects updated: ${updatedProjects}`)
    logger.info('\n✅ All metrics have been fixed!')

    // Close connection
    await mongoose.connection.close()
    logger.info('Database connection closed')
    process.exit(0)
  } catch (error) {
    logger.error('Error fixing metrics:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

// Run the script
fixAllMetrics()




