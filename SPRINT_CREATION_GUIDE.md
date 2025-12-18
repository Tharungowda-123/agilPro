# Sprint Creation Guide - Step by Step

## 📋 How to Create a Sprint in the Web Application

### **Step 1: Navigate to Sprints**

**Option A: From Projects Page**
1. Click **"Projects"** in the left sidebar
2. Click on any project (e.g., "E-Commerce Platform")
3. Click **"Sprints"** tab at the top

**Option B: From Sprints Menu**
1. Click **"Sprints"** in the left sidebar
2. Select a project from the dropdown (if multiple projects)

---

### **Step 2: Open Create Sprint Modal**

1. Click the **"Create Sprint"** button (usually top right, with a "+" icon)
2. The "Create New Sprint" modal will open

---

### **Step 3: Fill in Sprint Details**

Here's what each field means and example data:

#### **1. Sprint Template (Optional)**
- **What it is:** Pre-configured sprint settings
- **Example:** Select "2-Week Sprint Template" (if available)
- **Or:** Leave as "Select an option" to configure manually
- **Action:** Click "Manage Templates" to create custom templates

#### **2. Sprint Name**
- **What it is:** Name/identifier for the sprint
- **Required:** ✅ Yes
- **Examples:**
  - `Sprint 1 - Foundation`
  - `Sprint 2 - Authentication`
  - `Sprint 1 - Q1 2024`
  - `Sprint Alpha`
- **Best Practice:** Use descriptive names like "Sprint 1 - User Authentication"

#### **3. Sprint Goal**
- **What it is:** What you want to achieve in this sprint
- **Required:** ⚠️ Recommended (but can be empty)
- **Examples:**
  - `Set up project foundation and core infrastructure`
  - `Implement user authentication and authorization system`
  - `Build main dashboard with analytics and reporting`
  - `Complete payment gateway integration`
  - `Mobile responsive design implementation`
- **Best Practice:** Be specific about the sprint's objective

#### **4. Start Date**
- **What it is:** When the sprint begins
- **Required:** ✅ Yes
- **Format:** `mm/dd/yyyy` or use date picker (calendar icon)
- **Examples:**
  - Today's date: `11/17/2024`
  - Next Monday: `11/18/2024`
  - First of month: `12/01/2024`
- **Best Practice:** Usually Monday for 2-week sprints

#### **5. End Date**
- **What it is:** When the sprint ends
- **Required:** ✅ Yes
- **Format:** `mm/dd/yyyy` or use date picker
- **Examples:**
  - 2 weeks from start: If start is `11/17/2024`, end is `12/01/2024`
  - 1 week sprint: If start is `11/17/2024`, end is `11/24/2024`
  - 3 weeks sprint: If start is `11/17/2024`, end is `12/08/2024`
- **Best Practice:** Typically 1-4 weeks (2 weeks is most common)
- **Note:** End date must be after start date

#### **6. Story Points Commitment**
- **What it is:** Total story points the team can commit to
- **Required:** ✅ Yes
- **Default:** 80
- **Examples:**
  - Small team (2-3 devs): `40-60` points
  - Medium team (4-5 devs): `80-100` points
  - Large team (6+ devs): `120-150` points
- **Calculation:** 
  - Team size × Average velocity per developer
  - Example: 4 developers × 20 points each = 80 points
- **Best Practice:** Base on team's historical velocity

---

### **Step 4: Complete Example**

Here's a complete example with all fields filled:

```
Sprint Template: (Leave empty or select template)
Sprint Name: Sprint 1 - Foundation Setup
Sprint Goal: Set up project foundation, core infrastructure, and development environment
Start Date: 11/17/2024
End Date: 12/01/2024
Story Points Commitment: 80
```

**What this sprint does:**
- 2-week sprint (14 days)
- Starts November 17, 2024
- Ends December 1, 2024
- Team commits to 80 story points
- Focus: Foundation and infrastructure

---

### **Step 5: Create the Sprint**

1. Review all fields
2. Click **"Create Sprint"** button (blue button, bottom right)
3. Wait for success message
4. Sprint will appear in the sprints list

---

### **Step 6: After Creation**

Once created, you can:

1. **View Sprint:**
   - Click on the sprint card to see details

2. **Plan Sprint (Add Stories):**
   - Click **"Plan Sprint"** or **"Planning"** button
   - Drag stories from backlog to sprint
   - OR use **"AI Recommendations"** to get AI suggestions

3. **Start Sprint:**
   - Click **"Start Sprint"** button
   - Sprint status changes to "Active"

4. **Use AI Optimization:**
   - In Sprint Planning page, click **"AI Recommendations"**
   - AI will suggest best stories based on:
     - Team capacity
     - Story priority
     - Story complexity
     - Developer skills

---

## 📝 Common Sprint Examples

### **Example 1: 2-Week Sprint (Standard)**
```
Name: Sprint 1 - User Authentication
Goal: Implement secure user authentication with JWT tokens
Start: 11/17/2024
End: 12/01/2024
Capacity: 80 points
```

