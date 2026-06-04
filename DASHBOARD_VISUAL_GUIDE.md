# KNHS Portal - Dashboard Visual Guide

**A visual walkthrough of the three role-specific dashboards**

---

## 🎓 Student Dashboard

### Layout Structure:
```
┌─────────────────────────────────────────────────────────────────┐
│ WELCOME BANNER (Gradient Purple)                                │
│ Welcome back, Juan Dela Cruz                                     │
│ Grade 11 • STEM                                                  │
│ SY 2025-2026 • Quarter 1                                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ Join Class   │ View         │ Check Grades │
│              │ Assignments  │              │
└──────────────┴──────────────┴──────────────┘

┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 📋          │ ⚠️          │ ✅          │ 🔔          │
│ 5           │ 2           │ 8           │ 3           │
│ Pending     │ Overdue     │ Published   │ Unread      │
│ Assignments │             │ Grades      │ Notifs      │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌─────────────────────────────────────┬───────────────────┐
│ DUE SOON                            │ ANNOUNCEMENTS     │
│ ├─ Math Homework (Jun 8)           │ ├─ 🚨 Class      │
│ │  Submit →                         │ │  suspended      │
│ ├─ English Essay (Jun 10)          │ ├─ PE uniform     │
│ │  Submit →                         │ │  reminder       │
│ ├─ Science Lab Report (Jun 12)     │ └─ View all →     │
│ │  Submit →                         │                   │
│ └─ View all 5 assignments →        │ QUICK LINKS       │
│                                     │ ├─ 🎒 My Classes  │
│ RECENT GRADES                       │ ├─ 📅 Schedule    │
│ ┌─────────┬────────┬───────┬─────┐ │ └─ 📚 Materials   │
│ │ Subject │ Quarter│ Grade │ Pass│ │                   │
│ ├─────────┼────────┼───────┼─────┤ │                   │
│ │ Math    │ Q1     │  92   │ ✓   │ │                   │
│ │ English │ Q1     │  88   │ ✓   │ │                   │
│ │ Science │ Q1     │  85   │ ✓   │ │                   │
│ └─────────┴────────┴───────┴─────┘ │                   │
└─────────────────────────────────────┴───────────────────┘
```

