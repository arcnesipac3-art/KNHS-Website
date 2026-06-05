import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './features/auth/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from './features/auth/ProtectedRoute'
import PublicLayout from './components/layout/PublicLayout'
import DebugPanel from './components/ui/DebugPanel'
import Home from './pages/Home'
import About from './pages/About'
import Academics from './pages/Academics'
import News from './pages/News'
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
import GradeSubmission from './pages/GradeSubmission'
import MarkAttendance from './pages/MarkAttendance'
import AnnouncementList from './pages/AnnouncementList'
import CreateAnnouncement from './pages/CreateAnnouncement'
import GradeInput from './pages/GradeInput'
import StudentGrades from './pages/StudentGrades'
import Materials from './pages/Materials'
import UploadMaterial from './pages/UploadMaterial'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword'
import NotificationSettings from './pages/NotificationSettings'
import Settings from './pages/Settings'
import EnrollmentApplication from './pages/EnrollmentApplication'
import EnrollmentTracking from './pages/EnrollmentTracking'
import EnrollmentManagement from './pages/EnrollmentManagement'
import UserManagement from './pages/UserManagement'
import CreateUser from './pages/CreateUser'
import EditUser from './pages/EditUser'
import PrincipalDashboard from './pages/PrincipalDashboard'
import ApprovalCenter from './pages/ApprovalCenter'
import AdminUnlockGrades from './pages/AdminUnlockGrades'
import ConductRatings from './pages/ConductRatings'

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
              <Route path="submissions/:id" element={<GradeSubmission />} />
              <Route path="attendance/mark" element={<MarkAttendance />} />
              <Route path="announcements" element={<AnnouncementList />} />
              <Route path="announcements/create" element={<CreateAnnouncement />} />
              <Route path="grades/input" element={<GradeInput />} />
              <Route path="grades/conduct" element={<ConductRatings />} />
              <Route path="grades" element={<StudentGrades />} />
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
