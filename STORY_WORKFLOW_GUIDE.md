# 📋 Story Workflow Guide - Complete Explanation

## 🎯 Overview

Stories move through a **5-stage workflow** from creation to completion. Each stage represents a different phase of development.

---

## 📊 The 5 Stages (Left to Right on Board)

### 1. **BACKLOG** 📝
**What it is:** New stories that haven't been started yet.

**When stories are here:**
- ✅ **Newly created stories** (default status when created)
- ✅ Stories that need more information before starting
- ✅ Stories waiting for dependencies to be resolved
- ✅ Ideas/requirements that aren't ready to work on yet

**Example:**
```
Story: "Add user authentication with OAuth"
Status: Backlog
Reason: Just created, needs to be reviewed and planned before starting
```

**What happens next:** Story moves to **Ready** when it's been reviewed, has clear requirements, and is ready to be worked on.

---

### 2. **READY** ✅
**What it is:** Stories that are ready to be worked on but haven't started yet.

**When stories are here:**
- ✅ Story has been reviewed and approved
- ✅ Requirements are clear and well-defined
- ✅ Acceptance criteria are set
- ✅ Story is assigned to a sprint (optional)
- ✅ Dependencies are resolved
- ✅ Ready for a developer to pick up

**Example:**
```
Story: "Add user authentication with OAuth"
Status: Ready
Reason: 
  - Requirements are clear
  - Acceptance criteria defined
  - Assigned to Sprint 1
  - Waiting for developer to start
```

**What happens next:** Story moves to **In Progress** when a developer starts working on it.

---

### 3. **IN PROGRESS** 🔄
**What it is:** Stories currently being worked on by developers.

**When stories are here:**
- ✅ A developer has started working on the story
- ✅ Tasks are being created and worked on
- ✅ Code is being written
- ✅ Active development is happening

**Example:**
```
Story: "Add user authentication with OAuth"
Status: In Progress
Reason:
  - Developer assigned and started
  - Tasks created: "Setup OAuth provider", "Create login page", "Handle tokens"
  - Currently coding the login functionality
```

**What happens next:** Story moves to **Review** when development is complete and ready for testing/review.

---

### 4. **REVIEW** 🔍
**What it is:** Stories that are completed but need review/testing before being marked as done.

**When stories are here:**
- ✅ All development tasks are completed
- ✅ Code is ready for review
- ✅ Waiting for QA/testing
- ✅ Waiting for code review/approval
- ✅ Waiting for stakeholder approval

**Example:**
```
Story: "Add user authentication with OAuth"
Status: Review
Reason:
  - All tasks completed
  - Code submitted for review
  - QA testing the login flow
  - Waiting for approval from product manager
```

**What happens next:** Story moves to **Done** when review/testing is complete and approved.

---

### 5. **DONE** ✅
**What it is:** Stories that are fully completed and approved.

**When stories are here:**
- ✅ All tasks are completed
- ✅ Code review passed
- ✅ Testing passed
- ✅ Deployed to production (or ready for deployment)
- ✅ Approved by stakeholders

**Example:**
```
Story: "Add user authentication with OAuth"
Status: Done
Reason:
  - All tasks completed
  - Code reviewed and approved
  - QA tested and passed
  - Deployed to production
  - Users can now login with OAuth
```

**What happens next:** Story stays in Done. It's complete! 🎉

---

## 🔄 Complete Workflow Example

Let's follow a story from creation to completion:

### Step 1: Creation → **BACKLOG**
```
Product Manager creates story: "Add shopping cart feature"
Status: Backlog (default)
Location: Board → Backlog column
```

### Step 2: Planning → **READY**
```
After sprint planning meeting:
- Requirements clarified
- Story points estimated (8 points)
- Assigned to Sprint 2
- Acceptance criteria defined
Status: Ready
Location: Board → Ready column
```

### Step 3: Development Starts → **IN PROGRESS**
```
Developer picks up the story:
- Creates tasks: "Design cart UI", "Add to cart API", "Cart persistence"
- Starts coding
Status: In Progress
Location: Board → In Progress column
```

### Step 4: Development Complete → **REVIEW**
```
Developer finishes coding:
- All tasks completed
- Code submitted for review
- QA starts testing
Status: Review
Location: Board → Review column
```

### Step 5: Approved → **DONE**
```
After review and testing:
- Code review approved
- QA testing passed
- Product manager approved
- Deployed to production
Status: Done
Location: Board → Done column
```

---

## 🎛️ How to Change Story Status

