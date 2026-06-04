# Sprint 3: Learning Features - In Progress 🚧

**Date:** June 4, 2026  
**Status:** Backend Models & APIs Complete | Frontend Pending

---

## 🎯 Sprint 3 Goals

Build the core learning and communication features:
1. ✅ **Assignments** - Create, submit, grade workflow
2. ✅ **Grades** - WW/PT/QA input with DepEd transmutation
3. ✅ **Attendance** - Daily marking (P/A/L/E)
4. ✅ **Announcements** - School & class communications
5. ✅ **Learning Materials** - File uploads per subject
6. ✅ **Notifications** - In-app notification system

---

## ✅ Backend Implementation Complete

### New Apps Created (4)

1. **`apps.learning`** - Assignments, Submissions, Materials
2. **`apps.grading`** - Grades with DepEd transmutation
3. **`apps.attendance`** - Daily attendance records
4. **`apps.communications`** - Announcements & Notifications

---

## 📊 Database Models (10 New Models)

### Learning Module (3 models)

**Assignment**
- Linked to ClassSubject
- Title, description, due date, max score
- Status: draft, published, closed
- Allow late submission flag
- Attachment URL support
- Computed properties: `is_overdue`, `submission_count`

**Submission**
- Student submission for an assignment
- File URLs (JSON array) + text response
- Status: pending, submitted, late, graded, returned
- Score, feedback, graded_by, graded_at
- Unique constraint: one per student per assignment
- Computed property: `is_late`
- Method: `submit()` - auto-marks as submitted/late

**LearningMaterial**
- Class-subject learning resources
- Types: module, dll, worksheet, reference, video, other
- File URL, size tracking
- Uploaded by teacher

### Grading Module (2 models)

**Grade**
- Per student, per subject, per quarter
- Component scores: WW, PT, QA (0-100)
- Auto-computed: `initial_grade`, `transmuted_grade`
- Status: draft, computed, pending_approval, published, locked
- Computed property: `is_passing` (≥75)
- **DepEd Transmutation** - Automatic via lookup table
- Method: `compute_grade()` - applies weights & transmutation

**GradePublishEvent**
- Audit trail for grade changes
- Actions: computed, submitted, approved, published, unlocked, edited
- Actor, reason, metadata (JSON)
- Immutable audit log

### Attendance Module (1 model)

**AttendanceRecord**
- Daily attendance per student per classroom
- Status: P (Present), A (Absent), L (Late), E (Excused)
- Date, notes, recorded_by
- Unique constraint: one per student per date
- Index on date + status for fast queries

### Communications Module (4 models)

**Announcement**
- School or class announcements
- Author, title, body, priority (normal/important/urgent)
- Audience targeting: school, grade, strand, classroom, role
- Audience metadata (JSON) for flexible targeting
- Published_at, expires_at timestamps
- Computed: `is_published`, `is_expired`

**AnnouncementAttachment**
- File attachments for announcements
- File URL, filename, size

**AnnouncementRead**
- Track who read which announcements
- User, announcement, read_at
- Unique constraint per user per announcement

**Notification**
- In-app notifications
- Types: assignment, grade, announcement, submission, material, general
- User, title, body, link
- is_read flag
- Indexed on user + is_read + created_at

---

## 🔧 DepEd Transmutation Engine

**Implementation:** `apps.grading.models.py`

```python
DEPED_TRANSMUTATION = {
    100.00: 100, 99.99: 99, 98.39: 98, ...
    # Complete table with 40+ threshold mappings
    0.00: 60,  # Minimum grade
}

def transmute_grade(initial_grade):
    """Apply DepEd transmutation table"""
    # Lookup and return transmuted grade (60-100)
```

**Auto-computation on Grade.save():**
1. Check all component scores present (WW, PT, QA)
2. Get weights from ClassSubject (default: 30/50/20)
3. Compute weighted average (initial grade)
4. Apply transmutation table
5. Set transmuted_grade (60-100)
6. Update status to "computed"

---

## 🚀 REST API Endpoints (46 New Endpoints)

