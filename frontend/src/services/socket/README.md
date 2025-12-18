# Socket.IO Client Integration

This directory contains the Socket.IO client integration for real-time features in the AgileSAFe AI Platform.

## Structure

- `socketClient.js` - Main socket instance with connection management
- `socketEventHandlers.js` - Event handlers for all socket events
- `index.js` - Central export point

## Usage

### Basic Socket Connection

The socket connection is automatically initialized when a user is authenticated. The `useSocket` hook in `MainLayout` handles this.

### Using Socket in Components

```javascript
import { useSocket } from '@/hooks/useSocket'

function MyComponent() {
  const { socket, emit, isConnected } = useSocket()

  useEffect(() => {
    const handleTaskUpdate = (data) => {
      console.log('Task updated:', data)
      // Update UI
    }

    socket.on('task:updated', handleTaskUpdate)

    return () => {
      socket.off('task:updated', handleTaskUpdate)
    }
  }, [socket])

  const handleCreateTask = () => {
    emit('task:create', { title: 'New Task', storyId: '123' })
  }

  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
      <button onClick={handleCreateTask}>Create Task</button>
    </div>
  )
}
```

### Real-time Updates for Specific Entities

Use `useRealtimeUpdates` to automatically join rooms and receive updates:

```javascript
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'

function SprintDetail({ sprintId }) {
  // Automatically joins 'sprint:{sprintId}' room and listens to relevant events
  useRealtimeUpdates('sprint', sprintId)

  // Component will automatically update when sprint-related events occur
  return <div>Sprint Details</div>
}
```

### Presence Tracking

Use `usePresence` to track who's viewing the same entity:

```javascript
import { usePresence } from '@/hooks/usePresence'
import Avatar from '@/components/ui/Avatar'

function SprintDetail({ sprintId }) {
  const { onlineUsers, totalOnline } = usePresence('sprint', sprintId)

  return (
    <div>
      <p>{totalOnline} people viewing this sprint</p>
      <div className="flex gap-2">
        {onlineUsers.map((user) => (
          <Avatar key={user.id} name={user.name} src={user.avatar} size="sm" />
        ))}
      </div>
    </div>
  )
}
```

## Event Types

### Task Events
- `task:created` - New task created
- `task:updated` - Task updated
- `task:assigned` - Task assigned to user
- `task:status-changed` - Task status changed
- `task:completed` - Task completed

### Story Events
- `story:created` - New story created
- `story:updated` - Story updated
- `story:moved` - Story moved to different sprint
- `story:ai-analyzed` - AI analysis completed for story

### Sprint Events
- `sprint:started` - Sprint started
- `sprint:completed` - Sprint completed
- `sprint:velocity-updated` - Sprint velocity updated
- `sprint:updated` - Sprint updated

### Collaboration Events
- `user:joined` - User joined a room
- `user:left` - User left a room
- `user:typing` - User is typing
- `comment:added` - Comment added to entity

### Notification Events
- `notification:new` - New notification received

## Connection Status

The `ConnectionStatus` component is automatically displayed in the bottom-right corner, showing:
- 🟢 Green dot: Connected
- 🔴 Red dot: Disconnected
- 🟡 Yellow pulse: Reconnecting

## Environment Variables

Set `VITE_WS_URL` in your `.env` file:

```
VITE_WS_URL=http://localhost:5000
```

For production:
```
VITE_WS_URL=wss://your-backend-domain.com
```

## Notes

- Socket automatically reconnects on disconnect
- JWT token is sent in auth callback
- Rooms are automatically rejoined after reconnection
- React Query cache is automatically invalidated on relevant events
- Toast notifications are shown for important events

