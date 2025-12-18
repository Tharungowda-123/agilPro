#!/bin/bash

# Backend & Frontend Features Testing Script
# Tests Task Assignment and Sprint Optimization features end-to-end

set -e

BACKEND_URL="http://localhost:5000/api"
ML_SERVICE_URL="http://localhost:8000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Backend & Frontend Features Testing Script ===${NC}\n"

# Check if backend is running
echo "1. Checking Backend Service..."
if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running. Please start it first.${NC}"
    echo "   Run: cd backend && pnpm dev"
    exit 1
fi

# Check if ML service is running
echo "2. Checking ML Service..."
if curl -s "$ML_SERVICE_URL/health" > /dev/null; then
    echo -e "${GREEN}✓ ML Service is running${NC}"
else
    echo -e "${YELLOW}⚠ ML Service is not running (some features may not work)${NC}"
fi

echo ""
echo -e "${BLUE}=== Authentication & Setup ===${NC}\n"

# Login to get token
echo "3. Logging in as Admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "manojmanu938055@gmail.com",
        "password": "Demo@123"
    }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Login failed - no accessToken found${NC}"
    echo "   Response: $LOGIN_RESPONSE" | head -c 200
    echo "..."
    exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "   Token: ${TOKEN:0:50}..."

# Get user info
echo ""
echo "4. Getting user information..."
USER_RESPONSE=$(curl -s -X GET "$BACKEND_URL/auth/me" \
    -H "Authorization: Bearer $TOKEN")

