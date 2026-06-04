# Sprint 2 API Documentation

## Academic Structure APIs

All endpoints require authentication via Bearer token in the `Authorization` header.

Base URL: `http://localhost:8000/api/v1/`

---

## Academic Years

### List Academic Years
```http
GET /academic-years/
```

**Response:**
```json
[
  {
    "id": "uuid",
    "label": "SY 2024-2025",
    "start_date": "2024-08-01",
    "end_date": "2025-05-31",
    "is_current": true,
    "quarters_count": 4,
    "created_at": "2024-08-01T10:00:00Z",
    "updated_at": "2024-08-01T10:00:00Z"
  }
]
```

### Set Current Academic Year
```http
POST /academic-years/{id}/set_current/
```

**Permission:** Admin only

---

## Quarters

### List Quarters
```http
GET /quarters/?academic_year={uuid}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "academic_year": "uuid",
    "academic_year_label": "SY 2024-2025",
    "number": 1,
    "name": "First Quarter",
    "start_date": "2024-08-01",
    "end_date": "2024-10-31",
    "is_active": true,
    "created_at": "2024-08-01T10:00:00Z",
    "updated_at": "2024-08-01T10:00:00Z"
  }
]
```

---

## Subjects

### List Subjects
```http
GET /subjects/?grade_level=7&strand=STEM&active_only=true
```

**Query Parameters:**
- `grade_level` (optional): Filter by grade level (7-12)
- `strand` (optional): Filter by strand (STEM, ABM, HUMSS, GAS, TVL)
- `active_only` (optional): Show only active subjects (true/false)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "English 7",
    "code": "ENG7",
    "description": "",
    "grade_level": 7,
    "strand": "",
    "strand_display": "None (JHS)",
    "is_active": true,
    "created_at": "2024-08-01T10:00:00Z",
    "updated_at": "2024-08-01T10:00:00Z"
  }
]
```

### Create Subject
```http
POST /subjects/
```

**Permission:** Admin only

**Request Body:**
```json
{
  "name": "Mathematics 7",
  "code": "MATH7",
  "description": "Junior High School Mathematics",
  "grade_level": 7,
  "strand": "",
  "is_active": true
}
```

---

## Classrooms

### List Classrooms
```http
GET /classrooms/?academic_year={uuid}&grade_level=7&advised=true
```

**Query Parameters:**
- `academic_year` (optional): Filter by academic year (defaults to current)
- `grade_level` (optional): Filter by grade level
- `advised` (optional): For teachers, filter to only advised classes (true)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Einstein",
    "grade_level": 7,
    "section": "A",
    "strand": "",
    "strand_display": "None (JHS)",
    "adviser": "uuid",
    "adviser_name": "Juan Dela Cruz",
    "academic_year": "uuid",
    "academic_year_label": "SY 2024-2025",
    "enrollment_count": 35,
    "capacity": 40,
    "is_full": false,
    "is_active": true,
    "created_at": "2024-08-01T10:00:00Z"
  }
]
```

### Get Classroom Detail
```http
GET /classrooms/{id}/
```

**Response:** (includes join_code for teachers/admins)
```json
{
  "id": "uuid",
  "name": "Einstein",
  "grade_level": 7,
  "section": "A",
  "strand": "",
  "strand_display": "None (JHS)",
  "adviser": "uuid",
  "adviser_name": "Juan Dela Cruz",
  "academic_year": "uuid",
  "academic_year_label": "SY 2024-2025",
  "join_code": "ABC123",
  "enrollment_count": 35,
  "capacity": 40,
  "is_full": false,
  "is_active": true,
  "created_at": "2024-08-01T10:00:00Z",
  "updated_at": "2024-08-01T10:00:00Z"
}
```

### Join Class (Student)
```http
POST /classrooms/join/
```

**Permission:** Student only

**Request Body:**
```json
{
  "join_code": "ABC123"
}
```

