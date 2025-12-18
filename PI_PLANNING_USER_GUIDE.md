# PI Planning Feature - Step-by-Step User Guide

## Overview
Program Increment (PI) Planning allows you to plan multiple sprints together, organize features across sprints, set objectives, and use AI to optimize feature distribution. This guide walks you through every step of using the PI Planning feature.

---

## Table of Contents
1. [Accessing PI Planning](#accessing-pi-planning)
2. [Creating a Program Increment](#creating-a-program-increment)
3. [Managing PI Planning Board](#managing-pi-planning-board)
4. [Viewing PI Dashboard](#viewing-pi-dashboard)
5. [AI Optimization](#ai-optimization)
6. [Exporting PI Plan](#exporting-pi-plan)
7. [Importing from Excel](#importing-from-excel)
8. [Starting and Completing a PI](#starting-and-completing-a-pi)

---

## Accessing PI Planning

### Step 1: Navigate to a Project
1. **Log in** to your account
2. Click on **"Projects"** in the main navigation
3. Select a **project** from the list (or create a new one if needed)

### Step 2: Open PI Planning Tab
1. In the **Project Detail** page, click on the **"PI Planning"** tab
2. You'll see:
   - List of existing Program Increments (if any)
   - **"+ Create Program Increment"** button (if no PIs exist)
   - Or an empty state with a button to create your first PI

---

## Creating a Program Increment

The PI creation process uses a **6-step wizard**. Follow each step carefully:

### Step 1: Create PI - Basic Information

1. Click **"+ Create Program Increment"** button
2. The wizard modal opens with **Step 1: Create PI**

3. **Fill in the required fields:**
   - **PI Name** (Required):
     - Example: `PI 2025 Q1`
     - Example: `Q2 2025 Planning`
     - Example: `Sprint 1-6 Planning`
   
   - **Description** (Optional):
     - Example: `First quarter planning for 2025, focusing on e-commerce platform launch`
     - Describe the goals and scope of this Program Increment
   
   - **Start Date** (Required):
     - Click the date field
     - Select a start date (typically 8-12 weeks from now)
     - This should align with your first sprint start date
   
   - **End Date** (Required):
     - Click the date field
     - Select an end date (typically 12 weeks after start date)
     - The system will automatically calculate and display the duration in weeks

4. **Review the duration:**
   - After selecting both dates, you'll see a blue info box showing:
     - `Duration: X weeks`
   - Ensure this matches your planning timeline (typically 8-12 weeks for a PI)

5. Click **"Next"** to proceed to Step 2

---

### Step 2: Add Features

1. **View available features:**
   - You'll see a list of all features in the project
   - Each feature card shows:
     - Feature title
     - Description (if available)
     - Priority badge
     - Story points (if estimated)

2. **Select features for the PI:**
   - **Click on a feature card** to select it (or use the checkbox)
   - Selected features will have a **blue border**
   - You can select multiple features
   - Click again to deselect

3. **Tips for selection:**
   - Select features that align with your PI objectives
   - Consider dependencies between features
   - Include features that can be completed within the PI timeframe
   - The counter at the bottom shows: `X feature(s) selected`

4. **If you need to create new features:**
   - Close the wizard (your progress is saved)
   - Go to the **Features** tab in the project
   - Create new features
   - Return to PI Planning and reopen the wizard

5. Click **"Next"** to proceed to Step 3

---

### Step 3: Set Objectives

1. **View existing objectives** (if any):
   - You'll see a list of objectives you've added
   - Each objective shows:
     - Description
     - Business Value (BV) badge
     - Status badge (Uncommitted/Committed/Stretch)
     - Assigned team (if any)

2. **Add a new objective:**
   - Scroll to the **"Add Objective"** section (gray card)
   - Fill in the form:
     - **Objective Description** (Required):
       - Example: `Launch e-commerce platform`
       - Example: `Improve user authentication system`
       - Example: `Complete mobile app redesign`
     
     - **Business Value** (1-10 scale):
       - Enter a number between 1 and 10
       - Higher values indicate more business importance
       - Example: `10` for critical objectives
       - Example: `7` for important objectives
     
     - **Assign To** (Optional):
       - Select a team from the dropdown
       - Choose "Select Team" to leave unassigned
       - Only teams in your project will appear
     
     - **Status**:
       - **Uncommitted**: Objective is aspirational
       - **Committed**: Team commits to deliver this
       - **Stretch**: Nice-to-have if time permits

3. **Click "Add Objective"** button
   - The objective appears in the list above
   - You can add multiple objectives

4. **Remove an objective:**
   - Click the **"Remove"** button on any objective card

5. **Best practices:**
   - Set 3-5 objectives per PI
   - Mix committed and stretch objectives
   - Assign business values based on strategic importance
   - Assign objectives to specific teams for accountability

6. Click **"Next"** to proceed to Step 4

---

### Step 4: AI Distribution

1. **Review the AI Distribution screen:**
   - You'll see:
     - Number of features selected
     - Number of sprints available
     - A card with a lightning bolt icon (⚡)

2. **Use AI Optimization:**
   - Click the **"⚡ Optimize Distribution"** button
   - The AI will analyze:
     - Feature dependencies
     - Story point distribution
     - Team capacity
     - Sprint timelines
   - Wait for the optimization (takes a few seconds)

3. **Review optimization results:**
   - A green success message appears: `✓ Features distributed optimally across sprints`
   - The optimization assigns features to sprints based on:
     - Balanced workload
     - Dependency order
     - Team capacity
     - Timeline constraints

4. **Note:**
   - You can manually adjust assignments later in the Planning Board
   - The AI optimization is a starting point, not final

5. Click **"Next"** to proceed to Step 5

---

### Step 5: Review

1. **Review all PI details:**
   - **PI Details Card:**
     - Name
     - Duration (start date to end date)
   
   - **Features Card:**
     - Number of features selected
     - Total story points across all features
   
   - **Objectives Card:**
     - List of all objectives
     - Each shows description and business value

2. **Verify everything is correct:**
   - Check that all selected features are appropriate
   - Ensure objectives align with features
   - Verify dates are correct
   - Confirm total story points are realistic

3. **Make changes if needed:**
   - Click **"Back"** to return to previous steps
   - Modify any information
   - Return to Review step

4. Click **"Next"** to proceed to Step 6 (Commit)

---

### Step 6: Commit

1. **Final confirmation screen:**
   - You'll see a green checkmark icon
   - Message: "Ready to Create PI"
   - Description: "Click 'Create PI' to finalize the Program Increment and create all associated sprints."

2. **Create the PI:**
   - Click the **"Create PI"** button
   - The system will:
     - Create the Program Increment
     - Associate selected features
     - Create sprints for the PI duration
     - Set up objectives
     - Apply AI distribution (if optimized)

3. **Success notification:**
   - A success toast appears: `Program Increment created successfully!`
   - The wizard closes
   - You're redirected to the PI Planning tab

4. **View your new PI:**
   - The PI appears in the list
   - Status: **"planning"**
   - You can now open the Planning Board or Dashboard

---

## Managing PI Planning Board

The Planning Board allows you to visually organize features across sprints using drag-and-drop.

### Step 1: Open Planning Board

1. From the **PI Planning** tab in Project Detail:
   - Click on a PI card
   - OR click **"Open Planning Board"** button on a PI

2. You'll see the **PI Planning Board** with:
   - Header showing PI name and description
   - Action buttons (View Dashboard, AI Optimize, Export, Save Plan)
   - Sprint columns (one for each sprint in the PI)
   - Unassigned features column

### Step 2: Drag and Drop Features

1. **View features:**
   - Features appear in columns based on their current assignment
   - Unassigned features are in the "Unassigned" column

2. **Assign feature to sprint:**
   - **Click and hold** on a feature card
   - **Drag** it to a sprint column
   - **Drop** it in the desired sprint
   - The feature moves to that sprint column

3. **Move feature between sprints:**
   - Drag a feature from one sprint column to another
   - The assignment updates immediately

4. **Unassign a feature:**
   - Drag a feature from a sprint column to the "Unassigned" column
   - The feature becomes unassigned

### Step 3: View Capacity Warnings

1. **Check sprint capacity:**
   - Each sprint column shows:
     - Sprint name
     - Capacity (total story points)
     - Allocated (points from assigned features)
     - Utilization percentage

2. **Identify overloads:**
   - If a sprint is overloaded:
     - Yellow warning banner appears at the top
     - Shows which sprints are overloaded
     - Displays allocated vs. capacity
     - Example: `Sprint 1: 25 pts allocated, capacity is 21 pts`

3. **Resolve overloads:**
   - Drag features to other sprints
   - Or remove features from the PI
   - Aim for utilization between 80-100%

### Step 4: Use AI Optimize

1. **Click "AI Optimize" button:**
   - Located in the header
   - AI analyzes current assignments

2. **Wait for optimization:**
   - Takes a few seconds
   - AI redistributes features optimally

3. **Review changes:**
   - Features may move to different sprints
   - Capacity warnings should reduce
   - Success toast: `PI optimized successfully!`

4. **Manual adjustments:**
   - You can still drag features after AI optimization
   - Fine-tune the distribution as needed

### Step 5: Save Plan

1. **After making changes:**
   - Click **"Save Plan"** button
   - Your assignments are saved to the database

2. **Success notification:**
   - Toast: `PI plan saved!`
   - Changes are persisted

3. **Note:**
   - You can save multiple times
   - Each save updates the current state

---

## Viewing PI Dashboard

The PI Dashboard provides an overview of progress, metrics, burndown charts, objectives, risks, and dependencies.

### Step 1: Open Dashboard

1. **From Planning Board:**
   - Click **"View Dashboard"** button in header

2. **From PI Planning Tab:**
   - Click on a PI card
   - OR click **"View Dashboard"** on a PI

3. **From URL:**
   - Navigate to `/pi/{piId}`

### Step 2: View Metrics Overview

1. **Progress Card:**
   - Shows completion percentage
   - Displays: `X / Y features` completed

2. **Predicted Velocity:**
   - Total story points predicted across all sprints
   - Shows number of sprints

3. **Actual Velocity:**
   - Story points actually completed
   - Number of features completed

4. **Risks:**
   - Total number of risks
   - High priority risks count

### Step 3: Navigate Tabs

The dashboard has 5 tabs:

#### Overview Tab
- **Features Progress:**
  - List of features with status badges
  - Shows first 5 features
- **Sprint Status:**
  - List of sprints with status badges
  - Shows all sprints in the PI

#### Burndown Tab
- **PI Burndown Chart:**
  - Line chart showing planned vs. actual velocity
  - X-axis: Sprint names
  - Y-axis: Story points
  - Two lines:
    - **Planned** (blue): Predicted velocity
    - **Actual** (green): Actual velocity

#### Objectives Tab
- **List of Objectives:**
  - Each objective card shows:
    - Description
    - Business Value badge
    - Status badge (Committed/Uncommitted/Stretch)
    - Progress bar (if available)
    - Assigned team (if any)

#### Risks Tab
- **List of Risks:**
  - Each risk card shows:
    - Severity icon (Critical/High/Medium/Low)
    - Description
    - Severity badge
    - Mitigation strategy (if available)

#### Dependencies Tab
- **List of Dependencies:**
  - Each dependency card shows:
    - From Feature → To Feature
    - Dependency type badge
    - Description (if available)

### Step 4: View PI Status

1. **Status Badge:**
   - **Planning**: PI is being planned (can edit)
   - **Active**: PI is in progress
   - **Completed**: PI is finished

2. **Status-specific actions:**
   - **Planning**: "Open Planning Board" and "Start PI" buttons
   - **Active**: "Complete PI" button
   - **Completed**: No action buttons (read-only)

---

## AI Optimization

### Using AI Optimize in Planning Board

1. **Open Planning Board:**
   - Navigate to PI Planning tab
   - Click on a PI
   - Click "Open Planning Board"

2. **Click "AI Optimize" button:**
   - Located in the header
   - Has a lightning bolt icon (⚡)

3. **Wait for processing:**
   - AI analyzes:
     - Feature dependencies
     - Story point distribution
     - Sprint capacity
     - Team availability
     - Timeline constraints

4. **Review results:**
   - Features are redistributed across sprints
   - Capacity warnings should be minimized
   - Success toast appears

5. **Fine-tune manually:**
   - Drag features to adjust
   - Save plan when satisfied

### Using AI Optimize in Wizard (Step 4)

1. **During PI creation:**
   - Reach Step 4: AI Distribution
   - Click "⚡ Optimize Distribution"

2. **Review optimization:**
   - Green success message appears
   - Features are assigned to sprints

3. **Continue wizard:**
   - Proceed to Review step
   - Finalize PI creation

---

## Exporting PI Plan

### Step 1: Access Export

1. **From Planning Board:**
   - Click **"Export"** button in header
   - Dropdown menu appears

2. **From Dashboard:**
   - Click **"Export"** button in header
   - Dropdown menu appears

### Step 2: Choose Export Format

1. **Excel Export:**
   - Click **"Export to Excel"**
   - File downloads as `.xlsx`
   - Contains:
     - PI details
     - Features list
     - Sprint assignments
     - Objectives
     - Risks and dependencies

2. **PDF Export:**
   - Click **"Export to PDF"** (if available)
   - File downloads as `.pdf`
   - Contains formatted report

### Step 3: Use Exported File

1. **Open in Excel/PDF viewer:**
   - Review the exported data
   - Share with stakeholders
   - Use for presentations

2. **Edit if needed:**
   - Excel files can be edited
   - Re-import if necessary (see Import section)

---

## Importing from Excel

### Step 1: Prepare Excel File

1. **Download template** (if available):
   - Click "Download Template" in Import section
   - Use this as a starting point

2. **Format your data:**
   - Include columns: Feature Name, Sprint Assignment, Story Points, etc.
   - Follow the template structure

### Step 2: Import File

1. **Open Planning Board:**
   - Navigate to PI Planning
   - Open a PI in "planning" status
   - Click "Open Planning Board"

2. **Find Import Section:**
   - Look for "Import from Excel" card
   - Only visible when PI status is "planning"

3. **Upload file:**
   - Click "Choose File" or drag-and-drop
   - Select your Excel file
   - Click "Import"

4. **Wait for processing:**
   - System validates the file
   - Maps data to features and sprints
   - Shows progress

5. **Review results:**
   - Success toast: `Import completed! Refreshing...`
   - Page refreshes
   - Features are assigned based on import

6. **Verify assignments:**
   - Check Planning Board
   - Ensure features are in correct sprints
   - Adjust manually if needed

---

## Starting and Completing a PI

### Starting a PI

1. **Prerequisites:**
   - PI must be in "planning" status
   - Features should be assigned to sprints
   - Objectives should be set

2. **From Dashboard:**
   - Open PI Dashboard
   - Click **"Start PI"** button
   - Confirm the action

3. **Status change:**
   - PI status changes to **"active"**
   - Sprints become available for work
   - Team members can start working on features

4. **After starting:**
   - Planning Board becomes read-only (mostly)
   - Dashboard shows active metrics
   - Progress tracking begins

### Completing a PI

1. **Prerequisites:**
   - PI must be in "active" status
   - Most features should be completed
   - All sprints should be finished

2. **From Dashboard:**
   - Open PI Dashboard
   - Click **"Complete PI"** button
   - Confirm the action

3. **Status change:**
   - PI status changes to **"completed"**
   - Final metrics are calculated
   - PI becomes read-only

4. **After completion:**
   - View final burndown chart
   - Review objectives completion
   - Analyze actual vs. predicted velocity
   - Export final report

---

## Tips and Best Practices

### Planning Phase

1. **Feature Selection:**
   - Select 10-20 features per PI
   - Ensure features align with objectives
   - Consider dependencies

2. **Objective Setting:**
   - Set 3-5 objectives per PI
   - Mix committed and stretch goals
   - Assign clear business values

3. **Sprint Distribution:**
   - Use AI optimization as a starting point
   - Balance workload across sprints
   - Keep utilization at 80-100%
   - Avoid overloading sprints

### Execution Phase

1. **Regular Monitoring:**
   - Check Dashboard weekly
   - Review burndown chart
   - Track objective progress
   - Monitor risks

2. **Adjustments:**
   - Move features between sprints if needed
   - Update objectives if priorities change
   - Address risks promptly

3. **Communication:**
   - Share Dashboard with stakeholders
   - Export reports for meetings
   - Update team on progress

### Completion Phase

1. **Review:**
   - Compare actual vs. predicted velocity
   - Assess objective completion
   - Identify lessons learned

2. **Documentation:**
   - Export final report
   - Save metrics for future planning
   - Document risks and mitigations

---

## Troubleshooting

### Issue: Cannot create PI
- **Solution:** Ensure you have at least one feature in the project
- **Solution:** Check that dates are valid (end date after start date)

### Issue: Features not appearing in Step 2
- **Solution:** Create features in the Features tab first
- **Solution:** Refresh the page and reopen wizard

### Issue: AI Optimization not working
- **Solution:** Ensure you have selected features and sprints exist
- **Solution:** Check ML service is running (if using AI features)

### Issue: Cannot drag features in Planning Board
- **Solution:** Ensure PI status is "planning"
- **Solution:** Refresh the page
- **Solution:** Check browser supports drag-and-drop

### Issue: Import fails
- **Solution:** Check Excel file format matches template
- **Solution:** Ensure feature names match existing features
- **Solution:** Verify file is not corrupted

### Issue: Cannot start PI
- **Solution:** Ensure at least one feature is assigned to a sprint
- **Solution:** Check PI has valid dates
- **Solution:** Verify you have proper permissions

---

## Keyboard Shortcuts

- **Escape**: Close wizard/modal
- **Arrow Keys**: Navigate between wizard steps (if supported)
- **Enter**: Submit form (in wizard steps)

---

## Summary

The PI Planning feature provides a comprehensive solution for planning multiple sprints together. Key steps:

1. **Create PI** using the 6-step wizard
2. **Organize features** in the Planning Board with drag-and-drop
3. **Use AI** to optimize feature distribution
4. **Monitor progress** in the Dashboard
5. **Export/Import** for collaboration
6. **Start and Complete** PIs to track execution

For additional help, refer to the main project documentation or contact support.

