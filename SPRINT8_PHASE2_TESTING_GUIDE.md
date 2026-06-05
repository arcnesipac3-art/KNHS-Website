# Sprint 8 Phase 2: Testing Guide

**Purpose:** Comprehensive testing checklist for Phase 2 features  
**Target Audience:** QA Testers, Developers, Product Managers  
**Est. Testing Time:** 3-4 hours for complete suite

---

## 🎯 Testing Objectives

Phase 2 introduced 4 major features:
1. **Transmutation Table API** - Dynamic grade calculation
2. **Complete Notifications** - 4 notification types
3. **Grade Locking UI** - Principal-controlled permanent records
4. **Admin Unlock Interface** - Emergency grade corrections

Each feature requires functional, integration, and security testing.

---

## 🧪 Test Environment Setup

### Prerequisites
```bash
# Backend running on port 8000
python manage.py runserver

# Frontend running on port 5173
npm run dev

# Database with seed data
python manage.py seed_academic_data
python manage.py seed_admin
```

### Test Accounts Needed
- **Admin:** admin@knhs.edu.ph / password123
- **Principal:** principal@knhs.edu.ph / password123
- **Teacher:** teacher@knhs.edu.ph / password123
- **Student:** student@knhs.edu.ph / password123

---

## ✅ Test Suite 1: Transmutation Table API

### 1.1 Backend API Testing

#### Test Case: API Endpoint Returns Data
```bash
# Execute
curl http://localhost:8000/api/v1/grades/transmutation_table/

# Expected Response (200 OK)
{
  "table": [
    {"initial_grade": 100.0, "transmuted_grade": 100},
    {"initial_grade": 98.4, "transmuted_grade": 99},
    ...26 more entries...
  ],
  "description": "DepEd Transmutation Table (Initial Grade → Transmuted Grade)",
  "passing_grade": 75,
  "grade_range": {"min": 60, "max": 100}
}
```

**✅ Pass Criteria:**
- Status code is 200
- Response contains 28 table entries
- All entries have initial_grade and transmuted_grade
- passing_grade is 75
- grade_range.min is 60, max is 100

**❌ Fail Scenarios:**
- 404 or 500 error
- Empty table array
- Missing fields
- Incorrect values

---

#### Test Case: No Authentication Required
```bash
# Execute without auth token
curl http://localhost:8000/api/v1/grades/transmutation_table/

# Expected
Status: 200 OK (public endpoint)
```

**✅ Pass:** Anonymous users can access  
**❌ Fail:** 401 Unauthorized

---

### 1.2 Frontend Integration Testing

#### Test Case: GradeInput Fetches Table on Mount
1. **Setup:** Clear browser cache, logout
2. **Login as:** Teacher
3. **Navigate to:** `/grades/input`
4. **Open DevTools:** Network tab
5. **Action:** Page loads
6. **Check Network:**
   - Request to `/api/v1/grades/transmutation_table/`
   - Status 200
   - Response contains table data

**✅ Pass:** API called once on mount  
**❌ Fail:** No API call, multiple calls, or error

---

#### Test Case: Dynamic Transmutation Calculation
1. **Navigate to:** `/grades/input`
2. **Select:** Classroom, Quarter, Subject
3. **Enter for first student:**
   - WW: 85.5
   - PT: 88.0
   - QA: 90.0
4. **Check Transmuted Grade:**
   - Initial: (85.5 × 0.3) + (88 × 0.5) + (90 × 0.2) = 87.65
   - Transmuted: Should be **87**

**✅ Pass:** Transmuted grade displays as 87  
**❌ Fail:** Wrong grade, no calculation, error

---

#### Test Case: Fallback When API Fails
1. **Setup:** Stop backend server
2. **Navigate to:** `/grades/input` (frontend still running)
3. **Enter grades:** WW=100, PT=100, QA=100
4. **Check:** Transmuted grade should still calculate (using fallback)

**✅ Pass:** Grades calculate using hardcoded fallback  
**❌ Fail:** Error, no calculation, page crash

---

## ✅ Test Suite 2: Notification System

### 2.1 Assignment Published Notification

#### Test Case: Teacher Publishes → Students Notified
1. **Login as:** Teacher
2. **Create assignment:**
   - Title: "Test Assignment"
   - Class: Grade 7-A
   - Due date: Tomorrow
   - Status: Draft
