# Kiwalan National High School — Official Digital Campus

School Management and Learning Portal for KNHS, Iligan City, Lanao del Norte.

## 🎯 Project Status

✅ **Sprint 1 Complete:** Authentication, user roles, portal shell  
✅ **Sprint 2 Complete:** Academic structure, classrooms, join codes  
⏳ **Sprint 3 Next:** Assignments, grades, attendance, announcements

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[SPRINT2_INDEX.md](SPRINT2_INDEX.md)** | Documentation navigation guide |
| **[README_SPRINT2.md](README_SPRINT2.md)** | Sprint 2 overview & getting started |
| **[QUICKSTART_SPRINT2.md](QUICKSTART_SPRINT2.md)** | 5-minute quick start |
| **[API_SPRINT2.md](backend/API_SPRINT2.md)** | Complete API reference |
| **[SPRINT2_ARCHITECTURE.md](SPRINT2_ARCHITECTURE.md)** | System architecture |
| **[KNHSPortalBlueprint.md](KNHSPortalBlueprint.md)** | Full system blueprint |

---

## 🚀 Quick Start

### Backend Setup

```bash
cd backend

# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate        # Windows
source venv/bin/activate       # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env         # Windows
cp .env.example .env           # Mac/Linux

# Run migrations
python manage.py migrate

# Seed initial data
python manage.py seed_admin            # Create admin user
python manage.py seed_academic_data    # Create sample academic data

# Start server
python manage.py runserver
```

**Server runs at:** http://localhost:8000

**Admin Panel:** http://localhost:8000/admin/
- Email: `admin@knhs.edu.ph`
- Password: `admin123`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs at:** http://localhost:5173

---

## 🛠️ Tech Stack

- **Backend:** Django 4.2 + Django REST Framework + SimpleJWT
- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Database:** SQLite (dev) / PostgreSQL (production-ready)
- **Authentication:** JWT with httpOnly refresh cookies

---

## 🎓 Sprint 2 Features

### ✅ Academic Structure
- **Academic Years** - School year management (SY 2024-2025)
- **Quarters** - Q1-Q4 grading periods
- **Subjects** - Master catalog with grade level & strand support
- **Classrooms** - Homeroom management with join codes
- **Class Subjects** - Subject-teacher assignments with DepEd weights
- **Enrollments** - Student roster with status tracking

### 🎫 Join Code System
- 6-character unique codes per classroom
- Students join classes via code
- Teachers/advisers can regenerate codes
- Automatic validation (capacity, grade level)

### 👥 Role-Based Access
- **Student** - Join classes, view own enrollments
- **Teacher** - View teaching classes, manage roster
- **Adviser** - Additional advisory class management
- **Admin** - Full system control, transfer students
- **Principal** - Oversight access
- **Registrar** - Enrollment management
- **Guidance** - Student support

### 📊 DepEd Compliance
- Component weights: WW (30%), PT (50%), QA (20%)
- Configurable per class-subject
- Ready for grade computation (Sprint 3)

---

## 📡 API Endpoints

### Sprint 1 (Authentication)
```
POST   /api/v1/auth/login/
POST   /api/v1/auth/refresh/
POST   /api/v1/auth/logout/
GET    /api/v1/auth/me/
GET    /api/v1/health/
```

### Sprint 2 (Academic Structure)
```
# Academic Years (5 endpoints)
GET/POST /api/v1/academic-years/
POST     /api/v1/academic-years/{id}/set_current/

# Quarters (4 endpoints)
GET/POST /api/v1/quarters/

# Subjects (5 endpoints)
GET/POST /api/v1/subjects/

# Classrooms (7 endpoints)
GET/POST /api/v1/classrooms/
POST     /api/v1/classrooms/join/                    ⭐ Student join
POST     /api/v1/classrooms/{id}/regenerate_code/    ⭐ Regenerate code
GET      /api/v1/classrooms/{id}/enrollments/        ⭐ View roster

# Class Subjects (5 endpoints)
GET/POST /api/v1/class-subjects/

# Enrollments (6 endpoints)
GET/POST /api/v1/enrollments/
POST     /api/v1/enrollments/{id}/transfer/          ⭐ Transfer student
```

**Total:** 32 endpoints (9 Sprint 1 + 23 Sprint 2)

📖 **Full API docs:** [backend/API_SPRINT2.md](backend/API_SPRINT2.md)

---

## 📁 Project Structure

