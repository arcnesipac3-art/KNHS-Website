# Sprint 2 Architecture Overview

Visual guide to the academic structure implementation.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Pages (To be built in Sprint 3)                         │   │
│  │  - Student Dashboard                                      │   │
│  │  - Teacher Dashboard                                      │   │
│  │  - My Classes                                             │   │
│  │  - Join Class                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Client (academicApi.js) ✅                          │   │
│  │  - academicYearApi                                        │   │
│  │  - quarterApi                                             │   │
│  │  - subjectApi                                             │   │
│  │  - classroomApi                                           │   │
│  │  - classSubjectApi                                        │   │
│  │  - enrollmentApi                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP + JWT Bearer Token
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    BACKEND (Django REST API)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  URL Routing (/api/v1/)                                  │   │
│  │  → /academic-years/                                       │   │
│  │  → /quarters/                                             │   │
│  │  → /subjects/                                             │   │
│  │  → /classrooms/                                           │   │
│  │  → /class-subjects/                                       │   │
│  │  → /enrollments/                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ViewSets (views.py) ✅                                  │   │
│  │  - AcademicYearViewSet                                    │   │
│  │  - QuarterViewSet                                         │   │
│  │  - SubjectViewSet                                         │   │
│  │  - ClassroomViewSet (join, regenerate_code)              │   │
│  │  - ClassSubjectViewSet                                    │   │
│  │  - ClassEnrollmentViewSet (transfer)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Serializers (serializers.py) ✅                         │   │
│  │  - Role-specific field visibility                         │   │
│  │  - JoinClassSerializer                                    │   │
│  │  - Component weight validation                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Permissions (permissions.py) ✅                          │   │
│  │  - IsAdminUser                                            │   │
│  │  - IsTeacherUser / IsStudentUser                          │   │
│  │  - IsTeacherOfClass / IsAdviserOfClass                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Models (models.py) ✅                                   │   │
│  │  - AcademicYear                                           │   │
│  │  - Quarter                                                │   │
│  │  - Subject                                                │   │
│  │  - Classroom (join_code, adviser)                         │   │
│  │  - ClassSubject (WW/PT/QA weights)                        │   │
│  │  - ClassEnrollment (status tracking)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Django ORM
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    DATABASE (SQLite/PostgreSQL)                  │
│                                                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ AcademicYear  │  │   Quarter     │  │   Subject     │       │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤       │
│  │ id (UUID)     │  │ id (UUID)     │  │ id (UUID)     │       │
│  │ label         │  │ academic_year │  │ name          │       │
│  │ start_date    │  │ number (1-4)  │  │ code          │       │
│  │ end_date      │  │ name          │  │ grade_level   │       │
│  │ is_current    │  │ start_date    │  │ strand        │       │
│  └───────────────┘  │ end_date      │  │ is_active     │       │
│                     └───────────────┘  └───────────────┘       │
│                                                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  Classroom    │  │ ClassSubject  │  │ClassEnrollment│       │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤       │
│  │ id (UUID)     │  │ id (UUID)     │  │ id (UUID)     │       │
│  │ name          │  │ classroom_id  │  │ classroom_id  │       │
│  │ grade_level   │  │ subject_id    │  │ student_id    │       │
│  │ section       │  │ teacher_id    │  │ status        │       │
│  │ strand        │  │ ww_weight     │  │ enrolled_at   │       │
│  │ adviser_id    │  │ pt_weight     │  │ notes         │       │
│  │ academic_year │  │ qa_weight     │  └───────────────┘       │
│  │ join_code     │  └───────────────┘                          │
│  │ capacity      │                                              │
│  │ is_active     │                                              │
│  └───────────────┘                                              │
└───────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Student Joins Class

```
┌─────────┐                 ┌─────────┐                 ┌─────────┐
│ Student │                 │ Backend │                 │Database │
└────┬────┘                 └────┬────┘                 └────┬────┘
     │                           │                           │
     │ POST /classrooms/join/    │                           │
     │ {"join_code": "ABC123"}   │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ Validate join_code        │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ Check capacity            │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ Check grade level match   │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ Check not already enrolled│
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ Create enrollment         │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ <enrollment data>         │
     │                           │<──────────────────────────┤
     │                           │                           │
     │ 201 Created               │                           │
     │ {enrollment: {...}}       │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
```

### Teacher Views Class Roster

