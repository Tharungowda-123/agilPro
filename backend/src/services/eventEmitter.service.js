import { EventEmitter } from 'events'
import logger from '../utils/logger.js'

/**
 * Event Emitter Service
 * Decouples controllers from Socket.IO
 * Controllers emit events here, Socket handlers listen
 */

class AppEventEmitter extends EventEmitter {}

const eventEmitter = new AppEventEmitter()

// Set max listeners to prevent memory leaks warning
eventEmitter.setMaxListeners(50)

// Log all events in development
if (process.env.NODE_ENV === 'development') {
  const originalEmit = eventEmitter.emit.bind(eventEmitter)
  eventEmitter.emit = function (event, ...args) {
    logger.debug(`Event emitted: ${event}`, { args: args.length })
    return originalEmit(event, ...args)
  }
}

export default eventEmitter

