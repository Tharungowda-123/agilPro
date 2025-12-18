# Quick Start: Testing Features

## 🚀 Run Automated Tests

### **Test All Features:**
```bash
cd /home/ai/agilPro
./test-backend-features.sh
```

This will test:
- ✅ Story query fix (status='todo')
- ✅ Sprint creation
- ✅ Task assignment AI
- ✅ Sprint optimization AI
- ✅ Dashboard features

---

## 📋 Sprint Creation - Quick Example

### **In Web Application:**

1. **Navigate:** Projects → Select Project → Sprints Tab
2. **Click:** "Create Sprint" button
3. **Fill in:**
   ```
   Sprint Name: Sprint 1 - Foundation
   Sprint Goal: Set up core infrastructure and development environment
   Start Date: 11/18/2024 (use date picker)
   End Date: 12/02/2024 (use date picker)
   Story Points Commitment: 80
   ```
4. **Click:** "Create Sprint"

### **Via API (for testing):**
```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/sprints \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sprint 1 - Foundation",
    "goal": "Set up core infrastructure",
    "startDate": "2024-11-18",
    "endDate": "2024-12-02",
    "capacity": 80
  }'
```

---

## ✅ Test Results Summary

**Last Test Run:** All features working!

- ✅ Story query with 'todo' status: **FIXED**
- ✅ Sprint creation: **WORKING**
- ✅ Task assignment AI: **WORKING** (3 recommendations with real names)
- ✅ Sprint optimization AI: **WORKING** (11 stories, 76/80 points)
- ✅ All dashboard features: **WORKING**

**No dummy data** - All features use real database data!

---

## 📚 Full Guides

- **Sprint Creation:** See `SPRINT_CREATION_GUIDE.md`
- **Manual Testing:** See `MANUAL_TESTING_GUIDE.md`
- **Test Results:** See `TEST_RESULTS_SUMMARY.md`