### Color Scheme:
- **Banner:** Purple gradient (#5E2A84 → #7C3AED)
- **KPI Cards:** Amber (pending), Red (overdue), Green (grades), Blue (notifications)
- **Borders:** Left 4px colored accent on each card

### Key Features:
✅ Academic context (Grade, Strand, Quarter)  
✅ 4 KPI cards with icons  
✅ Due Soon list with submit buttons  
✅ Grades table with pass/fail indicators  
✅ Announcements with urgent badges  
✅ Quick Links sidebar  

---

## 👨‍🏫 Teacher Dashboard

### Layout Structure:
```
┌─────────────────────────────────────────────────────────────────┐
│ WELCOME BANNER (Gradient Purple)                                │
│ Welcome back, Maria Santos                                       │
│ Teacher • EMP-2024-001                                          │
│ SY 2025-2026 • Quarter 1                                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Create       │ Input Grades │ Mark         │ My Classes   │
│ Assignment   │              │ Attendance   │              │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 📝          │ 📄          │ 📊          │ 🎓          │
│ 12          │ 8           │ 15          │ 4           │
│ Active      │ Pending     │ Draft       │ My          │
│ Assignments │ Grading     │ Grades      │ Classes     │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌─────────────────────────────────────┬───────────────────┐
│ PENDING SUBMISSIONS                 │ MY ASSIGNMENTS    │
│ ├─ Math Homework                    │ ├─ Math Quiz 1    │
│ │  Juan Dela Cruz (Jun 3)          │ │  Due: Jun 8      │
│ │  Grade →                          │ │  Status: Active  │
│ ├─ Math Homework (LATE)            │ ├─ English Essay  │
│ │  Pedro Garcia (Jun 5)            │ │  Due: Jun 10     │
│ │  Grade →                          │ │  Status: Active  │
│ └─ View all 8 submissions →        │ └─ View all →     │
│                                     │                   │
│ DRAFT GRADES                        │ QUICK LINKS       │
│ ┌─────────┬────────┬────┬────────┐ │ ├─ 📚 Upload      │
│ │ Student │ Subject│ Q  │ Grade  │ │ │  Materials      │
│ ├─────────┼────────┼────┼────────┤ │ ├─ 📢 Post        │
│ │ Juan DC │ Math   │ Q1 │ Draft  │ │ │  Announcement   │
│ │ Maria S │ Math   │ Q1 │ Draft  │ │ └─ 📅 Schedule    │
│ └─────────┴────────┴────┴────────┘ │                   │
└─────────────────────────────────────┴───────────────────┘
```

### Color Scheme:
- **Banner:** Purple gradient
- **KPI Cards:** Purple (assignments), Amber (ungraded), Blue (drafts), Green (classes)
- **Late Badge:** Red pill with "Late Submission"

### Key Features:
✅ Employee ID display  
✅ Teacher-specific actions (Create, Grade, Attendance)  
✅ Ungraded submissions with late indicators  
✅ Draft grades table  
✅ Recent assignments with status  
✅ Quick Links: Materials, Announcements, Schedule  

---

## 🛡️ Admin Dashboard

### Layout Structure:
```
┌─────────────────────────────────────────────────────────────────┐
│ WELCOME BANNER (Gradient Purple)                                │
│ School Administrator                                             │
│ Admin User                                                       │
│ System Management & Configuration                               │
│ SY 2025-2026 • Quarter 1                                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Manage       │ Enrollment   │ Manage       │ System       │
│ Users        │ Queue        │ Classes      │ Settings     │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 👥          │ 👨‍🏫         │ 🏫          │ 📋          │
│ 850         │ 45          │ 32          │ 12          │
│ Active      │ Teachers    │ Active      │ Pending     │
│ Students    │             │ Classes     │ Enrollments │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌─────────────────────────────────────┬───────────────────┐
│ SYSTEM OVERVIEW                     │ RECENT ACTIVITY   │
│ ├─ Academic Year                    │ ├─ System Status  │
│ │  SY 2025-2026         [Active]    │ │  All systems    │
│ ├─ Current Quarter                  │ │  operational    │
│ │  Q1 • Jun 1 - Aug 31  [Q1]       │ │  ✓ Backend      │
│ ├─ Enrollment Status                │ ├─ Academic Year  │
│ │  Online system ready  [Config]    │ │  SY 2025-2026   │
│                                     │ │  4 quarters     │
│ MANAGEMENT TASKS                    │ ├─ Database       │
│ ┌──────────────┬──────────────┐    │ │  19 models      │
│ │ 👥 Student   │ 👨‍🏫 Teacher  │    │ │  88 endpoints   │
│ │ Management   │ Management   │    │ │  ✓ Connected    │
│ ├──────────────┼──────────────┤    │                   │
│ │ 🏫 Class     │ 📊 Grade     │    │ ADMIN TOOLS       │
│ │ Management   │ Oversight    │    │ ├─ 📢 School      │
│ └──────────────┴──────────────┘    │ │  Announcement   │
│                                     │ ├─ 📈 Generate    │
│                                     │ │  Reports        │
│                                     │ └─ 📝 Audit Logs  │
└─────────────────────────────────────┴───────────────────┘
```

### Color Scheme:
- **Banner:** Purple gradient
- **KPI Cards:** Blue (students), Purple (teachers), Green (classes), Amber (enrollments)
- **Status Badges:** Green (Active), Blue (Q1), configurable

### Key Features:
✅ System-wide statistics  
✅ Academic year overview with status badges  
✅ Management Tasks grid (4 clickable cards)  
✅ Hover effects on management cards  
✅ Recent Activity feed  
✅ Admin Tools sidebar  
✅ System health indicators  

---

## 🎨 Design Patterns Used

### 1. Welcome Banner (All Dashboards)
```jsx
<div className="rounded-2xl bg-gradient-to-r from-knhs-purple to-purple-700 p-6 text-white shadow-lg">
  <p className="text-sm opacity-90">Role Label</p>
  <h1 className="text-3xl font-bold">User Name</h1>
  <p className="mt-1 text-purple-100">Context Info</p>
  <p className="mt-2 text-sm text-purple-200">Academic Year • Quarter</p>
</div>
```

### 2. KPI Card Pattern
```jsx
<Card className="border-l-4 border-l-{color}-500">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
    <div className="rounded-lg bg-{color}-100 p-3">
      <Icon className="h-6 w-6 text-{color}-600" />
    </div>
  </div>
</Card>
```

### 3. 2-Column Layout
```jsx
<div className="grid gap-8 lg:grid-cols-3">
  {/* Left: 2/3 width */}
  <div className="space-y-8 lg:col-span-2">
    {/* Priority widgets */}
  </div>
  
  {/* Right: 1/3 width */}
  <div className="space-y-8">
    {/* Activity feed + Quick Links */}
  </div>
</div>
```

### 4. List Item Pattern
```jsx
<div className="flex items-start justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
  <div className="flex-1">
    <h4 className="font-medium text-text">{title}</h4>
    <p className="text-sm text-muted">{metadata}</p>
  </div>
  <Button size="sm">{action}</Button>
</div>
```

### 5. Quick Link Pattern
```jsx
<Link to={path} className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
  <div className="flex items-center gap-3">
    <div className="rounded bg-{color}-100 p-2">
      <Icon className="h-5 w-5 text-{color}-600" />
    </div>
    <div>
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="text-xs text-muted">{description}</p>
    </div>
  </div>
</Link>
```

---

## 📱 Responsive Breakpoints

### Mobile (< 768px):
- KPI cards stack vertically
- 2-column layout becomes single column
- Quick actions wrap to multiple rows
- Tables scroll horizontally

### Tablet (768px - 1024px):
- KPI cards: 2 columns
- Main content still stacked
- Welcome banner responsive padding

### Desktop (> 1024px):
- KPI cards: 4 columns
- 2-column layout activates (2/3 + 1/3)
- Full hover effects
- Optimal spacing

---

## 🔗 Navigation Flow

### Student Journey:
```
Login → /dashboard → redirect → /student-dashboard
↓
Click "Join Class" → /classes/join (placeholder)
Click "View Assignments" → /assignments (placeholder)
Click "My Classes" → /classes (placeholder)
Click assignment → /assignments/:id (to build)
```

### Teacher Journey:
```
Login → /dashboard → redirect → /teacher-dashboard
↓
Click "Create Assignment" → /assignments/create (to build)
Click "Grade" button → /submissions/:id (to build)
Click "Input Grades" → /grades (to build)
Click "Mark Attendance" → /attendance (to build)
```

### Admin Journey:
```
Login → /dashboard → redirect → /admin-dashboard
↓
Click "Manage Users" → /people (placeholder)
Click "Enrollment Queue" → /enrollment (placeholder)
Click "Manage Classes" → /classes (to build)
Click "System Settings" → /settings (placeholder)
```

---

## 🎯 Blueprint Compliance Checklist

### Layout Requirements:
- ✅ Welcome banner with gradient
- ✅ Quick actions (3-4 buttons)
- ✅ KPI cards row (4 metrics)
- ✅ 2-column main content (2/3 + 1/3)
- ✅ Mobile-first responsive

### Branding:
- ✅ DepEd purple (#5E2A84)
- ✅ Purple light (#7C3AED)
- ✅ Color-coded KPIs
- ✅ Consistent spacing (4px base)

### User Experience:
- ✅ Max 2 clicks to primary tasks
- ✅ Role-specific actions
- ✅ Loading states
- ✅ Empty states
- ✅ Hover effects

### Data Integration:
- ✅ Real backend data
- ✅ Academic year context
- ✅ Role-based filtering
- ✅ Convenience functions

---

## 🚀 What's Next

### Immediate Pages to Build:
1. **My Classes** - List view with class cards
2. **Join Class Form** - Simple code input
3. **Assignment Detail** - View and submit
4. **Grade Input** - WW/PT/QA table
5. **Attendance** - Roster with P/A/L/E toggles

### Navigation Components:
- Sidebar with active state
- Breadcrumbs for deep pages
- Notifications dropdown in header

### Shared Components:
- Empty state illustrations
- Loading skeletons
- Toast notifications
- Modal dialogs

---

**Dashboards are live and functional! 🎉**  
**Backend integration verified ✅**  
**Ready for supporting pages 🚀**

