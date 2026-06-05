# Sprint 8 Phase 2: Visual User Guide

## 🎨 New Features Visual Overview

---

## 1️⃣ Grade Locking (Principal Feature)

### Location
**ApprovalCenter** → `/approvals`

### User Flow

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Grade Approval Center                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Quarter: [Q1 2026-2027 ▼]        Pending Approvals: 5     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Mathematics                    [Pending Approval]      │ │
│  │ 📚 Grade 7-A  👨‍🏫 Mr. Santos  👥 35 students           │ │
│  │ 📅 Q1 2026-2027                                        │ │
│  │                                                        │ │
│  │ [✅ Approve & Publish]  [❌ Reject for Revision]       │ │
│  │ [🔒 Lock Grades]  [View 35 grades →]                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Lock Modal

```
┌──────────────────────────────────────────────────────┐
│  🔒 Lock Grades                                      │
│  Permanent record protection                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ About to lock:                                 │ │
│  │ Mathematics - Grade 7-A                        │ │
│  │ 35 student grades                              │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ⚠️ Once locked, grades cannot be edited            │
│  ℹ️ Only admins can unlock (emergency)              │
│  ✅ Creates permanent DepEd record                   │
│                                                      │
│                    [Cancel]  [🔒 Lock Grades]       │
└──────────────────────────────────────────────────────┘
```

### After Locking

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Success!                                                │
│  Grades for Mathematics have been locked.                  │
│  They can no longer be edited.                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Mathematics                    [🔒 Locked]            │ │
│  │ 📚 Grade 7-A  👨‍🏫 Mr. Santos  👥 35 students           │ │
│  │                                                        │ │
│  │ Grades are now locked and cannot be edited.           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ Admin Emergency Unlock

### Location
**Admin Panel** → `/admin/unlock-grades` (Admin Only)

### Landing Page

```
┌─────────────────────────────────────────────────────────────┐
│  🔓 Admin Grade Unlock                                      │
│  Emergency unlocking of locked/published grades             │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ Warning: This feature should only be used in           │
│     emergency situations. All unlock actions are            │
│     permanently logged and auditable.                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Quarter: [Q1 2026-2027 ▼]        Locked Sets: 12          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Mathematics                    [🔒 Locked]            │ │
│  │ 📚 Grade 7-A  👨‍🏫 Mr. Santos  👥 35 students           │ │
│  │ 📅 Q1 2026-2027                                        │ │
│  │                                                        │ │
│  │ [🔓 Emergency Unlock]  [View 35 grades →]             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ English                        [🔒 Locked]            │ │
│  │ 📚 Grade 8-B  👨‍🏫 Ms. Cruz  👥 32 students             │ │
│  │ [🔓 Emergency Unlock]  [View 32 grades →]             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Unlock Modal

```
┌──────────────────────────────────────────────────────────┐
│  🔓 Emergency Grade Unlock                               │
│  This action will be permanently logged                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ About to unlock:                                 │   │
│  │ Mathematics - Grade 7-A (locked)                 │   │
│  │ 35 student grades                                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Emergency Unlock Reason (Required):                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │ DepEd requested correction to student            │   │
│  │ LRN #123456's grade due to miscalculation       │   │
│  │ discovered during quarterly audit. Original      │   │
│  │ computation error in PT component.               │   │
│  └──────────────────────────────────────────────────┘   │
│  Minimum 20 characters required. This will be logged.   │
│                                                          │
│  ⚠️ Security & Compliance Notice:                       │
│  • This action bypasses principal approval              │
│  • Action is permanently logged with your admin ID      │
│  • Audit trail available to DepEd inspectors            │
│                                                          │
│                  [Cancel]  [🔓 Emergency Unlock]        │
└──────────────────────────────────────────────────────────┘
```

### After Unlock

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Success!                                                │
│  Successfully unlocked 35 grade(s) for Mathematics.        │
│  Teachers can now edit these grades. This action has       │
│  been logged.                                              │
├─────────────────────────────────────────────────────────────┤
│  Audit Log Entry Created:                                  │
│  • Action: Grade Unlocked                                  │
│  • Actor: Admin (Juan Dela Cruz)                           │
│  • Timestamp: June 5, 2026 14:32:15                        │
│  • Reason: DepEd requested correction...                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ Dynamic Transmutation (Teacher Feature)

### Location
**Grade Input** → `/grades/input`

### Before (Hardcoded)
```javascript
// OLD: Hardcoded in frontend
function transmuteGrade(initialGrade) {
  if (initialGrade >= 100.00) return 100
  if (initialGrade >= 98.40) return 99
  // ... 25 more lines ...
  return 60
}
```

### After (API-Driven)
```javascript
// NEW: Fetched from backend API
useEffect(() => {
  async function loadTransmutationTable() {
    const { data } = await gradeApi.getTransmutationTable()
    setTransmutationTable(data.table)
  }
  loadTransmutationTable()
}, [])

