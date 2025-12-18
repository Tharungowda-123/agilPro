# Role-Based Access Control Guide

## How to Test Different Roles

The application supports role-based access control. You can test different roles by logging in with different email addresses.

### Available Roles

1. **Admin** - Full access to all features
2. **Manager** - Access to management features
3. **User** - Standard user access

### Test Credentials

#### Admin User
- **Email:** `john.doe@example.com`
- **Password:** `any password` (e.g., `admin123`)
- **Role:** `admin`
- **Access:** Full access to all features

#### Manager User
- **Email:** `jane.smith@example.com`
- **Password:** `any password` (e.g., `manager123`)
- **Role:** `manager`
- **Access:** Management features

#### Regular User
- **Email:** `mike.johnson@example.com`
- **Password:** `any password` (e.g., `user123`)
- **Role:** `user`
- **Access:** Standard user features

#### Other Users
- **Email:** `sarah.williams@example.com` (role: `user`)
- **Email:** `david.brown@example.com` (role: `user`)

**Note:** Any other email will default to the first user (admin).

## How Role-Based Access Works

### 1. ProtectedRoute Component

The `ProtectedRoute` component supports role-based access:

```javascript
// Allow all authenticated users
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Only allow admin and manager roles
<ProtectedRoute allowedRoles={['admin', 'manager']}>
  <AdminPanel />
</ProtectedRoute>

// Only allow admin role
<ProtectedRoute allowedRoles={['admin']}>
  <Settings />
</ProtectedRoute>
```

### 2. Checking User Role in Components

```javascript
import { useAuthStore } from '@/stores/useAuthStore'

function MyComponent() {
  const { user } = useAuthStore()
  const userRole = user?.role || 'user'

  // Show content based on role
  if (userRole === 'admin') {
    return <AdminContent />
  }

  if (userRole === 'manager') {
    return <ManagerContent />
  }

  return <UserContent />
}
```

### 3. Conditional Rendering Based on Role

```javascript
import { useAuthStore } from '@/stores/useAuthStore'

function ProjectActions() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager'

  return (
    <div>
      {isAdmin && (
        <Button onClick={handleDelete}>Delete Project</Button>
      )}
      {(isAdmin || isManager) && (
        <Button onClick={handleEdit}>Edit Project</Button>
      )}
      <Button onClick={handleView}>View Project</Button>
    </div>
  )
}
```

## Adding Role Restrictions to Routes

To add role restrictions to a route in `App.jsx`:

```javascript
<Route
  path="/admin"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <LoadingBoundary>
        <AdminPanel />
      </LoadingBoundary>
    </ProtectedRoute>
  }
/>
```

## Testing Role-Based Access

1. **Login as Admin:**
   - Email: `john.doe@example.com`
   - Password: `admin123`
   - Should have access to all pages

2. **Login as Manager:**
   - Email: `jane.smith@example.com`
   - Password: `manager123`
   - Should have access to manager pages

3. **Login as User:**
   - Email: `mike.johnson@example.com`
   - Password: `user123`
   - Should have standard user access

4. **Test Access Denied:**
   - Login as a regular user
   - Try to access an admin-only route
   - Should see "Access Denied" message

## Current User Role Display

The user's role is displayed in:
- **Sidebar** - Shows role below user name
- **User Menu** - Shows role in dropdown
- **User Profile** - Shows role information

## Role Constants

Roles are defined in `/frontend/src/constants/index.js`:

```javascript
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MANAGER: 'manager',
}
```

## Example: Creating an Admin-Only Page

```javascript
// In App.jsx
<Route
  path="/admin-settings"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <LoadingBoundary>
        <AdminSettings />
      </LoadingBoundary>
    </ProtectedRoute>
  }
/>

// In AdminSettings component
import { useAuthStore } from '@/stores/useAuthStore'

export default function AdminSettings() {
  const { user } = useAuthStore()
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <div>Admin Settings Content</div>
}
```

## Utility Functions

You can create utility functions for role checking:

```javascript
// utils/roles.js
export const hasRole = (user, role) => {
  return user?.role === role
}

export const hasAnyRole = (user, roles) => {
  return roles.includes(user?.role)
}

export const isAdmin = (user) => {
  return user?.role === 'admin'
}

export const isManager = (user) => {
  return user?.role === 'manager'
}
```

