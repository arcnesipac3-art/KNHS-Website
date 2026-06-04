# Sprint 2: Visual Summary

A visual guide to what was built in Sprint 2.

---

## 🎯 Sprint 2 at a Glance

```
┌───────────────────────────────────────────────────────────────────┐
│                    SPRINT 2: ACADEMIC STRUCTURE                    │
│                                                                     │
│  From: Empty academic system                                       │
│  To:   Full classroom management with join codes                   │
│                                                                     │
│  ✅ 6 Database Models                                              │
│  ✅ 23 REST API Endpoints                                          │
│  ✅ Join Code System                                               │
│  ✅ Role-Based Permissions                                         │
│  ✅ DepEd Grade Components                                         │
│  ✅ Sample Data Seeder                                             │
│  ✅ Frontend API Client                                            │
│  ✅ Comprehensive Documentation                                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Models Created

```
┌─────────────────┐
│  AcademicYear   │  "SY 2024-2025"
│  =============== │
│  • label        │
│  • start_date   │
│  • end_date     │
│  • is_current   │
└────────┬────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│    Quarter      │    │   Classroom     │  "Grade 7 - Einstein"
│  =============== │    │  =============== │
│  • number (1-4) │    │  • name          │
│  • name         │    │  • grade_level   │
│  • start_date   │    │  • section       │
│  • end_date     │    │  • strand        │
│  • is_active    │    │  • adviser       │
└─────────────────┘    │  • join_code ⭐  │
                       │  • capacity      │
                       └────────┬─────────┘
                                │
                  ┌─────────────┼─────────────┐
                  │                           │
                  ▼                           ▼
         ┌─────────────────┐         ┌──────────────────┐
         │ ClassSubject    │         │ClassEnrollment   │
         │  =============== │         │ ================ │
         │  • classroom    │         │  • classroom     │
         │  • subject ───┐ │         │  • student       │
         │  • teacher    │ │         │  • status        │
         │  • ww_weight  │ │         │  • enrolled_at   │
         │  • pt_weight  │ │         └──────────────────┘
         │  • qa_weight  │ │
         └───────────────┘ │
                           │
                           ▼
                  ┌─────────────────┐
                  │    Subject      │  "Mathematics 7"
                  │  =============== │
                  │  • name          │
                  │  • code          │
                  │  • grade_level   │
                  │  • strand        │
                  │  • is_active     │
                  └─────────────────┘
```

---

## 🔄 Student Join Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                         BEFORE SPRINT 2                             │
│                                                                      │
│  No way for students to enroll in classes                           │
│  No join code system                                                │
│  No classroom management                                            │
└────────────────────────────────────────────────────────────────────┘

                                 ↓ ↓ ↓

┌────────────────────────────────────────────────────────────────────┐
│                         AFTER SPRINT 2                              │
│                                                                      │
│  1. Admin/Teacher creates classroom                                 │
│      → System generates join code: "GACSM3"                         │
│                                                                      │
│  2. Teacher shares code with students                               │
│      → "Join my class using code: GACSM3"                           │
│                                                                      │
│  3. Student enters code                                             │
│      → POST /api/v1/classrooms/join/                                │
│                                                                      │
│  4. System validates:                                               │
│      ✓ Code exists and active                                       │
│      ✓ Class not full (capacity check)                              │
│      ✓ Grade level matches                                          │
│      ✓ Not already enrolled                                         │
│                                                                      │
│  5. Enrollment created!                                             │
│      → Student sees class in "My Classes"                           │
│      → Teacher sees student in roster                               │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🎫 Join Code System

```
┌──────────────────────────────────────────────────────────────────┐
│                      Join Code Lifecycle                          │
└──────────────────────────────────────────────────────────────────┘

    Classroom Created
           │
           ├─► Auto-generated code
           │    Format: 6 chars (A-Z, 0-9)
           │    Example: "GACSM3", "Q5W71C"
           │    Stored in: classroom.join_code
           │
           ▼
    Teacher views code
           │
           ├─► Django Admin panel
           │    OR
           │   GET /api/v1/classrooms/{id}/
           │    (only if teacher/adviser/admin)
           │
           ▼
    Teacher shares code
           │
           ├─► Verbally in class
           │    OR
           │   Written on board
           │    OR
           │   Posted in group chat
           │
           ▼
    Student enters code
           │
           ├─► POST /api/v1/classrooms/join/
           │   {"join_code": "GACSM3"}
           │
           ▼
    Enrollment created ✅
    
    
    Optional: Code Regeneration
           │
           ├─► If compromised or needs refresh
           │   POST /api/v1/classrooms/{id}/regenerate_code/
           │
           ▼
    New code generated
    Old code invalidated
