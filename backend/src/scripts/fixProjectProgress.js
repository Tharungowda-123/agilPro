/**
 * Fix Project Progress Script
 * 
 * This script fixes projects where stories are completed but progress is 0.
 * It recalculates and updates project progress for all projects.
 * 
 * Run with: node backend/src/scripts/fixProjectProgress.js
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
import { updateProjectProgress } from '../services/project.service.js'
import { updateSprintVelocity } from '../services/sprint.service.js'
import logger from '../utils/logger.js'

const fixProjectProgress = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agilpro'
    await mongoose.connect(mongoUri)
    logger.info('Connected to MongoDB')

    // Get all projects
    const projects = await Project.find({ isArchived: false }).select('_id name')
    logger.info(`Found ${projects.length} projects to check`)

    let fixedProjects = 0
    let fixedStories = 0

    for (const project of projects) {
      try {
        logger.info(`\nProcessing project "${project.name}" (${project._id})`)

        // First, fix stories that have all tasks done but aren't marked as 'done'
        const stories = await Story.find({ project: project._id })
        logger.info(`  Found ${stories.length} stories`)

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
            logger.info(`    ✓ Fixed story "${story.title}" (${story.storyPoints} points) - all tasks completed`)
            
            // Update sprint velocity if story belongs to a sprint
            if (story.sprint) {
              await updateSprintVelocity(story.sprint.toString())
            }
          }
        }

        // Update project progress
        const progress = await updateProjectProgress(project._id.toString())
        if (progress > 0) {
          fixedProjects++
          logger.info(`  ✓ Updated progress for project "${project.name}": ${progress}%`)
        } else {
          logger.info(`  - Project "${project.name}" progress: ${progress}% (no completed stories)`)
        }
      } catch (error) {
        logger.error(`Error processing project ${project._id}:`, error.message)
      }
    }

    logger.info(`\n=== Summary ===`)
    logger.info(`Total projects checked: ${projects.length}`)
    logger.info(`Projects with progress updated: ${fixedProjects}`)
    logger.info(`Stories auto-completed: ${fixedStories}`)

    // Close connection
    await mongoose.connection.close()
    logger.info('Database connection closed')
    process.exit(0)
  } catch (error) {
    logger.error('Error fixing project progress:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

// Run the script
fixProjectProgress()




