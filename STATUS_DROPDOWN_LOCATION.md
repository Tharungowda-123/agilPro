# 📍 Status Dropdown Location Guide

## 🎯 Exact Location

The **Status dropdown** is located in the **Edit Story Modal** → **Details Tab** → **First field in the metadata row**.

---

## 📋 Step-by-Step Instructions

### Step 1: Open a Story
1. Go to **Board** page (left sidebar)
2. Click on **any story card** (the colored cards in columns)
3. The Story Detail Modal will open

### Step 2: Enter Edit Mode
1. In the modal, look at the **top right corner**
2. Click the **"Edit"** button (blue button)
3. The modal will switch to edit mode

### Step 3: Go to Details Tab
1. Look at the **tabs** below the title: "Details", "Tasks", "Comments", etc.
2. Make sure **"Details"** tab is selected (it should be by default)
3. If not, click on **"Details"**

### Step 4: Find Status Dropdown
1. Scroll down past the **Title** field
2. Look for a **row of 5 dropdown fields** (or 2 on mobile)
3. The **FIRST field** in this row is **"Status"**
4. It should show a dropdown with options: Backlog, Ready, In Progress, Review, Done

---

## 🖼️ Visual Layout

```
┌─────────────────────────────────────────┐
│  Edit Story                    [Cancel] [Save Changes] [X] │
├─────────────────────────────────────────┤
│  [Details] [Tasks] [Comments] [Attachments] [Activity] ... │
├─────────────────────────────────────────┤
│                                         │
│  Title: [Input field]                  │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Status: [Dropdown ▼] ← HERE!      │ │ ← FIRST FIELD
│  │ Priority: [Dropdown ▼]             │ │
│  │ Story Points: [Dropdown ▼]         │ │
│  │ Sprint: [Dropdown ▼]               │ │
│  │ Assignee: [Button]                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Description: [Rich text editor]       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔍 What You Should See

When you click on the **Status dropdown**, you should see:

```
┌─────────────────┐
│ Backlog         │
│ Ready           │
│ In Progress     │
│ Review          │
│ Done            │
└─────────────────┘
```

---

## ⚠️ Troubleshooting

### If you don't see the Status dropdown:

1. **Check if you're in Edit Mode:**
   - Look for "Edit" button at top right
   - Click it if you see "Edit" (not "Save Changes")

2. **Check if you're on Details Tab:**
   - Look at tabs below title
   - Click "Details" if another tab is selected

3. **Check screen size:**
   - On mobile/small screens, fields stack in 2 columns
   - Status should still be the first field
   - Scroll down to see all fields

4. **Refresh the page:**
   - Sometimes a refresh helps if the modal didn't load properly

---

## 📱 Mobile/Small Screen Layout

On smaller screens, the 5 fields are arranged in 2 columns:

```
┌─────────────────┬─────────────────┐
│ Status: [▼]     │ Priority: [▼]  │
├─────────────────┼─────────────────┤
│ Story Points: [▼]│ Sprint: [▼]    │
├─────────────────┴─────────────────┤
│ Assignee: [Button]                 │
└─────────────────────────────────────┘
```

**Status is still the FIRST field** (top left).

---

## ✅ Quick Test

1. Open any story from the Board
2. Click "Edit" button
3. Look for the row of dropdowns
4. The first one should say "Status" with a dropdown arrow
5. Click it to see: Backlog, Ready, In Progress, Review, Done

---

## 🎯 Alternative: Drag and Drop

If you still can't find the dropdown, you can also change status by:

1. Go to **Board** page
2. **Drag** the story card from one column to another
3. Status updates automatically!

Example:
- Drag from "Backlog" column → Drop in "Ready" column
- Status automatically changes to "Ready"

---

## 📞 Still Can't Find It?

If you still can't see the Status dropdown after following these steps:

1. Make sure you're logged in as a user with edit permissions
2. Try a different story
3. Check browser console for errors (F12)
4. Try refreshing the page

The Status dropdown should be visible as the **first field** in the metadata row when in Edit Mode on the Details tab.