### **Example 2: 1-Week Sprint (Short)**
```
Name: Sprint 2 - Bug Fixes
Goal: Fix critical bugs and improve stability
Start: 12/02/2024
End: 12/09/2024
Capacity: 40 points
```

### **Example 3: 3-Week Sprint (Extended)**
```
Name: Sprint 3 - Major Feature Release
Goal: Complete payment gateway and checkout flow
Start: 12/10/2024
End: 12/31/2024
Capacity: 120 points
```

### **Example 4: Sprint with Template**
```
Template: 2-Week Sprint Template (auto-fills dates and capacity)
Name: Sprint 4 - Dashboard
Goal: Build analytics dashboard with charts
Start: (auto-filled from template)
End: (auto-filled from template)
Capacity: (auto-filled from template)
```

---

## ⚠️ Common Mistakes to Avoid

1. **❌ End date before start date**
   - ✅ Fix: End date must be after start date

2. **❌ Too high capacity**
   - ✅ Fix: Base on team's actual velocity (not wishful thinking)

3. **❌ Vague sprint goal**
   - ✅ Fix: Be specific about what will be delivered

4. **❌ Forgetting to assign team**
   - ✅ Fix: Ensure project has a team assigned (in Project Settings)

5. **❌ Creating sprint without stories in backlog**
   - ✅ Fix: Create stories first, then create sprint and add them

---

## 🎯 Quick Reference

| Field | Required | Example | Notes |
|-------|----------|---------|-------|
| **Sprint Name** | ✅ Yes | `Sprint 1 - Foundation` | Descriptive name |
| **Sprint Goal** | ⚠️ Recommended | `Set up core infrastructure` | What to achieve |
| **Start Date** | ✅ Yes | `11/17/2024` | Use date picker |
| **End Date** | ✅ Yes | `12/01/2024` | Must be after start |
| **Capacity** | ✅ Yes | `80` | Story points team can commit |
| **Template** | ❌ No | `2-Week Template` | Optional, auto-fills fields |

---

## 🔧 Troubleshooting

### Issue: "Cannot create sprint - Project not found"
**Solution:** Ensure you're in a project or have selected a project

### Issue: "End date must be after start date"
**Solution:** Check your dates - end date must be later than start date

### Issue: "No team assigned to project"
**Solution:** 
1. Go to Project Settings
2. Assign a team to the project
3. Then create sprint

### Issue: Modal doesn't open
**Solution:** 
1. Refresh the page
2. Check browser console for errors
3. Ensure you're logged in as Admin/Manager

---

## ✅ Success Checklist

After creating a sprint, verify:
- [ ] Sprint appears in sprints list
- [ ] Sprint name is correct
- [ ] Dates are correct
- [ ] Capacity is set
- [ ] Status is "Planned" (default)
- [ ] Can click "Plan Sprint" to add stories
- [ ] Can use "AI Recommendations" feature

---

## 🚀 Next Steps After Creating Sprint

1. **Add Stories to Sprint:**
   - Click "Plan Sprint"
   - Drag stories from backlog
   - OR use AI Recommendations

2. **Start the Sprint:**
   - Click "Start Sprint" button
   - Sprint becomes "Active"

3. **Track Progress:**
   - View burndown chart
   - Monitor velocity
   - Update story statuses

4. **Complete Sprint:**
   - Click "Complete Sprint"
   - Fill retrospective
   - Review velocity

---

## 📸 Visual Guide

Based on the image you shared, here's what each field looks like:

1. **Template Dropdown:** Top field - "Select an option"
2. **Sprint Name:** Text input - "e.g., Sprint 1, Sprint 2"
3. **Sprint Goal:** Large text area - "What is the goal of this sprint?"
4. **Start Date:** Date picker - "mm/dd/yyyy" with calendar icon
5. **End Date:** Date picker - "mm/dd/yyyy" with calendar icon
6. **Story Points:** Number input - Shows "80" (default)
7. **Buttons:** 
   - "Cancel" (left, outlined)
   - "Create Sprint" (right, blue, primary)

---

## 💡 Pro Tips

1. **Use Templates:** Create sprint templates for common sprint types (2-week, 1-week, etc.)

2. **Plan Capacity Realistically:** 
   - Check team's historical velocity
   - Account for holidays/vacations
   - Leave buffer (80% of max capacity)

3. **Clear Goals:** Write specific, measurable sprint goals

4. **Use AI:** After creating sprint, use AI Recommendations to optimize story selection

5. **Regular Sprints:** Keep sprint duration consistent (e.g., always 2 weeks)

---

## 🎉 You're Done!

Once you click "Create Sprint", you'll see:
- ✅ Success toast notification
- ✅ Sprint appears in the list
- ✅ Can immediately start planning

**Now test the AI features:**
1. Click on the sprint
2. Click "Plan Sprint"
3. Click "AI Recommendations" (lightbulb icon)
4. See AI-suggested stories based on your team's capacity and skills!

