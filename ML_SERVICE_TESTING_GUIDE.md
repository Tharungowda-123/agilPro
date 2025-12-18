# ML Service Testing Guide

## Overview
The ML Service provides AI/ML capabilities for AgileSAFe including velocity forecasting, risk analysis, task assignment, sprint planning, and story analysis.

**ML Service URL:** `http://localhost:8000`  
**Backend API URL:** `http://localhost:5000/api`

---

## 🚀 Quick Start - Testing ML Service

### 1. Start ML Service
```bash
cd /home/ai/agilPro/ml-service
source venv/bin/activate  # or vitivenv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Verify ML Service is Running
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

### 3. Access Swagger UI
Open in browser: `http://localhost:8000/docs`

---

## 📋 All ML Service Features

### **1. Velocity Forecasting** 🎯

#### ML Service Endpoints (Direct)
- `POST /api/ml/velocity/forecast` - Forecast next sprint velocity
- `POST /api/ml/velocity/predict-completion` - Estimate completion timeline
- `POST /api/ml/velocity/detect-anomalies` - Detect velocity anomalies
- `GET /api/ml/velocity/trends/{team_id}` - Get velocity trend

#### Backend API Endpoints (Via Backend)
- `GET /api/dashboard/velocity-forecast` - Dashboard velocity forecast

#### Role Permissions
- ✅ **Admin**: Full access
- ✅ **Manager**: Full access
- ✅ **Developer**: Can view their team's forecast
- ❌ **Viewer**: No access

#### Testing Steps

**1. Test via Backend API (Recommended)**
```bash
# Login first to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manojmanu938055@gmail.com","password":"Demo@123"}'

# Use token from response
TOKEN="your_jwt_token_here"

# Get velocity forecast
curl -X GET http://localhost:5000/api/dashboard/velocity-forecast \
  -H "Authorization: Bearer $TOKEN"
```

**2. Test Direct ML Service**
```bash
curl -X POST http://localhost:8000/api/ml/velocity/forecast \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev" \
  -d '{
    "team_id": "69160a0b95bc437885a7f8d4",
    "sprint_capacity": 80
  }'
```

**3. Test in Frontend**
- Login as **Admin/Manager/Developer**
- Navigate to **Dashboard**
- View **"Sprint Velocity Forecast"** card

---

### **2. Risk Analysis** ⚠️

#### ML Service Endpoints (Direct)
- `POST /api/ml/risks/analyze-project` - Analyze project-level risks
- `POST /api/ml/risks/analyze-sprint` - Analyze sprint-specific risks
- `POST /api/ml/risks/detect-bottlenecks` - Detect overloaded developers
- `POST /api/ml/risks/predict-delays` - Predict sprint delays
- `GET /api/ml/risks/alerts/{team_id}` - Get active risk alerts

#### Backend API Endpoints (Via Backend)
- `GET /api/dashboard/risk-alerts` - Dashboard risk alerts and bottlenecks

#### Role Permissions
- ✅ **Admin**: Full access
- ✅ **Manager**: Full access
- ✅ **Developer**: Read-only access (can view alerts)
- ✅ **Viewer**: Read-only access (can view alerts)

#### Testing Steps

**1. Test via Backend API**
```bash
# Get risk alerts (all roles except viewer can access)
curl -X GET http://localhost:5000/api/dashboard/risk-alerts \
  -H "Authorization: Bearer $TOKEN"
```

**2. Test Direct ML Service**
```bash
# Analyze project risks
curl -X POST http://localhost:8000/api/ml/risks/analyze-project \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev" \
  -d '{
    "project_id": "YOUR_PROJECT_ID"
  }'

# Detect bottlenecks
curl -X POST http://localhost:8000/api/ml/risks/detect-bottlenecks \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev" \
  -d '{
    "team_id": "69160a0b95bc437885a7f8d4"
  }'
```

**3. Test in Frontend**
- Login as any role
- Navigate to **Dashboard**
- View **"Risk Alerts Panel"** (shows both alerts and bottlenecks)

---

### **3. Task Assignment Recommendations** 👥

#### ML Service Endpoints (Direct)
- `POST /api/ml/tasks/recommend-assignee` - Recommend best assignee
- `POST /api/ml/tasks/batch-assign` - Batch assignment recommendations
- `POST /api/ml/tasks/rebalance-workload` - Suggest workload rebalancing
- `POST /api/ml/tasks/feedback` - Submit feedback on recommendations
- `GET /api/ml/tasks/model-stats` - Get model statistics