### Assignments (8 endpoints)
```
GET/POST   /api/v1/assignments/
GET/PATCH  /api/v1/assignments/{id}/
POST       /api/v1/assignments/{id}/publish/          Publish to students
GET        /api/v1/assignments/{id}/submissions/      View all submissions
```

### Submissions (7 endpoints)
```
GET/POST   /api/v1/submissions/
GET/PATCH  /api/v1/submissions/{id}/
POST       /api/v1/submissions/submit/                Student submits work
POST       /api/v1/submissions/{id}/grade/            Teacher grades
```

### Learning Materials (5 endpoints)
```
GET/POST   /api/v1/learning-materials/
GET/PATCH/DELETE /api/v1/learning-materials/{id}/
```

### Grades (9 endpoints)
```
GET/POST   /api/v1/grades/
GET/PATCH  /api/v1/grades/{id}/
POST       /api/v1/grades/batch_input/                Batch grade entry
POST       /api/v1/grades/publish/                    Publish to students
POST       /api/v1/grades/{id}/unlock/                Admin unlock (audit logged)
```

### Grade Events (2 endpoints)
```
GET        /api/v1/grade-events/                      Audit trail
GET        /api/v1/grade-events/{id}/
```

### Attendance (8 endpoints)
```
GET/POST   /api/v1/attendance/
GET/PATCH  /api/v1/attendance/{id}/
POST       /api/v1/attendance/bulk_mark/              Mark whole class
GET        /api/v1/attendance/summary/                Classroom summary
```

### Announcements (9 endpoints)
```
GET/POST   /api/v1/announcements/
GET/PATCH/DELETE /api/v1/announcements/{id}/
POST       /api/v1/announcements/{id}/publish/        Publish or schedule
POST       /api/v1/announcements/{id}/mark_read/      Mark as read
GET        /api/v1/announcements/unread/              Get unread
```

### Notifications (8 endpoints)
```
GET/POST   /api/v1/notifications/
GET/PATCH  /api/v1/notifications/{id}/
POST       /api/v1/notifications/mark_all_read/       Bulk mark read
POST       /api/v1/notifications/{id}/mark_read/      Mark single read
GET        /api/v1/notifications/unread_count/        Get count
```

**Total Sprint 3 Endpoints:** 56 endpoints
**Total Project Endpoints:** 88 endpoints (32 from Sprint 1-2 + 56 Sprint 3)

---

## 🔐 Permission System Enhancements

### Role-Based Access

**Students:**
- See only published assignments from enrolled classes
- Submit own assignments
- View own published grades
- View own attendance
- View targeted announcements (school/grade/class)
- View own notifications

**Teachers:**
- Create/manage assignments for own classes
- Grade submissions from own classes
- Input grades for own subjects
- Mark attendance for own classes
- Create classroom announcements
- Upload learning materials

**Advisers (Teachers + extra):**
- All teacher permissions
- Mark attendance for advisory class
- View attendance summaries
- Input conduct ratings (future)

**Admins:**
- Full CRUD on all resources
- Unlock published grades (with audit log)
- Create school-wide announcements
- Batch operations
- View all audit logs

**Principal:**
- Read-only on most resources
- Approve grade publications (optional workflow)
- Create official announcements

---

## 🎓 Key Features Implemented

### 1. Assignment Workflow

```
Teacher creates assignment (draft)
  ↓
Teacher publishes → Status: published
  ↓
Students see assignment in enrolled classes
  ↓
Student submits (files/text) → Status: submitted/late
  ↓
Teacher grades submission → Status: graded
  ↓
Student sees score + feedback
```

**Features:**
- Due date validation
- Late submission detection
- File attachments (multiple files)
- Text responses
- Max score configuration
- Auto-count submissions

### 2. DepEd Grading System

```
Teacher inputs component scores:
  WW: 85, PT: 90, QA: 88
    ↓
System gets weights from ClassSubject:
  WW: 30%, PT: 50%, QA: 20%
    ↓
Compute initial grade:
  (85 × 0.30) + (90 × 0.50) + (88 × 0.20) = 88.1
    ↓
Apply DepEd transmutation table:
  88.1 → transmuted to 92
    ↓
Status: computed → pending_approval → published
    ↓
Student sees transmuted grade: 92
```