3. **Publish assignment:** Click publish button
4. **Logout, login as:** Student (enrolled in Grade 7-A)
5. **Check notifications:** Bell icon
6. **Expected notification:**
   - Type: "assignment"
   - Title: "New assignment: Test Assignment"
   - Link: `/assignments/{id}`

**✅ Pass:** Student sees notification with correct details  
**❌ Fail:** No notification, wrong content, broken link

---

#### Test Case: Students NOT in Class Don't Receive
1. **Setup:** Create assignment for Grade 7-A
2. **Publish assignment**
3. **Login as:** Student in Grade 8-B
4. **Check notifications**

**✅ Pass:** No notification for Grade 8-B student  
**❌ Fail:** Receives notification incorrectly

---

### 2.2 Submission Received Notification

#### Test Case: Student Submits → Teacher Notified
1. **Login as:** Student
2. **Navigate to:** Published assignment
3. **Submit assignment:** Upload file or enter text
4. **Click:** Submit button
5. **Logout, login as:** Teacher of that class
6. **Check notifications**
7. **Expected:**
   - Type: "assignment"
   - Title: "{Student Name} submitted {Assignment Title}"
   - Link: `/submissions/{id}`

**✅ Pass:** Teacher receives notification  
**❌ Fail:** No notification, wrong teacher, broken link

---

### 2.3 Submission Graded Notification

#### Test Case: Teacher Grades → Student Notified
1. **Login as:** Teacher
2. **Navigate to:** Submission to grade
3. **Enter:**
   - Score: 95
   - Feedback: "Excellent work!"
4. **Click:** Submit Grade
5. **Logout, login as:** Student who submitted
6. **Check notifications**
7. **Expected:**
   - Type: "assignment"
   - Title: "Your submission for {Assignment} has been graded"
   - Link: `/assignments/{id}`

**✅ Pass:** Student sees grade notification  
**❌ Fail:** No notification, wrong student notified

---

### 2.4 Announcement Published Notification

#### Test Case: School-Wide Announcement
1. **Login as:** Admin
2. **Create announcement:**
   - Title: "Foundation Day"
   - Target: School-wide
   - Priority: Important
3. **Publish announcement**
4. **Test with 4 accounts:**
   - Admin: Should receive
   - Principal: Should receive
   - Teacher: Should receive
   - Student: Should receive

**✅ Pass:** All 4 roles receive notification  
**❌ Fail:** Any role doesn't receive

---

#### Test Case: Grade-Level Targeted Announcement
1. **Login as:** Admin
2. **Create announcement:**
   - Title: "Grade 7 Field Trip"
   - Target: Grade Level → Grade 7
3. **Publish**
4. **Test:**
   - Grade 7 student: Should receive ✅
   - Grade 8 student: Should NOT receive ✅

**✅ Pass:** Only targeted grade receives  
**❌ Fail:** Wrong audience or no notification

---

#### Test Case: Classroom-Specific Announcement
1. **Login as:** Teacher (adviser of Grade 7-A)
2. **Create announcement:**
   - Title: "Class Reminders"
   - Target: Classroom → Grade 7-A
3. **Publish**
4. **Test:**
   - Student in 7-A: Receives ✅
   - Student in 7-B: Does NOT receive ✅
   - Teacher of 7-A: Receives ✅

**✅ Pass:** Only classroom members receive  
**❌ Fail:** Wrong targeting

---

## ✅ Test Suite 3: Grade Locking

### 3.1 Principal Lock Flow

#### Test Case: Lock Button Appears After Approval
1. **Setup:** Have grades in "pending_approval" status
2. **Login as:** Principal
3. **Navigate to:** `/approvals`
4. **Find:** Pending grade set
5. **Click:** "Approve & Publish"
6. **Check UI:** After approval
7. **Expected:** "Lock Grades" button should appear

**✅ Pass:** Lock button visible after approval  
**❌ Fail:** No lock button, or error

---

#### Test Case: Lock Modal Shows Warnings
1. **Click:** "🔒 Lock Grades" button
2. **Check modal:**
   - Title: "Lock Grades"
   - Shows subject, classroom, student count
   - Warning: "Once locked, grades cannot be edited"
   - Info: "Only admins can unlock"
   - Compliance note: "Creates permanent DepEd record"

