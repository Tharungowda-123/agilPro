#!/bin/bash

# ML Service Testing Script
# This script tests all ML service features

set -e

ML_SERVICE_URL="http://localhost:8000"
BACKEND_URL="http://localhost:5000/api"
API_KEY="dev"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== ML Service Testing Script ===${NC}\n"

# Check if ML service is running
echo "1. Checking ML Service Health..."
if curl -s "$ML_SERVICE_URL/health" > /dev/null; then
    echo -e "${GREEN}✓ ML Service is running${NC}"
else
    echo -e "${RED}✗ ML Service is not running. Please start it first.${NC}"
    echo "   Run: cd ml-service && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
    exit 1
fi

# Check if backend is running
echo "2. Checking Backend Service..."
if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠ Backend may not be running (this is okay for direct ML tests)${NC}"
fi

echo ""
echo -e "${YELLOW}=== Direct ML Service Tests ===${NC}\n"

# Test 1: Health Check
echo "Test 1: Health Check"
RESPONSE=$(curl -s "$ML_SERVICE_URL/health")
if echo "$RESPONSE" | grep -q "healthy\|status"; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "   Response: $RESPONSE"
else
    echo -e "${RED}✗ Health check failed${NC}"
fi
echo ""

# Test 2: Model Info
echo "Test 2: Get Model Info"
RESPONSE=$(curl -s -X GET "$ML_SERVICE_URL/api/ml/info" \
    -H "x-api-key: $API_KEY")
if echo "$RESPONSE" | grep -q "models\|total"; then
    echo -e "${GREEN}✓ Model info retrieved${NC}"
    echo "   Response: $RESPONSE" | head -c 200
    echo "..."
else
    echo -e "${RED}✗ Failed to get model info${NC}"
fi
echo ""

# Test 3: Velocity Forecast
echo "Test 3: Velocity Forecast"
RESPONSE=$(curl -s -X POST "$ML_SERVICE_URL/api/ml/velocity/forecast" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{
        "team_id": "69160a0b95bc437885a7f8d4",
        "sprint_capacity": 80
    }')
if echo "$RESPONSE" | grep -q "predicted_velocity\|velocity"; then
    echo -e "${GREEN}✓ Velocity forecast successful${NC}"
    echo "   Response: $RESPONSE" | head -c 200
    echo "..."
else
    echo -e "${RED}✗ Velocity forecast failed${NC}"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 4: Risk Analysis
echo "Test 4: Risk Analysis (Detect Bottlenecks)"
RESPONSE=$(curl -s -X POST "$ML_SERVICE_URL/api/ml/risks/detect-bottlenecks" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{
        "team_id": "69160a0b95bc437885a7f8d4"
    }')
if echo "$RESPONSE" | grep -q "bottlenecks\|\[\]"; then
    echo -e "${GREEN}✓ Bottleneck detection successful${NC}"
    echo "   Response: $RESPONSE" | head -c 200
    echo "..."
else
    echo -e "${RED}✗ Bottleneck detection failed${NC}"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 5: Story Analysis
echo "Test 5: Story Complexity Analysis"
RESPONSE=$(curl -s -X POST "$ML_SERVICE_URL/api/ml/stories/analyze-complexity" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{
        "title": "User authentication",
        "description": "Implement secure login with JWT tokens",
        "acceptance_criteria": ["User can login", "Token is generated"]
    }')
if echo "$RESPONSE" | grep -q "complexity\|breakdown"; then
    echo -e "${GREEN}✓ Story analysis successful${NC}"
    echo "   Response: $RESPONSE" | head -c 200
    echo "..."
else
    echo -e "${RED}✗ Story analysis failed${NC}"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 6: Task Assignment
echo "Test 6: Task Assignment Recommendations"
RESPONSE=$(curl -s -X POST "$ML_SERVICE_URL/api/ml/tasks/recommend-assignee" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{
        "task_id": "test_task_123",
        "title": "Implement API endpoint",
        "description": "Create REST API for user management",
        "priority": "high",
        "estimated_hours": 8,
        "story_points": 5,
        "team_members": ["user1", "user2"]
    }')
if echo "$RESPONSE" | grep -q "recommendations\|user_id"; then
    echo -e "${GREEN}✓ Task assignment successful${NC}"
    echo "   Response: $RESPONSE" | head -c 200
    echo "..."
else
    echo -e "${RED}✗ Task assignment failed${NC}"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 7: Sprint Planning
echo "Test 7: Sprint Plan Optimization"
RESPONSE=$(curl -s -X POST "$ML_SERVICE_URL/api/ml/sprints/optimize-plan" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d '{
        "sprint_id": "test_sprint_123",
        "sprint_capacity": 80,
        "team_members": ["user1", "user2"],
        "available_stories": [
            {"id": "story1", "points": 5, "priority": "high"},
            {"id": "story2", "points": 3, "priority": "medium"}
        ]
    }')
if echo "$RESPONSE" | grep -q "suggested_stories\|optimization"; then
    echo -e "${GREEN}✓ Sprint optimization successful${NC}"
    echo "   Response: $RESPONSE" | head -c 200
    echo "..."
else
    echo -e "${RED}✗ Sprint optimization failed${NC}"
    echo "   Response: $RESPONSE"
fi
echo ""

echo -e "${YELLOW}=== Testing Complete ===${NC}\n"
echo "To test via Backend API, you need to:"
echo "1. Login: curl -X POST $BACKEND_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"YOUR_EMAIL\",\"password\":\"YOUR_PASSWORD\"}'"
echo "2. Use the JWT token from response in Authorization header"
echo ""
echo "See ML_SERVICE_TESTING_GUIDE.md for detailed testing instructions."

