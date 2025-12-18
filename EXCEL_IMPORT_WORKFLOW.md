# Excel Import - Complete Automated Workflow

## Overview
When you upload an Excel sheet with features, the system now **automatically** performs the complete PI Planning workflow:

1. ✅ **Accepts Features** from Excel
2. ✅ **Breaks Down Features** into Stories (using AI)
3. ✅ **Creates Tasks** for each Story
4. ✅ **Assigns Tasks** to Team Members (based on skills and points)
5. ✅ **Schedules Sprints** and distributes Stories across them

---

## What Happens Automatically

### Step 1: Import Features from Excel
- Reads features from the "Features" sheet
- Creates feature records in the database
- Links features to the project and PI (if provided)

### Step 2: AI Feature Breakdown (Automatic)
For each feature that doesn't have stories:
- **AI analyzes** the feature description
- **Breaks down** into user stories
- **Estimates** story points for each story
- **Creates** acceptance criteria

### Step 3: Task Creation (Automatic)
For each story created:
- **Generates tasks** based on story requirements
- **Estimates hours** for each task
- **Links tasks** to their parent story

### Step 4: AI Task Assignment (Automatic)
For each task created:
- **Analyzes** task requirements and required skills
- **Evaluates** team members based on:
  - Skills match
  - Current workload
  - Availability
  - Performance history
  - Points capacity
- **Assigns** task to the best-matched team member
- **Provides** confidence score and reasoning

### Step 5: Sprint Scheduling (Automatic)
If a PI ID is provided:
- **Creates sprints** if they don't exist (based on PI timeline)
- **Uses AI** to distribute stories across sprints
- **Considers**:
  - Story points and sprint capacity
  - Feature priorities
  - Dependencies between features
  - Team velocity
- **Assigns** stories to appropriate sprints

---

## Excel File Format

### Required Sheets:
1. **Features** - List of features to import
2. **Stories** (optional) - Pre-defined stories (if not provided, AI will create them)
3. **Tasks** (optional) - Pre-defined tasks (if not provided, AI will create them)

### Features Sheet Columns:
- `Title*` (Required) - Feature title
- `Description*` (Required) - Feature description
- `Priority*` (Required) - high/medium/low
- `Business Value` (Optional) - Business value description
- `Estimated Points` (Optional) - Estimated story points
- `Status` (Optional) - draft/in-progress/completed

### Example Features Sheet:
```
Title*          | Description*              | Priority* | Business Value
User Login      | Implement user login     | high     | Critical feature
Shopping Cart   | Add shopping cart         | high     | Revenue driver
```

---

## API Endpoint

**POST** `/api/import/excel`

### Request Body:
```json
{
  "projectId": "project_id_here",
  "piId": "pi_id_here",  // Optional but recommended for sprint scheduling
  "autoBreakdown": true,  // Default: true
  "autoAssign": true,     // Default: true
  "autoScheduleSprints": true  // Default: true
}
```

### Response:
```json
{
  "imported": {
    "features": 5,
    "stories": 15,
    "tasks": 45,
    "tasksAssigned": 42,
    "sprintsCreated": 3,
    "storiesScheduled": 15
  },
  "breakdown": {
    "featuresProcessed": 5,
    "storiesCreated": 15,
    "tasksCreated": 45,
    "tasksAssigned": 42
  },
  "sprintScheduling": {
    "sprintsCreated": 3,
    "storiesScheduled": 15
  },
  "errors": []
}
```

---

## How to Use

### From Frontend (PI Planning Board):

1. **Navigate to PI Planning**
   - Go to your project
   - Click on "PI Planning" tab
   - Open a PI (or create one)

2. **Open Planning Board**
   - Click "Open Planning Board" button

3. **Import Excel**
   - Look for "Import from Excel" section
   - Click "Choose File" or drag-and-drop your Excel file
   - Ensure the file has a "Features" sheet
   - Click "Import"

4. **Wait for Processing**
   - System will:
     - Import features
     - Break down into stories (if needed)
     - Create tasks
     - Assign tasks to team members
     - Schedule sprints

