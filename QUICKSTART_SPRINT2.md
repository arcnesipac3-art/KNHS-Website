# Quick Start Guide - Sprint 2 Features

Get up and running with the academic structure features in 5 minutes.

---

## Prerequisites

- Python 3.9+ installed
- Node.js 18+ installed (for frontend)
- Django server running from Sprint 1

---

## Backend Setup (If starting fresh)

```bash
# Navigate to backend
cd "C:\Users\dragon\Desktop\Website Official\backend"

# Install dependencies (if not done)
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create admin user (if not done in Sprint 1)
python manage.py seed_admin

# Seed academic data
python manage.py seed_academic_data

# Start server
python manage.py runserver
```

Server will start at: **http://localhost:8000**

---

## Quick Test - API Access

### 1. Login as Admin
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@knhs.edu.ph\",\"password\":\"admin123\"}"
```

**Copy the `access_token` from response**

### 2. View Classrooms
```bash
curl http://localhost:8000/api/v1/classrooms/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

You should see 6 classrooms with join codes!

### 3. View Subjects
```bash
curl http://localhost:8000/api/v1/subjects/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## Join Codes from Seed Data

After running `python manage.py seed_academic_data`, you'll have these classrooms:

| Classroom | Grade | Join Code | Capacity |
|-----------|-------|-----------|----------|
| Einstein | 7 | *(random)* | 40 |
| Newton | 7 | *(random)* | 40 |
| Darwin | 8 | *(random)* | 40 |
| Hawking | 8 | *(random)* | 40 |
| Section A | 11 STEM | *(random)* | 35 |
| Section B | 11 STEM | *(random)* | 35 |

**To view join codes:**
1. Login to Django Admin: http://localhost:8000/admin/
2. Go to **Academics → Classrooms**
3. Click any classroom to see its join code

---

## Test Student Join Flow

### 1. Create a test student (Django Admin)
```
URL: http://localhost:8000/admin/accounts/user/add/
Fields:
  - Email: student@test.com
  - Role: Student
  - Password: test1234
  - Is verified: ✓
  - Is approved: ✓
```

Also create a UserProfile for the student with:
- Grade level: 7
- LRN: 123456789012 (optional)

### 2. Login as Student
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"student@test.com\",\"password\":\"test1234\"}"
```

### 3. Join a Class
```bash
curl -X POST http://localhost:8000/api/v1/classrooms/join/ \
  -H "Authorization: Bearer STUDENT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"join_code\":\"GACSM3\"}"
```

*(Replace GACSM3 with actual join code from admin panel)*

### 4. View My Classes
```bash
curl http://localhost:8000/api/v1/classrooms/ \
  -H "Authorization: Bearer STUDENT_ACCESS_TOKEN"
```

Student should now see only the joined class!

---

## Django Admin Quick Tour

**URL:** http://localhost:8000/admin/

### Academics Section:

1. **Academic Years**
   - View SY 2024-2025
   - See which is current
   - Click "Set current" to change

2. **Quarters**
   - See Q1-Q4 with dates
   - Check which is active based on today's date

3. **Subjects**
   - Filter by grade level or strand
   - Toggle active/inactive

4. **Classrooms**
   - View all classes
   - See join codes
   - Check enrollment count vs capacity
   - Assign advisers

5. **Class Subjects**
   - View subject-teacher assignments
   - Check DepEd component weights (WW/PT/QA)

6. **Class Enrollments**
   - View student roster per class
   - Filter by status
   - See enrollment dates

---

## Frontend Integration (Ready to Use)

The API client is ready at `frontend/src/lib/academicApi.js`

### Example Usage in React Component:

```jsx
import { classroomApi, getCurrentAcademicYearWithQuarters } from '@/lib/academicApi'
import { useEffect, useState } from 'react'

function MyClassesPage() {
  const [classes, setClasses] = useState([])

  useEffect(() => {
    async function loadClasses() {
      const { data } = await classroomApi.getAll()
      setClasses(data)
    }
    loadClasses()
  }, [])

  return (
    <div>
      <h1>My Classes</h1>
      {classes.map(cls => (
        <div key={cls.id}>
          <h2>{cls.name}</h2>
          <p>Grade {cls.grade_level} | Adviser: {cls.adviser_name}</p>
          <p>Enrollment: {cls.enrollment_count}/{cls.capacity}</p>
        </div>
      ))}
    </div>
  )
}
```

### Example: Student Join Class

```jsx
import { classroomApi } from '@/lib/academicApi'
import { useState } from 'react'

function JoinClassForm() {
  const [joinCode, setJoinCode] = useState('')

  async function handleJoin() {
    try {
      const { data } = await classroomApi.join(joinCode)
      alert(`Successfully joined ${data.enrollment.classroom_name}!`)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to join class')
    }
  }

  return (
    <div>
      <input 
        value={joinCode} 
        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
        placeholder="Enter join code"
        maxLength={6}
      />
      <button onClick={handleJoin}>Join Class</button>
    </div>
  )
}
```

---

## Common Issues & Solutions

### ❌ "Authentication credentials were not provided"
**Solution:** Include `Authorization: Bearer {token}` header in all API requests

### ❌ "Invalid join code"
**Solution:** 
- Check the code is correct (case-sensitive by default, but API converts to uppercase)
- Verify classroom is active
- Check in Django Admin that the classroom exists

### ❌ "This class is full"
**Solution:** Increase classroom capacity in Django Admin or create a new section

### ❌ "Your grade level does not match this classroom"
**Solution:** 
- Set student's grade_level in UserProfile
- Or join a classroom matching your grade

### ❌ "You are already enrolled in this class"
**Solution:** Student already joined - view My Classes instead

### ❌ Component weights validation error
**Solution:** Ensure WW + PT + QA = 100.00 when creating/editing class subjects

---

## API Endpoints Cheat Sheet

```
# Academic Years
GET    /api/v1/academic-years/
POST   /api/v1/academic-years/              [admin]
POST   /api/v1/academic-years/{id}/set_current/  [admin]

# Quarters
GET    /api/v1/quarters/?academic_year={id}
POST   /api/v1/quarters/                    [admin]

# Subjects
GET    /api/v1/subjects/?grade_level=7&strand=STEM
POST   /api/v1/subjects/                    [admin]

# Classrooms
GET    /api/v1/classrooms/                  [role-filtered]
GET    /api/v1/classrooms/{id}/             [includes join_code for staff]
POST   /api/v1/classrooms/join/             [student]
POST   /api/v1/classrooms/{id}/regenerate_code/  [adviser/admin]
GET    /api/v1/classrooms/{id}/enrollments/

# Class Subjects
GET    /api/v1/class-subjects/?classroom={id}
POST   /api/v1/class-subjects/              [admin]

# Enrollments
GET    /api/v1/enrollments/?student={id}
POST   /api/v1/enrollments/{id}/transfer/   [admin]
```

---

## What's Next?

Sprint 2 gives you the **foundation**. Sprint 3 will add:

- ✏️ **Assignments** - Teachers create, students submit
- 📊 **Grades** - DepEd WW/PT/QA input & transmutation
- 📅 **Attendance** - Daily marking (P/A/L/E)
- 📢 **Announcements** - School-wide & class-level
- 📚 **Learning Materials** - Upload files per subject

**Current Status:** Backend APIs complete, Frontend integration ready, UI pages pending

---

## Support

- **API Documentation:** See `backend/API_SPRINT2.md`
- **Full Blueprint:** See `KNHSPortalBlueprint.md`
- **Sprint Summary:** See `SPRINT2_COMPLETE.md`

**Ready to build Sprint 3? Say the word! 🚀**