```
┌─────────┐                 ┌─────────┐                 ┌─────────┐
│ Teacher │                 │ Backend │                 │Database │
└────┬────┘                 └────┬────┘                 └────┬────┘
     │                           │                           │
     │ GET /classrooms/{id}/     │                           │
     │     enrollments/          │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │ Check permission:         │
     │                           │ IsTeacherOfClass          │
     │                           │                           │
     │                           │ Query enrollments         │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ Join with student profile │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ <enrollment list>         │
     │                           │<──────────────────────────┤
     │                           │                           │
     │ 200 OK                    │                           │
     │ [{student_name,lrn,...}]  │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
```

---

## Permission Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      API Request                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │ JWT Authentication     │
          │ (rest_framework_jwt)   │
          └────────┬───────────────┘
                   │
                   ▼
          ┌────────────────────────┐
          │  Extract User & Role   │
          └────────┬───────────────┘
                   │
                   ▼
       ┌───────────────────────────────┐
       │   ViewSet Permission Check    │
       │   (IsAuthenticated, etc.)     │
       └───────────┬───────────────────┘
                   │
                   ▼
       ┌───────────────────────────────┐
       │   Role-Based Permission       │
       ├───────────────────────────────┤
       │ Admin   → Full access         │
       │ Teacher → Own classes         │
       │ Student → Enrolled classes    │
       └───────────┬───────────────────┘
                   │
                   ▼
       ┌───────────────────────────────┐
       │  Object-Level Permission      │
       │  (has_object_permission)      │
       ├───────────────────────────────┤
       │ IsTeacherOfClass              │
       │ IsAdviserOfClass              │
       └───────────┬───────────────────┘
                   │
                   ▼
       ┌───────────────────────────────┐
       │     Queryset Filtering        │
       ├───────────────────────────────┤
       │ Student: .filter(enrollments  │
       │          __student=user)      │
       │ Teacher: .filter(Q(adviser=   │
       │          user)|Q(class_       │
       │          subjects__teacher))  │
       └───────────┬───────────────────┘
                   │
                   ▼
          ┌────────────────────────┐
          │   Execute Query        │
          │   Return Response      │
          └────────────────────────┘
```

---

## Database Relationships

```
                    ┌─────────────────┐
                    │  AcademicYear   │
                    │  (SY 2024-25)   │
                    └────┬────────┬───┘
                         │        │
          ┌──────────────┘        └──────────────┐
          │                                      │
          ▼                                      ▼
    ┌──────────┐                          ┌──────────┐
    │ Quarter  │                          │Classroom │
    │ (Q1-Q4)  │                          │(Grade 7) │
    └──────────┘                          └────┬─────┘
                                               │
                                               │
                    ┌──────────────────────────┼──────────────┐
                    │                          │              │
                    ▼                          ▼              ▼
            ┌───────────────┐         ┌──────────────┐  ┌─────────────┐
            │ ClassSubject  │         │ClassEnroll.  │  │ (properties)│
            │(Math in 7-A)  │         │(Student in   │  │ join_code   │
            └───┬───────────┘         │ classroom)   │  │ capacity    │
                │                     └──────────────┘  │ is_full     │
                │                                       └─────────────┘
                ▼
         ┌──────────┐
         │ Subject  │
         │(Math 7)  │
         └──────────┘
         
         