**✅ Pass:** All warnings present and clear  
**❌ Fail:** Missing warnings, unclear messaging

---

#### Test Case: Lock Action Works
1. **In lock modal:** Click "🔒 Lock Grades"
2. **Wait for API call**
3. **Expected:**
   - Success message appears
   - Grade status changes to "locked"
   - Lock button disappears
   - Locked badge (🔒) shows

**✅ Pass:** Grades locked successfully  
**❌ Fail:** Error, status doesn't change, UI not updated

---

#### Test Case: Teachers Cannot Edit Locked Grades
1. **Setup:** Locked grades exist
2. **Login as:** Teacher
3. **Navigate to:** `/grades/input`
4. **Select:** Locked grade set
5. **Try to:** Edit any student's WW/PT/QA
6. **Expected:** Inputs are disabled

**✅ Pass:** All inputs disabled for locked grades  
**❌ Fail:** Can still edit, or page errors

---

#### Test Case: Students Can View Locked Grades
1. **Login as:** Student
2. **Navigate to:** `/grades`
3. **Check:** Locked grades display
4. **Expected:** Status badge shows "🔒 Locked"

**✅ Pass:** Student sees locked grades with badge  
**❌ Fail:** Can't view, or wrong status

---

### 3.2 Backend Lock API Testing

#### Test Case: Lock Endpoint Success
```bash
# Login and get token as principal
TOKEN="<principal_token>"

# Lock grades
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_subject_id": "<uuid>",
    "quarter_id": "<uuid>"
  }' \
  http://localhost:8000/api/v1/grades/lock/

# Expected (200 OK)
{
  "message": "Locked 35 grades successfully",
  "count": 35
}
```

**✅ Pass:** Status 200, grades locked in database  
**❌ Fail:** Error, grades not locked

---

#### Test Case: Lock Permission - Teacher Denied
```bash
# Login as teacher, get token
TOKEN="<teacher_token>"

# Try to lock grades
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -d '{...}' \
  http://localhost:8000/api/v1/grades/lock/

# Expected (403 Forbidden)
{
  "error": "Only principals and admins can lock grades"
}
```

**✅ Pass:** 403 error for teacher  
**❌ Fail:** Teacher can lock grades

---

## ✅ Test Suite 4: Admin Emergency Unlock

### 4.1 Access Control Testing

#### Test Case: Admin Can Access Unlock Page
1. **Login as:** Admin
2. **Navigate to:** `/admin/unlock-grades`
3. **Expected:** Page loads with security warning banner

**✅ Pass:** Page accessible to admin  
**❌ Fail:** 403 error or redirect

---

#### Test Case: Non-Admin Redirected
1. **Login as:** Principal
2. **Navigate to:** `/admin/unlock-grades`
3. **Expected:** Redirect to `/dashboard`

**✅ Pass:** Principal redirected  
**❌ Fail:** Can access page

1. **Login as:** Teacher
2. **Try:** `/admin/unlock-grades`
3. **Expected:** Redirect

**✅ Pass:** Teacher redirected  
**❌ Fail:** Can access

1. **Login as:** Student
2. **Try:** `/admin/unlock-grades`
3. **Expected:** Redirect

**✅ Pass:** Student redirected  
**❌ Fail:** Can access

---

### 4.2 Unlock Flow Testing

#### Test Case: Locked Grades Display
1. **Setup:** Have locked grades
2. **Login as:** Admin
3. **Navigate to:** `/admin/unlock-grades`
4. **Select quarter**
5. **Expected:**
   - List of locked/published grade sets
   - Shows classroom, subject, teacher, count
   - Status badge: 🔒 Locked or Published
   - "🔓 Emergency Unlock" button for each

**✅ Pass:** Locked grades list correctly  
**❌ Fail:** Empty list when locked grades exist

---

#### Test Case: Unlock Modal Validation
1. **Click:** "🔓 Emergency Unlock"
2. **Modal opens**
3. **Try:** Click "Emergency Unlock" without reason
4. **Expected:** Alert: "Please provide detailed reason (at least 20 characters)"

**✅ Pass:** Validation prevents empty reason  
**❌ Fail:** Allows unlock without reason

---

#### Test Case: Reason Too Short
1. **In modal:** Enter "Test" (4 chars)
2. **Try:** Click "Emergency Unlock"
3. **Expected:** Alert about 20 char minimum

