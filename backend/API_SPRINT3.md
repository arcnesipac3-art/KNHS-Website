# Sprint 3 API Documentation

Complete API reference for learning features, grades, attendance, and communications.

Base URL: `http://localhost:8000/api/v1/`

All endpoints require authentication via Bearer token unless otherwise noted.

---

## 📝 Assignments API

### List Assignments
```http
GET /assignments/?class_subject={uuid}&status=published
```

**Query Parameters:**
- `class_subject` (optional) - Filter by class-subject ID
- `status` (optional) - Filter by status (draft, published, closed)

**Response:**
```json
[
  {
    "id": "uuid",
    "class_subject": "uuid",
    "class_subject_name": "Mathematics 7",
    "classroom_name": "Einstein",
    "title": "Chapter 1 Quiz",
    "description": "Answer all questions on page 10-12",
    "due_date": "2024-10-20T23:59:59Z",
    "max_score": 50.00,
    "status": "published",
    "allow_late_submission": true,
    "attachment_url": "",
    "created_by": "uuid",
    "created_by_name": "Juan Dela Cruz",
    "is_overdue": false,
    "submission_count": 25,
    "created_at": "2024-10-15T10:00:00Z",
    "updated_at": "2024-10-15T10:00:00Z"
  }
]
```

### Create Assignment
```http
POST /assignments/
```

**Permission:** Teacher, Admin

**Request Body:**
```json
{
  "class_subject": "uuid",
  "title": "Chapter 1 Quiz",
  "description": "Answer all questions",
  "due_date": "2024-10-20T23:59:59Z",
  "max_score": 50.00,
  "status": "draft",
  "allow_late_submission": true,
  "attachment_url": "https://storage.com/template.pdf"
}
```

### Publish Assignment
```http
POST /assignments/{id}/publish/
```

**Permission:** Teacher, Admin

**Response:**
```json
{
  "message": "Assignment published successfully"
}
```

### Get Assignment Submissions
```http
GET /assignments/{id}/submissions/
```

**Permission:** Teacher, Admin

**Response:** Array of submission objects

---

## 📤 Submissions API

### Submit Assignment
```http
POST /submissions/submit/
```

**Permission:** Student only

**Request Body:**
```json
{
  "assignment_id": "uuid",
  "file_urls": ["https://storage.com/file1.pdf", "https://storage.com/file2.pdf"],
  "text_response": "My answer to the essay question..."
}
```

**Response:**
```json
{
  "message": "Assignment submitted successfully",
  "submission": {
    "id": "uuid",
    "assignment": "uuid",
    "assignment_title": "Chapter 1 Quiz",
    "student": "uuid",
    "student_name": "Maria Santos",
    "student_lrn": "123456789012",
    "file_urls": ["https://storage.com/file1.pdf"],
    "text_response": "My answer...",
    "submitted_at": "2024-10-18T14:30:00Z",
    "score": null,
    "feedback": "",
    "status": "submitted",
    "is_late": false,
    "graded_at": null,
    "graded_by": null,
    "created_at": "2024-10-18T14:30:00Z"
  }
}
```

### Grade Submission
```http
POST /submissions/{id}/grade/
```

**Permission:** Teacher, Admin

**Request Body:**
```json
{
  "score": 45.00,
  "feedback": "Good work! Check your answer on #3."
}
```

**Response:**
```json
{
  "message": "Submission graded successfully",
  "submission": { ... }
}
```

---

## 📚 Learning Materials API

### List Materials
```http
GET /learning-materials/?class_subject={uuid}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "class_subject": "uuid",
    "class_subject_name": "Mathematics 7",
    "classroom_name": "Einstein",
    "title": "Chapter 1 Module",
    "description": "Self-learning module for algebraic expressions",
    "material_type": "module",
    "material_type_display": "Module",
    "file_url": "https://storage.com/module1.pdf",
    "file_size": 2048576,
    "uploaded_by": "uuid",
    "uploaded_by_name": "Juan Dela Cruz",
    "created_at": "2024-10-15T10:00:00Z"
  }
]
```

### Upload Material
```http
POST /learning-materials/
```

**Permission:** Teacher, Admin

**Request Body:**
```json
{
  "class_subject": "uuid",
  "title": "Chapter 1 Module",
  "description": "Self-learning module",
  "material_type": "module",
  "file_url": "https://storage.com/module1.pdf",
  "file_size": 2048576
}
```

---

## 📊 Grades API

### List Grades
```http
GET /grades/?class_subject={uuid}&quarter={uuid}&student={uuid}
```

**Query Parameters:**
- `class_subject` (optional) - Filter by class-subject
- `quarter` (optional) - Filter by quarter
- `student` (optional) - Filter by student

