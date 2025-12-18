/**
 * Initialize Developer Metrics Script
 * 
 * This script initializes currentWorkload, velocity, and performance metrics
 * for all existing users in the database.
 * 
 * Run with: node backend/src/scripts/initializeDeveloperMetrics.js
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
import User from '../models/User.js'
import { updateAllDeveloperMetrics } from '../services/developerMetrics.service.js'
import logger from '../utils/logger.js'

const initializeMetrics = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agilpro'
    await mongoose.connect(mongoUri)
    logger.info('Connected to MongoDB')

    // Get all active users
    const users = await User.find({ isActive: true }).select('_id name email')
    logger.info(`Found ${users.length} active users to update`)

    // Update metrics for each user
    let successCount = 0
    let errorCount = 0

    for (const user of users) {
      try {
        await updateAllDeveloperMetrics(user._id.toString())
        successCount++
        logger.info(`✓ Updated metrics for ${user.name} (${user.email})`)
      } catch (error) {
        errorCount++
        logger.error(`✗ Failed to update metrics for ${user.name}:`, error.message)
      }
    }

    logger.info(`\n=== Summary ===`)
    logger.info(`Total users: ${users.length}`)
    logger.info(`Success: ${successCount}`)
    logger.info(`Errors: ${errorCount}`)

    // Close connection
    await mongoose.connection.close()
    logger.info('Database connection closed')
    process.exit(0)
  } catch (error) {
    logger.error('Error initializing developer metrics:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

// Run the script
initializeMetrics()

