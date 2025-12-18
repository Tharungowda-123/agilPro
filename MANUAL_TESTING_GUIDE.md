# Manual Testing Guide: ML Features in Web Application

## Prerequisites

1. **Login as Admin or Manager** (these roles have full access to AI features)
   - Email: `manojmanu938055@gmail.com`
   - Password: `Demo@123`

2. **Ensure ML data is seeded:**
   ```bash
   cd backend
   node src/scripts/seedMLData.js
   ```

3. **Verify ML service is running:**
   ```bash
   curl http://localhost:8000/health
   ```

---

## 🎯 Feature 1: AI Task Assignment

### **Method 1: From Task Detail Modal** (Recommended)

#### Step-by-Step:

1. **Navigate to a Project:**
   - Click **"Projects"** in the sidebar
   - Click on any active project (e.g., "E-Commerce Platform")

2. **Open a Story:**
   - Go to **"Backlog"** tab
   - Click on any story (e.g., "User Authentication System")

3. **View Tasks:**
   - In the story detail, you'll see a list of tasks
   - Click on any **unassigned task** (status: "Todo")

4. **Open Task Detail Modal:**
   - The task detail modal will open
   - Scroll down to find the **"AI Assignment Recommendations"** section

5. **View Recommendations:**
   - You should see:
     - **Top 3 recommended developers** with:
       - Name
       - Confidence score (0-100%)
       - Reasoning (why this developer is recommended)
       - Current workload
       - Skill match score
       - Performance score

6. **Assign Task:**
   - Click **"Assign"** button next to any recommendation
   - Task will be assigned to that developer
   - You'll see a success toast: "Assigned to [Developer Name]"

7. **Provide Feedback (Optional):**
   - Click **👍 (thumbs up)** if recommendation was good
   - Click **👎 (thumbs down)** if recommendation was poor
   - This helps improve future recommendations

#### Expected Result:
- ✅ Shows real developer names (from database)
- ✅ Shows actual skills, workload, and capacity
- ✅ Recommendations are based on skill match and workload
- ✅ Assignment works and updates the task

---

### **Method 2: From Dashboard AI Recommendations**

#### Step-by-Step:

1. **Go to Dashboard:**
   - Click **"Dashboard"** in the sidebar

2. **Open AI Recommendations:**
   - Click **"AI Recommendations"** button in Quick Actions section
   - OR click the lightbulb icon in the top right

3. **View Task Assignments:**
   - In the AI Recommendations panel, look for **"Task Assignment Recommendations"** section
   - You'll see tasks that need assignment with recommendations

4. **Assign Tasks:**
   - Click **"Assign"** on any recommendation
   - Provide feedback using 👍/👎 buttons

#### Expected Result:
- ✅ Shows unassigned tasks from your projects
- ✅ Provides recommendations for each task
- ✅ Can assign directly from the panel

---

## 🚀 Feature 2: Sprint Optimization AI

### **Method 1: From Sprint Planning Page** (Recommended)

#### Step-by-Step:

1. **Navigate to a Project:**
   - Click **"Projects"** in the sidebar
   - Click on any active project

2. **Go to Sprints:**
   - Click **"Sprints"** tab in the project detail page
   - OR navigate to **"Sprints"** from sidebar

3. **Create or Open a Sprint:**
   - **Option A:** Create a new sprint:
     - Click **"Create Sprint"** button
     - Fill in:
       - Name: "Sprint 1"
       - Start Date: Today
       - End Date: 2 weeks from today
       - Capacity: 80 (story points)
     - Click **"Create"**
   
   - **Option B:** Open an existing sprint:
     - Click on any sprint card

4. **Open Sprint Planning:**
   - Click **"Plan Sprint"** or **"Planning"** button
   - You'll see the Sprint Planning page with:
     - Left side: Backlog stories (available to add)
     - Right side: Sprint stories (already in sprint)

5. **Open AI Recommendations:**
   - Click **"AI Recommendations"** button (top right, with lightbulb icon)
   - OR click the **"Sparkles"** icon
   - A sidebar will open on the right: **"AI Sprint Planner"**

6. **View AI Suggestions:**
   - The sidebar shows:
     - **Recommended Stories** - Stories AI suggests adding to sprint
     - **Total Story Points** - Sum of recommended stories
     - **Team Capacity** - Available capacity
     - **Capacity Utilization** - Percentage used
     - **Predicted Completion Probability** - Likelihood of completing sprint
     - **Risk Factors** - Any identified risks

7. **Apply AI Plan:**
   - Click **"Apply AI Plan"** button
   - Recommended stories will be added to the sprint
   - You'll see a success toast: "Sprint plan applied"

8. **Refresh Recommendations (Optional):**
   - Click **"Refresh"** button to get updated recommendations
   - AI will recalculate based on current sprint state