```
Website Official/
├── backend/
│   ├── apps/
│   │   ├── accounts/          # Users, profiles, auth (Sprint 1)
│   │   ├── academics/         # Academic structure (Sprint 2) ⭐
│   │   │   ├── models.py      # 6 models (280 lines)
│   │   │   ├── serializers.py # 9 serializers (160 lines)
│   │   │   ├── views.py       # 6 viewsets (250 lines)
│   │   │   ├── permissions.py # 5 permission classes
│   │   │   └── admin.py       # Django admin interfaces
│   │   └── system/            # Health, dashboard (Sprint 1)
│   ├── config/                # Django settings
│   └── db.sqlite3             # Database with sample data
│
├── frontend/
│   └── src/
│       ├── components/        # UI components + layouts
│       ├── features/          # Auth context
│       ├── lib/
│       │   ├── api.js         # Base API client
│       │   └── academicApi.js # Academic API client (Sprint 2) ⭐
│       └── pages/             # Route pages
│
├── Documentation/
│   ├── KNHSPortalBlueprint.md # Full system blueprint
│   ├── README_SPRINT2.md      # Sprint 2 overview
│   ├── QUICKSTART_SPRINT2.md  # Quick start guide
│   ├── API_SPRINT2.md         # API reference
│   ├── SPRINT2_ARCHITECTURE.md # Architecture guide
│   ├── SPRINT2_COMPLETE.md    # Implementation details
│   ├── SPRINT2_VISUAL_SUMMARY.md # Visual diagrams
│   └── SPRINT2_INDEX.md       # Documentation index
│
└── README.md                  # This file
```

---

## 🧪 Testing

### Manual API Testing

```bash
# 1. Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@knhs.edu.ph","password":"admin123"}'

# 2. List classrooms (copy access_token from login)
curl http://localhost:8000/api/v1/classrooms/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 3. Join class as student
curl -X POST http://localhost:8000/api/v1/classrooms/join/ \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"join_code":"GACSM3"}'
```

### Django Admin Testing

1. Go to http://localhost:8000/admin/
2. Navigate to **Academics** section
3. View classrooms and their join codes
4. Create/edit academic data

---

## 📊 Sample Data Included

After running `python manage.py seed_academic_data`:

- **1 Academic Year:** SY 2024-2025
- **4 Quarters:** Q1-Q4 with proper dates
- **14 Subjects:** Grade 7-8 JHS + Grade 11 STEM subjects
- **6 Classrooms:** 
  - Grade 7: Einstein, Newton (40 capacity)
  - Grade 8: Darwin, Hawking (40 capacity)
  - Grade 11 STEM: Section A, Section B (35 capacity)
- **All subjects assigned** to respective classrooms

---

## 🎯 Sprint 2 Achievement Summary

| Metric | Count |
|--------|-------|
| Database Models | 6 |
| API Endpoints | 23 |
| Permission Classes | 5 |
| Serializers | 9 |
| ViewSets | 6 |
| Admin Interfaces | 6 |
| Backend LOC | ~980 |
| Frontend API Client | 260 lines |
| Documentation | 7 files (~3,650 lines) |

---

## 🔜 Next: Sprint 3

Sprint 3 will implement the **learning features**:

- 📝 **Assignments** - Create, submit, grade
- 📊 **Grades** - WW/PT/QA input, DepEd transmutation
- 📅 **Attendance** - Daily marking (P/A/L/E)
- 📢 **Announcements** - School & class communications
- 📚 **Learning Materials** - Upload/download per subject
- 🎨 **UI Pages** - Dashboards, My Classes, Assignment flow

**Say "Continue Sprint 3" to begin!**

---

## 🤝 Development Commands

```bash
# Backend
python manage.py makemigrations      # Create migrations
python manage.py migrate             # Apply migrations
python manage.py seed_admin          # Create admin user
python manage.py seed_academic_data  # Seed sample data
python manage.py runserver           # Start server
python manage.py shell               # Django shell

# Frontend
npm install                          # Install dependencies
npm run dev                          # Development server
npm run build                        # Production build
npm run lint                         # ESLint check
```

---

## 📖 Learning Resources

**New to the project?**
1. Read [README_SPRINT2.md](README_SPRINT2.md) for overview
2. Follow [QUICKSTART_SPRINT2.md](QUICKSTART_SPRINT2.md) for setup
3. Check [SPRINT2_INDEX.md](SPRINT2_INDEX.md) for documentation guide

**Frontend developer?**
- [backend/API_SPRINT2.md](backend/API_SPRINT2.md) - API reference
- [frontend/src/lib/academicApi.js](frontend/src/lib/academicApi.js) - API client

**Backend developer?**
- [SPRINT2_ARCHITECTURE.md](SPRINT2_ARCHITECTURE.md) - System design
- [backend/apps/academics/](backend/apps/academics/) - Source code

---

## 🎉 Milestones

- ✅ **Sprint 1** - Authentication & User Management (Complete)
- ✅ **Sprint 2** - Academic Structure & Join Codes (Complete)
- ⏳ **Sprint 3** - Learning Features (Next)
- 📅 **Sprint 4** - DepEd Reports & SF9 (Planned)
- 📅 **Sprint 5** - Enrollment Pipeline (Planned)

---

## 📞 Project Info

**School:** Kiwalan National High School  
**Location:** Iligan City, Lanao del Norte, Philippines  
**Purpose:** Digital campus for academic management & learning  
**Blueprint:** DepEd-compliant with MATATAG curriculum support  
**Stack:** Django + React + PostgreSQL  

---

**Built for KNHS with ❤️**
