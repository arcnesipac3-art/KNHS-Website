# KNHS Portal - UI Quick Start Guide

**Get the dashboards running in 5 minutes! 🚀**

---

## ✅ What We Just Built

- **3 Fully Functional Dashboards:**
  - Student Dashboard (340 lines)
  - Teacher Dashboard (395 lines)  
  - Admin Dashboard (360 lines)
- **Role-Based Routing** (auto-redirect by user role)
- **Real Backend Integration** (88 API endpoints)
- **DepEd-Compliant Design** (purple branding, responsive)

---

## 🚀 Quick Start

### Step 1: Start Backend
```bash
cd backend
python manage.py runserver
```

**Expected output:**
```
Django version 4.2.x
Starting development server at http://127.0.0.1:8000/
```

### Step 2: Start Frontend
```bash
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 3: Login and Test

**Open:** http://localhost:5173

**Test Admin Dashboard:**
1. Click "Portal Login"
2. Login with:
   - Email: `admin@knhs.edu.ph`
   - Password: `admin123`
3. **Expected:** Redirects to `/admin-dashboard`
4. **You should see:**
   - Purple gradient welcome banner
   - 4 KPI cards (Students, Teachers, Classes, Enrollments)
   - System Overview section
   - Management Tasks grid
   - Admin Tools sidebar

---

## 🎓 Testing Each Dashboard

### Student Dashboard Test

**Prerequisites:** Create a student account via Django admin or seeder

**Flow:**
1. Login as student
2. Auto-redirected to `/student-dashboard`
3. **Verify:**
   - Welcome shows: Grade level + Strand
   - Quick Actions: Join Class, View Assignments, Check Grades
   - KPI Cards show counts (may be 0 initially)
   - "Due Soon" section (empty state if no assignments)
   - Quick Links sidebar

**Test Data:** Run seeder to populate:
```bash
cd backend
python manage.py seed_sprint3_data
```

### Teacher Dashboard Test

**Prerequisites:** Create a teacher account

**Flow:**
1. Login as teacher
2. Auto-redirected to `/teacher-dashboard`
3. **Verify:**
   - Welcome shows: Employee ID
   - Quick Actions: Create Assignment, Input Grades, Mark Attendance
   - KPI Cards: Assignments, Pending Grading, Draft Grades, Classes
   - "Pending Submissions" section
   - "My Assignments" list in sidebar

### Admin Dashboard Test

**Already working with admin@knhs.edu.ph!**

**Verify:**
- System Overview shows academic year
- Current quarter displayed
- Management Tasks grid (4 clickable cards)
- Recent Activity sidebar
- Admin Tools links

---

## 🔍 What to Look For

### Visual Elements:
✅ **Purple gradient banner** at top  
✅ **4 KPI cards** in a row (colored left borders)  
✅ **Icons** in KPI cards (colored backgrounds)  
✅ **2-column layout** on desktop  
✅ **Hover effects** on cards and links  
✅ **Loading spinner** while fetching data  

### Functionality:
✅ **Auto-redirect** from `/dashboard` to role-specific dashboard  
✅ **Real data** from backend (check console for API calls)  
✅ **Academic year context** shown in banner  
✅ **Quick action buttons** are clickable (some go to placeholders)  
✅ **Responsive** - resize window to test mobile view  

### Console:
- No errors (red text)
- API calls visible: `GET /api/v1/dashboard/`
- Academic year fetch: `GET /api/v1/academic-years/`

---

## 📁 Project Structure (UI)

```
frontend/src/
├── pages/
│   ├── Dashboard.jsx           ← Role router (redirects)
│   ├── StudentDashboard.jsx    ← Student view ⭐
│   ├── TeacherDashboard.jsx    ← Teacher view ⭐
│   ├── AdminDashboard.jsx      ← Admin view ⭐
│   ├── Home.jsx                ← Public homepage
│   ├── Login.jsx               ← Auth
│   └── PlaceholderPage.jsx     ← For unbuilt pages
│
├── lib/
│   ├── api.js                  ← Axios instance
│   ├── academicApi.js          ← Sprint 2 APIs (23 endpoints)
│   └── learningApi.js          ← Sprint 3 APIs (56 endpoints)
│
├── components/
│   ├── ui/
│   │   ├── Card.jsx            ← Reusable card component
│   │   └── Button.jsx          ← Reusable button
│   └── layout/
│       ├── PortalLayout.jsx    ← Auth page wrapper
│       └── PublicLayout.jsx    ← Public page wrapper
│
├── features/
│   └── auth/
│       ├── AuthContext.jsx     ← User state management
│       └── ProtectedRoute.jsx  ← Route guards
│
└── App.jsx                     ← Router configuration
```

---

## 🎨 Color Reference

```css
/* DepEd Branding */
--knhs-purple: #5E2A84       /* Primary */
--purple-700: #7C3AED         /* Gradient */
--background: #F8F7FC         /* Page bg */
--surface: #FFFFFF            /* Cards */
--text: #1E1B2E               /* Body text */
--muted: #6B7280              /* Secondary text */