**Features:**
- Auto-computation on save
- DepEd-compliant transmutation
- Status workflow (draft → published → locked)
- Batch input for whole class
- Publication per quarter
- Admin unlock with audit log
- Passing threshold check (≥75)

### 3. Attendance Management

```
Teacher opens classroom on date: 2024-10-15
  ↓
System loads active roster
  ↓
Teacher marks: P/A/L/E for each student
  ↓
Bulk save attendance records
  ↓
System computes summary:
  - Present count, Absent count
  - Attendance rate per student
  - Quarter rollup for SF9
```

**Features:**
- Bulk marking for efficiency
- Date-based filtering
- Summary reports with rates
- Notes field for reasons
- Unique per student per date

### 4. Communication System

**Announcements:**
- School-wide or targeted (grade/strand/class/role)
- Priority levels (normal/important/urgent)
- Publish now or schedule
- Attachments support
- Read tracking
- Expiration dates

**Notifications:**
- In-app alerts
- Type categorization
- Unread count API
- Bulk mark as read
- Link to relevant pages

---

## 📁 File Structure

```
backend/apps/
├── learning/
│   ├── models.py              (Assignment, Submission, LearningMaterial)
│   ├── serializers.py         (5 serializers)
│   ├── views.py               (3 viewsets)
│   ├── urls.py
│   ├── admin.py
│   └── migrations/0001_initial.py
│
├── grading/
│   ├── models.py              (Grade, GradePublishEvent, DEPED_TRANSMUTATION)
│   ├── serializers.py         (6 serializers)
│   ├── views.py               (2 viewsets)
│   ├── urls.py
│   ├── admin.py
│   └── migrations/0001_initial.py
│
├── attendance/
│   ├── models.py              (AttendanceRecord)
│   ├── serializers.py         (3 serializers)
│   ├── views.py               (1 viewset)
│   ├── urls.py
│   ├── admin.py
│   └── migrations/0001_initial.py
│
└── communications/
    ├── models.py              (Announcement, Notification, etc.)
    ├── serializers.py         (6 serializers)
    ├── views.py               (2 viewsets)
    ├── urls.py
    ├── admin.py
    └── migrations/0001_initial.py
```

---

## 🧪 What's Tested

- ✅ All migrations created and applied
- ✅ Django admin interfaces configured
- ✅ Models saved successfully in database
- ⏳ API endpoints (testing next)
- ⏳ Frontend integration (pending)

---

## 📋 Sprint 3 Progress Checklist

### Backend
- [✓] Learning models (Assignment, Submission, Material)
- [✓] Grading models (Grade, PublishEvent)
- [✓] Attendance model
- [✓] Communications models (Announcement, Notification)
- [✓] DepEd transmutation engine
- [✓] All serializers
- [✓] All viewsets
- [✓] URL routing
- [✓] Django admin interfaces
- [✓] Migrations applied
- [ ] API testing
- [ ] Sample data seeding

### Frontend (Pending)
- [ ] API client functions
- [ ] Assignment submission UI
- [ ] Grade view UI
- [ ] Attendance marking UI
- [ ] Announcement feed
- [ ] Notification dropdown
- [ ] Dashboard widgets

---

## 🔜 Next Steps

1. **Test APIs** - Verify all endpoints work
2. **Create seed command** - Sample assignments, grades, announcements
3. **Build frontend API client** - Similar to `academicApi.js`
4. **Create UI components** - Assignment cards, grade tables, etc.
5. **Build dashboard pages** - Student/Teacher/Admin dashboards
6. **Integration testing** - End-to-end workflows

---

## 📊 Sprint 3 Metrics (So Far)

| Metric | Count |
|--------|-------|
| New Apps | 4 |
| Database Models | 10 |
| API Endpoints | 56 |
| Serializers | 20+ |
| ViewSets | 8 |
| Admin Interfaces | 10 |
| Backend LOC | ~2,500 |
| Migrations | 4 |

---

**Status:** Backend core complete, moving to testing & frontend! 🚀
