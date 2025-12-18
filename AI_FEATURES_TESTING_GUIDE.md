# 🤖 AI Features Testing Guide

## 📋 Overview

This guide provides step-by-step instructions to test all AI automation features implemented in the AgileSAFe AI Platform. These features use Machine Learning to automate project management tasks.

**Prerequisites:**
- Backend service running on `http://localhost:5000`
- ML service running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- Logged in as **Admin** or **Manager** role
- At least one project created
- MongoDB and Redis services running

---

## 🎯 Table of Contents

1. [Feature AI Breakdown](#1-feature-ai-breakdown)
2. [Auto-Breakdown and Create](#2-auto-breakdown-and-create)
3. [NLP Analysis & Insights](#3-nlp-analysis--insights)
4. [ML Feedback System](#4-ml-feedback-system)
5. [Feature Breakdown Wizard](#5-feature-breakdown-wizard)
6. [Troubleshooting](#troubleshooting)

---

## 1. Feature AI Breakdown

### What it does:
AI analyzes a feature description and suggests breaking it down into user stories and tasks.

### Testing Steps:

#### Step 1.1: Create a Feature
1. Navigate to **Projects** → Select a project → Click **"Features"** tab
2. Click **"+ Create Feature"** button
3. Fill in the feature details:
   - **Title**: `User Authentication System`
   - **Description**: `Implement a complete user authentication system with email/password login, password reset, and social login options. Users should be able to register, login, logout, and manage their profiles securely.`
   - **Business Value**: `High - Enables user access and security`
   - **Priority**: `High`
   - **Acceptance Criteria**:
     - Users can register with email and password
     - Users can login with credentials
     - Password reset functionality works
     - Session management is secure
4. Click **"Create Feature"**
5. ✅ **Expected Result**: Feature is created and appears in the features list

#### Step 1.2: Analyze Feature with AI
1. Click on the feature you just created to open the **Feature Detail** page
2. Look for the **"Breakdown with AI"** button (with sparkles icon) in the top right
3. Click **"Breakdown with AI"**
4. Wait for the AI analysis (this may take 10-30 seconds)
5. ✅ **Expected Result**: 
   - A modal/wizard opens showing AI-generated breakdown
   - You see suggested stories with titles, descriptions, and estimated points
   - Each story has associated tasks
   - AI insights show complexity score, identified personas, and extracted requirements

#### Step 1.3: Review AI Suggestions
1. In the breakdown wizard, review the suggested stories
2. Check each story for:
   - **Title**: Should be descriptive (e.g., "User Registration Story")
   - **Description**: Should follow user story format ("As a... I want...")
   - **Story Points**: Should be a reasonable estimate (1-13 points)
   - **Tasks**: Each story should have 2-5 related tasks
   - **Acceptance Criteria**: Should be relevant to the story
3. ✅ **Expected Result**: 
   - Stories are well-structured and relevant
   - Tasks are actionable and specific
   - Estimates seem reasonable

#### Step 1.4: Accept Selected Stories
1. In the breakdown wizard, select specific stories you want to create (checkboxes)
2. Click **"Accept Selected"** button
3. ✅ **Expected Result**: 
   - Selected stories are created in the backlog
   - Tasks are automatically created for each story
   - Success message: "Created X stories with Y tasks successfully"
   - Stories appear in the project backlog

#### Step 1.5: Accept All Stories
1. Go back to the feature detail page
2. Click **"Breakdown with AI"** again (or use existing breakdown)
3. Click **"Accept All"** button
4. ✅ **Expected Result**: 
   - All suggested stories are created
   - All tasks are created
   - Feature status changes to "broken-down"

---

## 2. Auto-Breakdown and Create

### What it does:
One-click feature that instantly breaks down a feature and creates all stories and tasks automatically (no manual selection needed).

### Testing Steps:

#### Step 2.1: Create a New Feature
1. Navigate to **Projects** → Select a project → **Features** tab
2. Click **"+ Create Feature"**
3. Fill in feature details:
   - **Title**: `Shopping Cart Functionality`
   - **Description**: `Implement a shopping cart where users can add products, update quantities, remove items, apply discount codes, and proceed to checkout. The cart should persist across sessions and support multiple payment methods.`
   - **Business Value**: `Critical - Core e-commerce functionality`
   - **Priority**: `High`
4. Click **"Create Feature"**

#### Step 2.2: Use Auto-Breakdown
1. Open the feature detail page
2. Look for the **"Auto-Breakdown & Create"** button (with lightning bolt icon ⚡)
3. Click **"Auto-Breakdown & Create"**
4. Wait for processing (10-30 seconds)
5. ✅ **Expected Result**: 
   - Success message: "Created X stories and Y tasks in 3 seconds! ⚡"
   - All stories are immediately created in the backlog
   - All tasks are created and linked to stories
   - Feature status changes to "broken-down"
   - You can see the created stories in the project backlog

#### Step 2.3: Verify Created Stories
1. Navigate to the project's **Backlog** tab
2. Look for the newly created stories
3. Click on a story to view details
4. ✅ **Expected Result**: 
   - Stories have proper titles and descriptions
   - Stories have story points assigned
   - Stories have tasks linked to them
   - Tasks have estimated hours
   - All data is properly saved in the database

---

## 3. NLP Analysis & Insights

### What it does:
Advanced Natural Language Processing analyzes feature descriptions to extract personas, requirements, and complexity metrics.

### Testing Steps:

#### Step 3.1: Create Feature with Rich Description
1. Create a new feature with detailed description:
   - **Title**: `Customer Support Dashboard`
   - **Description**: `Build a comprehensive customer support dashboard for support agents. Agents need to view all customer tickets, filter by priority and status, respond to customer inquiries, escalate urgent issues, track response times, and generate support reports. The dashboard should integrate with email, chat, and phone support channels.`
   - **Acceptance Criteria**:
     - Support agents can view all tickets in one place
     - Filtering by status, priority, and date range
     - Real-time ticket updates
     - Response time tracking
     - Report generation

#### Step 3.2: Trigger NLP Analysis
1. Open the feature detail page
2. Click **"Breakdown with AI"** button
3. Wait for analysis to complete
4. ✅ **Expected Result**: 
   - Feature detail page shows **"AI Insights"** section
   - **NLP Insights** card displays:
     - **Complexity Score**: A number (0-10)
     - **Identified Personas**: List of user types (e.g., "Support Agent", "Customer")
     - **Extracted Requirements**: List of functional requirements
     - **Analysis Date**: Timestamp of when analysis was performed

#### Step 3.3: View Advanced NLP Insights
1. Scroll down to the **"AI Insights"** section on the feature detail page
2. Look for the **NLPInsights** component
3. ✅ **Expected Result**: 
   - Shows detailed NLP analysis breakdown
   - Displays sentiment analysis if available
   - Shows entity extraction (key terms, concepts)
   - May show confidence scores

#### Step 3.4: Re-analyze Feature
1. On the feature detail page, find the **"Re-analyze"** button in AI Insights section
2. Click **"Re-analyze"**
3. Wait for new analysis
4. ✅ **Expected Result**: 
   - New analysis results appear
   - Analysis date updates
   - Insights may change based on updated feature description

---

## 4. ML Feedback System

### What it does:
Allows users to provide feedback on AI predictions to improve the ML models over time.

### Testing Steps:

#### Step 4.1: Provide Feedback on Story Suggestions
1. After using **"Breakdown with AI"**, review the suggested stories
2. For each story, you can provide feedback:
   - **Good suggestion**: Story is relevant and well-estimated
   - **Needs improvement**: Story needs adjustment
3. Look for feedback buttons or options in the breakdown wizard
4. ✅ **Expected Result**: 
   - Feedback is submitted to the ML service
   - Success message confirms feedback was recorded
   - ML models can learn from this feedback

#### Step 4.2: Provide Feedback on Task Assignments
1. Navigate to a story that has tasks
2. If AI suggested task assignments, review them
3. Provide feedback on assignment quality
4. ✅ **Expected Result**: 
   - Feedback is saved
   - Future suggestions improve based on feedback

#### Step 4.3: View Feedback Statistics
1. Navigate to **Settings** → **ML Performance** (if available)
2. Or check the ML Performance Dashboard
3. ✅ **Expected Result**: 
   - See feedback statistics
   - View model performance trends
   - See accuracy metrics

---

## 5. Feature Breakdown Wizard

### What it does:
Interactive wizard that guides you through the AI breakdown process with options to customize and select stories.

### Testing Steps:

#### Step 5.1: Open Breakdown Wizard
1. Create or open a feature
2. Click **"Breakdown with AI"** button
3. ✅ **Expected Result**: 
   - Wizard opens with multiple steps
   - Step 1: Shows loading/analysis progress
   - Step 2: Shows suggested stories with checkboxes

#### Step 5.2: Review Story Details
1. In the wizard, expand a story to see:
   - Full description
   - Acceptance criteria
   - Estimated story points
   - Associated tasks
2. Click on tasks to see task details
3. ✅ **Expected Result**: 
   - All story information is visible
   - Tasks are properly nested under stories
   - You can select/deselect individual stories

#### Step 5.3: Select and Accept Stories
1. Check the boxes next to stories you want to create
2. Click **"Accept Selected (X)"** button
3. ✅ **Expected Result**: 
   - Only selected stories are created
   - Success message shows count
   - Stories appear in backlog

#### Step 5.4: Accept All Stories
1. In the wizard, click **"Accept All"** button
2. ✅ **Expected Result**: 
   - All stories are created
   - All tasks are created
   - Wizard shows confirmation step

#### Step 5.5: Re-analyze Feature
1. In the wizard, click **"Re-analyze"** button
2. Wait for new analysis
3. ✅ **Expected Result**: 
   - New suggestions appear
   - Previous selections are cleared
   - You can review new breakdown

---

## 6. Testing Feature Detail Page AI Features

### Step 6.1: View AI Insights on Feature Page
1. Open any feature that has been analyzed
2. Scroll to the **"AI Insights"** section
3. ✅ **Expected Result**: 
   - Shows complexity score
   - Shows identified personas
   - Shows extracted requirements
   - Shows analysis timestamp

### Step 6.2: View NLP Insights Component
1. On feature detail page, look for **NLPInsights** component
2. ✅ **Expected Result**: 
   - Advanced NLP analysis displayed
   - Shows detailed breakdown of analysis
   - May show confidence scores

### Step 6.3: View Child Stories
1. On feature detail page, scroll to **"Child Stories"** section
2. ✅ **Expected Result**: 
   - Lists all stories created from this feature
   - Shows story status and points
   - Clickable to view story details

---

## 7. Testing from Project Backlog Tab

### Step 7.1: Use AI Breakdown from Backlog
1. Navigate to **Projects** → Select project → **Backlog** tab
2. In the **"Features & AI Breakdown"** section, find a feature
3. Click **"Break Down with AI"** button on a feature card
4. ✅ **Expected Result**: 
   - Breakdown process starts
   - Stories are suggested
   - You can accept them

### Step 7.2: Verify Stories in Backlog
1. After accepting breakdown, check the backlog
2. ✅ **Expected Result**: 
   - New stories appear in the backlog
   - Stories are linked to the feature
   - Stories have proper metadata

---

## 🔍 Verification Checklist

After testing each feature, verify:

- [ ] Stories are created with proper titles and descriptions
- [ ] Tasks are created and linked to stories
- [ ] Story points are assigned
- [ ] Acceptance criteria are included
- [ ] Feature status updates correctly
- [ ] AI insights are displayed
- [ ] No duplicate storyIds are created
- [ ] All data persists after page refresh
- [ ] Error messages are user-friendly if ML service is down
- [ ] Loading states are shown during processing

---

## 🐛 Troubleshooting

### Issue: "ML service unavailable" error
**Solution:**
1. Check if ML service is running: `curl http://localhost:8000/health`
2. Check ML service logs for errors
3. Verify Redis connection in ML service
4. Restart ML service if needed

### Issue: Breakdown takes too long
**Solution:**
1. Check ML service performance
2. Verify Redis is working (used for caching)
3. Check network connectivity between backend and ML service
4. Try with a simpler feature description first

### Issue: No stories generated
**Solution:**
1. Ensure feature has a detailed description
2. Check ML service logs for errors
3. Verify feature description is not too short
4. Try re-analyzing the feature

### Issue: Duplicate storyIds error
**Solution:**
1. This should be fixed, but if it occurs:
2. Check backend logs for the error
3. Verify the fix for pre-calculating storyIds is working
4. Clear any duplicate stories manually if needed

### Issue: Stories not appearing in backlog
**Solution:**
1. Refresh the page
2. Check if stories were actually created (check database)
3. Verify project ID is correct
4. Check browser console for errors

### Issue: AI Insights not showing
**Solution:**
1. Ensure breakdown was completed successfully
2. Check if feature has `aiInsights` property
3. Verify NLP analysis completed
4. Try re-analyzing the feature

---

## 📊 Expected Test Results Summary

| Feature | Expected Outcome | Success Criteria |
|---------|------------------|------------------|
| Feature Breakdown | Stories and tasks suggested | 3-8 stories per feature, 2-5 tasks per story |
| Auto-Breakdown | Instant creation | All stories/tasks created in <30 seconds |
| NLP Analysis | Insights displayed | Complexity score, personas, requirements shown |
| Accept Breakdown | Selected stories created | Only checked stories appear in backlog |
| ML Feedback | Feedback recorded | Success message, feedback saved to database |
| Breakdown Wizard | Interactive workflow | Multi-step wizard with selection options |

---

## 🎯 Quick Test Scenario

**Complete End-to-End Test:**

1. **Create Feature**: "E-Commerce Checkout Process"
   - Description: "Implement secure checkout with payment processing, order confirmation, and email notifications"
   - Priority: High

2. **Use Auto-Breakdown**: Click "Auto-Breakdown & Create" ⚡
   - Wait for completion
   - Verify stories created

3. **Check Backlog**: Navigate to project backlog
   - Verify stories appear
   - Check story details

4. **View AI Insights**: Open feature detail page
   - Verify NLP insights displayed
   - Check complexity score

5. **Provide Feedback**: (If feedback UI is available)
   - Rate the breakdown quality
   - Submit feedback

**Expected Result**: Complete workflow works end-to-end, all data persists, and AI suggestions are relevant.

---

## 📝 Notes

- **ML Service Requirements**: Ensure ML service has all required models loaded
- **Performance**: First breakdown may take longer (model loading)
- **Caching**: Subsequent breakdowns may be faster due to caching
- **Data Quality**: Better feature descriptions = better AI suggestions
- **Feedback Loop**: Regular feedback improves model accuracy over time

---

## ✅ Success Criteria

All features are working correctly if:
- ✅ AI breakdown generates relevant stories and tasks
- ✅ Auto-breakdown creates all items successfully
- ✅ NLP insights are displayed accurately
- ✅ Stories and tasks are saved to database
- ✅ No errors occur during the process
- ✅ User can provide feedback on suggestions
- ✅ Feature status updates correctly
- ✅ All UI elements are responsive and functional

---

**Last Updated**: November 22, 2025
**Version**: 1.0