**Response:**
```json
[
  {
    "id": "uuid",
    "class_enrollment": "uuid",
    "student_name": "Maria Santos",
    "student_lrn": "123456789012",
    "class_subject": "uuid",
    "subject_name": "Mathematics 7",
    "subject_code": "MATH7",
    "classroom_name": "Einstein",
    "quarter": "uuid",
    "quarter_name": "First Quarter",
    "quarter_number": 1,
    "ww_score": 85.00,
    "pt_score": 90.00,
    "qa_score": 88.00,
    "initial_grade": 88.10,
    "transmuted_grade": 92,
    "is_passing": true,
    "status": "published",
    "status_display": "Published",
    "remarks": "Good performance",
    "created_at": "2024-10-15T10:00:00Z",
    "updated_at": "2024-10-20T15:00:00Z"
  }
]
```

### Batch Grade Input
```http
POST /grades/batch_input/
```

**Permission:** Teacher, Admin

**Request Body:**
```json
{
  "class_subject_id": "uuid",
  "quarter_id": "uuid",
  "grades": [
    {
      "student_id": "uuid",
      "ww_score": 85.00,
      "pt_score": 90.00,
      "qa_score": 88.00,
      "remarks": "Good work"
    },
    {
      "student_id": "uuid2",
      "ww_score": 78.00,
      "pt_score": 82.00,
      "qa_score": 80.00
    }
  ]
}
```

**Response:**
```json
{
  "message": "Grades saved successfully",
  "created": 15,
  "updated": 10
}
```

**Note:** Grades auto-compute initial_grade and transmuted_grade on save!

### Publish Grades
```http
POST /grades/publish/
```

**Permission:** Teacher, Admin

**Request Body:**
```json
{
  "class_subject_id": "uuid",
  "quarter_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Published 25 grades successfully",
  "count": 25
}
```

### Unlock Grade
```http
POST /grades/{id}/unlock/
```

**Permission:** Admin only

**Request Body:**
```json
{
  "reason": "Student requested grade review due to computation error in quiz scores"
}
```

**Response:**
```json
{
  "message": "Grade unlocked successfully"
}
```

**Note:** Creates audit log entry

---

## 📅 Attendance API

### List Attendance Records
```http
GET /attendance/?classroom={uuid}&date_from=2024-10-01&date_to=2024-10-31&student={uuid}
```

**Query Parameters:**
- `classroom` (optional) - Filter by classroom
- `date_from` (optional) - Start date
- `date_to` (optional) - End date
- `student` (optional) - Filter by student

**Response:**
```json
[
  {
    "id": "uuid",
    "class_enrollment": "uuid",
    "student_name": "Maria Santos",
    "student_lrn": "123456789012",
    "classroom_name": "Einstein",
    "date": "2024-10-15",
    "status": "P",
    "status_display": "Present",
    "notes": "",
    "recorded_by": "uuid",
    "recorded_by_name": "Juan Dela Cruz",
    "created_at": "2024-10-15T08:00:00Z"
  }
]
```

### Bulk Mark Attendance
```http
POST /attendance/bulk_mark/
```

**Permission:** Teacher, Admin

**Request Body:**
```json
{
  "classroom_id": "uuid",
  "date": "2024-10-15",
  "attendance": [
    {
      "student_id": "uuid1",
      "status": "P",
      "notes": ""
    },
    {
      "student_id": "uuid2",
      "status": "A",
      "notes": "Sick"
    },
    {
      "student_id": "uuid3",
      "status": "L",
      "notes": "Arrived 8:15 AM"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Attendance marked successfully",
  "created": 20,
  "updated": 5
}
```

### Attendance Summary
```http
GET /attendance/summary/?classroom={uuid}&date_from=2024-10-01&date_to=2024-10-31
```

**Response:**
```json
[
  {
    "student_id": "uuid",
    "student_name": "Maria Santos",
    "student_lrn": "123456789012",
    "present_count": 18,
    "absent_count": 2,
    "late_count": 1,
    "excused_count": 0,
    "total_days": 21,
    "attendance_rate": 85.71
  }
]
```

---

## 📢 Announcements API

### List Announcements
```http
GET /announcements/?exclude_expired=true
```

**Query Parameters:**
- `exclude_expired` (optional) - Exclude expired announcements

**Response:**
```json
[
  {
    "id": "uuid",
    "author": "uuid",
    "author_name": "Principal Smith",
    "title": "No Classes Tomorrow",
    "body": "Due to inclement weather, all classes are suspended tomorrow, October 16, 2024.",
    "priority": "urgent",
    "priority_display": "Urgent",
    "audience_type": "school",
    "audience_type_display": "School-wide",
    "audience_ref_id": null,
    "audience_metadata": {},
    "published_at": "2024-10-15T16:00:00Z",
    "expires_at": "2024-10-17T00:00:00Z",
    "is_published": true,
    "is_expired": false,
    "is_read": false,
    "attachments": [],
    "created_at": "2024-10-15T15:30:00Z"
  }
]
```

### Create Announcement
```http
POST /announcements/
```

**Permission:** Teacher (classroom only), Admin (all types)

