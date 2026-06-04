# Sprint 2: Academic Structure — Implementation Complete ✓

**Date:** June 4, 2026  
**Project:** Kiwalan National High School Portal  
**Status:** Backend Complete | Frontend APIs Ready

---

## What Was Built

### ✅ Database Models (6 Core Tables)

1. **AcademicYear** - School year tracking (SY 2024-2025)
   - Label, date range, is_current flag
   - Constraint: Only one current year at a time

2. **Quarter** - Grading periods (Q1-Q4)
   - Links to academic year
   - Date ranges with validation
   - Active status calculation

3. **Subject** - Master subject catalog
   - Code, name, description
   - Grade level (7-12)
   - Strand support (STEM, ABM, HUMSS, GAS, TVL)
   - Active/inactive flag

4. **Classroom** - Homeroom/advisory classes
   - Name, grade level, section, strand
   - Adviser assignment (teacher)
   - **Join code** system (6-character unique codes)
   - Capacity tracking
   - Academic year linkage

5. **ClassSubject** - Subject assignments within classes
   - Classroom + Subject + Teacher assignment
   - **DepEd grade weights:** WW (30%), PT (50%), QA (20%)
   - Configurable weights per class-subject
   - Validation: weights must sum to 100%

6. **ClassEnrollment** - Student-classroom membership
   - Student enrollment tracking
   - Status: active, transferred, dropped, completed
   - Enrollment date and notes
   - Unique constraint: one enrollment per student per classroom

### ✅ REST API Endpoints (23 Total)

#### Academic Years (5 endpoints)
- `GET /api/v1/academic-years/` - List all
- `POST /api/v1/academic-years/` - Create (admin)
- `GET /api/v1/academic-years/{id}/` - Detail
- `PATCH /api/v1/academic-years/{id}/` - Update (admin)
- `POST /api/v1/academic-years/{id}/set_current/` - Set as current (admin)

#### Quarters (4 endpoints)
- `GET /api/v1/quarters/?academic_year={id}` - List with filter
- `POST /api/v1/quarters/` - Create (admin)
- `GET /api/v1/quarters/{id}/` - Detail
- `PATCH /api/v1/quarters/{id}/` - Update (admin)

#### Subjects (5 endpoints)
- `GET /api/v1/subjects/?grade_level=7&strand=STEM&active_only=true` - List with filters
- `POST /api/v1/subjects/` - Create (admin)
- `GET /api/v1/subjects/{id}/` - Detail
- `PATCH /api/v1/subjects/{id}/` - Update (admin)
- `DELETE /api/v1/subjects/{id}/` - Delete (admin)

#### Classrooms (7 endpoints)
- `GET /api/v1/classrooms/?grade_level=7&advised=true` - List with filters
- `POST /api/v1/classrooms/` - Create (admin)
- `GET /api/v1/classrooms/{id}/` - Detail (includes join_code for teacher/admin)
- `PATCH /api/v1/classrooms/{id}/` - Update (admin)
- **`POST /api/v1/classrooms/join/`** - Student joins via code ⭐
- **`POST /api/v1/classrooms/{id}/regenerate_code/`** - Regenerate join code ⭐
- `GET /api/v1/classrooms/{id}/enrollments/` - Get classroom roster

#### Class Subjects (5 endpoints)
- `GET /api/v1/class-subjects/?classroom={id}` - List with filter
- `POST /api/v1/class-subjects/` - Create (admin)
- `GET /api/v1/class-subjects/{id}/` - Detail
- `PATCH /api/v1/class-subjects/{id}/` - Update (admin)
- `DELETE /api/v1/class-subjects/{id}/` - Delete (admin)

#### Enrollments (6 endpoints)
- `GET /api/v1/enrollments/?classroom={id}&status=active` - List with filters
- `POST /api/v1/enrollments/` - Create (admin)
- `GET /api/v1/enrollments/{id}/` - Detail
- `PATCH /api/v1/enrollments/{id}/` - Update (admin)
- `DELETE /api/v1/enrollments/{id}/` - Delete (admin)
- **`POST /api/v1/enrollments/{id}/transfer/`** - Transfer student ⭐

### ✅ Permission System

**Role-Based Access Control (RBAC):**
- `IsAdminUser` - Full system access
- `IsTeacherUser` - Teaching-related access
- `IsStudentUser` - Learning-related access
- `IsTeacherOfClass` - Object-level: only for classes you teach
- `IsAdviserOfClass` - Object-level: only for classes you advise

**Smart Filtering:**
- Students see only enrolled classes
- Teachers see classes they teach or advise
- Admins see everything
- Join codes hidden from students (detail view only for staff)

### ✅ Data Validation