**✅ Pass:** Short reason rejected  
**❌ Fail:** Accepts short reason

---

#### Test Case: Valid Unlock
1. **In modal:** Enter detailed 20+ char reason:
   ```
   DepEd requested correction to student LRN #123456's 
   grade due to miscalculation in PT component discovered 
   during quarterly audit.
   ```
2. **Click:** "Emergency Unlock"
3. **Confirm:** In browser alert
4. **Expected:**
   - Success message appears
   - Grades disappear from locked list
   - Backend status changes to "computed"

**✅ Pass:** Grades unlocked successfully  
**❌ Fail:** Error, status doesn't change

---

#### Test Case: Teacher Can Edit After Unlock
1. **After unlock:** Logout admin
2. **Login as:** Teacher
3. **Navigate to:** `/grades/input`
4. **Select:** Previously locked grade set
5. **Try:** Edit student grades
6. **Expected:** Inputs are now enabled

**✅ Pass:** Teacher can edit again  
**❌ Fail:** Inputs still disabled

---

### 4.3 Audit Logging Testing

#### Test Case: Unlock Creates Audit Log
1. **After unlock:** Check database
```bash
python manage.py shell

from apps.grading.models import GradePublishEvent
events = GradePublishEvent.objects.filter(action='unlocked').order_by('-created_at')
latest = events.first()

print(latest.actor)  # Should be admin user
print(latest.reason)  # Should be unlock reason
print(latest.created_at)  # Should be recent timestamp
```

**✅ Pass:** Audit log exists with all details  
**❌ Fail:** No log, or missing data

---

#### Test Case: Audit Log is Permanent
1. **Try:** Delete audit log entry in admin panel
2. **Expected:** No delete option (read-only model)

**✅ Pass:** Cannot delete audit logs  
**❌ Fail:** Can delete

---

### 4.4 Backend Unlock API Testing

#### Test Case: Unlock Permission - Admin Only
```bash
# Try as teacher
TOKEN="<teacher_token>"
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "Testing"}' \
  http://localhost:8000/api/v1/grades/<grade_id>/unlock/

# Expected (403 Forbidden)
{
  "error": "Only principals and admins can unlock grades"
}
```

**✅ Pass:** 403 for teacher  
**❌ Fail:** Teacher can unlock

---

#### Test Case: Unlock Success
```bash
# As admin
TOKEN="<admin_token>"
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "DepEd correction requested due to calculation error in PT component"
  }' \
  http://localhost:8000/api/v1/grades/<locked_grade_id>/unlock/

# Expected (200 OK)
{
  "message": "Grade unlocked successfully"
}
```

**✅ Pass:** 200 OK, grade unlocked  
**❌ Fail:** Error, grade still locked

---

## ✅ Test Suite 5: Integration Testing

### 5.1 Complete Grade Lifecycle
1. **Teacher:** Enter grades (draft)
2. **System:** Calculate transmutation (computed)
3. **Teacher:** Submit for approval (pending_approval)
4. **Principal:** Review and approve (published)
5. **Students:** View grades
6. **Principal:** Lock grades (locked)
7. **Teacher:** Try to edit (should fail)
8. **Admin:** Emergency unlock (computed)
9. **Teacher:** Edit correction (computed)
10. **Teacher:** Resubmit (pending_approval)
11. **Principal:** Re-approve (published)
12. **Principal:** Re-lock (locked)

**✅ Pass:** All 12 steps work correctly  
**❌ Fail:** Any step fails or incorrect state

---

### 5.2 Notification Chain Testing
1. **Teacher:** Publish assignment
   - **Check:** Students receive notification
2. **Student:** Submit assignment
   - **Check:** Teacher receives notification
3. **Teacher:** Grade submission
   - **Check:** Student receives notification
4. **Admin:** Publish announcement
   - **Check:** All users receive notification

**✅ Pass:** All 4 notification types fire  
**❌ Fail:** Any notification missing

---

### 5.3 Multi-User Concurrent Testing
1. **Setup:** 2 browser windows
2. **Window 1:** Login as Principal
3. **Window 2:** Login as Teacher
4. **W1 (Principal):** Approve grades
5. **W2 (Teacher):** Try to edit same grades immediately
6. **Expected:** Teacher sees published status, can't edit

**✅ Pass:** Real-time status prevents conflicts  
**❌ Fail:** Teacher can still edit