### **Method 1: Using Status Dropdown (Recommended)**

**Location:** Story Detail Modal → Details Tab → Edit Mode

**Steps:**
1. **Open the story:**
   - Go to **Board** page
   - Click on any story card
   - OR go to **Projects** → Select project → Click on a story

2. **Enter Edit Mode:**
   - In the story modal, click the **"Edit"** button (top right)
   - The modal will switch to edit mode

3. **Find Status Dropdown:**
   - Look in the **"Details"** tab (should be open by default)
   - Find the **"Status"** field (first field in the metadata row)
   - You'll see a dropdown with options:
     - Backlog
     - Ready
     - In Progress
     - Review
     - Done

4. **Change Status:**
   - Click the dropdown
   - Select the new status
   - Click **"Save Changes"** button
   - Story will automatically move to the correct column on the board!

**Visual Guide:**
```
Story Detail Modal
├── [Edit Button] ← Click here first
├── Details Tab (default)
│   ├── Title
│   ├── Description
│   └── Metadata Row
│       ├── Status: [Dropdown ▼] ← HERE! Click to change
│       ├── Priority
│       ├── Story Points
│       ├── Sprint
│       └── Assignee
└── [Save Changes] ← Click after changing status
```

### **Method 2: Drag and Drop on Board**

**Location:** Board Page

**Steps:**
1. Go to **Board** page
2. Find the story card in its current column
3. **Drag** the story card to the target column
4. **Drop** it in the new column
5. Status updates automatically!

**Example:**
```
Drag story from "Backlog" → Drop in "Ready" column
Result: Status automatically changes to "Ready"
```

---

## 📍 Where to Find Status Dropdown

### **Primary Location: Story Detail Modal**

1. **Access via Board:**
   - Navigate to: **Board** (left sidebar)
   - Click any story card
   - Click **"Edit"** button
   - Find **"Status"** dropdown in Details tab

2. **Access via Projects:**
   - Navigate to: **Projects** (left sidebar)
   - Click on a project
   - Click on a story
   - Click **"Edit"** button
   - Find **"Status"** dropdown in Details tab

3. **Access via Sprints:**
   - Navigate to: **Sprints** (left sidebar)
   - Click on a sprint
   - Click on a story
   - Click **"Edit"** button
   - Find **"Status"** dropdown in Details tab

### **Visual Path:**
```
Left Sidebar
  └── Board / Projects / Sprints
      └── Click Story Card
          └── Story Detail Modal Opens
              └── Click "Edit" Button
                  └── Details Tab
                      └── Status Dropdown ← HERE!
```

---

## 🎯 Best Practices

### **When to Move Stories:**

1. **Backlog → Ready:**
   - After sprint planning
   - When requirements are clear
   - When ready to be assigned

2. **Ready → In Progress:**
   - When developer starts working
   - When first task is created/started

3. **In Progress → Review:**
   - When all tasks are completed
   - When code is ready for review
   - When ready for testing

4. **Review → Done:**
   - When review is approved
   - When testing passes
   - When deployed/ready for deployment

### **Tips:**
- ✅ Update status as you progress (don't wait until the end)
- ✅ Use drag-and-drop for quick status changes
- ✅ Use dropdown for precise control
- ✅ Status changes reflect everywhere automatically
- ✅ All team members see updates in real-time

---

## 🔄 Automatic Updates

When you change a story's status:

✅ **Board** - Story automatically moves to correct column
✅ **Project Page** - Story status updates
✅ **Sprint Detail** - Story status updates
✅ **Dashboard** - Stats update (if moved to Done)
✅ **Real-time** - All team members see the change immediately

---

## ❓ Common Questions

**Q: Can I skip stages?**
A: Yes! You can move a story from Backlog directly to In Progress if needed. The workflow is flexible.

**Q: What if I move a story to Done by mistake?**
A: Just change the status back! You can move stories in any direction.

**Q: Do I need to update status manually?**
A: Yes, but you can also drag-and-drop on the board for quick updates.

**Q: What happens to tasks when story status changes?**
A: Tasks remain independent. You can complete tasks while the story is in any status.

---

## 📝 Summary

**The Flow:**
```
Backlog → Ready → In Progress → Review → Done
   📝        ✅         🔄          🔍        ✅
```

**To Change Status:**
1. Open story → Click "Edit" → Find "Status" dropdown → Select new status → Save
2. OR drag story card on Board to new column

**Status Dropdown Location:**
- Story Detail Modal → Edit Mode → Details Tab → Status Field

That's it! You're now a workflow expert! 🎉