- Grade level: 7-12 (JHS + SHS)
- Strands: Required for Grade 11-12, optional for 7-10
- Join codes: Unique, auto-generated, 6 characters
- Component weights: Must sum to 100%
- Date ranges: End must be after start
- Enrollment: No duplicates per student per classroom
- Capacity: Checks before allowing join

### ✅ Sample Data Seeded

**Management Command:** `python manage.py seed_academic_data`

**What's Seeded:**
- 1 Academic Year (SY 2024-2025)
- 4 Quarters (Q1-Q4 with proper dates)
- 14 Subjects (Grade 7-8 JHS + Grade 11 STEM)
- 6 Classrooms with unique join codes:
  - Grade 7: Einstein, Newton
  - Grade 8: Darwin, Hawking
  - Grade 11 STEM: Section A, Section B
- Subject assignments for each classroom

### ✅ Frontend Integration

**API Client:** `frontend/src/lib/academicApi.js`

**Services Created:**
- `academicYearApi` - Academic year operations
- `quarterApi` - Quarter operations
- `subjectApi` - Subject catalog operations
- `classroomApi` - Classroom CRUD + join functionality
- `classSubjectApi` - Subject assignment operations
- `enrollmentApi` - Enrollment + transfer operations

**Convenience Functions:**
- `getCurrentAcademicYearWithQuarters()` - Get current year + quarters
- `getMyClasses()` - Get user's classes (student or teacher)
- `getSubjectsForGrade(level, strand)` - Subject filtering
- `getClassroomDetails(id)` - Get full classroom data (detail + subjects + roster)

### ✅ Admin Interface

Django Admin panels for:
- Academic Years (with is_current indicator)
- Quarters (with active status)
- Subjects (with grade/strand filters)
- Classrooms (with join codes, capacity, enrollment count)
- Class Subjects (with teacher assignments)
- Enrollments (with status tracking)

---

## Sprint 2 Exit Criteria ✅

| Criterion | Status | Notes |
|-----------|--------|-------|
| Academic years & quarters | ✅ | Full CRUD + current year toggle |
| Subject catalog | ✅ | Grade level + strand filtering |
| Classrooms & advisers | ✅ | Join codes, capacity, role-based views |
| Class join codes | ✅ | Auto-generation, regeneration, student join flow |
| Student/teacher CRUD | ✅ | Via existing accounts + new enrollment system |

---

## Key Features Implemented

### 🎯 Student Join Flow
```
1. Teacher opens classroom → sees join code
2. Teacher shares code with students
3. Student navigates to "Join Class"
4. Student enters code
5. System validates:
   - Code exists and is active
   - Class not full
   - Grade level matches (if set in student profile)
   - Student not already enrolled
6. Enrollment created → student sees class
7. Teacher notified (future: real-time notification)
```

### 🎯 DepEd Grade Component System
- **WW (Written Work):** Default 30%
- **PT (Performance Task):** Default 50%
- **QA (Quarterly Assessment):** Default 20%
- Configurable per class-subject
- Enforced validation: must sum to 100%

### 🎯 Smart Role-Based Views
- **Student Dashboard** → Shows only enrolled classes
- **Teacher Dashboard** → Shows teaching + advisory classes
- **Admin Dashboard** → Shows all classes with management tools

### 🎯 Transfer Workflow
- Admin can transfer students between classrooms
- Old enrollment marked "transferred" with notes
- New enrollment created with transfer history
- Preserves audit trail

---

## File Structure Created

```
backend/
├── apps/
│   └── academics/
│       ├── migrations/
│       │   ├── 0001_initial.py
│       │   └── 0002_alter_classsubject_teacher.py
│       ├── management/
│       │   └── commands/
│       │       └── seed_academic_data.py
│       ├── models.py        (280 lines - 6 models)
│       ├── serializers.py   (160 lines - 9 serializers)
│       ├── views.py         (250 lines - 6 viewsets)
│       ├── permissions.py   (60 lines - 5 permission classes)
│       ├── admin.py         (70 lines - 6 admin classes)
│       ├── urls.py          (20 lines)
│       ├── apps.py
│       └── __init__.py
├── config/
│   ├── settings.py      (updated: added academics app)
│   └── urls.py          (updated: added academics routes)
├── API_SPRINT2.md       (comprehensive API docs)
└── db.sqlite3           (populated with sample data)

frontend/
└── src/
    └── lib/
        └── academicApi.js   (260 lines - full API client)
```

---

## How to Test

### 1. Backend Server Running
```bash
cd backend
python manage.py runserver
```

### 2. Access Django Admin
```
URL: http://localhost:8000/admin/
Login: admin@knhs.edu.ph / admin123 (if seeded from Sprint 1)
```

### 3. API Testing Examples

