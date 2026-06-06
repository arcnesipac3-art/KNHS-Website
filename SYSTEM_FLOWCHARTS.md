# System Flowcharts

Visual flowcharts for the major systems in the KNHS portal.

These diagrams use Mermaid syntax and can be viewed in Markdown renderers that support Mermaid.

## 1. Authentication and Accounts

```mermaid
flowchart TD
    A[User opens app] --> B[AuthProvider bootstrap]
    B --> C[POST /auth/refresh/]
    C -->|success| D[Store access token]
    D --> E[GET /auth/me/]
    E --> F[Load user profile and role]
    C -->|fail| G[Clear token and stay logged out]

    H[Login page] --> I[POST /auth/login/]
    I --> J{Valid credentials and approved?}
    J -->|No| K[Return error]
    J -->|Yes| L[Return access token + refresh cookie]
    L --> F

    F --> M[ProtectedRoute]
    M --> N{Allowed role?}
    N -->|No| O[Redirect to role home]
    N -->|Yes| P[Open portal page]

    P --> Q[Admin user management]
    Q --> R[Create, update, activate, deactivate, delete users]

    P --> S[Parent-student linking]
    S --> T[Parent requests link]
    T --> U[Admin/Registrar approves or rejects]
    U --> V[Parent can view approved children]
```

## 2. Academic Structure

```mermaid
flowchart TD
    A[Admin manages school structure] --> B[Academic Years]
    A --> C[Quarters]
    A --> D[Subjects]
    A --> E[Classrooms]
    A --> F[Class Subjects]
    A --> G[Timetable]

    E --> H[Join code auto-generated]
    H --> I[Teacher shares code]

    J[Student enters join code] --> K[POST /classrooms/join/]
    K --> L{Valid code and active class?}
    L -->|No| M[Return error]
    L -->|Yes| N{Grade match and not already enrolled?}
    N -->|No| M
    N -->|Yes| O[Create ClassEnrollment]
    O --> P[Student sees class in My Classes]

    Q[Teacher opens class] --> R[GET /classrooms/:id/]
    R --> S[Load class detail]
    S --> T[GET /classrooms/:id/enrollments/]
    T --> U[View roster]

    V[Admin transfers student] --> W[POST /enrollments/:id/transfer/]
    W --> X[Old enrollment marked transferred]
    X --> Y[New enrollment created]
```

## 3. Learning System

```mermaid
flowchart TD
    A[Teacher selects class-subject] --> B[Create assignment]
    B --> C[Save draft assignment]
    C --> D[Publish assignment]
    D --> E[Create student notifications]
    E --> F[Students see assignment]

    F --> G[Student opens assignment]
    G --> H[Submit text/files]
    H --> I[POST /submissions/submit/]
    I --> J{Enrolled and assignment published?}
    J -->|No| K[Return error]
    J -->|Yes| L[Create or update submission]
    L --> M[Mark submitted or late]
    M --> N[Notify teacher]

    O[Teacher views submissions] --> P[GET /assignments/:id/submissions/]
    P --> Q[Grade submission]
    Q --> R[POST /submissions/:id/grade/]
    R --> S[Save score and feedback]
    S --> T[Notify student]

    U[Teacher uploads material] --> V[POST /learning-materials/]
    V --> W[Students in enrolled classes can access materials]
```

## 4. Grading Workflow

```mermaid
flowchart TD
    A[Teacher opens grade input] --> B[Batch input scores WW/PT/QA]
    B --> C[POST /grades/batch_input/]
    C --> D[Grades saved as draft/computed]

    D --> E[Submit for approval]
    E --> F[POST /grades/submit_for_approval/]
    F --> G{All grades complete?}
    G -->|No| H[Return validation error]
    G -->|Yes| I[Status becomes pending_approval]
    I --> J[Notify principal/admin]

    J --> K[Approval Center]
    K --> L{Approve or Reject?}

    L -->|Approve| M[POST /grades/publish/]
    M --> N[Status becomes published]
    N --> O[Notify students]
    O --> P[Students can view grades]

    L -->|Reject| Q[POST /grades/reject/]
    Q --> R[Status returns to computed]
    R --> S[Notify teacher for revision]

    P --> T[Optional lock]
    T --> U[POST /grades/lock/]
    U --> V[Status becomes locked]

    V --> W[Admin/Principal may unlock]
    W --> X[POST /grades/:id/unlock/]
    X --> Y[Back to computed for edits]

    P --> Z[Generate SF9/report card data or PDF]
```

## 5. Attendance System