```

---

## 👥 Role-Based Access

```
┌────────────────────────────────────────────────────────────────┐
│                         STUDENT VIEW                            │
├────────────────────────────────────────────────────────────────┤
│  GET /api/v1/classrooms/                                        │
│  → Returns: Only enrolled classes                               │
│  → Join code: HIDDEN                                            │
│                                                                  │
│  [                                                               │
│    {                                                             │
│      "name": "Einstein",                                         │
│      "adviser_name": "Juan Dela Cruz",                           │
│      "enrollment_count": 35,                                     │
│      // NO join_code field                                      │
│    }                                                             │
│  ]                                                               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                         TEACHER VIEW                            │
├────────────────────────────────────────────────────────────────┤
│  GET /api/v1/classrooms/                                        │
│  → Returns: Teaching classes + advised classes                  │
│                                                                  │
│  GET /api/v1/classrooms/{id}/                                   │
│  → Join code: VISIBLE                                           │
│                                                                  │
│  {                                                               │
│    "name": "Einstein",                                           │
│    "join_code": "GACSM3",  ← INCLUDED                           │
│    "adviser_name": "Juan Dela Cruz",                             │
│    "enrollment_count": 35                                        │
│  }                                                               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                         ADMIN VIEW                              │
├────────────────────────────────────────────────────────────────┤
│  GET /api/v1/classrooms/                                        │
│  → Returns: ALL classes                                         │
│  → Full management access                                       │
│  → Can regenerate join codes                                    │
│  → Can transfer students                                        │
│  → Can create/edit classrooms                                   │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 DepEd Grade Components

```
┌────────────────────────────────────────────────────────────────┐
│              ClassSubject Configuration                         │
│         (per teacher-subject-classroom assignment)              │
└────────────────────────────────────────────────────────────────┘

    Math 7 in Grade 7 - Einstein
    Taught by: Prof. Cruz
    
    ┌──────────────────────────────────────────────┐
    │  Component Weights                            │
    │                                               │
    │  ┌────────────────────────────────────────┐  │
    │  │  Written Work (WW)                     │  │
    │  │  • Quizzes, exercises, homework        │  │
    │  │  • Default: 30%                        │  │
    │  │  • Configurable per class              │  │
    │  └────────────────────────────────────────┘  │
    │              30%                              │
    │                                               │
    │  ┌────────────────────────────────────────┐  │
    │  │  Performance Task (PT)                 │  │
    │  │  • Projects, presentations             │  │
    │  │  • Default: 50%                        │  │
    │  │  • Configurable per class              │  │
    │  └────────────────────────────────────────┘  │
    │              50%                              │
    │                                               │
    │  ┌────────────────────────────────────────┐  │
    │  │  Quarterly Assessment (QA)             │  │
    │  │  • Periodical exam                     │  │
    │  │  • Default: 20%                        │  │
    │  │  • Configurable per class              │  │
    │  └────────────────────────────────────────┘  │
    │              20%                              │
    │                                               │
    │  Total: 100% (enforced by validation)        │
    └──────────────────────────────────────────────┘
    
    Used in Sprint 3 for:
    • Grade input
    • Transmutation
    • SF9 generation
```

---

## 🗂️ Sample Data Structure

```
SY 2024-2025 (Academic Year)
│
├── Quarter 1 (Aug 1 - Oct 31, 2024)
├── Quarter 2 (Nov 1, 2024 - Jan 31, 2025)
├── Quarter 3 (Feb 1 - Apr 15, 2025)
└── Quarter 4 (Apr 16 - May 31, 2025)

Subjects (14 total)
│
├── Grade 7
│   ├── English 7 (ENG7)
│   ├── Mathematics 7 (MATH7)
│   ├── Science 7 (SCI7)
│   ├── Filipino 7 (FIL7)
│   └── Araling Panlipunan 7 (AP7)
│
├── Grade 8
│   ├── English 8 (ENG8)
│   ├── Mathematics 8 (MATH8)
│   └── Science 8 (SCI8)
│
└── Grade 11 STEM
    ├── General Mathematics (GEN_MATH)
    ├── Basic Calculus (BASIC_CALC)
    ├── General Physics 1 (GEN_PHYS1)
    ├── General Chemistry 1 (GEN_CHEM1)
    ├── Oral Communication (ORAL_COM)
    └── 21st Century Literature (21ST_LIT)

Classrooms (6 total)
│
├── Grade 7
│   ├── Einstein (Section A) - Code: [random] - Capacity: 40
│   │   └── Subjects: ENG7, MATH7, SCI7, FIL7, AP7
│   └── Newton (Section B) - Code: [random] - Capacity: 40
│       └── Subjects: ENG7, MATH7, SCI7, FIL7, AP7
│
├── Grade 8
│   ├── Darwin (Section A) - Code: [random] - Capacity: 40
│   │   └── Subjects: ENG8, MATH8, SCI8
│   └── Hawking (Section B) - Code: [random] - Capacity: 40
│       └── Subjects: ENG8, MATH8, SCI8
│
└── Grade 11 STEM
    ├── Section A - Code: [random] - Capacity: 35
    │   └── Subjects: GEN_MATH, BASIC_CALC, GEN_PHYS1, 
    │                  GEN_CHEM1, ORAL_COM, 21ST_LIT
    └── Section B - Code: [random] - Capacity: 35
        └── Subjects: GEN_MATH, BASIC_CALC, GEN_PHYS1, 
                       GEN_CHEM1, ORAL_COM, 21ST_LIT
```

