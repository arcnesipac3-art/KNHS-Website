import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useEffect } from 'react'
import { AuthProvider } from './features/auth/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from './features/auth/ProtectedRoute'
import PublicLayout from './components/layout/PublicLayout'
import DebugPanel from './components/ui/DebugPanel'
import ErrorBoundary from './components/ui/ErrorBoundary'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { initPostHog } from './lib/analytics'
import { initSentry } from './lib/sentry'

// Keep the Render free-tier backend alive — ping /api/health/ (no DB, no auth, <5ms)
// every 9 minutes so the server never hits the 15-min inactivity sleep threshold.
const HEALTH_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api/health/'

function useKeepAlive() {
  useEffect(() => {
    fetch(HEALTH_URL, { method: 'GET', mode: 'cors' }).catch(() => {})
    const interval = setInterval(() => {
      fetch(HEALTH_URL, { method: 'GET', mode: 'cors' }).catch(() => {})
    }, 9 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])
}

// Eager load critical pages
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// Lazy load other pages for code splitting
const About = lazy(() => import('./pages/About'))
const Academics = lazy(() => import('./pages/Academics'))
const News = lazy(() => import('./pages/News'))
const Contact = lazy(() => import('./pages/Contact'))
const ForcePasswordChange = lazy(() => import('./pages/ForcePasswordChange'))
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const PrincipalDashboard = lazy(() => import('./pages/PrincipalDashboard'))
const MyClasses = lazy(() => import('./pages/MyClasses'))
const JoinClass = lazy(() => import('./pages/JoinClass'))
const ClassDetail = lazy(() => import('./pages/ClassDetail'))
const AssignmentDetail = lazy(() => import('./pages/AssignmentDetail'))
const CreateAssignment = lazy(() => import('./pages/CreateAssignment'))
const GradeSubmission = lazy(() => import('./pages/GradeSubmission'))
const MarkAttendance = lazy(() => import('./pages/MarkAttendance'))
const AnnouncementList = lazy(() => import('./pages/AnnouncementList'))
const CreateAnnouncement = lazy(() => import('./pages/CreateAnnouncement'))
const GradeInput = lazy(() => import('./pages/GradeInput'))
const StudentGrades = lazy(() => import('./pages/StudentGrades'))
const Materials = lazy(() => import('./pages/Materials'))
const UploadMaterial = lazy(() => import('./pages/UploadMaterial'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'))
const Settings = lazy(() => import('./pages/Settings'))
const EnrollmentApplication = lazy(() => import('./pages/EnrollmentApplication'))
const EnrollmentTracking = lazy(() => import('./pages/EnrollmentTracking'))
const EnrollmentManagement = lazy(() => import('./pages/EnrollmentManagement'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const CreateUser = lazy(() => import('./pages/CreateUser'))
const EditUser = lazy(() => import('./pages/EditUser'))
const ApprovalCenter = lazy(() => import('./pages/ApprovalCenter'))
const AdminUnlockGrades = lazy(() => import('./pages/AdminUnlockGrades'))
const ConductRatings = lazy(() => import('./pages/ConductRatings'))
const ReportCards = lazy(() => import('./pages/ReportCards'))
const Analytics = lazy(() => import('./pages/Analytics'))
const AssignmentList = lazy(() => import('./pages/AssignmentList'))
const AttendanceHistory = lazy(() => import('./pages/AttendanceHistory'))
const GuidanceDashboard = lazy(() => import('./pages/GuidanceDashboard'))
const RegistrarDashboard = lazy(() => import('./pages/RegistrarDashboard'))
const Reports = lazy(() => import('./pages/Reports'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Messages = lazy(() => import('./pages/Messages'))
const Friends = lazy(() => import('./pages/Friends'))
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'))
const ContentEditor = lazy(() => import('./pages/ContentEditor'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  // Initialize analytics and error tracking
  useEffect(() => {
    initPostHog()
    initSentry()
  }, [])

  useKeepAlive()
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route index element={<Home />} />
                  <Route path="about" element={<About />} />
                  <Route path="academics" element={<Academics />} />
                  <Route path="news" element={<News />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="enrollment/apply" element={<EnrollmentApplication />} />
                  <Route path="enrollment/track" element={<EnrollmentTracking />} />
            </Route>

            <Route element={<PublicOnlyRoute />}>
              <Route path="login" element={<Login />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="student-dashboard" element={<StudentDashboard />} />
              <Route path="teacher-dashboard" element={<TeacherDashboard />} />
              <Route path="admin-dashboard" element={<AdminDashboard />} />
              <Route path="principal-dashboard" element={<PrincipalDashboard />} />
              <Route path="guidance-dashboard" element={<GuidanceDashboard />} />
              <Route path="registrar-dashboard" element={<RegistrarDashboard />} />
              <Route path="parent-dashboard" element={<ParentDashboard />} />
              <Route path="force-password-change" element={<ForcePasswordChange />} />
              <Route path="classes" element={<MyClasses />} />
              <Route path="classes/join" element={<JoinClass />} />
              <Route path="classes/:id" element={<ClassDetail />} />
              <Route
                path="assignments"
                element={<AssignmentList />}
              />
              <Route path="assignments/:id" element={<AssignmentDetail />} />
              <Route path="assignments/create" element={<CreateAssignment />} />
              <Route path="submissions/:id" element={<GradeSubmission />} />
              <Route path="attendance/mark" element={<MarkAttendance />} />
              <Route path="announcements" element={<AnnouncementList />} />
              <Route path="announcements/create" element={<CreateAnnouncement />} />
              <Route path="grades/input" element={<GradeInput />} />
              <Route path="grades/conduct" element={<ConductRatings />} />
              <Route path="grades" element={<StudentGrades />} />
              <Route path="report-cards" element={<ReportCards />} />
              <Route path="analytics" element={<Analytics />} />
              <Route
                path="attendance"
                element={<AttendanceHistory />}
              />
              <Route
                path="schedule"
                element={<Schedule />}
              />
              <Route
                path="materials"
                element={<Materials />}
              />
              <Route
                path="materials/upload"
                element={<UploadMaterial />}
              />
              <Route
                path="notifications"
                element={<Notifications />}
              />
              <Route
                path="messages"
                element={<Messages />}
              />
              <Route
                path="friends"
                element={<Friends />}
              />
              <Route
                path="profile"
                element={<Profile />}
              />
              <Route
                path="settings/password"
                element={<ChangePassword />}
              />
              <Route
                path="settings/notifications"
                element={<NotificationSettings />}
              />
              <Route
                path="content-editor"
                element={<ContentEditor />}
              />
              <Route
                path="people"
                element={<Navigate to="/users" replace />}
              />
              <Route
                path="enrollment"
                element={<EnrollmentManagement />}
              />
              <Route
                path="users"
                element={<UserManagement />}
              />
              <Route
                path="users/create"
                element={<CreateUser />}
              />
              <Route
                path="users/:id/edit"
                element={<EditUser />}
              />
              <Route
                path="settings"
                element={<Settings />}
              />
              <Route path="approvals" element={<ApprovalCenter />} />
              <Route path="admin/unlock-grades" element={<AdminUnlockGrades />} />
              <Route
                path="reports"
                element={<Reports />}
              />
              <Route
                path="students"
                element={<Navigate to="/users?role=student" replace />}
              />
              <Route
                path="exports"
                element={<Navigate to="/reports" replace />}
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          
          {/* Debug Panel - Only visible in development */}
          <DebugPanel />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
