import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './features/auth/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from './features/auth/ProtectedRoute'
import PublicLayout from './components/layout/PublicLayout'
import DebugPanel from './components/ui/DebugPanel'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ForcePasswordChange from './pages/ForcePasswordChange'
import PlaceholderPage from './pages/PlaceholderPage'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import AdminDashboard from './pages/AdminDashboard'
import MyClasses from './pages/MyClasses'
import JoinClass from './pages/JoinClass'
import ClassDetail from './pages/ClassDetail'
import AssignmentDetail from './pages/AssignmentDetail'
import CreateAssignment from './pages/CreateAssignment'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
            </Route>

            <Route element={<PublicOnlyRoute />}>
              <Route path="login" element={<Login />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="student-dashboard" element={<StudentDashboard />} />
              <Route path="teacher-dashboard" element={<TeacherDashboard />} />
              <Route path="admin-dashboard" element={<AdminDashboard />} />
              <Route path="principal-dashboard" element={<PlaceholderPage title="Principal Dashboard" description="Executive dashboard and approval center coming in Phase 2." />} />
              <Route path="guidance-dashboard" element={<PlaceholderPage title="Guidance Dashboard" description="Student lookup and case management coming in Phase 2." />} />
              <Route path="registrar-dashboard" element={<PlaceholderPage title="Registrar Dashboard" description="Enrollment queue and records management coming soon." />} />
              <Route path="force-password-change" element={<ForcePasswordChange />} />
              <Route path="classes" element={<MyClasses />} />
              <Route path="classes/join" element={<JoinClass />} />
              <Route path="classes/:id" element={<ClassDetail />} />
              <Route
                path="assignments"
                element={
                  <PlaceholderPage
                    title="Assignments"
                    description="Create, submit, and grade assignments coming in Sprint 3."
                  />
                }
              />
              <Route path="assignments/:id" element={<AssignmentDetail />} />
              <Route path="assignments/create" element={<CreateAssignment />} />
              <Route
                path="grades"
                element={
                  <PlaceholderPage
                    title="Grades"
                    description="DepEd WW/PT/QA grade input coming in Sprint 4."
                  />
                }
              />
              <Route
                path="attendance"
                element={
                  <PlaceholderPage
                    title="Attendance"
                    description="Daily attendance marking coming in Sprint 4."
                  />
                }
              />
              <Route
                path="announcements"
                element={
                  <PlaceholderPage
                    title="Announcements"
                    description="School and class announcements coming in Sprint 5."
                  />
                }
              />
              <Route
                path="schedule"
                element={
                  <PlaceholderPage
                    title="Schedule"
                    description="Class timetable coming in Phase 2."
                  />
                }
              />
              <Route
                path="materials"
                element={
                  <PlaceholderPage
                    title="Materials"
                    description="Learning materials coming soon."
                  />
                }
              />
              <Route
                path="people"
                element={
                  <PlaceholderPage
                    title="People"
                    description="Student and teacher management coming in Sprint 2."
                  />
                }
              />
              <Route
                path="enrollment"
                element={
                  <PlaceholderPage
                    title="Enrollment"
                    description="Online enrollment pipeline coming in Sprint 5."
                  />
                }
              />
              <Route
                path="settings"
                element={
                  <PlaceholderPage
                    title="Settings"
                    description="School settings and academic calendar coming soon."
                  />
                }
              />
              <Route
                path="approvals"
                element={
                  <PlaceholderPage
                    title="Approval Center"
                    description="Principal approval workflows planned for Phase 2."
                  />
                }
              />
              <Route
                path="reports"
                element={
                  <PlaceholderPage
                    title="Reports"
                    description="School reports and analytics planned for Phase 2."
                  />
                }
              />
              <Route
                path="students"
                element={
                  <PlaceholderPage
                    title="Student Records"
                    description="Student lookup and records coming in upcoming sprints."
                  />
                }
              />
              <Route
                path="exports"
                element={
                  <PlaceholderPage
                    title="Exports"
                    description="Class lists and LIS prep exports planned for Phase 2."
                  />
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Debug Panel - Only visible in development */}
          <DebugPanel />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