---

## 📡 API Endpoints Map

```
/api/v1/
│
├── /academic-years/                    [5 endpoints]
│   ├── GET    /                        List all
│   ├── POST   /                        Create (admin)
│   ├── GET    /{id}/                   Detail
│   ├── PATCH  /{id}/                   Update (admin)
│   └── POST   /{id}/set_current/       Set as current (admin)
│
├── /quarters/                          [4 endpoints]
│   ├── GET    /                        List (filter by year)
│   ├── POST   /                        Create (admin)
│   ├── GET    /{id}/                   Detail
│   └── PATCH  /{id}/                   Update (admin)
│
├── /subjects/                          [5 endpoints]
│   ├── GET    /                        List (filter by grade/strand)
│   ├── POST   /                        Create (admin)
│   ├── GET    /{id}/                   Detail
│   ├── PATCH  /{id}/                   Update (admin)
│   └── DELETE /{id}/                   Delete (admin)
│
├── /classrooms/                        [7 endpoints]
│   ├── GET    /                        List (role-filtered)
│   ├── POST   /                        Create (admin)
│   ├── GET    /{id}/                   Detail (join code for staff)
│   ├── PATCH  /{id}/                   Update (admin)
│   ├── POST   /join/                   Join via code (student) ⭐
│   ├── POST   /{id}/regenerate_code/   Regenerate code (adviser) ⭐
│   └── GET    /{id}/enrollments/       Get roster
│
├── /class-subjects/                    [5 endpoints]
│   ├── GET    /                        List (filter by classroom)
│   ├── POST   /                        Create (admin)
│   ├── GET    /{id}/                   Detail
│   ├── PATCH  /{id}/                   Update (admin)
│   └── DELETE /{id}/                   Delete (admin)
│
└── /enrollments/                       [6 endpoints]
    ├── GET    /                        List (filter by classroom/student)
    ├── POST   /                        Create (admin)
    ├── GET    /{id}/                   Detail
    ├── PATCH  /{id}/                   Update (admin)
    ├── DELETE /{id}/                   Delete (admin)
    └── POST   /{id}/transfer/          Transfer student (admin) ⭐

Total: 32 endpoints (23 Sprint 2 + 9 from Sprint 1)
```

---

## 🎨 Frontend Integration

```javascript
// Import API client
import { classroomApi, getMyClasses } from '@/lib/academicApi'

// ============================================
// STUDENT: View My Classes
// ============================================
const classes = await getMyClasses()
// → Returns only enrolled classes
// → No join codes visible

// ============================================
// STUDENT: Join Class
// ============================================
try {
  const { data } = await classroomApi.join('GACSM3')
  console.log(`Joined ${data.enrollment.classroom_name}!`)
} catch (error) {
  console.error(error.response?.data?.error)
}

// ============================================
// TEACHER: View Class with Join Code
// ============================================
const { data: classroom } = await classroomApi.getById(classroomId)
console.log(`Join Code: ${classroom.join_code}`)
// → Code visible for teachers/advisers/admins

// ============================================
// TEACHER: View Roster
// ============================================
const { data: students } = await classroomApi.getEnrollments(classroomId)
students.forEach(enrollment => {
  console.log(`${enrollment.student_name} (LRN: ${enrollment.student_lrn})`)
})

// ============================================
// ADMIN: Transfer Student
// ============================================
await enrollmentApi.transfer(enrollmentId, newClassroomId)
```

---

## 📈 Sprint 2 Metrics

