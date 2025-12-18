# 🚀 Complete Project Workflow Guide - From Creation to Completion

## 📖 Table of Contents
1. [Introduction](#introduction)
2. [Step 1: Create a Project](#step-1-create-a-project)
3. [Step 2: Create Stories](#step-2-create-stories)
4. [Step 3: Create Sprints](#step-3-create-sprints)
5. [Step 4: Assign Stories to Sprints](#step-4-assign-stories-to-sprints)
6. [Step 5: Create Tasks](#step-5-create-tasks)
7. [Step 6: Assign Tasks to Developers](#step-6-assign-tasks-to-developers)
8. [Step 7: Track Progress on the Board](#step-7-track-progress-on-the-board)
9. [Step 8: Complete Tasks](#step-8-complete-tasks)
10. [Step 9: Complete Stories](#step-9-complete-stories)
11. [Step 10: Complete Sprints](#step-10-complete-sprints)
12. [Step 11: Complete the Project](#step-11-complete-the-project)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 Introduction

This guide will walk you through the **complete workflow** of managing a project in AgileSAFe AI Platform, from the moment you create a project until it's fully completed. Follow these steps in order for the best experience.

**Prerequisites:**
- You must be logged in as **Admin** or **Manager** to create projects, stories, and sprints
- You need at least one **Developer** user in your system to assign tasks

---

## 📝 Step 1: Create a Project

### What is a Project?
A **Project** is the top-level container that holds everything: stories, sprints, tasks, and team members. Think of it as your main workspace.

### How to Create a Project:

1. **Navigate to Projects Page**
   - Click on **"Projects"** in the left sidebar menu
   - You'll see a list of all existing projects (or an empty list if this is your first project)

2. **Click "Create Project" Button**
   - Look for a **"+ Create Project"** or **"New Project"** button (usually at the top right)
   - Click it to open the project creation form

3. **Fill in Project Details**
   - **Project Name** (Required): Enter a descriptive name
     - Example: `E-Commerce Platform`, `Mobile App Development`, `Website Redesign`
   - **Project Key** (Auto-generated): A short code (e.g., `ECOM`, `MOBILE`, `WEB`)
     - This is automatically created from your project name
   - **Description** (Optional): Add details about what this project aims to achieve
   - **Start Date** (Optional): When the project begins
   - **End Date** (Optional): Target completion date
   - **Team** (Optional): Select a team if you have teams set up
   - **Priority** (Optional): Choose `Low`, `Medium`, or `High`

4. **Save the Project**
   - Click **"Create"** or **"Save"** button
   - You'll see a success message: "Project created successfully!"
   - You'll be redirected to the project detail page

### ✅ What You Should See:
- Your new project appears in the projects list
- You can click on it to open the project detail page
- The project detail page shows tabs: **Overview**, **Backlog**, **Sprints**, **Board**, **Team**, etc.

---

## 📚 Step 2: Create Stories

### What is a Story?
A **Story** (User Story) is a feature or requirement written from the user's perspective. It describes what a user wants and why. Stories are broken down into smaller **Tasks** later.

**Format:** "As a [user type], I want to [action] so that [benefit]"

### How to Create Stories:

#### Method 1: From Project Backlog Tab (Recommended)

1. **Open Your Project**
   - Go to **Projects** page
   - Click on your project name to open it

2. **Navigate to Backlog Tab**
   - Click on the **"Backlog"** tab in the project detail page
   - This is where all your stories will be stored

3. **Click "Create Story" Button**
   - Look for **"+ Create Story"** button (usually at the top)
   - Click it to open the story creation form

4. **Fill in Story Details**
   - **Title** (Required): A clear, concise title
     - Example: `Implement User Login`, `Add Shopping Cart`, `Create Dashboard`
   - **Description** (Required): Full description using the user story format
     - Example: `As a user, I want to log in with my email and password so that I can access my account`
   - **Priority** (Required): Choose `Low`, `Medium`, or `High`
   - **Story Points** (Required): Estimate effort (1, 2, 3, 5, 8, 13)
     - **1-2 points**: Very small, quick tasks
     - **3-5 points**: Medium complexity
     - **8-13 points**: Large, complex features
   - **Feature** (Optional): If you have features/epics, select one
   - **Sprint** (Optional): Leave empty for now (we'll assign later)
   - **Assignee** (Optional): Leave empty for now (we'll assign later)
   - **Acceptance Criteria** (Optional): Add checkboxes for what must be true for the story to be complete
     - Example:
       - `User can log in with valid email and password`
       - `User sees error message for invalid credentials`
       - `User is redirected to dashboard after login`

5. **Save the Story**
   - Click **"Create"** or **"Save"** button
   - The story appears in your backlog with status **"Backlog"**

#### Method 2: Quick Create (From Dashboard)

1. **Go to Dashboard**
   - Click **"Dashboard"** in the sidebar
   - Look for **"Quick Actions"** or **"+ Create Story"** button

2. **Fill in Quick Form**
   - Select your project from dropdown
   - Enter title and description
   - Set priority and story points
   - Click **"Create"**

### ✅ What You Should See:
- Story appears in the **Backlog** tab
- Story has status: **"Backlog"** (default)
- Story ID is auto-generated (e.g., `ECOM-1`, `ECOM-2`)

### 💡 Tips:
- Create multiple stories for different features
- Start with high-priority stories first
- Keep story descriptions clear and specific
- Add acceptance criteria to make completion clear

---

## 🏃 Step 3: Create Sprints

### What is a Sprint?
A **Sprint** is a time-boxed period (usually 1-4 weeks) where a team works on a set of stories. It's like a mini-project with a deadline.

### How to Create Sprints:

1. **Open Your Project**
   - Go to **Projects** page
   - Click on your project

2. **Navigate to Sprints Tab**
   - Click on the **"Sprints"** tab in the project detail page
   - You'll see a list of sprints (or an empty list)

3. **Click "Create Sprint" Button**
   - Look for **"+ Create Sprint"** or **"New Sprint"** button
   - Click it to open the sprint creation form

4. **Fill in Sprint Details**
   - **Sprint Name** (Required): Descriptive name
     - Example: `Sprint 1 - User Authentication`, `Sprint 2 - Shopping Cart`, `Sprint 1 - Foundation`
   - **Start Date** (Required): When the sprint begins
     - Example: `2025-01-01`
   - **End Date** (Required): When the sprint ends
     - Example: `2025-01-14` (2-week sprint)
   - **Goal** (Optional): What this sprint aims to achieve
     - Example: `Implement user authentication and authorization`
   - **Capacity** (Optional): Total story points the team can handle
     - Example: `21` points (if team can handle ~21 points per sprint)

5. **Save the Sprint**
   - Click **"Create"** or **"Save"** button
   - Sprint is created with status **"Planning"** (not started yet)

### ✅ What You Should See:
- Sprint appears in the sprints list
- Status: **"Planning"** (means it's ready but not started)
- Sprint shows: `0 stories`, `0 points committed`

### 💡 Tips:
- Create sprints for 1-4 weeks duration
- Name them clearly (Sprint 1, Sprint 2, etc.)
- Set realistic end dates
- Don't start the sprint yet (we'll do that after assigning stories)

---

## 🔗 Step 4: Assign Stories to Sprints

### Why Assign Stories to Sprints?
This tells the system which stories will be worked on during which sprint. It helps with planning and tracking.

### How to Assign Stories to Sprints:

#### Method 1: From Backlog Tab (Bulk Assignment)

1. **Go to Backlog Tab**
   - Open your project
   - Click **"Backlog"** tab

2. **Select Stories**
   - Check the boxes next to the stories you want to assign
   - You can select multiple stories at once
   - Or click **"Select All"** to select all stories

3. **Choose Sprint**
   - Look for a dropdown that says **"Select Sprint"**
   - Click it and choose the sprint you created (e.g., `Sprint 1 - User Authentication`)

4. **Assign Stories**
   - Click **"Assign to Sprint"** button
   - You'll see a success message
   - Stories are now linked to that sprint

#### Method 2: From Story Detail Modal (Individual Assignment)

1. **Open a Story**
   - Click on any story in the backlog
   - Story detail modal opens

2. **Click "Edit" Button**
   - Click the **"Edit"** button (top right, with pencil icon)

3. **Select Sprint**
   - Find the **"Sprint"** dropdown
   - Select your sprint from the list
   - Click **"Save"**

### ✅ What You Should See:
- Stories show the sprint name in the backlog
- Sprint detail page shows the assigned stories
- Sprint shows: `X stories`, `Y points committed` (updated automatically)

### 💡 Tips:
- Assign stories that are related or can be completed together
- Don't assign too many stories (respect sprint capacity)
- Make sure stories are in **"Ready"** or **"Backlog"** status before assigning

---

## ✅ Step 5: Create Tasks

### What is a Task?
A **Task** is a small, actionable work item that belongs to a story. Stories are broken down into tasks that developers can work on. Each task should be completable in a few hours to a day.

### How to Create Tasks:

1. **Open a Story**
   - Go to your project's **Backlog** tab
   - Click on a story to open the story detail modal

2. **Go to Tasks Tab**
   - In the story detail modal, click on the **"Tasks"** tab
   - You'll see a list of tasks (or "No tasks yet" if empty)

3. **Click "Add Task" Button**
   - Look for **"+ Add Task"** button
   - Click it to show the task creation form

4. **Fill in Task Details**
   - **Title** (Required): Clear, specific task title
     - Example: `Create login form component`, `Implement password validation`, `Add error handling`
   - **Description** (Optional): More details about the task
   - **Priority** (Required): Choose `Low`, `Medium`, or `High`
   - **Estimated Hours** (Optional): How long you think it will take
     - Example: `4` hours, `8` hours

5. **Save the Task**
   - Click **"Create"** or press `Ctrl+Enter` (Windows) or `Cmd+Enter` (Mac)
   - Task appears in the tasks list with status **"Todo"**

6. **Repeat for More Tasks**
   - Add multiple tasks for each story
   - Break down the story into small, manageable tasks

### ✅ What You Should See:
- Tasks appear in the **Tasks** tab of the story
- Each task has status: **"Todo"** (default)
- Tasks show: `0/X completed` (e.g., `0/3 completed`)

### 💡 Tips:
- Break stories into 3-8 tasks per story
- Each task should take 2-8 hours to complete
- Use clear, action-oriented task titles
- Tasks should be independent (can be worked on separately)

---

## 👤 Step 6: Assign Tasks to Developers

### Why Assign Tasks?
Assigning tasks tells developers what they should work on. You can assign manually or use AI recommendations.

### How to Assign Tasks to Developers:

#### Method 1: Manual Assignment (From Task Detail)

1. **Open a Task**
   - Go to a story's **Tasks** tab
   - Click on a task to open the task detail modal

2. **Click "Edit" Button**
   - Click the **"Edit"** button (top right)

3. **Select Assignee**
   - Find the **"Assignee"** dropdown
   - Click it to see a list of users
   - Select a developer from the list
   - Or select **"Unassigned"** to remove assignment

4. **Save Changes**
   - Click **"Save"** button
   - Task is now assigned to that developer

#### Method 2: AI-Powered Assignment (Recommended)

1. **Open a Task**
   - Click on a task to open task detail modal

2. **Click "Edit" Button**
   - Click **"Edit"** button

3. **Use AI Recommendation**
   - Look for **"AI Assign"** or **"Get Recommendations"** button
   - Click it to see AI-suggested developers
   - AI considers: skills, workload, past performance, availability
   - Select a recommended developer
   - Click **"Save"**

#### Method 3: Bulk Assignment (From Board)

1. **Go to Board**
   - Open your project
   - Click **"Board"** tab
   - You'll see the Kanban board with columns: Backlog, Ready, In Progress, Review, Done

2. **Open Story**
   - Click on a story card
   - Story detail modal opens

3. **Go to Tasks Tab**
   - Click **"Tasks"** tab
   - Assign tasks as described in Method 1

### ✅ What You Should See:
- Task shows the assigned developer's name
- Developer receives a notification (if notifications are enabled)
- Task appears in developer's dashboard/board view

### 💡 Tips:
- Use AI recommendations for optimal task distribution
- Consider developer skills and current workload
- Assign related tasks to the same developer when possible
- Don't overload a single developer

---

## 📊 Step 7: Track Progress on the Board

### What is the Board?
The **Board** (Kanban Board) is a visual representation of your project's progress. Stories move through columns as they progress.

### Understanding the Board Columns:

1. **BACKLOG** 📝
   - New stories that haven't been started
   - Stories waiting to be worked on

2. **READY** ✅
   - Stories ready to be worked on
   - Requirements are clear, assigned to sprint

3. **IN PROGRESS** 🔄
   - Stories currently being worked on
   - At least one task has been started

4. **REVIEW** 👀
   - Stories completed, waiting for review/approval
   - All tasks are done, needs testing/QA

5. **DONE** ✅
   - Stories fully completed and approved
   - Ready for deployment/release

### How to Use the Board:

1. **Navigate to Board**
   - Open your project
   - Click **"Board"** tab
   - You'll see all stories organized in columns

2. **View Story Details**
   - Click on any story card to see details
   - View tasks, assignees, status, etc.

3. **Move Stories (Drag & Drop)**
   - Click and drag a story card
   - Drop it in a different column
   - Story status updates automatically
   - Example: Drag from **"Backlog"** to **"Ready"** when story is ready to start

4. **Change Story Status (Manual)**
   - Click on a story card
   - Click **"Edit"** button
   - Change **"Status"** dropdown
   - Select: `Backlog`, `Ready`, `In Progress`, `Review`, or `Done`
   - Click **"Save"**

### ✅ What You Should See:
- Stories appear in appropriate columns based on their status
- Story cards show: title, assignee, story points, priority
- You can filter by: assignee, sprint, status, priority

### 💡 Tips:
- Update story status regularly as work progresses
- Use drag-and-drop for quick status updates
- Keep the board updated for accurate project visibility

---

## ✅ Step 8: Complete Tasks

### When to Complete Tasks?
Complete tasks when the work is done and tested. This moves the story closer to completion.

### How to Complete Tasks:

#### Method 1: From Story Detail Modal

1. **Open a Story**
   - Go to **Board** or **Backlog**
   - Click on a story

2. **Go to Tasks Tab**
   - Click **"Tasks"** tab in the story detail modal

3. **Mark Task as Done**
   - Find the task you completed
   - Click the **checkbox** next to the task
   - Task status changes to **"Done"**
   - Checkbox becomes checked ✅

#### Method 2: From Task Detail Modal

1. **Open a Task**
   - Click on a task in the tasks list

2. **Click "Edit" Button**
   - Click **"Edit"** button

3. **Change Status**
   - Find **"Status"** dropdown
   - Select **"Done"**
   - Optionally, enter **"Actual Hours"** (how long it actually took)
   - Click **"Save"**

### ✅ What You Should See:
- Task checkbox is checked ✅
- Task status shows: **"Done"**
- Story shows: `X/Y completed` (e.g., `2/3 completed`)
- When all tasks are done, story can move to **"Review"** status

### 💡 Tips:
- Complete tasks as soon as work is done
- Enter actual hours for better time tracking
- Don't mark tasks as done until they're tested

---

## 🎉 Step 9: Complete Stories

### When to Complete Stories?
Complete a story when all its tasks are done, it's been tested, and it meets the acceptance criteria.

### How to Complete Stories:

1. **Verify All Tasks Are Done**
   - Open the story
   - Go to **Tasks** tab
   - Make sure all tasks are checked ✅
   - If not, complete remaining tasks first

2. **Verify Acceptance Criteria**
   - Go to **Details** tab
   - Check that all acceptance criteria are met
   - If using checkboxes, make sure they're all checked

3. **Change Story Status to "Done"**
   - Click **"Edit"** button
   - Change **"Status"** dropdown to **"Done"**
   - Click **"Save"**

   **OR**

   - Go to **Board**
   - Drag the story card to the **"Done"** column
   - Status updates automatically

### ✅ What You Should See:
- Story appears in **"Done"** column on the board
- Story status shows: **"Done"**
- Story is marked as completed in sprint/project statistics

### 💡 Tips:
- Don't mark stories as done until all tasks are complete
- Ensure acceptance criteria are met
- Get stakeholder approval if needed

---

## 🏁 Step 10: Complete Sprints

### When to Complete Sprints?
Complete a sprint when the sprint end date arrives or when all planned stories are done.

### How to Complete Sprints:

1. **Navigate to Sprint Detail Page**
   - Go to your project
   - Click **"Sprints"** tab
   - Click on the sprint you want to complete

2. **Review Sprint Progress**
   - Check which stories are **"Done"**
   - Review completed work
   - Check burndown chart (if available)

3. **Start Sprint Retrospective (Optional)**
   - Fill in **"What Went Well"**
   - Fill in **"What Didn't Go Well"**
   - Add **"Action Items"** for improvements
   - This helps improve future sprints

4. **Complete the Sprint**
   - Look for **"Complete Sprint"** button
   - Click it
   - Confirm the action
   - Sprint status changes to **"Completed"**

### ✅ What You Should See:
- Sprint status: **"Completed"**
- Sprint shows completion date
- Completed stories remain visible
- Sprint velocity is calculated (if enabled)

### 💡 Tips:
- Complete sprints on time (even if not all stories are done)
- Hold sprint retrospective meetings
- Use learnings to improve next sprint

---

## 🎊 Step 11: Complete the Project

### When to Complete a Project?
Complete a project when all major features are done, all sprints are completed, and the project goals are achieved.

### How to Complete a Project:

1. **Review Project Status**
   - Open your project
   - Go to **"Overview"** tab
   - Check project statistics:
     - Total stories completed
     - Total sprints completed
     - Overall progress

2. **Verify All Stories Are Done**
   - Go to **"Backlog"** or **"Board"** tab
   - Make sure all important stories are in **"Done"** status
   - If some stories aren't needed, you can leave them or delete them

3. **Complete All Sprints**
   - Go to **"Sprints"** tab
   - Complete any remaining active sprints
   - All sprints should be **"Completed"**

4. **Update Project Status**
   - Click **"Edit Project"** button (if available)
   - Change project status to **"Completed"** or **"Closed"**
   - Add final notes if needed
   - Save changes

### ✅ What You Should See:
- Project status: **"Completed"** or **"Closed"**
- Project shows completion date
- All statistics are finalized
- Project appears in completed projects list

### 💡 Tips:
- Get stakeholder sign-off before closing
- Export project data (stories, tasks) for records
- Archive the project for future reference

---

## 💡 Best Practices

### Project Management:
- ✅ Create clear project goals and descriptions
- ✅ Set realistic start and end dates
- ✅ Assign projects to appropriate teams

### Story Management:
- ✅ Write clear, user-focused story descriptions
- ✅ Use the format: "As a [user], I want to [action] so that [benefit]"
- ✅ Add detailed acceptance criteria
- ✅ Estimate story points accurately
- ✅ Prioritize stories (High > Medium > Low)

### Sprint Planning:
- ✅ Plan sprints for 1-4 weeks
- ✅ Don't overcommit (assign realistic story points)
- ✅ Include buffer time for unexpected issues
- ✅ Review and adjust sprint capacity based on team velocity

### Task Management:
- ✅ Break stories into 3-8 tasks
- ✅ Each task should take 2-8 hours
- ✅ Use clear, action-oriented task titles
- ✅ Assign tasks based on developer skills

### Progress Tracking:
- ✅ Update task status daily
- ✅ Update story status weekly
- ✅ Keep the board up-to-date
- ✅ Hold regular standup meetings

### Team Collaboration:
- ✅ Use comments on stories/tasks for communication
- ✅ Assign tasks clearly
- ✅ Review completed work before marking as done
- ✅ Hold sprint retrospectives

---

## 🔧 Troubleshooting

### Problem: Can't create a project
**Solution:**
- Make sure you're logged in as **Admin** or **Manager**
- Check that you have the necessary permissions
- Refresh the page and try again

### Problem: Stories not showing in backlog
**Solution:**
- Make sure you're viewing the correct project
- Check that stories were created successfully
- Refresh the page
- Check filters (make sure no filters are hiding stories)

### Problem: Can't assign stories to sprint
**Solution:**
- Make sure sprint is created and in **"Planning"** status
- Verify you selected stories before clicking "Assign to Sprint"
- Check that stories are in **"Backlog"** or **"Ready"** status

### Problem: Tasks not appearing
**Solution:**
- Make sure you're in the **"Tasks"** tab of the story
- Refresh the page
- Verify tasks were created successfully

### Problem: Can't assign tasks to developers
**Solution:**
- Make sure developer users exist in the system
- Check that you have permission to assign tasks
- Try refreshing the page

### Problem: Story not moving on board
**Solution:**
- Make sure you saved the status change
- Refresh the page
- Try drag-and-drop instead of manual status change

### Problem: Sprint won't complete
**Solution:**
- Make sure sprint end date has passed or all stories are done
- Check that you have permission to complete sprints
- Verify sprint is in **"Active"** status

---

## 📚 Quick Reference

### Status Flow:
```
Backlog → Ready → In Progress → Review → Done
```

### Typical Workflow:
1. Create Project
2. Create Stories (in Backlog)
3. Create Sprint
4. Assign Stories to Sprint
5. Create Tasks for Stories
6. Assign Tasks to Developers
7. Developers work on tasks (move to In Progress)
8. Complete tasks (mark as Done)
9. Complete stories (move to Done)
10. Complete sprint
11. Complete project

### Keyboard Shortcuts:
- `Ctrl/Cmd + Enter`: Save task when creating
- `Esc`: Cancel/close modal
- `Ctrl/Cmd + K`: Quick actions (if enabled)

---

## 🎓 Summary

You've learned the complete workflow:

1. ✅ **Create Project** - Set up your workspace
2. ✅ **Create Stories** - Define what needs to be built
3. ✅ **Create Sprints** - Plan time-boxed work periods
4. ✅ **Assign Stories to Sprints** - Plan which stories go in which sprint
5. ✅ **Create Tasks** - Break stories into actionable items
6. ✅ **Assign Tasks to Developers** - Distribute work to team members
7. ✅ **Track Progress** - Use the board to visualize progress
8. ✅ **Complete Tasks** - Mark tasks as done when finished
9. ✅ **Complete Stories** - Mark stories as done when all tasks are complete
10. ✅ **Complete Sprints** - Close sprints when done
11. ✅ **Complete Project** - Finalize the entire project

**Remember:** This is an iterative process. You'll create multiple stories, run multiple sprints, and continuously track progress until the project is complete.

---

## 🧪 Complete Feature Testing Guide

This section provides detailed step-by-step instructions for testing **every feature** in the AgileSAFe AI Platform, including all AI-powered capabilities.

---

## 📋 Table of Contents - Testing

1. [Core Features Testing](#core-features-testing)
2. [AI Features Testing](#ai-features-testing)
3. [Advanced Features Testing](#advanced-features-testing)
4. [Integration Testing](#integration-testing)
5. [Performance Testing](#performance-testing)

---

## 🔧 Core Features Testing

### Test 1: User Authentication & Authorization

#### Test Login:
1. **Navigate to Login Page**
   - Go to `/login` or click "Sign In" from home page
   - You should see login form with email and password fields

2. **Test Valid Login**
   - Enter valid email: `admin@example.com`
   - Enter valid password
   - Click "Sign In"
   - **Expected**: Redirects to Dashboard, shows user name in header

3. **Test Invalid Login**
   - Enter invalid email or password
   - Click "Sign In"
   - **Expected**: Shows error message "Invalid credentials"

4. **Test Logout**
   - Click user avatar in header
   - Click "Logout"
   - **Expected**: Redirects to login page, session cleared

#### Test Registration:
1. **Navigate to Register Page**
   - Go to `/register` or click "Get Started"
   - Fill in: Name, Email, Password, Confirm Password, Role
   - Click "Register"
   - **Expected**: Account created, redirects to login

#### Test Role-Based Access:
1. **Login as Admin**
   - **Expected**: Can see all menus (Projects, Teams, Users, Settings, Admin panels)

2. **Login as Manager**
   - **Expected**: Can see Projects, Teams, Dashboard (no Admin panels)

3. **Login as Developer**
   - **Expected**: Can see Dashboard, Tasks, Board (limited access)

4. **Login as Viewer**
   - **Expected**: Read-only access to Projects, Dashboard

---

### Test 2: Project Management

#### Test Create Project:
1. **Navigate to Projects Page**
   - Click "Projects" in sidebar
   - Click "+ Create Project" button

2. **Fill Project Form**
   - Name: `Test E-Commerce Platform`
   - Description: `Building an online shopping platform`
   - Start Date: Select today's date
   - End Date: Select date 3 months from now
   - Team: Select a team (if available)
   - Priority: Select "High"
   - Click "Create"

3. **Verify Project Created**
   - **Expected**: Success message appears
   - Project appears in projects list
   - Project key auto-generated (e.g., `TEP-001`)

#### Test View Project:
1. **Click on Project Name**
   - **Expected**: Opens project detail page
   - Shows tabs: Overview, PI Planning, Features, Sprints, Backlog, Board, Team, Settings

#### Test Edit Project:
1. **Open Project Detail**
   - Click "Edit" button (or Settings tab → Edit)
   - Change name to `Updated E-Commerce Platform`
   - Change priority to "Critical"
   - Click "Save"
   - **Expected**: Changes saved, project name updated in list

#### Test Delete Project:
1. **Open Project Settings**
   - Go to Settings tab
   - Click "Delete Project" button
   - Confirm deletion
   - **Expected**: Project removed from list, success message

#### Test Project Filters:
1. **Apply Filters**
   - Filter by Status: Active, Completed, Archived
   - Filter by Priority: High, Medium, Low
   - Filter by Team
   - **Expected**: Projects list updates based on filters

---

### Test 3: Feature Management

#### Test Create Feature:
1. **Navigate to Features**
   - Go to Projects → Select Project → Features tab
   - OR go to "Features" in sidebar
   - Click "+ Create Feature"

2. **Fill Feature Form**
   - Title: `User Authentication System`
   - Description: `Implement secure user login and registration`
   - Business Value: `Enable secure access to platform`
   - Priority: Select "High"
   - Status: Leave as "Draft"
   - Estimated Story Points: `25`
   - Click "Create"

3. **Verify Feature Created**
   - **Expected**: Feature appears in features list
   - Shows in project's Features tab

#### Test View Feature Detail:
1. **Click on Feature Name**
   - **Expected**: Opens feature detail page
   - Shows: Title, Description, Business Value, Priority, Status
   - Shows: Child Stories list
   - Shows: Progress bar (X/Y stories done)

#### Test Edit Feature:
1. **Open Feature Detail**
   - Click "Edit" button
   - Change priority to "Critical"
   - Change status to "Ready"
   - Click "Save"
   - **Expected**: Changes saved, status updated

#### Test Feature Breakdown (Manual):
1. **Open Feature Detail**
   - Click "+ Add Story" button
   - Create a story linked to this feature
   - **Expected**: Story appears in feature's stories list
   - Feature progress updates

---

### Test 4: Story Management

#### Test Create Story:
1. **Navigate to Backlog**
   - Go to Project → Backlog tab
   - Click "+ Create Story"

2. **Fill Story Form**
   - Title: `User Login Functionality`
   - Description: `As a user, I want to log in with email and password so that I can access my account`
   - Priority: Select "High"
   - Story Points: Select `5`
   - Feature: Select feature created above (optional)
   - Acceptance Criteria:
     - `User can enter email and password`
     - `User sees error for invalid credentials`
     - `User is redirected to dashboard after login`
   - Click "Create"

3. **Verify Story Created**
   - **Expected**: Story appears in backlog
   - Story ID auto-generated (e.g., `TEP-1`)
   - Status: "Backlog"

#### Test Edit Story:
1. **Click on Story**
   - Click "Edit" button
   - Change story points to `8`
   - Change priority to "Critical"
   - Click "Save"
   - **Expected**: Changes saved

#### Test Assign Story to Sprint:
1. **Select Story in Backlog**
   - Check checkbox next to story
   - Select sprint from "Assign to Sprint" dropdown
   - Click "Assign"
   - **Expected**: Story shows sprint name, sprint shows story count

#### Test Story Status Flow:
1. **Change Story Status**
   - Open story detail
   - Change status: Backlog → Ready → In Progress → Review → Done
   - **Expected**: Status updates, story moves on board accordingly

---

### Test 5: Task Management

#### Test Create Task:
1. **Open Story Detail**
   - Click on a story in backlog
   - Go to "Tasks" tab
   - Click "+ Add Task"

2. **Fill Task Form**
   - Title: `Create login form UI component`
   - Description: `Design and implement login form with email/password fields`
   - Priority: Select "High"
   - Estimated Hours: `4`
   - Skills: `React, UI/UX` (comma-separated)
   - Click "Create"

3. **Verify Task Created**
   - **Expected**: Task appears in tasks list
   - Status: "Todo"
   - Shows: `0/X completed` (e.g., `0/1 completed`)

#### Test Assign Task:
1. **Open Task Detail**
   - Click on task
   - Click "Edit"
   - Select "Assignee" dropdown
   - Choose a developer
   - Click "Save"
   - **Expected**: Task shows assignee name
   - Developer receives notification (if enabled)

#### Test Complete Task:
1. **Mark Task as Done**
   - Open task
   - Check the checkbox next to task
   - OR change status to "Done"
   - Enter actual hours: `5`
   - **Expected**: Task checkbox checked ✅
   - Story shows: `1/1 completed`
   - Story can move to "Review" status

---

### Test 6: Sprint Management

#### Test Create Sprint:
1. **Navigate to Sprints**
   - Go to Project → Sprints tab
   - Click "+ Create Sprint"

2. **Fill Sprint Form**
   - Name: `Sprint 1 - User Authentication`
   - Start Date: Select today
   - End Date: Select date 2 weeks from now
   - Goal: `Implement user authentication system`
   - Capacity: `21` story points
   - Click "Create"

3. **Verify Sprint Created**
   - **Expected**: Sprint appears in sprints list
   - Status: "Planning"
   - Shows: `0 stories`, `0 points committed`

#### Test Start Sprint:
1. **Open Sprint Detail**
   - Click on sprint name
   - Click "Start Sprint" button
   - Confirm action
   - **Expected**: Status changes to "Active"
   - Sprint shows active dates

#### Test Auto-Generate Sprint Plan (AI):
1. **Open Sprint Planning Page**
   - Go to Sprints → Select Sprint → Planning tab
   - OR go to "Sprint Planning" in sidebar
   - Click "⚡ Auto-Generate Sprint Plan" button

2. **Wait for AI Generation**
   - **Expected**: Loading modal appears
   - Progress messages: "Analyzing...", "Selecting stories...", "Assigning tasks..."
   - Takes 3-5 seconds

3. **Review Generated Plan**
   - **Expected**: Review modal shows:
     - Selected stories with points
     - Task assignments per story
     - Total points and capacity utilization
     - Team workload distribution
     - Predicted completion percentage

4. **Accept Generated Plan**
   - Click "Accept Plan" button
   - **Expected**: Stories assigned to sprint
   - Tasks created and assigned
   - Success toast: "Sprint plan created! X stories, Y tasks in Z seconds ⚡"

#### Test Complete Sprint:
1. **Open Sprint Detail**
   - Ensure all stories are "Done" or sprint end date passed
   - Click "Complete Sprint" button
   - Fill retrospective (optional):
     - What Went Well
     - What Didn't Go Well
     - Action Items
   - Click "Complete"
   - **Expected**: Status changes to "Completed"
   - Velocity calculated and displayed

---

### Test 7: Board/Kanban View

#### Test View Board:
1. **Navigate to Board**
   - Go to Project → Board tab
   - **Expected**: See columns: Backlog, Ready, In Progress, Review, Done
   - Stories appear in appropriate columns based on status

#### Test Drag & Drop:
1. **Move Story on Board**
   - Click and drag a story card
   - Drop it in "In Progress" column
   - **Expected**: Story status updates to "In Progress"
   - Story appears in new column

#### Test Board Filters:
1. **Apply Filters**
   - Filter by Sprint: Select a sprint
   - Filter by Assignee: Select a developer
   - Filter by Priority: Select High/Medium/Low
   - **Expected**: Board shows only filtered stories

#### Test Story Card Details:
1. **Click Story Card**
   - **Expected**: Story detail modal opens
   - Shows: Title, Description, Points, Priority, Status
   - Shows: Tasks tab with task list
   - Shows: Comments, Activity timeline

---

### Test 8: Team Management

#### Test Create Team:
1. **Navigate to Teams**
   - Click "Teams" in sidebar
   - Click "+ Create Team"

2. **Fill Team Form**
   - Name: `Frontend Development Team`
   - Description: `Team responsible for UI/UX development`
   - Lead: Select a user from dropdown
   - Members: Select multiple users
   - Click "Create"

3. **Verify Team Created**
   - **Expected**: Team appears in teams list
   - Shows member count

#### Test View Team Detail:
1. **Click Team Name**
   - **Expected**: Opens team detail page
   - Shows: Team info, members list, projects assigned
   - Shows: Team calendar, capacity planning

#### Test Assign Team to Project:
1. **Open Project Settings**
   - Go to Project → Settings tab
   - Click "Edit"
   - Select team from "Team" dropdown
   - Click "Save"
   - **Expected**: Team assigned to project

---

### Test 9: User Management

#### Test View Users (Admin Only):
1. **Navigate to User Management**
   - Click "Users" in sidebar (Admin only)
   - **Expected**: See list of all users
   - Shows: Name, Email, Role, Team, Status

#### Test Edit User:
1. **Click on User**
   - Click "Edit" button
   - Change role to "Manager"
   - Assign to team
   - Click "Save"
   - **Expected**: User role updated

#### Test User Profile:
1. **Click User Avatar**
   - Click "Profile"
   - **Expected**: Shows user profile page
   - Shows: Personal info, assigned tasks, activity

---

## 🤖 AI Features Testing

### Test 10: AI-Powered Feature Breakdown

#### Test Feature Analysis:
1. **Create a Feature**
   - Go to Features → Create Feature
   - Title: `E-Commerce Shopping Cart`
   - Description: `Users can add products to cart, view cart, update quantities, and checkout with payment integration`
   - Business Value: `Enable online purchases and revenue generation`
   - Click "Create"

2. **Trigger AI Analysis**
   - Open feature detail page
   - Click "Breakdown with AI" button (prominent blue button)
   - **Expected**: Loading modal appears
   - Progress messages:
     - "AI is analyzing feature..."
     - "Identifying personas..."
     - "Extracting requirements..."
     - "Generating stories..."

3. **Review AI Analysis Results**
   - **Expected**: Step 2 - Review Breakdown shows:
     - **AI Insights Section**:
       - Complexity score (0-100)
       - Identified Personas (e.g., User, Admin, Customer)
       - Extracted Requirements (functional and non-functional)
       - Detected Technologies (e.g., React, Node.js, MongoDB)
       - Third-Party Integrations (e.g., Stripe, SendGrid)
       - Complexity Factors (warnings)
     - **Generated Stories**:
       - Story 1: "Add Product to Cart" (5 pts)
         - Tasks: Create cart UI, Add to cart API, Update cart state
       - Story 2: "View Shopping Cart" (3 pts)
         - Tasks: Display cart items, Show totals, Handle empty cart
       - Story 3: "Update Cart Quantities" (3 pts)
         - Tasks: Quantity input, Update API, Recalculate totals
       - Story 4: "Checkout Process" (8 pts)
         - Tasks: Checkout form, Payment integration, Order confirmation
     - Total: 4 stories, 20 tasks, 19 points

4. **Review & Accept Breakdown**
   - Check/uncheck stories to accept
   - Check/uncheck tasks within stories
   - Click "Edit" on any story/task to modify
   - Click "Accept Selected" or "Accept All"
   - **Expected**: Stories and tasks created in database
   - Success message: "Created 4 stories and 20 tasks successfully!"

#### Test One-Click Instant Breakdown:
1. **Open Feature Detail**
   - Click "Auto-Breakdown & Create" button
   - **Expected**: No review step
   - Loading: "Creating stories and tasks..."
   - Success toast: "Created 4 stories and 20 tasks in 3 seconds! ⚡"
   - Redirects to feature detail showing created stories

#### Test Re-analyze Feature:
1. **After Making Changes**
   - Edit feature description
   - Click "Re-analyze" button (if available)
   - **Expected**: AI re-analyzes with updated description
   - New breakdown suggestions appear

---

### Test 11: Advanced NLP Analysis

#### Test NLP Feature Analysis:
1. **Trigger NLP Analysis**
   - Create or open a feature
   - Click "Analyze with NLP" (if separate from breakdown)
   - OR breakdown automatically includes NLP analysis

2. **Review NLP Insights**
   - **Expected**: NLP Insights component shows:
     - **User Personas**: Badges showing detected roles (User, Admin, Customer, Manager)
     - **Primary Intent**: Main purpose (e.g., "Payment Processing", "User Management")
       - Confidence score (e.g., 87%)
     - **Technologies Detected**: Badges (React, Node.js, MongoDB, JWT, Stripe)
     - **Third-Party Integrations**: 
       - Service: Stripe (Payment processing)
       - Service: SendGrid (Email service)
     - **Extracted Requirements**:
       - Functional: "User can add products to cart"
       - Non-functional: "Secure payment processing", "Fast checkout"
     - **Complexity Factors**: Warnings
       - "Uses multiple technologies: React, Node.js, MongoDB"
       - "Full CRUD operations required"
       - "Security and authentication required"
     - **Actions Detected**: Badges (Create, Read, Update, Delete, Process)

---

### Test 12: AI Task Assignment Recommendations

#### Test Get Task Assignment Recommendations:
1. **Create or Open a Task**
   - Go to Story → Tasks tab
   - Create task: `Implement payment gateway integration`
   - Skills: `Node.js, Payment Processing, API Integration`
   - Estimated Hours: `8`

2. **Get AI Recommendations**
   - Open task detail
   - Click "Edit"
   - Click "Get AI Recommendations" or "AI Assign" button
   - **Expected**: Loading: "Analyzing task requirements..."
   - Recommendations appear showing:
     - **Recommended Developer 1** (Confidence: 92%)
       - Name: John Doe
       - Skills Match: Node.js (Expert), Payment Processing (Advanced)
       - Current Workload: 12 hours (Low)
       - Reasoning: "Strong match for payment integration tasks"
     - **Recommended Developer 2** (Confidence: 78%)
       - Name: Jane Smith
       - Skills Match: Node.js (Advanced), API Integration (Expert)
       - Current Workload: 20 hours (Medium)
       - Reasoning: "Good API integration experience"

3. **Accept Recommendation**
   - Click "Assign" next to recommended developer
   - **Expected**: Task assigned to developer
   - Success message: "Task assigned based on AI recommendation"

4. **Provide Feedback (Optional)**
   - Thumbs up 👍 if assignment was good
   - Thumbs down 👎 if assignment was poor
   - **Expected**: Feedback recorded for ML learning

---

### Test 13: Sprint Auto-Generation

#### Test Auto-Generate Sprint Plan:
1. **Navigate to Sprint Planning**
   - Go to Sprints → Select Sprint → Planning tab
   - OR go to "Sprint Planning" page

2. **Prepare Data**
   - Ensure you have:
     - Available stories in backlog (with points)
     - Team members with skills defined
     - Sprint capacity set (e.g., 21 points)

3. **Click Auto-Generate Button**
   - Click "⚡ Auto-Generate Sprint Plan" button
   - **Expected**: Loading modal with progress:
     - "Analyzing team capacity..."
     - "Selecting optimal stories..."
     - "Assigning tasks to team members..."
     - "Balancing workload..."
     - Takes 3-5 seconds

4. **Review Generated Plan**
   - **Expected**: Review modal shows:
     - **Selected Stories**:
       - Story 1: "User Login" (5 pts) - 3 tasks
       - Story 2: "Shopping Cart" (8 pts) - 5 tasks
       - Story 3: "Product Search" (5 pts) - 4 tasks
       - Story 4: "Checkout" (3 pts) - 2 tasks
     - **Total**: 4 stories, 14 tasks, 21 points
     - **Capacity Utilization**: 100% (21/21 points)
     - **Team Workload**:
       - John Doe: 16 hours (Before: 8h, After: 24h, Utilization: 60%)
       - Jane Smith: 12 hours (Before: 10h, After: 22h, Utilization: 55%)
       - Bob Wilson: 8 hours (Before: 5h, After: 13h, Utilization: 33%)
     - **Predicted Completion**: 88%
     - **Generation Time**: "2.3 seconds"

5. **Accept Generated Plan**
   - Click "Accept Plan" button
   - **Expected**: 
     - Stories assigned to sprint
     - Tasks created and assigned to developers
     - Sprint shows updated story count and points
     - Success toast: "Sprint plan created! 4 stories, 14 tasks in 2.3 seconds ⚡"

---

### Test 14: Velocity Forecasting

#### Test View Velocity Forecast:
1. **Navigate to Dashboard**
   - Click "Dashboard" in sidebar
   - Look for "Velocity Forecast" card or section

2. **View Forecast**
   - **Expected**: Shows:
     - **Team**: Current team name
     - **Historical Average**: Average velocity from past sprints (e.g., 18 points)
     - **Sprint Capacity**: Current sprint capacity (e.g., 21 points)
     - **Forecasted Velocity**: AI prediction (e.g., 19 points)
     - **Confidence**: 85%
     - **Chart**: Line chart showing historical velocity and forecast

3. **View Forecast Details**
   - Click "View Details" or expand forecast card
   - **Expected**: Shows:
     - Historical velocity data points
     - Trend line
     - Predicted range (min-max)
     - Factors considered (team size, historical performance, current workload)

---

### Test 15: Risk Detection & Analysis

#### Test View Risk Alerts:
1. **Navigate to Dashboard**
   - Look for "Risk Alerts" panel or section

2. **View Detected Risks**
   - **Expected**: Shows risk cards:
     - **Risk 1**: "Sprint Overload"
       - Severity: High
       - Description: "Sprint has 25 points committed, capacity is 21 points"
       - Mitigation: "Consider removing 1-2 stories or extending sprint"
     - **Risk 2**: "Bottleneck Detected"
       - Severity: Medium
       - Description: "Developer John Doe has 30 hours assigned this sprint"
       - Mitigation: "Redistribute tasks to balance workload"
     - **Risk 3**: "Dependency Risk"
       - Severity: Low
       - Description: "Story 'Checkout' depends on 'Shopping Cart' which is not started"
       - Mitigation: "Prioritize 'Shopping Cart' story"

#### Test Project Risk Analysis:
1. **Navigate to Project Detail**
   - Go to Project → Overview tab
   - Look for "Risk Analysis" section

2. **View Project Risks**
   - **Expected**: Shows:
     - Overall risk score (e.g., 65/100)
     - Risk categories:
       - Schedule Risk: High
       - Resource Risk: Medium
       - Technical Risk: Low
     - Detailed risk list with mitigations

---

### Test 16: PI Planning & Optimization

#### Test Create Program Increment:
1. **Navigate to PI Planning**
   - Go to Project → PI Planning tab
   - Click "+ Create PI" or "New Program Increment"

2. **Fill PI Wizard - Step 1: Basic Info**
   - Name: `PI 2025 Q1`
   - Description: `First quarter planning for 2025`
   - Start Date: Select date (8-12 weeks from now)
   - End Date: Select end date (12 weeks later)
   - Teams: Select teams to include
   - Click "Next"

3. **Step 2: Add Features**
   - Select features from backlog
   - OR create new features
   - Click "Next"

4. **Step 3: Set Objectives**
   - Add objective: "Launch e-commerce platform"
   - Business Value: 10 (1-10 scale)
   - Assign to team
   - Status: "Committed"
   - Click "Next"

5. **Step 4: AI Sprint Distribution**
   - Click "⚡ Optimize with AI" button
   - **Expected**: AI analyzes features and distributes across sprints
   - Shows optimal distribution:
     - Sprint 1: Feature A (8 pts), Feature B (5 pts) = 13 pts
     - Sprint 2: Feature C (8 pts), Feature D (5 pts) = 13 pts
     - Sprint 3: Feature E (8 pts), Feature F (5 pts) = 13 pts
   - Click "Next"

6. **Step 5: Review & Adjust**
   - Review visual board
   - Drag features between sprints if needed
   - Check capacity warnings
   - Click "Next"

7. **Step 6: Commit**
   - Review summary
   - Click "Commit PI"
   - **Expected**: PI created, sprints created, features assigned

#### Test PI Optimization:
1. **Open PI Dashboard**
   - Go to PI Planning → Select PI
   - Click "Optimize PI" button

2. **View Optimization Results**
   - **Expected**: Shows:
     - Optimal feature distribution
     - Business value maximized
     - Dependencies respected
     - Risk minimized
     - Capacity balanced

3. **Apply Optimization**
   - Click "Apply Optimization"
   - **Expected**: Features redistributed across sprints

---

### Test 17: Historical Learning & Feedback

#### Test Provide Feedback on AI Recommendations:
1. **After Using AI Task Assignment**
   - Task was assigned using AI recommendation
   - After task completion, provide feedback:
     - Click thumbs up 👍 if assignment was good
     - Click thumbs down 👎 if assignment was poor
   - **Expected**: Feedback recorded

2. **View Feedback Impact**
   - Go to ML Performance Dashboard (Admin/Manager only)
   - **Expected**: Shows feedback statistics:
     - Total predictions: 50
     - Acceptance rate: 85%
     - Average accuracy: 0.87

#### Test Sprint Outcome Feedback (Automatic):
1. **Complete a Sprint**
   - Sprint had predicted velocity: 20 points
   - Actual velocity: 18 points
   - **Expected**: System automatically records feedback
   - Accuracy calculated: 90% (18/20 = 0.9)

---

### Test 18: ML Model Retraining

#### Test View ML Performance:
1. **Navigate to ML Performance Dashboard**
   - Click "ML Performance" in sidebar (Admin/Manager only)
   - OR go to `/ml-performance`

2. **View Model Statistics**
   - **Expected**: Cards showing:
     - **Task Assignment Model**:
       - Version: v3
       - Accuracy: 87.5%
       - Training Samples: 150
       - Last Trained: 2025-01-15
     - **Velocity Forecast Model**:
       - Version: v2
       - Accuracy: 82.3%
       - Training Samples: 80
       - Last Trained: 2025-01-10

3. **View Performance Chart**
   - Select model from dropdown
   - **Expected**: Line chart showing accuracy over time
   - Shows improvement trends

4. **View Training History**
   - **Expected**: Table showing:
     - Version, Accuracy, Improvement, Samples, Date
     - v3: 87.5% (+2.1%), 150 samples, 2025-01-15
     - v2: 85.4% (+1.2%), 120 samples, 2025-01-08

#### Test Manual Retraining:
1. **Trigger Retraining**
   - Click "Retrain Now" button for a model
   - Confirm action
   - **Expected**: 
     - Toast: "Retraining started in background"
     - Retraining runs (takes 1-5 minutes)
     - New version created if performance improved

2. **Check Retraining Results**
   - Refresh page after few minutes
   - **Expected**: New version appears if improved
   - Shows improvement percentage

---

## 🚀 Advanced Features Testing

### Test 19: Time Tracking

#### Test Log Time Entry:
1. **Navigate to Time Tracking**
   - Click "Time Tracking" in sidebar
   - OR go to task detail → "Log Time"

2. **Create Time Entry**
   - Select Task: Choose a task
   - Date: Select date
   - Hours: Enter `4`
   - Description: `Implemented login form UI`
   - Entry Type: "Manual" or "Timer"
   - Click "Log Time"

3. **Verify Time Entry**
   - **Expected**: Time entry appears in list
   - Task shows updated actual hours
   - Story shows cumulative hours

#### Test Use Timer:
1. **Start Timer**
   - Open task detail
   - Click "Start Timer" button
   - **Expected**: Timer starts counting
   - Shows elapsed time

2. **Stop Timer**
   - Click "Stop Timer"
   - **Expected**: Time entry created automatically
   - Hours calculated from timer duration

#### Test View Time Reports:
1. **View Time Entries**
   - Go to Time Tracking Dashboard
   - **Expected**: Shows:
     - Daily/weekly/monthly totals
     - Time by project, task, user
     - Charts and graphs

---

### Test 20: Analytics & Reports

#### Test View Analytics:
1. **Navigate to Analytics**
   - Click "Analytics" in sidebar

2. **View Analytics Dashboard**
   - **Expected**: Shows:
     - **Velocity Trends**: Chart showing velocity over time
     - **Burn-down Charts**: Sprint and project burn-down
     - **Team Performance**: Comparison charts
     - **Task Completion Rates**: By status, priority
     - **Time Tracking**: Hours logged over time

#### Test Generate Custom Report:
1. **Navigate to Reports**
   - Click "Reports" in sidebar
   - Click "Create Custom Report"

2. **Configure Report**
   - Report Type: Select "Sprint Summary", "Project Progress", etc.
   - Date Range: Select start and end dates
   - Filters: Select projects, teams, sprints
   - Format: PDF or Excel
   - Click "Generate"

3. **View Report**
   - **Expected**: Report generated and downloaded
   - Contains requested data in selected format

---

### Test 21: Export Functionality

#### Test Export Dashboard to PDF:
1. **Navigate to Dashboard**
   - Click "Export" button (top right)
   - Select "Export to PDF"

2. **Verify Export**
   - **Expected**: PDF file downloads
   - Contains: Dashboard stats, charts, recent activities

#### Test Export Projects to Excel:
1. **Navigate to Projects**
   - Click "Export" button
   - Select "Export to Excel"

2. **Verify Export**
   - **Expected**: Excel file downloads
   - Contains: All projects with details (name, team, status, progress, dates)

#### Test Export Stories to Excel:
1. **Navigate to Project Backlog**
   - Click "Export" button
   - Select "Export Stories to Excel"

2. **Verify Export**
   - **Expected**: Excel file downloads
   - Contains: All stories with details (title, points, priority, status, feature)

#### Test Export Tasks to Excel:
1. **Navigate to Story Tasks**
   - Click "Export" button
   - Select "Export Tasks to Excel"

2. **Verify Export**
   - **Expected**: Excel file downloads
   - Contains: All tasks with details (title, hours, assignee, status, skills)

#### Test Export Teams to Excel:
1. **Navigate to Teams**
   - Click "Export" button
   - Select "Export to Excel"

2. **Verify Export**
   - **Expected**: Excel file downloads
   - Contains: All teams with members, lead, status

#### Test Export Time Entries:
1. **Navigate to Time Tracking**
   - Click "Export" button
   - Select "Export to PDF" or "Export to Excel"

2. **Verify Export**
   - **Expected**: File downloads
   - Contains: Time entries with date, user, task, hours, description

#### Test Export PI Plan:
1. **Navigate to PI Dashboard**
   - Click "Export" button
   - Select "Export PI to Excel"

2. **Verify Export**
   - **Expected**: Excel file downloads
   - Contains multiple sheets:
     - PI Overview
     - Features
     - Stories
     - Tasks

---

### Test 22: Import Functionality

#### Test Import PI Plan from Excel:
1. **Navigate to PI Planning**
   - Go to Project → PI Planning tab
   - Click "Import" button (if PI status is "Planning")

2. **Download Template**
   - Click "Download Template" button
   - **Expected**: Excel template downloads
   - Contains: Features, Stories, Tasks, Instructions sheets

3. **Fill Template**
   - Open downloaded template
   - Fill in Features sheet:
     - Feature ID: `FEAT-001`
     - Title: `User Authentication`
     - Description: `Implement login and registration`
     - Priority: `High`
     - Status: `Draft`
   - Fill in Stories sheet:
     - Story ID: `STORY-001`
     - Feature ID: `FEAT-001`
     - Title: `User Login`
     - Description: `As a user, I want to log in`
     - Story Points: `5`
   - Fill in Tasks sheet:
     - Task ID: `TASK-001`
     - Story ID: `STORY-001`
     - Title: `Create login form`
     - Estimated Hours: `4`
   - Save file

4. **Upload File**
   - Click "Upload PI Plan Excel" area
   - Select filled Excel file
   - Click "Import PI Plan"

5. **Verify Import**
   - **Expected**: 
     - Success message: "Imported 1 features, 1 stories, 1 tasks"
     - Features, stories, tasks appear in system
     - Relationships maintained (story linked to feature, task linked to story)

6. **Check for Errors**
   - If errors occurred, error list shows:
     - "Row 2 in Stories: Feature ID not found: FEAT-999"
     - Review and fix errors

---

### Test 23: Cache Management (Admin Only)

#### Test View Cache Statistics:
1. **Navigate to Cache Management**
   - Click "Cache Management" in sidebar (Admin only)
   - OR go to `/admin/cache`

2. **View Cache Stats**
   - **Expected**: Shows:
     - **Total Keys**: 1,234
     - **Hit Rate**: 87.5%
     - **Keys by Prefix**:
       - `cache:projects`: 45
       - `ml:task-assign`: 120
       - `ml:velocity-forecast`: 80
       - `session:user`: 50

#### Test Clear Cache:
1. **Clear All Cache**
   - Click "Clear All Cache" button
   - Confirm action
   - **Expected**: All cache cleared, stats reset

2. **Clear Specific Pattern**
   - Find prefix in table (e.g., `ml:task-assign`)
   - Click "Clear" button
   - **Expected**: Only that pattern cleared
   - Stats updated

---

### Test 24: Audit Logs (Admin Only)

#### Test View Audit Logs:
1. **Navigate to Audit Logs**
   - Click "Audit Logs" in sidebar (Admin only)
   - OR go to `/admin/audit-logs`

2. **View Logs**
   - **Expected**: Table showing:
     - Timestamp, User, Action, Entity Type, Entity ID, Details
     - Filters: Date range, user, action type, entity type

3. **Test Filters**
   - Filter by User: Select a user
   - Filter by Action: Select "Create", "Update", "Delete"
   - Filter by Entity: Select "Project", "Story", "Task"
   - **Expected**: Logs filtered accordingly

#### Test Export Audit Logs:
1. **Export Logs**
   - Click "Export" button
   - Select format (CSV or Excel)
   - **Expected**: File downloads with audit log data

---

### Test 25: System Health (Admin Only)

#### Test View System Health:
1. **Navigate to System Health**
   - Click "System Health" in sidebar (Admin only)
   - OR go to `/admin/system-health`

2. **View Health Metrics**
   - **Expected**: Shows:
     - **Backend Status**: ✅ Healthy
     - **ML Service Status**: ✅ Healthy
     - **Database Status**: ✅ Connected
     - **Redis Status**: ✅ Connected
     - **API Response Time**: 120ms average
     - **ML Service Response Time**: 450ms average
     - **Database Query Time**: 25ms average

3. **View Detailed Metrics**
   - **Expected**: Charts showing:
     - API response times over time
     - ML service latency
     - Database performance
     - Error rates

---

## 🔗 Integration Testing

### Test 26: End-to-End Workflow

#### Test Complete Project Lifecycle:
1. **Create Project**
   - Create project: "E-Commerce Platform"
   - Assign team

2. **Create Feature with AI Breakdown**
   - Create feature: "Shopping Cart System"
   - Use "Auto-Breakdown & Create"
   - **Expected**: 4 stories, 20 tasks created

3. **Create Sprint**
   - Create sprint: "Sprint 1"
   - Set capacity: 21 points

4. **Auto-Generate Sprint Plan**
   - Use "⚡ Auto-Generate Sprint Plan"
   - Accept generated plan
   - **Expected**: Stories assigned, tasks assigned to developers

5. **Start Sprint**
   - Click "Start Sprint"
   - **Expected**: Sprint status: "Active"

6. **Work on Tasks**
   - Developers complete tasks
   - Mark tasks as "Done"
   - **Expected**: Story progress updates

7. **Complete Stories**
   - When all tasks done, mark story as "Done"
   - **Expected**: Story moves to "Done" column

8. **Complete Sprint**
   - Click "Complete Sprint"
   - Fill retrospective
   - **Expected**: Sprint completed, velocity calculated

9. **View Analytics**
   - Go to Analytics
   - **Expected**: Shows velocity trends, burn-down charts

10. **Export Reports**
    - Export sprint summary to Excel
    - **Expected**: Excel file with sprint data

---

## ⚡ Performance Testing

### Test 27: Response Time Testing

#### Test API Response Times:
1. **Monitor Response Times**
   - Open browser DevTools → Network tab
   - Perform various actions:
     - Load dashboard
     - Create project
     - Get AI recommendations
     - Export to Excel

2. **Expected Response Times**:
   - Dashboard load: < 1 second
   - Create project: < 500ms
   - AI task assignment: < 2 seconds
   - AI feature breakdown: < 5 seconds
   - Sprint auto-generation: < 5 seconds
   - Export Excel: < 3 seconds
   - Export PDF: < 5 seconds

#### Test Cache Performance:
1. **Test Cache Hits**
   - Load dashboard (first time: cache miss)
   - Reload dashboard (second time: cache hit)
   - **Expected**: Second load faster (cached)

2. **View Cache Stats**
   - Go to Cache Management
   - **Expected**: Hit rate > 70%

---

## ✅ Testing Checklist

Use this checklist to ensure all features are tested:

### Core Features:
- [ ] User Authentication (Login, Logout, Registration)
- [ ] Project CRUD (Create, Read, Update, Delete)
- [ ] Feature CRUD
- [ ] Story CRUD
- [ ] Task CRUD
- [ ] Sprint CRUD
- [ ] Team Management
- [ ] User Management
- [ ] Board/Kanban View
- [ ] Drag & Drop

### AI Features:
- [ ] Feature Breakdown (AI Analysis)
- [ ] One-Click Instant Breakdown
- [ ] Advanced NLP Analysis
- [ ] Task Assignment Recommendations
- [ ] Sprint Auto-Generation
- [ ] Velocity Forecasting
- [ ] Risk Detection
- [ ] PI Optimization
- [ ] Historical Learning/Feedback
- [ ] ML Model Retraining

### Advanced Features:
- [ ] Time Tracking
- [ ] Analytics Dashboard
- [ ] Custom Reports
- [ ] Export (PDF, Excel)
- [ ] Import (Excel)
- [ ] Cache Management
- [ ] Audit Logs
- [ ] System Health

### Integration:
- [ ] End-to-End Workflow
- [ ] API Integration
- [ ] ML Service Integration
- [ ] Performance Testing

---

## 🐛 Common Testing Issues & Solutions

### Issue: AI features not working
**Solution:**
- Check ML service is running: `cd ml-service && python main.py`
- Check ML service URL in backend `.env`: `ML_API_URL=http://localhost:8001`
- Check API key is set: `ML_API_KEY=your-key-here`
- Check ML service logs for errors

### Issue: Export not downloading
**Solution:**
- Check browser download settings
- Check file size (large files may take time)
- Check backend logs for errors
- Try different browser

### Issue: Cache not working
**Solution:**
- Check Redis is running: `redis-cli ping` (should return PONG)
- Check Redis connection in backend `.env`
- Check Redis logs

### Issue: Import fails
**Solution:**
- Check Excel file format matches template
- Check required fields are filled
- Check file size (< 10MB)
- Review error messages in import results

---

## 🆘 Need Help?

If you encounter issues:
1. Check the **Troubleshooting** section above
2. Review the **Best Practices** section
3. Check user permissions (Admin/Manager vs Developer)
4. Refresh the page and try again
5. Contact your system administrator

**Happy Project Managing! 🚀**