```mermaid
flowchart TD
    A[Teacher opens attendance page] --> B[Choose classroom and date]
    B --> C[Load active enrollments]
    C --> D[Mark P / A / L / E]
    D --> E[POST /attendance/bulk_mark/]
    E --> F[Create or update attendance records]

    G[Teacher/Admin requests summary] --> H[GET /attendance/summary/]
    H --> I[Aggregate attendance by student]
    I --> J[Return present, absent, late, excused, rate]

    K[Student opens attendance history] --> L[GET /attendance/?student=current]
    L --> M[Role-filtered records returned]

    N[SF9/report flow] --> O[GET /attendance/quarterly_rollup/]
    O --> P[Quarter attendance rollup returned]
```

## 6. Communications System

```mermaid
flowchart TD
    A[Teacher/Admin creates announcement] --> B[Save announcement]
    B --> C[Publish announcement]
    C --> D[Resolve audience]
    D --> E[School]
    D --> F[Role]
    D --> G[Grade level]
    D --> H[Classroom]

    E --> I[Create notifications]
    F --> I
    G --> I
    H --> I

    I --> J[Users receive in-app notifications]
    J --> K[User opens notifications panel]
    K --> L[Mark one or all as read]

    M[User opens announcements page] --> N[GET /announcements/]
    N --> O[Backend filters by role and audience]
    O --> P[Visible announcements returned]
    P --> Q[User marks announcement read]

    R[User starts message thread] --> S[Create thread + participants]
    S --> T[Create first message]
    T --> U[Participants read/reply in thread]
```

## 7. Enrollment System

```mermaid
flowchart TD
    A[Applicant opens public enrollment form] --> B[Fill personal, contact, academic, guardian, documents]
    B --> C[POST /enrollment-applications/]
    C --> D[Application saved]
    D --> E[Tracking number returned]
    E --> F[Applicant checks status later]

    F --> G[GET /enrollment-applications/track/?tracking_number=...]
    G --> H[Current status shown]

    I[Registrar/Admin opens Enrollment Management] --> J[GET /enrollment-applications/]
    J --> K[Filter by status / grade / strand]
    K --> L[Review application]
    L --> M[PATCH /enrollment-applications/:id/review/]
    M --> N[Status updated]
    N --> O[Status history saved]
    O --> P[Status email triggered]
    P --> Q[System event logged]

    N --> R[Applicant sees updated status using tracking number]
```

## 8. Analytics and Dashboard System

```mermaid
flowchart TD
    A[Admin/Principal opens dashboard] --> B[GET /dashboard/ or /analytics/dashboard_overview/]
    B --> C[Collect attendance stats]
    B --> D[Collect grade stats]
    B --> E[Collect assignment stats]
    B --> F[Collect active user counts]
    C --> G[Return overview cards]
    D --> G
    E --> G
    F --> G

    H[Analytics page] --> I[Attendance overview]
    H --> J[Grade analytics]
    H --> K[Assignment analytics]

    I --> L[Filter by date range and classroom]
    L --> M[Return trends + chronic absences]

    J --> N[Filter by quarter, grade, subject]
    N --> O[Return distribution + passing rate + at-risk students]

    K --> P[Filter by class-subject/date]
    P --> Q[Return submission rate + average score + weak assignments]
```

## 9. Settings and CMS

```mermaid
flowchart TD
    A[Public page loads] --> B[GET /school-settings/public_settings/]
    B --> C[Load public branding info]

    A --> D[GET /content-blocks/public/]
    D --> E[Load active public content]

    F[Admin opens settings] --> G[GET /school-settings/]
    G --> H[View full settings]
    H --> I[PATCH /school-settings/:id/]
    I --> J[Save updated settings]

    K[Admin opens content editor] --> L[GET /content-blocks/]
    L --> M[Create / update / delete content blocks]
    M --> N[Updated public content appears on website]
```

## 10. Full Platform View

```mermaid
flowchart LR
    A[Frontend Pages] --> B[API Client]
    B --> C[JWT Auth + Refresh]
    C --> D[Django API Router]

    D --> E[Accounts]
    D --> F[Academics]
    D --> G[Learning]
    D --> H[Grading]
    D --> I[Attendance]
    D --> J[Communications]
    D --> K[Enrollment]
    D --> L[System Analytics]
    D --> M[Core Settings/CMS]

    E --> N[(Database)]
    F --> N
    G --> N
    H --> N
    I --> N
    J --> N
    K --> N
    L --> N
    M --> N
```

## Reference Files

- Frontend routing: `frontend/src/App.jsx`
- Auth flow: `frontend/src/features/auth/AuthContext.jsx`
- API client: `frontend/src/lib/api.js`
- Accounts: `backend/apps/accounts/views.py`
- Academics: `backend/apps/academics/views.py`
- Learning: `backend/apps/learning/views.py`
- Grading: `backend/apps/grading/views.py`
- Attendance: `backend/apps/attendance/views.py`
- Communications: `backend/apps/communications/views.py`
- Enrollment: `backend/apps/enrollment/views.py`
- Analytics/System: `backend/apps/system/views.py`
- Core settings/CMS: `backend/apps/core/views.py`