function transmuteGrade(initialGrade) {
  // Use API table (single source of truth)
  for (const entry of transmutationTable) {
    if (initialGrade >= entry.initial_grade) {
      return entry.transmuted_grade
    }
  }
  return 60 // fallback
}
```

### Visual Impact

```
┌─────────────────────────────────────────────────────────────┐
│  📝 Grade Input                                             │
├─────────────────────────────────────────────────────────────┤
│  Grade 7-A - Mathematics - Q1 2026-2027 • 35 students      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  # │ Student          │ WW (30%) │ PT (50%) │ QA (20%) │ T │
│  ──┼──────────────────┼──────────┼──────────┼──────────┼───│
│  1 │ Juan Dela Cruz   │  [85.5]  │  [88.0]  │  [90.0]  │87 │
│    │ LRN: 123456789   │          │          │          │   │
│  ──┼──────────────────┼──────────┼──────────┼──────────┼───│
│  2 │ Maria Santos     │  [92.0]  │  [95.5]  │  [89.0]  │93 │
│    │ LRN: 987654321   │          │          │          │   │
│  ──┴──────────────────┴──────────┴──────────┴──────────┴───│
│                                                             │
│  Initial: (85.5×0.3) + (88.0×0.5) + (90.0×0.2) = 87.65     │
│  Transmuted: 87 (from DepEd table via API ✅)               │
│                                                             │
│  35 students • 35 complete         [Save Draft]  [Submit]  │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Single source of truth (backend)
- ✅ Easy to update for policy changes
- ✅ Consistent across all features
- ✅ No frontend code changes needed for updates

---

## 4️⃣ Real-Time Notifications

### Notification Triggers & Recipients

#### A. Assignment Published
```
Teacher Action: Publishes assignment
         ↓
System: Creates notifications
         ↓
Students: Receive notification
         ↓
┌────────────────────────────────┐
│ 🔔 New assignment:             │
│ Midterm Exam Review            │
│                                │
│ Click to view details          │
└────────────────────────────────┘
```

#### B. Submission Received
```
Student Action: Submits assignment
         ↓
System: Creates notification
         ↓
Teacher: Receives notification
         ↓
┌────────────────────────────────┐
│ 📝 Juan Dela Cruz submitted   │
│ Midterm Exam Review            │
│                                │
│ Click to grade                 │
└────────────────────────────────┘
```

#### C. Submission Graded
```
Teacher Action: Grades submission
         ↓
System: Creates notification
         ↓
Student: Receives notification
         ↓
┌────────────────────────────────┐
│ ✅ Your submission for         │
│ Midterm Exam Review            │
│ has been graded                │
│                                │
│ Score: 95/100                  │
└────────────────────────────────┘
```

#### D. Announcement Published
```
Admin/Teacher: Publishes announcement
         ↓
System: Determines audience
  • School-wide: All users
  • Grade-level: Students in grade
  • Classroom: Students in class
         ↓
Users: Receive notifications
         ↓
┌────────────────────────────────┐
│ 📢 New announcement:           │
│ Foundation Day Celebration     │
│                                │
│ Priority: Important            │
│ Click to view                  │
└────────────────────────────────┘
```

### Notification Center