**Request Body:**
```json
{
  "title": "Quiz Reminder",
  "body": "Don't forget our quiz tomorrow on Chapter 1-3.",
  "priority": "normal",
  "audience_type": "classroom",
  "audience_ref_id": "classroom-uuid",
  "audience_metadata": {},
  "expires_at": "2024-10-20T00:00:00Z"
}
```

### Publish Announcement
```http
POST /announcements/{id}/publish/
```

**Request Body:**
```json
{
  "publish_now": true
}
```

OR

```json
{
  "publish_now": false,
  "scheduled_time": "2024-10-16T07:00:00Z"
}
```

### Mark Announcement as Read
```http
POST /announcements/{id}/mark_read/
```

**Response:**
```json
{
  "message": "Announcement marked as read",
  "already_read": false
}
```

### Get Unread Announcements
```http
GET /announcements/unread/
```

---

## 🔔 Notifications API

### List Notifications
```http
GET /notifications/?is_read=false
```

**Query Parameters:**
- `is_read` (optional) - Filter by read status (true/false)

**Response:**
```json
[
  {
    "id": "uuid",
    "user": "uuid",
    "notification_type": "assignment",
    "notification_type_display": "New Assignment",
    "title": "New Assignment: Chapter 1 Quiz",
    "body": "Juan Dela Cruz posted a new assignment in Mathematics 7",
    "link": "/classes/einstein/assignments/uuid",
    "is_read": false,
    "created_at": "2024-10-15T10:00:00Z"
  }
]
```

### Mark All as Read
```http
POST /notifications/mark_all_read/
```

**Response:**
```json
{
  "message": "Marked 12 notifications as read",
  "count": 12
}
```

### Mark Single as Read
```http
POST /notifications/{id}/mark_read/
```

### Get Unread Count
```http
GET /notifications/unread_count/
```

**Response:**
```json
{
  "unread_count": 5
}
```

---

## 🔐 Permission Summary

| Endpoint | Student | Teacher | Admin |
|----------|---------|---------|-------|
| List Assignments | Published only | Own classes | All |
| Create Assignment | - | ✓ | ✓ |
| Publish Assignment | - | Own | All |
| Submit Assignment | ✓ | - | - |
| Grade Submission | - | Own classes | All |
| List Grades | Own published | Own classes | All |
| Input Grades | - | Own subjects | All |
| Publish Grades | - | Own subjects | All |
| Unlock Grade | - | - | ✓ |
| List Attendance | Own | Own classes | All |
| Mark Attendance | - | Own classes | All |
| List Announcements | Targeted | Targeted | All |
| Create Announcement | - | Classroom only | All types |
| List Notifications | Own | Own | Own |

---

## 📈 DepEd Transmutation Reference

**Formula:**
```
Initial Grade = (WW × ww_weight) + (PT × pt_weight) + (QA × qa_weight)
Transmuted Grade = DEPED_TRANSMUTATION[Initial Grade]
```

**Example:**
```
WW: 85, PT: 90, QA: 88
Weights: 30%, 50%, 20%

Initial = (85 × 0.30) + (90 × 0.50) + (88 × 0.20)
        = 25.5 + 45.0 + 17.6
        = 88.1

Transmuted (via table) = 92
```

**Passing Grade:** ≥ 75 (transmuted)

---

## 🚨 Common Error Responses

### 400 Bad Request
```json
{
  "error": "assignment_id is required"
}
```

### 403 Forbidden
```json
{
  "error": "Only teachers and admins can grade submissions"
}
```

### 404 Not Found
```json
{
  "error": "Assignment not found or not published"
}
```

---

## 🧪 Testing Examples

### Submit Assignment (Student)
```bash
curl -X POST http://localhost:8000/api/v1/submissions/submit/ \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignment_id": "assignment-uuid",
    "file_urls": ["https://storage.com/mywork.pdf"],
    "text_response": "My essay answer..."
  }'
```

### Batch Input Grades (Teacher)
```bash
curl -X POST http://localhost:8000/api/v1/grades/batch_input/ \
  -H "Authorization: Bearer TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_subject_id": "math7-einstein-uuid",
    "quarter_id": "q1-uuid",
    "grades": [
      {"student_id": "student1-uuid", "ww_score": 85, "pt_score": 90, "qa_score": 88},
      {"student_id": "student2-uuid", "ww_score": 78, "pt_score": 82, "qa_score": 80}
    ]
  }'
```

### Mark Attendance (Teacher)
```bash
curl -X POST http://localhost:8000/api/v1/attendance/bulk_mark/ \
  -H "Authorization: Bearer TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "classroom_id": "einstein-uuid",
    "date": "2024-10-15",
    "attendance": [
      {"student_id": "student1-uuid", "status": "P"},
      {"student_id": "student2-uuid", "status": "A", "notes": "Sick"}
    ]
  }'
```

---

**Total Sprint 3 Endpoints:** 56  
**Documentation Complete:** ✅
