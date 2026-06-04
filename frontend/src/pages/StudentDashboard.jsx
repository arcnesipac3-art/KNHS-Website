import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { getStudentDashboard } from '../lib/learningApi'
import { getCurrentAcademicYearWithQuarters } from '../lib/academicApi'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [academicYear, setAcademicYear] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashboardData, yearData] = await Promise.all([
          getStudentDashboard(),
          getCurrentAcademicYearWithQuarters(),
        ])
        setDashboard(dashboardData)
        setAcademicYear(yearData)
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
            <p className="mt-4 text-muted">Loading dashboard...</p>
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
      <div className="space-y-8">{/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-knhs-purple to-purple-700 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Welcome back,</p>
          <h1 className="text-3xl font-bold">{user?.profile?.full_name || user?.email}</h1>
          <p className="mt-1 text-purple-100">
            Grade {user?.profile?.grade_level} {user?.profile?.strand && `• ${user?.profile?.strand}`}
          </p>
          {currentQuarter && (
            <p className="mt-2 text-sm text-purple-200">
              {academicYear.academicYear.label} • {currentQuarter.name}
            </p>
          )}
        </div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link to="/classes/join">
            <Button>Join Class</Button>
          </Link>
          <Link to="/assignments">
            <Button variant="secondary">View Assignments</Button>
          </Link>
          <Link to="/grades">
            <Button variant="secondary">Check Grades</Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{dashboard?.stats.pendingCount || 0}</p>
                <p className="text-sm text-muted">Pending Assignments</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-3">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{dashboard?.stats.overdueCount || 0}</p>
                <p className="text-sm text-muted">Overdue</p>
              </div>
              <div className="rounded-lg bg-red-100 p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{dashboard?.publishedGrades.length || 0}</p>
                <p className="text-sm text-muted">Published Grades</p>
              </div>
              <div className="rounded-lg bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{dashboard?.stats.unreadNotifications || 0}</p>
                <p className="text-sm text-muted">Unread Notifications</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content: 2-column layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column (2/3) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Due Soon */}
            <Card title="Due Soon" subtitle="Assignments due in the next 7 days">
              {dashboard?.pendingAssignments.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.pendingAssignments.slice(0, 5).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-start justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-text">{assignment.title}</h4>
                        <p className="text-sm text-muted">
                          {assignment.class_subject_name} • {assignment.classroom_name}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Link to={`/assignments/${assignment.id}`}>
                        <Button size="sm">Submit</Button>
                      </Link>
                    </div>
                  ))}
                  {dashboard.pendingAssignments.length > 5 && (
                    <Link to="/assignments" className="block text-center text-sm text-knhs-purple hover:underline">
                      View all {dashboard.pendingAssignments.length} assignments →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted">No pending assignments</p>
                  <p className="mt-1 text-sm text-muted">You're all caught up! 🎉</p>
                </div>
              )}
            </Card>

            {/* Recent Grades */}
            {dashboard?.publishedGrades.length > 0 && (
              <Card title="Recent Grades" subtitle="Latest published grades">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-muted">Subject</th>
                        <th className="px-4 py-2 text-left font-medium text-muted">Quarter</th>
                        <th className="px-4 py-2 text-center font-medium text-muted">Grade</th>
                        <th className="px-4 py-2 text-center font-medium text-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.publishedGrades.slice(0, 5).map((grade) => (
                        <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-text">{grade.subject_name}</td>
                          <td className="px-4 py-3 text-muted">Q{grade.quarter_number}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                                grade.is_passing
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {grade.transmuted_grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {grade.is_passing ? (
                              <span className="text-green-600">✓ Passed</span>
                            ) : (
                              <span className="text-red-600">Needs Improvement</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {dashboard.publishedGrades.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link to="/grades" className="text-sm text-knhs-purple hover:underline">
                      View all grades →
                    </Link>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-8">
            {/* Announcements */}
            <Card title="Announcements" subtitle="Latest updates">
              {dashboard?.unreadAnnouncements.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.unreadAnnouncements.slice(0, 3).map((announcement) => (
                    <div
                      key={announcement.id}
                      className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-2">
                        {announcement.priority === 'urgent' && (
                          <span className="mt-1 text-red-500">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-text">{announcement.title}</h5>
                          <p className="mt-1 text-xs text-muted line-clamp-2">{announcement.body}</p>
                          <p className="mt-1 text-xs text-muted">
                            {new Date(announcement.published_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
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
                <p className="py-4 text-center text-sm text-muted">No new announcements</p>
              )}
            </Card>

            {/* Quick Links */}
            <Card title="Quick Links">
              <div className="space-y-2">
                <Link
                  to="/classes"
                  className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-purple-100 p-2">
                      <svg className="h-5 w-5 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">My Classes</p>
                      <p className="text-xs text-muted">View enrolled classes</p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/schedule"
                  className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-blue-100 p-2">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Schedule</p>
                      <p className="text-xs text-muted">Class timetable</p>
                    </div>
                  </div>
                </Link>

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
                      <p className="text-sm font-medium text-text">Materials</p>
                      <p className="text-xs text-muted">Learning resources</p>
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
