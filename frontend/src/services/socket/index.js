/**
 * Socket Service Exports
 * Central export point for all socket-related functionality
 */

export { default as socket, connectSocket, disconnectSocket, reconnectSocket, updateSocketAuth } from './socketClient'
export {
  registerEventHandlers,
  unregisterEventHandlers,
  taskEventHandlers,
  storyEventHandlers,
  sprintEventHandlers,
  collaborationEventHandlers,
  notificationEventHandlers,
  setToastInstance,
} from './socketEventHandlers'