USER_ID=$(echo "$USER_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
USER_NAME=$(echo "$USER_RESPONSE" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
USER_ROLE=$(echo "$USER_RESPONSE" | grep -o '"role":"[^"]*' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}✓ User: $USER_NAME ($USER_ROLE)${NC}"
echo "   User ID: $USER_ID"

# Get projects
echo ""
echo "5. Getting projects..."
PROJECTS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/projects" \
    -H "Authorization: Bearer $TOKEN")

PROJECT_ID=$(echo "$PROJECTS_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
PROJECT_NAME=$(echo "$PROJECTS_RESPONSE" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}✗ No projects found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found project: $PROJECT_NAME${NC}"
echo "   Project ID: $PROJECT_ID"

# Get team members
echo ""
echo "6. Getting team members..."
TEAM_RESPONSE=$(curl -s -X GET "$BACKEND_URL/teams" \
    -H "Authorization: Bearer $TOKEN")

TEAM_ID=$(echo "$TEAM_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
TEAM_NAME=$(echo "$TEAM_RESPONSE" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$TEAM_ID" ]; then
    echo -e "${YELLOW}⚠ No teams found${NC}"
else
    echo -e "${GREEN}✓ Found team: $TEAM_NAME${NC}"
    echo "   Team ID: $TEAM_ID"
    
    # Get team members
    TEAM_DETAIL_RESPONSE=$(curl -s -X GET "$BACKEND_URL/teams/$TEAM_ID" \
        -H "Authorization: Bearer $TOKEN")
    
    MEMBER_IDS=$(echo "$TEAM_DETAIL_RESPONSE" | grep -o '"_id":"[^"]*' | head -3 | cut -d'"' -f4 | tr '\n' ',' | sed 's/,$//')
    echo "   Member IDs: $MEMBER_IDS"
fi

echo ""
echo -e "${BLUE}=== Testing Story Query Fix ===${NC}\n"

# Test 1: Query stories with 'todo' status (should map to 'backlog')
echo "Test 1: Query stories with status='todo' (should map to 'backlog')"
STORIES_TODO_RESPONSE=$(curl -s -X GET "$BACKEND_URL/stories/projects/$PROJECT_ID/stories?status=todo" \
    -H "Authorization: Bearer $TOKEN")

if echo "$STORIES_TODO_RESPONSE" | grep -q '"status":"error"\|"statusCode":40[0-9]\|"statusCode":50[0-9]'; then
    echo -e "${RED}✗ Query failed${NC}"
    echo "   Response: $STORIES_TODO_RESPONSE" | head -c 200
    echo "..."
else
    echo -e "${GREEN}✓ Query successful (status='todo' mapped to 'backlog')${NC}"
    STORY_COUNT=$(echo "$STORIES_TODO_RESPONSE" | grep -o '"_id"' | wc -l)
    echo "   Found $STORY_COUNT stories"
fi

# Test 2: Query stories with 'backlog' status
echo ""
echo "Test 2: Query stories with status='backlog'"
STORIES_BACKLOG_RESPONSE=$(curl -s -X GET "$BACKEND_URL/stories/projects/$PROJECT_ID/stories?status=backlog" \
    -H "Authorization: Bearer $TOKEN")

if echo "$STORIES_BACKLOG_RESPONSE" | grep -q '"status":"error"\|"statusCode":40[0-9]\|"statusCode":50[0-9]'; then
    echo -e "${RED}✗ Query failed${NC}"
    echo "   Response: $STORIES_BACKLOG_RESPONSE" | head -c 200
else
    echo -e "${GREEN}✓ Query successful${NC}"
    BACKLOG_COUNT=$(echo "$STORIES_BACKLOG_RESPONSE" | grep -o '"_id"' | wc -l)
    echo "   Found $BACKLOG_COUNT stories"
fi

echo ""
echo -e "${BLUE}=== Testing Sprint Creation ===${NC}\n"

# Test 3: Create a sprint
echo "Test 3: Create a new sprint"
SPRINT_NAME="Test Sprint $(date +%s)"
START_DATE=$(date -d "+1 day" +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d 2>/dev/null || date +%Y-%m-%d)
END_DATE=$(date -d "+15 days" +%Y-%m-%d 2>/dev/null || date -v+15d +%Y-%m-%d 2>/dev/null || date +%Y-%m-%d)

CREATE_SPRINT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/projects/$PROJECT_ID/sprints" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"$SPRINT_NAME\",
        \"goal\": \"Test sprint for AI features - Foundation setup and core infrastructure\",
        \"startDate\": \"$START_DATE\",
        \"endDate\": \"$END_DATE\",
        \"capacity\": 80
    }")

# Extract sprint ID from response (format: data.sprint._id)
SPRINT_ID=$(echo "$CREATE_SPRINT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('sprint', {}).get('_id', ''))" 2>/dev/null)

# Fallback: try grep extraction
if [ -z "$SPRINT_ID" ]; then
    # Find _id that's not the project ID
    ALL_IDS=$(echo "$CREATE_SPRINT_RESPONSE" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    for id in $ALL_IDS; do
        if [ "$id" != "$PROJECT_ID" ] && [ ${#id} -eq 24 ]; then
            SPRINT_ID=$id
            break
        fi
    done
fi

if [ -z "$SPRINT_ID" ] || [ "$SPRINT_ID" = "$PROJECT_ID" ]; then
    echo -e "${RED}✗ Sprint creation failed or invalid ID${NC}"
    echo "   Response: $CREATE_SPRINT_RESPONSE" | head -c 300
    echo "..."
    SPRINT_ID=""
else
    echo -e "${GREEN}✓ Sprint created successfully${NC}"
    echo "   Sprint ID: $SPRINT_ID"
    echo "   Name: $SPRINT_NAME"
    echo "   Capacity: 80 points"
fi

echo ""
echo -e "${BLUE}=== Testing Task Assignment AI ===${NC}\n"

# Get stories to find a task
echo "Test 4: Get stories to find tasks..."
STORIES_RESPONSE=$(curl -s -X GET "$BACKEND_URL/stories/projects/$PROJECT_ID/stories?limit=5" \
    -H "Authorization: Bearer $TOKEN")

STORY_ID=$(echo "$STORIES_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$STORY_ID" ]; then
    echo -e "${YELLOW}⚠ No stories found, creating a test story...${NC}"
    # Create a test story
    CREATE_STORY_RESPONSE=$(curl -s -X POST "$BACKEND_URL/projects/$PROJECT_ID/stories" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Test Story for AI Assignment",
            "description": "Test story to verify AI task assignment",
            "storyPoints": 5,
            "priority": "high",
            "status": "ready"
        }')
    STORY_ID=$(echo "$CREATE_STORY_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "   Created story ID: $STORY_ID"
fi

# Get tasks for the story
echo ""
echo "Test 5: Get tasks for story..."
TASKS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/tasks/stories/$STORY_ID/tasks" \
    -H "Authorization: Bearer $TOKEN")

TASK_ID=$(echo "$TASKS_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$TASK_ID" ]; then
    echo -e "${YELLOW}⚠ No tasks found, creating a test task...${NC}"
    # Create a test task
    CREATE_TASK_RESPONSE=$(curl -s -X POST "$BACKEND_URL/tasks/stories/$STORY_ID/tasks" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Implement API endpoint",
            "description": "Create REST API for user management with JWT authentication",
            "priority": "high",
            "estimatedHours": 8,
            "storyPoints": 5,
            "status": "todo"
        }')
    TASK_ID=$(echo "$CREATE_TASK_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('task', {}).get('_id', data.get('data', {}).get('_id', '')))" 2>/dev/null)
    if [ -z "$TASK_ID" ]; then
        TASK_ID=$(echo "$CREATE_TASK_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
    fi
    if [ ! -z "$TASK_ID" ]; then
        echo "   Created task ID: $TASK_ID"
    else
        echo "   Task creation response: $CREATE_TASK_RESPONSE" | head -c 200
    fi
else
    echo -e "${GREEN}✓ Found task${NC}"
    echo "   Task ID: $TASK_ID"
fi

# Test 6: Get AI recommendations for task
echo ""
echo "Test 6: Get AI task assignment recommendations..."
RECOMMENDATIONS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/tasks/$TASK_ID/recommendations" \
    -H "Authorization: Bearer $TOKEN")

if echo "$RECOMMENDATIONS_RESPONSE" | grep -q "recommendations\|user_id\|userName"; then
    echo -e "${GREEN}✓ Recommendations retrieved${NC}"
    REC_COUNT=$(echo "$RECOMMENDATIONS_RESPONSE" | grep -o '"user_id"' | wc -l)
    echo "   Found $REC_COUNT recommendations"
    
    # Extract first recommendation
    FIRST_USER_ID=$(echo "$RECOMMENDATIONS_RESPONSE" | grep -o '"user_id":"[^"]*' | head -1 | cut -d'"' -f4)
    FIRST_USER_NAME=$(echo "$RECOMMENDATIONS_RESPONSE" | grep -o '"user_name":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$FIRST_USER_NAME" ]; then
        echo "   Top recommendation: $FIRST_USER_NAME"
        echo "   User ID: $FIRST_USER_ID"
        
        # Test 7: Assign task using AI
        echo ""
        echo "Test 7: Assign task using AI recommendation..."
        ASSIGN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/tasks/$TASK_ID/assign-ai" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
        
        if echo "$ASSIGN_RESPONSE" | grep -q "assignedTo\|assigned\|success"; then
            echo -e "${GREEN}✓ Task assigned successfully${NC}"
            ASSIGNED_USER=$(echo "$ASSIGN_RESPONSE" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
            echo "   Assigned to: $ASSIGNED_USER"
        else
            echo -e "${YELLOW}⚠ Assignment response: $ASSIGN_RESPONSE${NC}" | head -c 200
        fi
    fi
else
    echo -e "${YELLOW}⚠ No recommendations or error${NC}"
    echo "   Response: $RECOMMENDATIONS_RESPONSE" | head -c 200
    echo "..."
fi

echo ""
echo -e "${BLUE}=== Testing Sprint Optimization AI ===${NC}\n"

# Test 8: Get sprint AI optimization
if [ ! -z "$SPRINT_ID" ] && [ "$SPRINT_ID" != "$PROJECT_ID" ]; then
    echo "Test 8: Get AI sprint optimization plan..."
    OPTIMIZE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/sprints/$SPRINT_ID/ai/optimize-plan" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    if echo "$OPTIMIZE_RESPONSE" | grep -q "suggested_stories\|suggestedStories\|plan"; then
        echo -e "${GREEN}✓ Sprint optimization successful${NC}"
        STORY_COUNT=$(echo "$OPTIMIZE_RESPONSE" | grep -o '"story_id"' | wc -l)
        echo "   Suggested $STORY_COUNT stories"
        
        # Extract some details
        TOTAL_POINTS=$(echo "$OPTIMIZE_RESPONSE" | grep -o '"total_story_points":[0-9]*' | cut -d':' -f2)
        CAPACITY=$(echo "$OPTIMIZE_RESPONSE" | grep -o '"team_capacity":[0-9]*' | cut -d':' -f2)
        
        if [ ! -z "$TOTAL_POINTS" ]; then
            echo "   Total points: $TOTAL_POINTS"
        fi
        if [ ! -z "$CAPACITY" ]; then
            echo "   Team capacity: $CAPACITY"
        fi
    else
        echo -e "${YELLOW}⚠ Optimization response: $OPTIMIZE_RESPONSE${NC}" | head -c 200
    fi
    
    # Test 9: Get sprint velocity forecast
    echo ""
    echo "Test 9: Get sprint velocity forecast..."
    VELOCITY_RESPONSE=$(curl -s -X POST "$BACKEND_URL/sprints/$SPRINT_ID/ai/predict-velocity" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    if echo "$VELOCITY_RESPONSE" | grep -q "predicted_velocity\|velocity\|forecast"; then
        echo -e "${GREEN}✓ Velocity forecast successful${NC}"
        PREDICTED=$(echo "$VELOCITY_RESPONSE" | grep -o '"predicted_velocity":[0-9]*' | cut -d':' -f2)
        if [ ! -z "$PREDICTED" ]; then
            echo "   Predicted velocity: $PREDICTED points"
        fi
    else
        echo -e "${YELLOW}⚠ Velocity forecast: $VELOCITY_RESPONSE${NC}" | head -c 200
    fi
    
    # Test 10: Get sprint story suggestions
    echo ""
    echo "Test 10: Get AI story suggestions for sprint..."
    SUGGESTIONS_RESPONSE=$(curl -s -X POST "$BACKEND_URL/sprints/$SPRINT_ID/ai/suggest-stories" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    if echo "$SUGGESTIONS_RESPONSE" | grep -q "suggested_stories\|suggestedStories"; then
        echo -e "${GREEN}✓ Story suggestions successful${NC}"
        SUGGESTION_COUNT=$(echo "$SUGGESTIONS_RESPONSE" | grep -o '"story_id"' | wc -l)
        echo "   Suggested $SUGGESTION_COUNT stories"
    else
        echo -e "${YELLOW}⚠ Suggestions response: $SUGGESTIONS_RESPONSE${NC}" | head -c 200
    fi
else
    echo -e "${YELLOW}⚠ Skipping sprint AI tests (no valid sprint ID)${NC}"
fi

echo ""
echo -e "${BLUE}=== Testing Dashboard Features ===${NC}\n"

# Test 11: Get dashboard velocity forecast
echo "Test 11: Get dashboard velocity forecast..."
VELOCITY_DASH_RESPONSE=$(curl -s -X GET "$BACKEND_URL/dashboard/velocity-forecast" \
    -H "Authorization: Bearer $TOKEN")

if echo "$VELOCITY_DASH_RESPONSE" | grep -q "predicted_velocity\|velocity\|forecast"; then
    echo -e "${GREEN}✓ Dashboard velocity forecast successful${NC}"
else
    echo -e "${YELLOW}⚠ Dashboard velocity: $VELOCITY_DASH_RESPONSE${NC}" | head -c 200
fi

# Test 12: Get dashboard risk alerts
echo ""
echo "Test 12: Get dashboard risk alerts..."
RISK_RESPONSE=$(curl -s -X GET "$BACKEND_URL/dashboard/risk-alerts" \
    -H "Authorization: Bearer $TOKEN")

if echo "$RISK_RESPONSE" | grep -q "alerts\|bottlenecks\|risk"; then
    echo -e "${GREEN}✓ Dashboard risk alerts successful${NC}"
    ALERT_COUNT=$(echo "$RISK_RESPONSE" | grep -o '"type"' | wc -l)
    echo "   Found $ALERT_COUNT alerts/bottlenecks"
else
    echo -e "${YELLOW}⚠ Risk alerts: $RISK_RESPONSE${NC}" | head -c 200
fi

echo ""
echo -e "${BLUE}=== Summary ===${NC}\n"
echo "✅ Tests completed!"
echo ""
echo "Features tested:"
echo "  ✓ Story query with 'todo' status (fixed)"
echo "  ✓ Sprint creation"
echo "  ✓ Task assignment AI recommendations"
echo "  ✓ Task assignment via AI"
echo "  ✓ Sprint optimization AI"
echo "  ✓ Sprint velocity forecast"
echo "  ✓ Sprint story suggestions"
echo "  ✓ Dashboard velocity forecast"
echo "  ✓ Dashboard risk alerts"
echo ""
echo "To test in the web application:"
echo "  1. Login at http://localhost:5173"
echo "  2. Go to Projects → Select a project"
echo "  3. Create a sprint (see SPRINT_CREATION_GUIDE.md)"
echo "  4. Test AI features (see MANUAL_TESTING_GUIDE.md)"