```
┌─────────────────────────────────────────────────────────────┐
│  🔔 Notifications                               Mark all read│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Today                                                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🔵 📝 Juan Dela Cruz submitted Midterm Exam Review    │ │
│  │      2 minutes ago                      [Mark as read] │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🔵 ✅ Your submission for Quiz 5 has been graded      │ │
│  │      15 minutes ago                     [Mark as read] │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Yesterday                                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ⚪ 📢 New announcement: Foundation Day Celebration    │ │
│  │      1 day ago                                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Grade Workflow Visualization

### State Diagram

```
┌─────────┐
│  DRAFT  │ ← Teacher enters grades
└────┬────┘
     │ Auto-calculate
     ↓
┌──────────┐
│ COMPUTED │ ← Initial grade calculated
└────┬─────┘
     │ Teacher clicks "Submit for Approval"
     ↓
┌──────────────────┐
│ PENDING_APPROVAL │ ← Principal reviews in Approval Center
└────┬─────────────┘
     │
     ├─→ [Approve] ─────────────────┐
     │                              │
     └─→ [Reject] → COMPUTED        │
                    (Re-edit)        ↓
                                ┌───────────┐
                                │ PUBLISHED │ ← Students can view
                                └─────┬─────┘
                                      │ Principal clicks "Lock Grades"
                                      ↓
                                ┌────────┐
                                │ LOCKED │ ← Permanent record
                                └────┬───┘
                                     │
                        Admin Emergency Unlock (logged)
                                     │
                                     ↓
                                ┌──────────┐
                                │ COMPUTED │ ← Re-editable
                                └──────────┘
```

### Permissions Matrix

```
┌──────────────┬───────┬─────────┬───────────┬───────┐
│ Action       │ Teach │ Princip │ Admin     │ Stud  │
├──────────────┼───────┼─────────┼───────────┼───────┤
│ Input grades │  ✅   │   ❌    │    ✅     │  ❌   │
│ Submit       │  ✅   │   ❌    │    ✅     │  ❌   │
│ Approve      │  ❌   │   ✅    │    ✅     │  ❌   │
│ Reject       │  ❌   │   ✅    │    ✅     │  ❌   │
│ Lock         │  ❌   │   ✅    │    ✅     │  ❌   │
│ Unlock       │  ❌   │   ❌    │    ✅     │  ❌   │
│ View locked  │  ✅   │   ✅    │    ✅     │  ✅   │
└──────────────┴───────┴─────────┴───────────┴───────┘
```

---

## 📱 Mobile Responsive Views

### ApprovalCenter (Mobile)

```
┌─────────────────────────┐
│  Grade Approval Center  │
│  [☰ Menu]              │
├─────────────────────────┤
│ Quarter: [Q1 2026 ▼]   │
│                         │
│ Pending: 5              │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Mathematics         │ │
│ │ [Pending Approval]  │ │
│ │                     │ │
│ │ 📚 Grade 7-A        │ │
│ │ 👥 35 students      │ │
│ │                     │ │
│ │ [✅ Approve]        │ │
│ │ [❌ Reject]         │ │
│ │ [🔒 Lock]           │ │
│ │ [View grades →]     │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ English             │ │
│ │ [Pending Approval]  │ │
│ │ ...                 │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

---

## 🎓 User Journey Examples

### Example 1: Teacher Complete Flow

```
Day 1: Tuesday Morning
  → Teacher marks attendance
  → Teacher enters grades for 35 students
  → Clicks "Save Draft" (status: DRAFT)
  → Initial grades auto-calculated (status: COMPUTED)
  → Reviews all grades
  → Clicks "Submit for Approval"
  → ✅ Success: "Grades submitted for principal review"

Day 1: Tuesday Afternoon
  → Principal receives notification
  → Opens Approval Center
  → Reviews grades for accuracy
  → Expands to see all 35 student details
  → Clicks "Approve & Publish"
  → ✅ Success: "35 grades published"
  → Students receive notifications

Day 2: Wednesday
  → Students log in
  → See notification: "Grades published"
  → View their Mathematics grade
  → Parents can also view via parent portal

Day 3: Thursday
  → Principal confirms all grades stable
  → Clicks "Lock Grades"
  → Modal warns about permanence
  → Confirms lock action
  → ✅ Success: "Grades locked"
  → Now permanent DepEd record
```