#### Backend API Endpoints (Via Backend)
- `POST /api/tasks/:id/assign-ai` - Assign task using AI (Manager/Admin only)
- `GET /api/tasks/:id/recommendations` - Get assignment recommendations
- `POST /api/tasks/:id/ai/feedback` - Submit feedback (Manager/Admin only)
- `GET /api/tasks/ai/model-stats` - Get model stats (Manager/Admin only)

#### Role Permissions
- ✅ **Admin**: Full access (assign, view recommendations, submit feedback)
- ✅ **Manager**: Full access (assign, view recommendations, submit feedback)
- ✅ **Developer**: Can view recommendations for their own tasks
- ❌ **Viewer**: No access

#### Testing Steps

**1. Test via Backend API**
```bash
# Get recommendations for a task
curl -X GET http://localhost:5000/api/tasks/TASK_ID/recommendations \
  -H "Authorization: Bearer $TOKEN"

# Assign task using AI (Manager/Admin only)
curl -X POST http://localhost:5000/api/tasks/TASK_ID/assign-ai \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Get model stats (Manager/Admin only)
curl -X GET http://localhost:5000/api/tasks/ai/model-stats \
  -H "Authorization: Bearer $TOKEN"
```

**2. Test Direct ML Service**
```bash
curl -X POST http://localhost:8000/api/ml/tasks/recommend-assignee \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev" \
  -d '{
    "task_id": "TASK_ID",
    "title": "Implement user authentication",
    "description": "Add JWT-based auth",
    "priority": "high",
    "estimated_hours": 8,
    "story_points": 5,
    "team_members": ["USER_ID_1", "USER_ID_2"]
  }'
```

**3. Test in Frontend**
- Login as **Manager/Admin**
- Navigate to a **Task**
- Click **"AI Assign"** or **"Get Recommendations"**

---

### **4. Sprint Planning** 📅

#### ML Service Endpoints (Direct)
- `POST /api/ml/sprints/optimize-plan` - Optimize sprint plan
- `POST /api/ml/sprints/predict-velocity` - Predict sprint velocity
- `POST /api/ml/sprints/simulate` - Simulate sprint outcome
- `POST /api/ml/sprints/suggest-stories` - Suggest backlog stories

#### Backend API Endpoints (Via Backend)
- `POST /api/sprints/:id/ai/optimize-plan` - Optimize sprint (Manager/Admin only)
- `POST /api/sprints/:id/ai/predict-velocity` - Predict velocity (Manager/Admin only)
- `POST /api/sprints/:id/ai/suggest-stories` - Suggest stories (Manager/Admin only)
- `POST /api/sprints/:id/ai/simulate` - Simulate outcome (Manager/Admin only)
- `POST /api/sprints/:id/ai/predict-completion` - Predict completion (Manager/Admin only)

#### Role Permissions
- ✅ **Admin**: Full access to all AI sprint planning features
- ✅ **Manager**: Full access to all AI sprint planning features
- ❌ **Developer**: No access
- ❌ **Viewer**: No access

#### Testing Steps

**1. Test via Backend API**
```bash
# Optimize sprint plan
curl -X POST http://localhost:5000/api/sprints/SPRINT_ID/ai/optimize-plan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Predict velocity
curl -X POST http://localhost:5000/api/sprints/SPRINT_ID/ai/predict-velocity \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Suggest stories
curl -X POST http://localhost:5000/api/sprints/SPRINT_ID/ai/suggest-stories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**2. Test Direct ML Service**
```bash
curl -X POST http://localhost:8000/api/ml/sprints/optimize-plan \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev" \
  -d '{
    "sprint_id": "SPRINT_ID",
    "sprint_capacity": 80,
    "team_members": ["USER_ID_1", "USER_ID_2"],
    "available_stories": [
      {"id": "STORY_1", "points": 5, "priority": "high"},
      {"id": "STORY_2", "points": 3, "priority": "medium"}
    ]
  }'
```

**3. Test in Frontend**
- Login as **Manager/Admin**
- Navigate to a **Sprint**
- Use AI planning features in sprint detail page

---

### **5. Story Analysis** 📖

#### ML Service Endpoints (Direct)
- `POST /api/ml/stories/analyze-complexity` - Analyze story complexity
- `POST /api/ml/stories/estimate-points` - Estimate story points
- `POST /api/ml/stories/extract-requirements` - Extract requirements
- `POST /api/ml/stories/find-similar` - Find similar stories
- `POST /api/ml/stories/breakdown` - Break down feature into stories

#### Backend API Endpoints (Via Backend)
- `POST /api/stories/:id/analyze` - Analyze story complexity
- `POST /api/stories/:id/estimate-points` - Estimate story points
- `GET /api/stories/:id/similar` - Find similar stories

#### Role Permissions
- ✅ **Admin**: Full access
- ✅ **Manager**: Full access
- ✅ **Developer**: Can analyze stories they have access to
- ✅ **Viewer**: Can view analysis results (read-only)

#### Testing Steps

**1. Test via Backend API**
```bash
# Analyze story complexity
curl -X POST http://localhost:5000/api/stories/STORY_ID/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Estimate story points
curl -X POST http://localhost:5000/api/stories/STORY_ID/estimate-points \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Find similar stories
curl -X GET http://localhost:5000/api/stories/STORY_ID/similar \
  -H "Authorization: Bearer $TOKEN"