#### Expected Result:
- ✅ Shows stories from your project backlog
- ✅ Recommendations consider:
  - Team capacity
  - Story priority
  - Story complexity
  - Developer skills
- ✅ Stories are added to sprint when you click "Apply"
- ✅ Shows realistic completion probability

---

### **Method 2: From Dashboard AI Recommendations**

#### Step-by-Step:

1. **Go to Dashboard:**
   - Click **"Dashboard"** in the sidebar

2. **Open AI Recommendations:**
   - Click **"AI Recommendations"** button

3. **View Sprint Optimizations:**
   - Look for **"Sprint Optimization Suggestions"** section
   - You'll see sprints with AI suggestions

4. **Accept Suggestions:**
   - Click **"Accept"** to apply the AI plan
   - Stories will be added to the sprint

#### Expected Result:
- ✅ Shows active sprints that could benefit from optimization
- ✅ Provides story suggestions
- ✅ Can apply suggestions directly

---

## 📋 Testing Checklist

### Task Assignment Testing:

- [ ] **Can see AI recommendations in task detail modal**
- [ ] **Recommendations show real developer names** (not "User user1")
- [ ] **Recommendations show actual skills** (JavaScript, Python, etc.)
- [ ] **Recommendations show workload information**
- [ ] **Can assign task from recommendations**
- [ ] **Assignment updates task correctly**
- [ ] **Can provide feedback (thumbs up/down)**
- [ ] **No dummy/fake data shown**

### Sprint Optimization Testing:

- [ ] **Can open AI Sprint Planner sidebar**
- [ ] **Shows recommended stories from backlog**
- [ ] **Shows team capacity and utilization**
- [ ] **Shows completion probability**
- [ ] **Shows risk factors**
- [ ] **Can apply AI plan**
- [ ] **Stories are added to sprint correctly**
- [ ] **Can refresh recommendations**
- [ ] **No dummy/fake data shown**

---

## 🐛 Troubleshooting

### Issue: "No recommendations available"

**Possible Causes:**
1. **No team assigned to project:**
   - Solution: Go to Project Settings → Assign a team

2. **No developers in team:**
   - Solution: Go to Teams → Add developers to team

3. **No tasks/stories created:**
   - Solution: Create tasks/stories first

4. **ML service not running:**
   - Solution: Start ML service: `cd ml-service && uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

### Issue: "Could not resolve team members"

**Cause:** Users don't have capacity/availability set

**Solution:**
```bash
cd backend
node src/scripts/seedMLData.js
```

### Issue: Recommendations show "User user1" instead of real names

**Cause:** Using fake user IDs or users not in database

**Solution:**
- Ensure you're logged in as a real user
- Ensure project has a team with real developers
- Run seeding script to add ML data to users

---

## 🎯 Quick Test Scenarios

### Scenario 1: Assign Task to Best Developer

1. Create a task: "Implement REST API endpoint"
2. Set priority: High
3. Set estimated hours: 8
4. Open task detail
5. Check AI recommendations
6. Assign to top recommendation
7. Verify task is assigned correctly

### Scenario 2: Optimize Sprint with AI

1. Create a sprint with capacity: 80 points
2. Ensure backlog has 10+ stories
3. Open Sprint Planning
4. Click "AI Recommendations"
5. Review suggested stories
6. Click "Apply AI Plan"
7. Verify stories are added to sprint
8. Check capacity utilization

### Scenario 3: Test with Different Priorities

1. Create tasks with different priorities (High, Medium, Low)
2. Check if AI recommendations prioritize high-priority tasks
3. Verify skill matching works correctly

---

## 📸 What to Look For

### Good Signs ✅:
- Real developer names (Alice Johnson, Bob Smith, etc.)
- Actual skills listed (JavaScript, Python, React, etc.)
- Realistic workload percentages
- Meaningful reasoning text
- High confidence scores (70%+)
- Stories match team capacity

### Bad Signs ❌:
- "User user1" or generic names
- Empty skills arrays
- All recommendations have same confidence
- No reasoning provided
- Dummy/fake data

---

## 🔍 Verification Steps

After testing, verify in database:

```bash
# Check users have ML data
mongo
use agil
db.users.find({ role: "developer" }).limit(1).pretty()

# Should show:
# - skills: ["JavaScript", "React", ...]
# - capacity: 40 (or availability: 40)
# - currentWorkload: <number>
# - velocity: <number>
```

---

## 📝 Notes

- **Admin/Manager roles** have full access to AI features
- **Developer role** can view recommendations but may have limited access
- **Viewer role** has read-only access
- ML service must be running for features to work
- Real database data is required (no dummy data)

---

## 🎉 Success Criteria

You've successfully tested if:
1. ✅ Recommendations show real developer names
2. ✅ Recommendations are based on actual skills and workload
3. ✅ Task assignment works correctly
4. ✅ Sprint optimization suggests relevant stories
5. ✅ No dummy/fake data is displayed
6. ✅ All features work end-to-end