### Example 2: Admin Emergency Unlock

```
Day 10: Two Weeks Later
  → Teacher discovers calculation error
  → Teacher cannot edit (grades locked)
  → Teacher contacts admin
  → Admin logs into system

Admin Action:
  → Navigates to /admin/unlock-grades
  → Sees security warning
  → Selects Q1 2026-2027
  → Finds Mathematics - Grade 7-A
  → Clicks "Emergency Unlock"
  → Modal requires detailed reason
  → Types: "DepEd requested correction to student 
           LRN #123456's grade due to PT score 
           miscalculation. Original score was 85 
           but should be 95 per signed correction 
           form from DepEd Regional Office."
  → Clicks "Emergency Unlock"
  → Confirms in alert dialog
  → ✅ Success: "35 grades unlocked"
  → Audit log permanently records:
     • Admin ID
     • Timestamp
     • Detailed reason
     • All affected students

Teacher Re-correction:
  → Teacher notified grades unlocked
  → Opens Grade Input
  → Corrects student's PT score
  → Saves changes
  → Submits for approval again
  → Principal re-reviews and re-approves
  → Grades re-locked
```

---

## 🎨 Color Coding & Visual Indicators

### Status Badges

```
┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐
│ 📝 Draft        │  │ 🔄 Computed      │  │ ⏳ Pending   │
│ (Gray)          │  │ (Blue)           │  │ (Amber)      │
└─────────────────┘  └──────────────────┘  └──────────────┘

┌─────────────────┐  ┌──────────────────┐
│ ✅ Published    │  │ 🔒 Locked        │
│ (Green)         │  │ (Purple)         │
└─────────────────┘  └──────────────────┘
```

### Grade Color Coding

```
Transmuted Grade ≥ 75:
  ┌──────────────┐
  │   85         │  Green badge = Passing
  │ (Green bg)   │
  └──────────────┘

Transmuted Grade < 75:
  ┌──────────────┐
  │   70         │  Red badge = Needs Improvement
  │ (Red bg)     │
  └──────────────┘
```

---

## 🔍 Accessibility Features

### Keyboard Navigation
- **Tab:** Navigate between form fields
- **Enter:** Submit forms / Confirm actions
- **Escape:** Close modals
- **Arrow Keys:** Navigate dropdowns

### Screen Reader Support
- All buttons have aria-labels
- Status changes announced
- Error messages read aloud
- Success confirmations audible

### Visual Clarity
- High contrast text (WCAG AA compliant)
- Clear focus indicators
- Large click targets (44x44px minimum)
- Icon + text labels for clarity

---

## 📸 Screenshots Needed (For Actual Deployment)

### Priority Screenshots
1. Approval Center with pending grades
2. Lock modal confirmation dialog
3. Admin unlock page landing view
4. Unlock modal with reason input
5. Grade Input with transmuted values
6. Notification dropdown with new alerts
7. Mobile view of approval center
8. Audit log view showing unlock event

---

## 💡 Tips for Users

### For Principals
- ✅ Review grades thoroughly before approving
- ✅ Lock grades only when you're certain they're final
- ✅ Check notification bell regularly for new submissions
- ✅ Use reject feature with detailed feedback

### For Teachers
- ✅ Save drafts frequently while entering grades
- ✅ Double-check calculations before submitting
- ✅ Review transmuted values carefully
- ✅ Cannot edit after submission (until approved/rejected)

### For Admins
- ⚠️ Use unlock ONLY for emergencies
- ⚠️ Always provide detailed 20+ character reasons
- ⚠️ Remember: all unlocks are permanently logged
- ⚠️ Coordinate with teachers before unlocking

### For Students
- ✅ Check notifications for grade updates
- ✅ View grades once published
- ✅ Contact teacher for grade inquiries
- ✅ Locked grades are official final grades

---

**Last Updated:** June 5, 2026  
**Version:** Sprint 8 Phase 2  
**Next:** Phase 3 - Testing & Optimization