```
┌────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION STATS                     │
├────────────────────────────────────────────────────────────┤
│  Database Models:          6                               │
│  API Endpoints:            23                              │
│  Permission Classes:       5                               │
│  Serializers:              9                               │
│  ViewSets:                 6                               │
│  Admin Interfaces:         6                               │
│  Management Commands:      1                               │
│  Backend Lines of Code:    ~980                            │
│  Frontend API Client:      260 lines                       │
│  Documentation Files:      5                               │
│  Sample Classrooms:        6                               │
│  Sample Subjects:          14                              │
│  Sample Quarters:          4                               │
└────────────────────────────────────────────────────────────┘
```

---

## ✅ Sprint 2 Checklist

```
Backend Development
  [✓] AcademicYear model with is_current flag
  [✓] Quarter model with date ranges
  [✓] Subject model with grade/strand support
  [✓] Classroom model with join codes
  [✓] ClassSubject model with WW/PT/QA weights
  [✓] ClassEnrollment model with status tracking
  [✓] All migrations created and applied
  [✓] 23 REST API endpoints
  [✓] Role-based permission classes
  [✓] Serializer field visibility by role
  [✓] Join code validation
  [✓] Capacity checking
  [✓] Grade level matching
  [✓] Duplicate enrollment prevention
  [✓] Component weight validation
  [✓] Django Admin interfaces
  [✓] Sample data seeder command

Frontend Development
  [✓] API client with all endpoints
  [✓] Convenience functions
  [✓] Error handling patterns
  [ ] UI pages (Sprint 3)

Documentation
  [✓] API reference (API_SPRINT2.md)
  [✓] Implementation summary (SPRINT2_COMPLETE.md)
  [✓] Architecture guide (SPRINT2_ARCHITECTURE.md)
  [✓] Quick start guide (QUICKSTART_SPRINT2.md)
  [✓] Main README (README_SPRINT2.md)
  [✓] Visual summary (this file)

Testing
  [✓] Manual API testing
  [✓] Admin panel verification
  [✓] Role-based access testing
  [✓] Join code flow testing
  [✓] Validation rule testing
  [ ] Automated tests (future)
```

---

## 🎯 What's Next: Sprint 3 Preview

```
┌────────────────────────────────────────────────────────────┐
│                      SPRINT 3 SCOPE                         │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  📝 ASSIGNMENTS                                             │
│     • Teacher creates assignments                           │
│     • Due dates & late tracking                             │
│     • Student file submissions                              │
│     • Grading & feedback                                    │
│                                                              │
│  📊 GRADES                                                  │
│     • WW/PT/QA input per quarter                            │
│     • DepEd transmutation                                   │
│     • Grade computation                                     │
│     • Publication workflow                                  │
│     • Student grade view                                    │
│                                                              │
│  📅 ATTENDANCE                                              │
│     • Daily marking (P/A/L/E)                               │
│     • Attendance summary                                    │
│     • Adviser quarterly rollup                              │
│                                                              │
│  📢 ANNOUNCEMENTS                                           │
│     • School-wide                                           │
│     • Class-level                                           │
│     • Role-targeted                                         │
│     • In-app notifications                                  │
│                                                              │
│  📚 LEARNING MATERIALS                                      │
│     • File upload per subject                               │
│     • Student download access                               │
│                                                              │
│  🎨 FRONTEND PAGES                                          │
│     • Dashboards (student/teacher/admin)                    │
│     • My Classes page                                       │
│     • Join Class page                                       │
│     • Classroom detail page                                 │
│     • Assignment flow                                       │
│     • Grade view                                            │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Foundation Complete

```
                Sprint 1              Sprint 2              Sprint 3
                --------              --------              --------
                
         ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
         │     AUTH     │      │   ACADEMIC   │      │   LEARNING   │
         │     RBAC     │ ───► │  STRUCTURE   │ ───► │   FEATURES   │
         │    USERS     │      │  CLASSROOMS  │      │ ASSIGNMENTS  │
         └──────────────┘      │  JOIN CODES  │      │    GRADES    │
                               └──────────────┘      │  ATTENDANCE  │
                                                     └──────────────┘
         
         Foundation          Academic Setup           Full Portal
```

---

## 🎉 Sprint 2 Success!

```
┌───────────────────────────────────────────────────────────────┐
│                                                                │
│                    ✅ SPRINT 2 COMPLETE                       │
│                                                                │
│   Academic structure foundation successfully implemented!      │
│                                                                │
│   • Students can join classes via join codes                  │
│   • Teachers can manage classrooms & rosters                  │
│   • Admins have full system control                           │
│   • DepEd grade components configured                         │
│   • All APIs documented and tested                            │
│   • Frontend integration ready                                │
│                                                                │
│   Ready for Sprint 3: Learning Features! 🚀                   │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

---

**Say "Continue Sprint 3" to build assignments, grades, attendance, and UI pages!**