/* KPI Card Borders */
--blue-500: #3B82F6           /* Students, Notifications */
--purple-500: #8B5CF6         /* Teachers, Assignments */
--green-500: #10B981          /* Classes, Grades */
--amber-500: #F59E0B          /* Pending, Overdue */
--red-500: #EF4444            /* Overdue, Urgent */
```

**Tailwind classes used:**
- `bg-knhs-purple` (custom in tailwind.config)
- `from-knhs-purple to-purple-700` (gradient)
- `border-l-4 border-l-amber-500` (left accent)

---

## 🐛 Troubleshooting

### Issue: Blank dashboard / No data showing

**Solution:**
1. Check backend is running: http://localhost:8000/api/v1/
2. Check browser console for API errors
3. Verify JWT token is valid (check Application → Cookies)
4. Run seeders to populate data:
   ```bash
   python manage.py seed_academic_data
   python manage.py seed_sprint3_data
   ```

### Issue: Not redirecting to role dashboard

**Solution:**
1. Check `user.role` in AuthContext (console.log in Dashboard.jsx)
2. Verify role is one of: student, teacher, admin, principal, guidance, registrar
3. Clear localStorage and re-login

### Issue: "Cannot read property of undefined"

**Solution:**
1. Check if `getCurrentAcademicYearWithQuarters()` returns data
2. Create academic year in Django admin:
   - Go to: http://localhost:8000/admin/
   - Login as admin
   - Create Academic Year → Set as current
   - Create Quarters (Q1-Q4)

### Issue: 404 on API calls

**Solution:**
1. Verify Django is running on port 8000
2. Check `frontend/src/lib/api.js` baseURL
3. Check CORS settings in `backend/config/settings.py`

---

## 📊 Expected Data Flow

### Login → Dashboard Flow:
```
1. User submits login form
   ↓
2. POST /api/v1/auth/login/
   ← { access, refresh, user }
   ↓
3. Store tokens in AuthContext
   ↓
4. Navigate to /dashboard
   ↓
5. Dashboard.jsx reads user.role
   ↓
6. useEffect redirects:
   - student → /student-dashboard
   - teacher → /teacher-dashboard
   - admin → /admin-dashboard
   ↓
7. Role dashboard loads:
   - Fetches dashboard data
   - Fetches academic year
   - Renders widgets
```

### API Calls Made:
```javascript
// StudentDashboard
GET /api/v1/announcements/unread/
GET /api/v1/notifications/?is_read=false
GET /api/v1/assignments/?status=published
GET /api/v1/grades/
GET /api/v1/submissions/
GET /api/v1/academic-years/
GET /api/v1/quarters/

// TeacherDashboard
GET /api/v1/assignments/
GET /api/v1/submissions/
GET /api/v1/grades/
GET /api/v1/academic-years/

// AdminDashboard
GET /api/v1/dashboard/
GET /api/v1/academic-years/
```

---

## 🎯 Test Checklist

### Visual Tests:
- [ ] Purple gradient banner visible
- [ ] User name displays correctly
- [ ] Academic year shows (e.g., "SY 2025-2026 • Q1")
- [ ] 4 KPI cards in a row
- [ ] Icons render in KPI cards
- [ ] Quick action buttons visible
- [ ] 2-column layout on desktop
- [ ] Single column on mobile (resize to <768px)
- [ ] Hover effects work on cards
- [ ] "View all →" links styled correctly

### Functional Tests:
- [ ] Login redirects to role dashboard
- [ ] Logout works (returns to homepage)
- [ ] KPI cards show correct numbers
- [ ] Empty states display when no data
- [ ] Loading spinner appears initially
- [ ] Quick action buttons navigate (may be placeholders)
- [ ] Quick Links sidebar works
- [ ] Browser back button works
- [ ] Refresh preserves auth state

### Responsive Tests:
- [ ] Mobile: Cards stack vertically
- [ ] Tablet: 2-column KPI grid
- [ ] Desktop: 4-column KPI grid
- [ ] Desktop: 2-column main layout (2/3 + 1/3)
- [ ] Text remains readable at all sizes
- [ ] No horizontal scroll

---

## 🚀 Next Steps

### Immediate (Priority 1):
1. **My Classes Page** - List enrolled/teaching classes
2. **Join Class Form** - Student enter join code
3. **Assignment Detail** - View assignment + submit

### Short Term (Priority 2):
4. **Grade Input Page** - WW/PT/QA table for teachers
5. **Attendance Page** - Mark P/A/L/E for roster
6. **Announcements Feed** - List with filters

### Medium Term (Priority 3):
7. **People Management** - Admin CRUD for users
8. **Class Management** - Create/edit classes
9. **Settings Page** - Academic year config

---

## 📚 Reference Docs

- **UI_PHASE_STATUS.md** - Detailed implementation notes
- **DASHBOARD_VISUAL_GUIDE.md** - Visual layouts and patterns
- **KNHSPortalBlueprint.md** - Master blueprint (section 7: UI/UX)
- **PROJECT_STATUS.md** - Overall backend status (88 endpoints)
- **API_SPRINT2.md** - Academic structure APIs
- **API_SPRINT3.md** - Learning features APIs

---

## 🎉 Success Criteria

**Your dashboards are working if:**

✅ You can login as admin  
✅ You're redirected to `/admin-dashboard`  
✅ You see a purple gradient banner with your name  
✅ 4 KPI cards display (even if counts are 0)  
✅ System Overview shows academic year status  
✅ Management Tasks grid shows 4 clickable cards  
✅ No errors in browser console  
✅ Page is responsive (test mobile view)  

**Congratulations! Your KNHS Portal UI is live! 🎉**

---

**Questions? Check the documentation or review the code in:**
- `frontend/src/pages/StudentDashboard.jsx`
- `frontend/src/pages/TeacherDashboard.jsx`
- `frontend/src/pages/AdminDashboard.jsx`

