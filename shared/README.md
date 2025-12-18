# Shared - AgileSAFe AI Platform

Shared utilities, constants, and types used across frontend and backend services.

## Contents

- **constants.js** - Shared constants (API endpoints, socket events, user roles, etc.)
- **utils.js** - Shared utility functions (date formatting, validation, etc.)

## Usage

### Frontend
```javascript
import { API_ENDPOINTS, SOCKET_EVENTS } from '../shared/constants.js'
import { formatDate, validateEmail } from '../shared/utils.js'
```

### Backend
```javascript
import { API_ENDPOINTS, STATUS_CODES } from '../shared/constants.js'
import { formatDate } from '../shared/utils.js'
```

## Adding New Shared Code

1. Add constants to `constants.js`
2. Add utility functions to `utils.js`
3. Export from the respective files
4. Import where needed in frontend/backend