**Response:**
```json
{
  "message": "Successfully joined Grade 7 - Einstein",
  "enrollment": {
    "id": "uuid",
    "classroom": "uuid",
    "classroom_name": "Einstein",
    "student": "uuid",
    "student_name": "Maria Santos",
    "student_lrn": "123456789012",
    "status": "active",
    "status_display": "Active",
    "enrolled_at": "2024-08-01T10:00:00Z",
    "notes": "",
    "created_at": "2024-08-01T10:00:00Z",
    "updated_at": "2024-08-01T10:00:00Z"
  }
}
```

**Error Responses:**
- 400: Invalid join code, class full, grade level mismatch, already enrolled

### Regenerate Join Code
```http
POST /classrooms/{id}/regenerate_code/
```

**Permission:** Adviser or Admin

**Response:**
```json
{
  "message": "Join code regenerated successfully",
  "join_code": "XYZ789"
}
```

### Get Classroom Enrollments
```http
GET /classrooms/{id}/enrollments/?status=active
```

**Query Parameters:**
- `status` (optional): Filter by enrollment status (active, transferred, dropped, completed)

**Response:**
```json
[
  {
    "id": "uuid",
    "classroom": "uuid",
    "classroom_name": "Einstein",
    "student": "uuid",
    "student_name": "Maria Santos",
    "student_lrn": "123456789012",
    "status": "active",
    "status_display": "Active",
    "enrolled_at": "2024-08-01T10:00:00Z",
    "notes": "",
    "created_at": "2024-08-01T10:00:00Z",
    "updated_at": "2024-08-01T10:00:00Z"
  }
]
```

---

## Class Subjects

### List Class Subjects
```http
GET /class-subjects/?classroom={uuid}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "classroom": "uuid",
    "classroom_name": "Einstein",
    "subject": "uuid",
    "subject_name": "English 7",
    "subject_code": "ENG7",
    "teacher": "uuid",
    "teacher_name": "Juan Dela Cruz",
    "ww_weight": 30.00,
    "pt_weight": 50.00,
    "qa_weight": 20.00,
    "created_at": "2024-08-01T10:00:00Z",
    "updated_at": "2024-08-01T10:00:00Z"
  }
]
```

### Create Class Subject
```http
POST /class-subjects/
```

**Permission:** Admin only

**Request Body:**
```json
{
  "classroom": "uuid",
  "subject": "uuid",
  "teacher": "uuid",
  "ww_weight": 30.00,
  "pt_weight": 50.00,
  "qa_weight": 20.00
}
```

**Validation:** Weights must sum to 100%

---

## Enrollments

### List Enrollments
```http
GET /enrollments/?classroom={uuid}&student={uuid}&status=active
```

**Response:** Same as classroom enrollments above

### Transfer Student
```http
POST /enrollments/{id}/transfer/
```

**Permission:** Admin only

**Request Body:**
```json
{
  "new_classroom_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Student transferred to Grade 7 - Newton",
  "new_enrollment": { ... }
}
```

---

## Role-Based Access Summary

| Endpoint | Student | Teacher | Admin |
|----------|---------|---------|-------|
| List Academic Years | ✓ | ✓ | ✓ |
| Create/Edit Academic Year | - | - | ✓ |
| List Quarters | ✓ | ✓ | ✓ |
| List Subjects | ✓ | ✓ | ✓ |
| Create/Edit Subject | - | - | ✓ |
| List Classrooms | Own only | Teaching/Advised | All |
| Join Class | ✓ | - | - |
| View Join Code | - | Own classes | All |
| Regenerate Join Code | - | Advised only | All |
| List Class Subjects | Enrolled only | Teaching | All |
| Transfer Student | - | - | ✓ |

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "error": "Only administrators can perform this action"
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

---

## Testing with curl

### Login First
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@knhs.edu.ph","password":"admin123"}'
```

### List Classrooms
```bash
curl http://localhost:8000/api/v1/classrooms/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Join Class (Student)
```bash
curl -X POST http://localhost:8000/api/v1/classrooms/join/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"join_code":"ABC123"}'
```
