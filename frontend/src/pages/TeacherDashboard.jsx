import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { getTeacherDashboard } from '../lib/learningApi'
import { getCurrentAcademicYearWithQuarters } from '../lib/academicApi'
import api from '../lib/api'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [academicYear, setAcademicYear] = useState(null)
  const [loading, setLoading] = useState(true)
  const [studentAlerts, setStudentAlerts] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [todaySchedule, setTodaySchedule] = useState([])

  useEffect(() => {
    async function loadDashboard() {
      const [dashboardResult, yearResult, alertsResult, announcementsResult, scheduleResult] = await Promise.allSettled([
        getTeacherDashboard(),
        getCurrentAcademicYearWithQuarters(),
        api.get('/attendance/student-alerts/'),
        api.get('/announcements/?limit=5'),
        api.get('/schedule/today/'),
      ])

      if (dashboardResult.status === 'fulfilled') {
        setDashboard(dashboardResult.value)
      } else {
        console.error('Error fetching teacher dashboard:', dashboardResult.reason)
        setDashboard({ myAssignments: [], ungradedSubmissions: [], draftGrades: [], stats: { totalAssignments: 0, ungradedCount: 0, draftGradesCount: 0 } })
      }

      if (yearResult.status === 'fulfilled') {
        setAcademicYear(yearResult.value)
      } else {
        setAcademicYear({ academicYear: null, quarters: [] })
      }

      if (alertsResult.status === 'fulfilled') {
        setStudentAlerts(alertsResult.value.results || alertsResult.value || [])
      } else {
        setStudentAlerts([])
      }

      if (announcementsResult.status === 'fulfilled') {
        setAnnouncements(announcementsResult.value.results || announcementsResult.value || [])
      } else {
        setAnnouncements([])
      }

      if (scheduleResult.status === 'fulfilled') {
        setTodaySchedule(scheduleResult.value || [])
      } else {
        setTodaySchedule([])
      }

      setLoading(false)
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <PortalLayout>
        <div className="space-y-8">
          {/* Skeleton banner */}
          <div className="h-32 animate-pulse rounded-2xl bg-purple-200" />
          {/* Skeleton KPI cards */}
          <div className="grid gap-4 md:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />)}
          </div>
          {/* Skeleton content */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
            </div>
            <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>
      </PortalLayout>
    )
  }

  // Safely access quarters - it's at the top level of the response
  const quarters = Array.isArray(academicYear?.quarters) ? academicYear.quarters : []
  const currentQuarter = quarters.find((q) => q.is_active) || null

  return (
    <PortalLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-knhs-purple to-purple-700 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Welcome back,</p>
          <h1 className="text-3xl font-bold">{user?.display_name || user?.email}</h1>
          <p className="mt-1 text-purple-100">Teacher • {user?.employee_id || 'Faculty'}</p>
          {currentQuarter && (
            <p className="mt-2 text-sm text-purple-200">
              {academicYear.academicYear.label} • {currentQuarter.name}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link to="/assignments/create">
            <Button>Create Assignment</Button>
          </Link>
          <Link to="/grades/input">
            <Button variant="secondary">Input Grades</Button>
          </Link>
          <Link to="/grades/conduct">
            <Button variant="secondary">Conduct Ratings</Button>
          </Link>
          <Link to="/attendance/mark">
            <Button variant="secondary">Mark Attendance</Button>
          </Link>
          <Link to="/classes">
            <Button variant="secondary">My Classes</Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{dashboard?.stats.totalAssignments || 0}</p>
                <p className="text-sm text-muted">Active Assignments</p>
              </div>
              <div className="rounded-lg bg-purple-100 p-3">
                <svg className="h-6 w-6 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{dashboard?.stats.ungradedCount || 0}</p>
                <p className="text-sm text-muted">Pending Grading</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-3">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{dashboard?.stats.draftGradesCount || 0}</p>
                <p className="text-sm text-muted">Draft Grades</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{dashboard?.myAssignments?.length || 0}</p>
                <p className="text-sm text-muted">My Classes</p>
              </div>
              <div className="rounded-lg bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content: 3-column layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column (2/3) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Today's Schedule */}
            <Card title="Today's Schedule" subtitle="Your classes for today">
              {todaySchedule?.length > 0 ? (
                <div className="space-y-3">
                  {todaySchedule.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-text">{schedule.subject_name}</h4>
                        <p className="text-sm text-muted">
                          {schedule.class_name} • {schedule.room}
                        </p>
                        <p className="text-sm text-muted">
                          {schedule.start_time} - {schedule.end_time}
                        </p>
                      </div>
                      <Link to={`/classes/${schedule.class_id}`}>
                        <Button size="sm">View Class</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted">No classes scheduled for today</p>
                  <p className="mt-1 text-sm text-muted">Enjoy your free time! 🎉</p>
                </div>
              )}
            </Card>

            {/* Student Alerts */}
            {studentAlerts?.length > 0 && (
              <Card title="Student Alerts" subtitle="Attendance and performance issues">
                <div className="space-y-3">
                  {studentAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start justify-between rounded-lg border p-4 ${
                        alert.alert_type === 'attendance' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-text">{alert.student_name}</h4>
                        <p className="text-sm text-muted">
                          {alert.alert_type === 'attendance' ? 'Attendance Issue' : 'Performance Alert'}
                        </p>
                        <p className="text-sm text-muted">{alert.message}</p>
                      </div>
                      <Link to={`/students/${alert.student_id}`}>
                        <Button size="sm" variant="secondary">View</Button>
                      </Link>
                    </div>
                  ))}
                  {studentAlerts.length > 5 && (
                    <Link to="/students" className="block text-center text-sm text-knhs-purple hover:underline">
                      View all {studentAlerts.length} alerts →
                    </Link>
                  )}
                </div>
              </Card>
            )}

            {/* Ungraded Submissions */}
            <Card title="Pending Submissions" subtitle="Assignments waiting for your review">
              {dashboard?.ungradedSubmissions?.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.ungradedSubmissions.slice(0, 5).map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-start justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-text">{submission.assignment_title}</h4>
                        <p className="text-sm text-muted">
                          Student: {submission.student_name} • 
                          Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                        {submission.is_late && (
                          <span className="mt-1 inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                            Late Submission
                          </span>
                        )}
                      </div>
                      <Link to={`/submissions/${submission.id}`}>
                        <Button size="sm">Grade</Button>
                      </Link>
                    </div>
                  ))}
                  {dashboard.ungradedSubmissions.length > 5 && (
                    <Link to="/submissions" className="block text-center text-sm text-knhs-purple hover:underline">
                      View all {dashboard.ungradedSubmissions.length} submissions →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted">No pending submissions</p>
                  <p className="mt-1 text-sm text-muted">All caught up! 🎉</p>
                </div>
              )}
            </Card>

            {/* Draft Grades */}
            {dashboard?.draftGrades?.length > 0 && (
              <Card title="Draft Grades" subtitle="Grades ready for review and publication">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-muted">Student</th>
                        <th className="px-4 py-2 text-left font-medium text-muted">Subject</th>
                        <th className="px-4 py-2 text-center font-medium text-muted">Quarter</th>
                        <th className="px-4 py-2 text-center font-medium text-muted">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.draftGrades.slice(0, 5).map((grade) => (
                        <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-text">{grade.student_name}</td>
                          <td className="px-4 py-3 text-muted">{grade.subject_name}</td>
                          <td className="px-4 py-3 text-center text-muted">Q{grade.quarter_number}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
                              {grade.transmuted_grade || 'Draft'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {dashboard.draftGrades.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link to="/grades" className="text-sm text-knhs-purple hover:underline">
                      View all draft grades →
                    </Link>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-8">
            {/* Recent Announcements */}
            <Card title="Recent Announcements" subtitle="Latest school updates">
              {announcements?.length > 0 ? (
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <h5 className="text-sm font-medium text-text">{announcement.title}</h5>
                      <p className="mt-1 text-xs text-muted line-clamp-2">{announcement.content}</p>
                      <p className="mt-1 text-xs text-muted">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  <Link
                    to="/announcements"
                    className="block text-center text-sm text-knhs-purple hover:underline"
                  >
                    View all →
                  </Link>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted">No recent announcements</p>
              )}
            </Card>

            {/* Recent Assignments */}
            <Card title="My Assignments" subtitle="Recently created">
              {dashboard?.myAssignments?.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.myAssignments.slice(0, 4).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <h5 className="text-sm font-medium text-text">{assignment.title}</h5>
                      <p className="mt-1 text-xs text-muted">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Status: 
                        <span className={`ml-1 font-medium ${assignment.status === 'published' ? 'text-green-600' : 'text-gray-600'}`}>
                          {assignment.status}
                        </span>
                      </p>
                    </div>
                  ))}
                  <Link
                    to="/assignments"
                    className="block text-center text-sm text-knhs-purple hover:underline"
                  >
                    View all →
                  </Link>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted">No assignments yet</p>
              )}
            </Card>

            {/* Quick Links */}
            <Card title="Quick Links">
              <div className="space-y-2">
                <Link
                  to="/materials"
                  className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-green-100 p-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Upload Materials</p>
                      <p className="text-xs text-muted">Share resources with students</p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/announcements/create"
                  className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-blue-100 p-2">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Post Announcement</p>
                      <p className="text-xs text-muted">Notify your classes</p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/schedule"
                  className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-purple-100 p-2">
                      <svg className="h-5 w-5 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Full Schedule</p>
                      <p className="text-xs text-muted">View your timetable</p>
                    </div>
                  </div>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
