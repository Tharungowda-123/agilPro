import mongoose from 'mongoose'
import logger from '../utils/logger.js'

/**
 * MongoDB Database Connection
 * Handles connection, reconnection, and graceful shutdown
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI 
    
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain at least 5 socket connections
      retryWrites: true,
      w: 'majority',
    }

    logger.info('Attempting to connect to MongoDB...')
    const conn = await mongoose.connect(mongoURI, options)
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`)
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB')
    })

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB')
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      logger.info('MongoDB connection closed due to app termination')
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      await mongoose.connection.close()
      logger.info('MongoDB connection closed due to app termination')
      process.exit(0)
    })

    return conn
  } catch (error) {
    logger.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export default connectDB