---

## ✅ Test Suite 6: Error Handling

### 6.1 Network Failures

#### Test Case: API Timeout
1. **Setup:** Throttle network to "Slow 3G" in DevTools
2. **Action:** Try to lock grades
3. **Expected:** Loading indicator, then timeout error message

**✅ Pass:** Graceful error handling  
**❌ Fail:** Page crash or infinite loading

---

### 6.2 Invalid Data

#### Test Case: Lock Non-Existent Grade Set
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "class_subject_id": "00000000-0000-0000-0000-000000000000",
    "quarter_id": "00000000-0000-0000-0000-000000000000"
  }' \
  http://localhost:8000/api/v1/grades/lock/

# Expected (404 Not Found)
{
  "error": "No published grades found to lock"
}
```

**✅ Pass:** 404 with clear message  
**❌ Fail:** 500 error or generic message

---

## 📊 Test Results Template

```markdown
## Sprint 8 Phase 2 Test Results

**Date:** _______________
**Tester:** _______________
**Environment:** Development / Staging / Production
**Browser:** Chrome / Firefox / Safari / Edge

### Test Suite 1: Transmutation API
- [ ] 1.1 API Returns Data
- [ ] 1.2 No Auth Required
- [ ] 1.3 Frontend Fetches on Mount
- [ ] 1.4 Dynamic Calculation Works
- [ ] 1.5 Fallback When API Fails

### Test Suite 2: Notifications
- [ ] 2.1 Assignment Published → Students
- [ ] 2.2 Students NOT in Class Don't Receive
- [ ] 2.3 Submission Received → Teacher
- [ ] 2.4 Submission Graded → Student
- [ ] 2.5 Announcement School-Wide
- [ ] 2.6 Announcement Grade-Level
- [ ] 2.7 Announcement Classroom

### Test Suite 3: Grade Locking
- [ ] 3.1 Lock Button After Approval
- [ ] 3.2 Lock Modal Warnings
- [ ] 3.3 Lock Action Works
- [ ] 3.4 Teachers Can't Edit Locked
- [ ] 3.5 Students View Locked
- [ ] 3.6 API Lock Success
- [ ] 3.7 Teacher Lock Denied

### Test Suite 4: Admin Unlock
- [ ] 4.1 Admin Access OK
- [ ] 4.2 Principal Redirected
- [ ] 4.3 Teacher Redirected
- [ ] 4.4 Student Redirected
- [ ] 4.5 Locked Grades Display
- [ ] 4.6 Modal Validation (empty)
- [ ] 4.7 Modal Validation (too short)
- [ ] 4.8 Valid Unlock Works
- [ ] 4.9 Teacher Edit After Unlock
- [ ] 4.10 Audit Log Created
- [ ] 4.11 API Teacher Unlock Denied

### Test Suite 5: Integration
- [ ] 5.1 Complete Lifecycle (12 steps)
- [ ] 5.2 Notification Chain (4 types)
- [ ] 5.3 Multi-User Concurrent

### Test Suite 6: Error Handling
- [ ] 6.1 Network Timeout
- [ ] 6.2 Invalid Data

### Summary
**Total Tests:** 43
**Passed:** ___
**Failed:** ___
**Blocked:** ___
**Pass Rate:** ___%

### Critical Issues Found
1. _______________
2. _______________
3. _______________

### Recommendations
- _______________
- _______________
```

---

## 🚀 Performance Benchmarks

### Expected Response Times
- Transmutation API: < 100ms
- Lock action: < 500ms
- Unlock action: < 500ms
- Notification creation: < 200ms per recipient

### Load Testing Targets
- 100 concurrent users viewing grades
- 50 teachers locking grades simultaneously
- 1000 notifications sent in bulk

---

## 📝 Notes for Testers

### Common Issues to Watch For
- **Transmutation:** Off-by-one errors in grade boundaries
- **Notifications:** Duplicate notifications sent
- **Locking:** Race conditions with concurrent approvals
- **Unlocking:** Audit log missing or incomplete
- **UI:** Loading states not showing
- **Mobile:** Modals not responsive

### Browser Compatibility
Test on:
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

### Device Testing
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

---

**Testing Guide Version:** 1.0  
**Last Updated:** June 5, 2026  
**Next Review:** Sprint 8 Phase 3