Relationships:
• AcademicYear ──< Quarter (one to many)
• AcademicYear ──< Classroom (one to many)
• Classroom ──< ClassSubject (one to many)
• Classroom ──< ClassEnrollment (one to many)
• Subject ──< ClassSubject (one to many)
• User (Teacher) ──< Classroom.adviser (one to many)
• User (Teacher) ──< ClassSubject.teacher (one to many)
• User (Student) ──< ClassEnrollment.student (one to many)
```

---

## Join Code Lifecycle

```
┌────────────────────────────────────────────────────────────────┐
│                    Classroom Creation                           │
│                                                                  │
│   Admin creates classroom via:                                  │
│   • Django Admin UI                                             │
│   • POST /api/v1/classrooms/                                    │
│                                                                  │
│   ┌────────────────────────────────────────────────┐           │
│   │  Join Code Auto-Generated                       │           │
│   │  • 6 characters                                 │           │
│   │  • Uppercase + digits                           │           │
│   │  • Unique constraint in DB                      │           │
│   │  Example: "GACSM3", "Q5W71C"                    │           │
│   └────────────────────────────────────────────────┘           │
└────────────────────────────────────────────────────────────────┘
                             │
                             │ Teacher shares code
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                      Student Join                               │
│                                                                  │
│   Student submits: POST /classrooms/join/                       │
│   {"join_code": "GACSM3"}                                       │
│                                                                  │
│   ┌────────────────────────────────────────────────┐           │
│   │  Validation Checks:                             │           │
│   │  ✓ Code exists                                  │           │
│   │  ✓ Classroom is active                          │           │
│   │  ✓ Not at capacity                              │           │
│   │  ✓ Grade level matches (if student has grade)  │           │
│   │  ✓ Student not already enrolled                 │           │
│   └────────────────────────────────────────────────┘           │
│                                                                  │
│   If all checks pass:                                           │
│   → Create ClassEnrollment record                               │
│   → Return enrollment data to student                           │
└────────────────────────────────────────────────────────────────┘
                             │
                             │ If code compromised or needs refresh
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                   Code Regeneration                             │
│                                                                  │
│   Teacher/Admin: POST /classrooms/{id}/regenerate_code/         │
│                                                                  │
│   ┌────────────────────────────────────────────────┐           │
│   │  Permission Check:                              │           │
│   │  • Adviser of this classroom, OR                │           │
│   │  • Admin role                                   │           │
│   └────────────────────────────────────────────────┘           │
│                                                                  │
│   New code generated, old code invalidated                      │
│   Teacher shares new code with students                         │
└────────────────────────────────────────────────────────────────┘
```

---

## DepEd Component Weights

```
┌─────────────────────────────────────────────────────────────────┐
│                      ClassSubject Record                         │
│                                                                   │
│   Math 7 in Grade 7 - Einstein                                  │
│                                                                   │
│   ┌───────────────────────────────────────────────────┐         │
│   │  Component Weights (Configurable per class)      │         │
│   │                                                    │         │
│   │  ┌─────────────────────────────────────────────┐ │         │
│   │  │ Written Work (WW)        30%                │ │         │
│   │  │ • Quizzes, exercises, homework              │ │         │
│   │  └─────────────────────────────────────────────┘ │         │
│   │                                                    │         │
│   │  ┌─────────────────────────────────────────────┐ │         │
│   │  │ Performance Task (PT)    50%                │ │         │
│   │  │ • Projects, presentations, practicals       │ │         │
│   │  └─────────────────────────────────────────────┘ │         │
│   │                                                    │         │
│   │  ┌─────────────────────────────────────────────┐ │         │
│   │  │ Quarterly Assessment (QA) 20%               │ │         │
│   │  │ • Periodical exam                           │ │         │
│   │  └─────────────────────────────────────────────┘ │         │
│   │                                                    │         │
│   │  Validation: WW + PT + QA = 100%                  │         │
│   └───────────────────────────────────────────────────┘         │
│                                                                   │
│   Used in Sprint 3 for:                                          │
│   • Grade computation                                            │
│   • DepEd transmutation                                          │
│   • SF9 report card generation                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Response Examples

### Classroom List (Student View)
```json
[
  {
    "id": "abc123...",
    "name": "Einstein",
    "grade_level": 7,
    "section": "A",
    "strand": "",
    "strand_display": "None (JHS)",
    "adviser": "teacher-uuid",
    "adviser_name": "Juan Dela Cruz",
    "academic_year": "year-uuid",
    "academic_year_label": "SY 2024-2025",
    "enrollment_count": 35,
    "capacity": 40,
    "is_full": false,
    "is_active": true,
    "created_at": "2024-08-01T10:00:00Z"
    // Note: join_code NOT included for students
  }
]
```

### Classroom Detail (Teacher View)
```json
{
  "id": "abc123...",
  "name": "Einstein",
  "grade_level": 7,
  "section": "A",
  "strand": "",
  "strand_display": "None (JHS)",
  "adviser": "teacher-uuid",
  "adviser_name": "Juan Dela Cruz",
  "academic_year": "year-uuid",
  "academic_year_label": "SY 2024-2025",
  "join_code": "GACSM3",  // ← Included for teachers/advisers/admins
  "enrollment_count": 35,
  "capacity": 40,
  "is_full": false,
  "is_active": true,
  "created_at": "2024-08-01T10:00:00Z",
  "updated_at": "2024-08-01T10:00:00Z"
}
```