5. **Review Results**
   - Check the success message
   - Review any errors (if any)
   - View the Planning Board to see:
     - Features broken down into stories
     - Tasks assigned to team members
     - Stories distributed across sprints

---

## What You'll See

### After Import:

1. **Features Tab**
   - All imported features
   - Status: "broken-down" (if AI processed them)
   - Linked stories visible

2. **Stories**
   - Stories created from breakdown
   - Assigned to sprints (if scheduling was enabled)
   - Story points estimated

3. **Tasks**
   - Tasks created for each story
   - Assigned to team members
   - Estimated hours set

4. **Sprints**
   - Sprints created (if PI timeline provided)
   - Stories distributed across sprints
   - Capacity and velocity calculated

5. **Team Members**
   - Tasks assigned based on skills
   - Workload balanced
   - Availability considered

---

## Configuration Options

### Enable/Disable Features:

When importing, you can control what happens:

```javascript
{
  "autoBreakdown": true,        // Break down features into stories
  "autoAssign": true,           // Assign tasks to team members
  "autoScheduleSprints": true   // Schedule stories into sprints
}
```

### Example: Only Breakdown, No Assignment
```json
{
  "projectId": "xxx",
  "piId": "yyy",
  "autoBreakdown": true,
  "autoAssign": false,  // Don't assign tasks
  "autoScheduleSprints": false  // Don't schedule sprints
}
```

---

## AI Assignment Logic

### Task Assignment Criteria:

1. **Skill Match** (40% weight)
   - Required skills vs. team member skills
   - Experience level
   - Past performance on similar tasks

2. **Workload Balance** (30% weight)
   - Current assigned tasks
   - Available capacity
   - Points already committed

3. **Availability** (20% weight)
   - Time off
   - Other commitments
   - Schedule conflicts

4. **Performance** (10% weight)
   - Completion rate
   - Quality score
   - On-time delivery

### Result:
- Top recommendation with confidence score
- Reasoning for the assignment
- Alternative recommendations available

---

## Sprint Scheduling Logic

### Sprint Creation:
- If PI has start/end dates but no sprints:
  - Creates 2-week sprints automatically
  - Distributes sprints across PI timeline
  - Sets default capacity (21 points)

### Story Distribution:
- Uses AI optimization algorithm
- Considers:
  - Story points vs. sprint capacity
  - Feature priorities
  - Dependencies
  - Team velocity
- Distributes stories to balance workload

---

## Error Handling

### Common Errors:

1. **Missing Required Sheets**
   - Error: "Missing required sheets: Features"
   - Solution: Ensure Excel has "Features" sheet

2. **No Team Members**
   - Error: "No team members available for task assignment"
   - Solution: Assign a team to the project with members

3. **ML Service Unavailable**
   - Error: "ML service unavailable"
   - Solution: Check ML service is running
   - Workaround: Import will continue but skip AI features

4. **Invalid PI ID**
   - Error: "Program Increment not found"
   - Solution: Ensure PI exists or don't provide piId

---

## Best Practices

1. **Prepare Your Excel File**
   - Include clear feature descriptions
   - Add business value if possible
   - Set priorities correctly

2. **Ensure Team is Set Up**
   - Assign team to project
   - Add team members with skills
   - Set member availability

3. **Create PI First** (Recommended)
   - Create PI with start/end dates
   - System will create sprints automatically
   - Stories will be distributed optimally

4. **Review After Import**
   - Check task assignments
   - Verify sprint distribution
   - Adjust if needed

5. **Use PI Planning Board**
   - Drag-and-drop to adjust assignments
   - Use AI Optimize for redistribution
   - Save changes

---

## Summary

**YES!** When you upload an Excel sheet with features, the system now **automatically**:

✅ Accepts features from Excel  
✅ Breaks down features into stories (AI)  
✅ Creates tasks for each story  
✅ Assigns tasks to team members (based on skills & points)  
✅ Schedules sprints and distributes stories  

All of this happens in **one import operation**! You just need to:
1. Prepare your Excel file with features
2. Upload it through the PI Planning Board
3. Wait for processing
4. Review and adjust if needed

The system handles everything else automatically using AI! 🚀

