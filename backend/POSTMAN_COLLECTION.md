# Postman API Testing Guide

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### 1. Login
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/auth/login`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "email": "admin@agilesafe.com",
    "password": "Admin@123"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "status": "success",
    "message": "Login successful",
    "data": {
      "user": {
        "_id": "...",
        "name": "Admin User",
        "email": "admin@agilesafe.com",
        "role": "admin"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Response (401):**
  ```json
  {
    "status": "error",
    "statusCode": 401,
    "message": "Invalid email or password"
  }
  ```

### 2. Register
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/auth/register`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```

### 3. Get Current User (Protected)
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/auth/me`
- **Headers:**
  ```
  Authorization: Bearer <accessToken>
  Content-Type: application/json
  ```

### 4. Refresh Token
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/auth/refresh-token`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 5. Logout
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/auth/logout`
- **Headers:**
  ```
  Authorization: Bearer <accessToken>
  Content-Type: application/json
  ```

## Test Credentials

After running the seed script (`npm run seed`), you can use these credentials:

- **Admin:**
  - Email: `admin@agilesafe.com`
  - Password: `Admin@123`

- **Manager:**
  - Email: `manager1@agilesafe.com`
  - Password: `Manager@123`

- **Developer:**
  - Email: `alice@agilesafe.com`
  - Password: `Developer@123`

- **Viewer:**
  - Email: `viewer1@agilesafe.com`
  - Password: `Viewer@123`

## Postman Environment Variables

Create a Postman environment with these variables:

```
base_url: http://localhost:5000/api
access_token: (will be set after login)
refresh_token: (will be set after login)
```

## Postman Pre-request Script (for Login)

To automatically save tokens after login, add this to the "Tests" tab of your Login request:

```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data && response.data.accessToken) {
        pm.environment.set("access_token", response.data.accessToken);
        pm.environment.set("refresh_token", response.data.refreshToken);
        console.log("Tokens saved to environment");
    }
}
```

## Postman Authorization Setup

For protected endpoints, use:
- **Type:** Bearer Token
- **Token:** `{{access_token}}` (from environment variable)

## Common Issues

1. **401 Unauthorized:** 
   - Check if email/password are correct
   - Verify user exists in database (run `npm run seed`)
   - Check if token is expired

2. **400 Bad Request:**
   - Verify JSON format is correct
   - Check required fields (email, password)
   - Ensure email is valid format

3. **429 Too Many Requests:**
   - Rate limiting is active (5 requests per 15 minutes)
   - Wait a few minutes before retrying

4. **500 Server Error:**
   - Check if MongoDB is running
   - Verify backend server is running on port 5000
   - Check server logs for details