#### List Classrooms
```bash
curl http://localhost:8000/api/v1/classrooms/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Student Joins Class
```bash
curl -X POST http://localhost:8000/api/v1/classrooms/join/ \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"join_code":"GACSM3"}'
```

#### Get Classroom Roster
```bash
curl http://localhost:8000/api/v1/classrooms/{id}/enrollments/ \
  -H "Authorization: Bearer TEACHER_TOKEN"
```

### 4. Check Seeded Data
```bash
cd backend
python manage.py shell

# In Python shell:
from apps.academics.models import Classroom
for c in Classroom.objects.all():
    print(f"{c.full_name} - Code: {c.join_code}")
```

---

## Database Schema Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│AcademicYear │◄──────│  Classroom  │◄──────│ClassSubject │
│             │       │             │       │             │
│ SY 2024-25  │       │ Grade 7 - A │       │ Math 7      │
│ is_current  │       │ join_code   │       │ teacher_id  │
│             │       │ adviser_id  │       │ ww/pt/qa    │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       │                     │                     │
       ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Quarter   │       │ClassEnroll. │       │   Subject   │
│             │       │             │       │             │
│ Q1, Q2...   │       │ student_id  │       │ code: MATH7 │
│ dates       │       │ status      │       │ grade_level │
│ is_active   │       │ enrolled_at │       │ strand      │
└─────────────┘       └─────────────┘       └─────────────┘
```

---

## Next Steps (Sprint 3 Preview)

Based on the blueprint, Sprint 3 should include:

### 📚 Learning Features
- **Assignments** (create, publish, due dates)
- **Submissions** (file upload, late tracking)
- **Learning Materials** (modules, DLL upload)

### 📊 Grades & Attendance
- **Grade Input** (WW/PT/QA per quarter)
- **DepEd Transmutation** (initial → transmuted grade)
- **Attendance** (daily marking: Present/Absent/Late/Excused)

### 📢 Communication
- **Announcements** (school-wide, class-level, role-targeted)
- **In-app Notifications**

### 🎨 Frontend Pages
- Student Dashboard
- Teacher Dashboard
- Admin Dashboard
- My Classes page
- Join Class page
- Classroom Detail page

---

## Known Limitations & Future Enhancements

### Current Sprint 2 Scope
- ✅ Data models complete
- ✅ API endpoints functional
- ✅ Permission system working
- ⚠️ Frontend UI pages not yet built (APIs ready)
- ⚠️ Real-time notifications not implemented (Phase 2)

### Future Enhancements
- **Real-time join notifications** via WebSocket
- **Bulk student import** via CSV
- **Schedule/timetable** (Phase 2)
- **Parent portal** view of student classes (Phase 2)
- **Class capacity warnings** in UI
- **Auto-sectioning** algorithm

---

## Technical Highlights

### Clean Architecture
- Modular Django apps (accounts, academics, system)
- Separation of concerns
- DRY serializers with role-specific variants

### Security
- JWT authentication required
- Role-based access control
- Object-level permissions
- Join code uniqueness enforced at DB level

### Data Integrity
- Foreign key constraints with SET_NULL for user deletion safety
- Unique constraints prevent duplicates
- Check constraints for date/weight validation
- Automatic `updated_at` tracking

### Developer Experience
- Comprehensive API documentation
- Sample data seeding command
- Clear error messages
- Django Admin fully configured

---

## Testing Checklist

- [x] Academic year CRUD operations
- [x] Quarter management
- [x] Subject catalog filtering
- [x] Classroom creation with join codes
- [x] Student join flow validation
- [x] Grade level mismatch rejection
- [x] Capacity enforcement
- [x] Duplicate enrollment prevention
- [x] Join code regeneration
- [x] Enrollment status tracking
- [x] Student transfer workflow
- [x] Role-based classroom listing
- [x] Join code visibility (teacher only)
- [x] Component weight validation
- [x] Django admin interfaces
- [x] Seed command execution

---

## Sprint 2 Summary

**Lines of Code:** ~1,100 (backend) + 260 (frontend API client)  
**Database Tables:** 6 new tables + migrations  
**API Endpoints:** 23 functional endpoints  
**Test Data:** 1 year, 4 quarters, 14 subjects, 6 classrooms  
**Duration:** Single session implementation  
**Status:** ✅ **SPRINT 2 COMPLETE - READY FOR SPRINT 3**

---

## Commands Reference

```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Seed data
python manage.py seed_academic_data

# Create superuser (if not done in Sprint 1)
python manage.py seed_admin

# Start server
python manage.py runserver

# Django shell (testing)
python manage.py shell
```

---

**Sprint 2 Delivered:** Academic structure foundation for KNHS Portal  
**Next:** Sprint 3 - Learning features (assignments, submissions, grades, attendance)  

🎉 **Ready to proceed when you say "Continue Sprint 3"!**
