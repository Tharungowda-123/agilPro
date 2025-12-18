/**
 * Fix Sprint Velocity Script
 * 
 * This script fixes sprints where stories have all tasks completed
 * but the story isn't marked as 'done', causing velocity to be 0.
 * 
 * Run with: node backend/src/scripts/fixSprintVelocity.js
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
import Story from '../models/Story.js'
import Task from '../models/Task.js'
import Sprint from '../models/Sprint.js'
import { updateSprintVelocity } from '../services/sprint.service.js'
import logger from '../utils/logger.js'

const fixSprintVelocity = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agilpro'
    await mongoose.connect(mongoUri)
    logger.info('Connected to MongoDB')

    // Get all sprints
    const sprints = await Sprint.find({}).select('_id name status')
    logger.info(`Found ${sprints.length} sprints to check`)

    let fixedStories = 0
    let updatedSprints = 0

    for (const sprint of sprints) {
      try {
        // Get all stories in this sprint
        const stories = await Story.find({ sprint: sprint._id })
        logger.info(`Checking sprint "${sprint.name}" (${sprint.status}) - ${stories.length} stories`)

        let sprintFixed = false

        for (const story of stories) {
          // Skip if story is already done
          if (story.status === 'done') continue

          // Get all tasks for this story
          const tasks = await Task.find({ story: story._id })
          
          if (tasks.length === 0) {
            // No tasks, skip
            continue
          }

          // Check if all tasks are done
          const allTasksDone = tasks.every(t => t.status === 'done')
          
          if (allTasksDone) {
            // Mark story as done
            story.status = 'done'
            story.completedAt = new Date()
            await story.save()
            fixedStories++
            sprintFixed = true
            logger.info(`  ✓ Fixed story "${story.title}" (${story.storyPoints} points) - all tasks completed`)
          }
        }

        // Update sprint velocity if any stories were fixed
        if (sprintFixed) {
          await updateSprintVelocity(sprint._id.toString())
          updatedSprints++
          logger.info(`  ✓ Updated velocity for sprint "${sprint.name}"`)
        }
      } catch (error) {
        logger.error(`Error processing sprint ${sprint._id}:`, error.message)
      }
    }

    logger.info(`\n=== Summary ===`)
    logger.info(`Total sprints checked: ${sprints.length}`)
    logger.info(`Stories fixed: ${fixedStories}`)
    logger.info(`Sprints updated: ${updatedSprints}`)

    // Close connection
    await mongoose.connection.close()
    logger.info('Database connection closed')
    process.exit(0)
  } catch (error) {
    logger.error('Error fixing sprint velocity:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

// Run the script
fixSprintVelocity()