```

**2. Test Direct ML Service**
```bash
curl -X POST http://localhost:8000/api/ml/stories/analyze-complexity \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev" \
  -d '{
    "title": "User login feature",
    "description": "Implement secure user authentication with JWT",
    "acceptance_criteria": [
      "User can login with email/password",
      "JWT token is generated on success"
    ]
  }'
```

**3. Test in Frontend**
- Login as any role
- Navigate to a **Story**
- Click **"Analyze Complexity"** or **"Estimate Points"**

---

### **6. General ML Endpoints** 🔧

#### ML Service Endpoints
- `GET /api/ml/info` - List available models
- `POST /api/ml/predict` - Generic prediction endpoint
- `POST /api/ml/analyze` - Generic analysis endpoint
- `GET /health` - Health check (no auth required)

#### Testing Steps

```bash
# Health check (no auth)
curl http://localhost:8000/health

# Get model info
curl -X GET http://localhost:8000/api/ml/info \
  -H "x-api-key: dev"
```

---

## 🧪 Complete Testing Workflow by Role

### **Admin Role** (Full Access)
```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manojmanu938055@gmail.com","password":"Demo@123"}'

# 2. Test all features
# - Velocity forecast ✅
# - Risk analysis ✅
# - Task assignment ✅
# - Sprint planning ✅
# - Story analysis ✅
```

### **Manager Role** (Most Features)
```bash
# Same as Admin, except:
# - Cannot delete projects/users
# - Can manage their assigned teams/projects
```

### **Developer Role** (Limited Access)
```bash
# Can access:
# - View velocity forecast for their team ✅
# - View risk alerts ✅
# - View task recommendations for their tasks ✅
# - Analyze stories they have access to ✅

# Cannot access:
# - Sprint AI planning ❌
# - Task AI assignment ❌
# - Model statistics ❌
```

### **Viewer Role** (Read-Only)
```bash
# Can access:
# - View risk alerts ✅
# - View story analysis results ✅

# Cannot access:
# - Any write operations ❌
# - AI planning features ❌
# - Task recommendations ❌
```

---

## 🔍 Troubleshooting

### ML Service Not Responding
```bash
# Check if service is running
curl http://localhost:8000/health

# Check logs
cd /home/ai/agilPro/ml-service
tail -f logs/ml-service.log
```

### 401 Unauthorized
- Ensure `API_KEY=dev` is set in ML service `.env`
- Ensure `ML_SERVICE_API_KEY=dev` is set in backend `.env`
- Check that API key middleware is not blocking requests

### 403 Forbidden
- Check user role permissions
- Verify user has access to the resource (team/project)

### Empty Results
- Ensure database has seeded data
- Check that team/project IDs are valid
- Verify user is linked to a team

---

## 📊 Expected Response Examples

### Velocity Forecast
```json
{
  "predicted_velocity": 45,
  "confidence": 0.85,
  "confidence_interval": [40, 50],
  "trend": "increasing"
}
```

### Risk Analysis
```json
{
  "risk_factors": [
    {
      "type": "capacity",
      "score": 75,
      "description": "Team capacity exceeded"
    }
  ],
  "bottlenecks": [
    {
      "user_id": "USER_ID",
      "workload_percentage": 120,
      "reason": "Overloaded"
    }
  ]
}
```

### Task Recommendations
```json
{
  "recommendations": [
    {
      "user_id": "USER_ID",
      "confidence": 0.92,
      "reasoning": "Has experience with similar tasks",
      "workload_percentage": 60
    }
  ]
}
```

---

## 🎯 Quick Test Checklist

- [ ] ML service health check passes
- [ ] Velocity forecast returns data
- [ ] Risk alerts show on dashboard
- [ ] Task recommendations work
- [ ] Sprint planning AI features accessible (Manager/Admin)
- [ ] Story analysis works
- [ ] Role-based access enforced correctly

---

## 📝 Notes

- All ML service endpoints require `x-api-key: dev` header (currently disabled for dev)
- Backend endpoints require JWT token in `Authorization: Bearer TOKEN` header
- Most ML features cache responses for 5 minutes
- Viewer role has minimal access (read-only for most features)
- Developer role can view but not execute AI actions