### Enrollment Response
```json
{
  "id": "enrollment-uuid",
  "classroom": "classroom-uuid",
  "classroom_name": "Grade 7 - Einstein",
  "student": "student-uuid",
  "student_name": "Maria Santos",
  "student_lrn": "123456789012",
  "status": "active",
  "status_display": "Active",
  "enrolled_at": "2024-08-15T09:30:00Z",
  "notes": "",
  "created_at": "2024-08-15T09:30:00Z",
  "updated_at": "2024-08-15T09:30:00Z"
}
```

---

## File Organization

```
backend/apps/academics/
│
├── models.py                    (280 lines)
│   ├── AcademicYear            (40 lines)
│   ├── Quarter                 (35 lines)
│   ├── Subject                 (45 lines)
│   ├── Classroom               (80 lines)
│   ├── ClassSubject            (50 lines)
│   └── ClassEnrollment         (30 lines)
│
├── serializers.py               (160 lines)
│   ├── AcademicYearSerializer
│   ├── QuarterSerializer
│   ├── SubjectSerializer
│   ├── ClassroomListSerializer
│   ├── ClassroomDetailSerializer
│   ├── ClassSubjectSerializer
│   ├── ClassEnrollmentSerializer
│   └── JoinClassSerializer
│
├── views.py                     (250 lines)
│   ├── AcademicYearViewSet     (40 lines)
│   ├── QuarterViewSet          (30 lines)
│   ├── SubjectViewSet          (40 lines)
│   ├── ClassroomViewSet        (90 lines)
│   ├── ClassSubjectViewSet     (25 lines)
│   └── ClassEnrollmentViewSet  (45 lines)
│
├── permissions.py               (60 lines)
│   ├── IsAdminUser
│   ├── IsTeacherUser
│   ├── IsStudentUser
│   ├── IsTeacherOfClass
│   └── IsAdviserOfClass
│
├── admin.py                     (70 lines)
│   └── 6 admin classes with filters
│
├── urls.py                      (20 lines)
│   └── Router configuration
│
└── management/commands/
    └── seed_academic_data.py    (140 lines)
        └── Populates sample data

Total Backend: ~980 lines
```

---

## Key Technical Decisions

### ✅ UUID Primary Keys
- Better for distributed systems
- No sequential ID leakage
- Easier multi-database merge

### ✅ Join Code Pattern
- Simple 6-character codes (vs complex invitation system)
- Auto-generated on classroom creation
- Regenerable by adviser/admin
- Unique constraint enforced

### ✅ Soft Relationships
- `teacher` and `adviser` use SET_NULL on delete
- Preserves data integrity when users deactivated
- Allows "No Teacher Assigned" state

### ✅ Component Weight Validation
- Model-level `clean()` method
- Serializer-level validation
- Ensures DepEd compliance

### ✅ Status Tracking
- Enrollment status: active, transferred, dropped, completed
- Enables audit trails
- Supports student mobility

### ✅ Role-Based Serializers
- `ClassroomListSerializer` - Public view
- `ClassroomDetailSerializer` - Includes join_code
- Same endpoint, different serializers by role

---

## Sprint 2 Metrics

| Metric | Count |
|--------|-------|
| Database Tables | 6 |
| API Endpoints | 23 |
| Backend Lines of Code | ~980 |
| Frontend API Client | 260 lines |
| Models | 6 |
| Serializers | 9 |
| ViewSets | 6 |
| Permission Classes | 5 |
| Admin Interfaces | 6 |
| Management Commands | 1 |
| Migrations | 2 |

---

## What Developers Need to Know

### For Backend Developers
1. All models use UUID primary keys
2. Relationships use `related_name` for reverse queries
3. Permissions are layered: class-based → object-level → queryset filtering
4. Admin interface is fully configured for all models
5. Seed command available: `python manage.py seed_academic_data`

### For Frontend Developers
1. API client ready: `import { classroomApi } from '@/lib/academicApi'`
2. All endpoints require JWT Bearer token
3. Error responses follow consistent format: `{error: "message"}`
4. Join codes are uppercase, 6 characters
5. Role determines what data is visible (API handles filtering)

### For Testers
1. Use Django Admin to create test data: `http://localhost:8000/admin/`
2. Join codes visible in Classroom admin panel
3. Test different roles: student, teacher, admin
4. Check permission boundaries (students can't see join codes, etc.)
5. Validate DepEd weight rules (must sum to 100%)

---

**This architecture forms the foundation for all learning features in Sprint 3!**
