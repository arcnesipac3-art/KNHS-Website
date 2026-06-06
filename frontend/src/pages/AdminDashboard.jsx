import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { getCurrentAcademicYearWithQuarters } from '../lib/academicApi'
import api from '../lib/api'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [academicYear, setAcademicYear] = useState(null)
  const [stats, setStats] = useState({ total_students: 0, total_teachers: 0, total_classrooms: 0, pending_enrollments: 0, total_users: 0, active_sessions: 0 })
  const [systemHealth, setSystemHealth] = useState({ status: 'healthy', message: 'All systems operational' })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const [yearResult, dashboardResult, activitiesResult] = await Promise.allSettled([
        getCurrentAcademicYearWithQuarters(),
        api.get('/dashboard/'),
        api.get('/audit-logs/?limit=10'),
      ])

      if (yearResult.status === 'fulfilled') {
        setAcademicYear(yearResult.value)
      } else {
        setAcademicYear({ academicYear: null, quarters: [] })
      }

      if (dashboardResult.status === 'fulfilled') {
        const d = dashboardResult.value.data
        setStats({
          total_students: d?.users?.active_students ?? 0,
          total_teachers: d?.users?.active_teachers ?? 0,
          total_classrooms: 0,
          pending_enrollments: d?.grades?.pending_approvals ?? 0,
          total_users: (d?.users?.active_students ?? 0) + (d?.users?.active_teachers ?? 0) + (d?.users?.admins ?? 0) + (d?.users?.others ?? 0),
          active_sessions: d?.active_sessions ?? 0,
        })
      }

      if (activitiesResult.status === 'fulfilled') {
        setRecentActivities(activitiesResult.value.results || activitiesResult.value || [])
      } else {
        setRecentActivities([])
      }

      setLoading(false)
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <PortalLayout>
        <div className="space-y-8">
          <div className="h-32 animate-pulse rounded-2xl bg-purple-200" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />)}
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
            </div>
            <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
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
          <p className="text-sm opacity-90">School Administrator</p>
          <h1 className="text-3xl font-bold">{user?.display_name || user?.email}</h1>
          <p className="mt-1 text-purple-100">System Management & Configuration</p>
          {currentQuarter && academicYear?.academicYear && (
            <p className="mt-2 text-sm text-purple-200">
              {academicYear.academicYear.label} • {currentQuarter.name}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link to="/users">
            <Button>User Management</Button>
          </Link>
          <Link to="/enrollment">
            <Button variant="secondary">Enrollment Queue</Button>
          </Link>
          <Link to="/classes">
            <Button variant="secondary">Manage Classes</Button>
          </Link>
          <Link to="/settings">
            <Button variant="secondary">System Settings</Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{stats?.total_users || 0}</p>
                <p className="text-sm text-muted">Total Users</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{stats?.active_sessions || 0}</p>
                <p className="text-sm text-muted">Active Sessions</p>
              </div>
              <div className="rounded-lg bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{stats?.total_students || 0}</p>
                <p className="text-sm text-muted">Students</p>
              </div>
              <div className="rounded-lg bg-purple-100 p-3">
                <svg className="h-6 w-6 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{stats?.pending_enrollments || 0}</p>
                <p className="text-sm text-muted">Pending Enrollments</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-3">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content: 2-column layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column (2/3) */}
          <div className="space-y-8 lg:col-span-2">
            {/* System Health */}
            <Card title="System Health" subtitle="Current system status">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <div className="flex items-center justify-center">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <p className="mt-2 text-sm font-medium text-green-800">Backend</p>
                  <p className="text-xs text-green-600">Operational</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <div className="flex items-center justify-center">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  <p className="mt-2 text-sm font-medium text-green-800">Database</p>
                  <p className="text-xs text-green-600">Connected</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <div className="flex items-center justify-center">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="mt-2 text-sm font-medium text-green-800">Cache</p>
                  <p className="text-xs text-green-600">Active</p>
                </div>
              </div>
            </Card>

            {/* User Statistics by Role */}
            <Card title="User Statistics by Role" subtitle="Breakdown of users by role">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-text">{stats?.total_students || 0}</p>
                  <p className="text-sm text-muted">Students</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-text">{stats?.total_teachers || 0}</p>
                  <p className="text-sm text-muted">Teachers</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-text">-</p>
                  <p className="text-sm text-muted">Admins</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-text">-</p>
                  <p className="text-sm text-muted">Others</p>
                </div>
              </div>
            </Card>

            {/* System Overview */}
            <Card title="System Overview" subtitle="Current academic year status">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div>
                    <p className="font-medium text-text">Academic Year</p>
                    <p className="text-sm text-muted">
                      {academicYear?.academicYear?.label || 'Not set'}
                    </p>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div>
                    <p className="font-medium text-text">Current Quarter</p>
                    <p className="text-sm text-muted">
                      {currentQuarter?.name || 'Not set'} • {currentQuarter?.start_date ? new Date(currentQuarter.start_date).toLocaleDateString() : ''} - {currentQuarter?.end_date ? new Date(currentQuarter.end_date).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                    Q{currentQuarter?.number || '?'}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div>
                    <p className="font-medium text-text">Enrollment Status</p>
                    <p className="text-sm text-muted">Online enrollment system ready</p>
                  </div>
                  <Link to="/settings">
                    <Button size="sm" variant="secondary">Configure</Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Management Tasks */}
            <Card title="Management Tasks" subtitle="Quick access to admin functions">
              <div className="grid gap-3 md:grid-cols-2">
                <Link to="/people?tab=students" className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 hover:border-knhs-purple transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-3">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-text">Student Management</p>
                      <p className="text-xs text-muted">Add, edit, or transfer students</p>
                    </div>
                  </div>
                </Link>

                <Link to="/people?tab=teachers" className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 hover:border-knhs-purple transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 p-3">
                      <svg className="h-6 w-6 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-text">Teacher Management</p>
                      <p className="text-xs text-muted">Manage faculty accounts</p>
                    </div>
                  </div>
                </Link>

                <Link to="/classes" className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 hover:border-knhs-purple transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-3">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-text">Class Management</p>
                      <p className="text-xs text-muted">Create and configure classes</p>
                    </div>
                  </div>
                </Link>

                <Link to="/grades" className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 hover:border-knhs-purple transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-3">
                      <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-text">Grade Oversight</p>
                      <p className="text-xs text-muted">Review and unlock grades</p>
                    </div>
                  </div>
                </Link>
              </div>
            </Card>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <Card title="Recent Activity" subtitle="System events">
              {recentActivities?.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="rounded-lg border border-gray-200 p-3">
                      <p className="text-sm font-medium text-text">{activity.action}</p>
                      <p className="mt-1 text-xs text-muted">
                        {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-muted line-clamp-2">{activity.details}</p>
                    </div>
                  ))}
                  <Link
                    to="/settings/audit"
                    className="block text-center text-sm text-knhs-purple hover:underline"
                  >
                    View all activity →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-medium text-text">System Status</p>
                    <p className="mt-1 text-xs text-muted">All systems operational</p>
                    <p className="mt-1 text-xs text-green-600">✓ Backend running</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-medium text-text">Academic Year</p>
                    <p className="mt-1 text-xs text-muted">
                      {academicYear?.academicYear?.label || 'Not configured'}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {quarters.length || 0} quarters defined
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-medium text-text">Database</p>
                    <p className="mt-1 text-xs text-muted">19 models • 88 endpoints</p>
                    <p className="mt-1 text-xs text-green-600">✓ Connected</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Admin Tools */}
            <Card title="Admin Tools">
              <div className="space-y-2">
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
                      <p className="text-sm font-medium text-text">School Announcement</p>
                      <p className="text-xs text-muted">Post to entire school</p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/reports"
                  className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-green-100 p-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Generate Reports</p>
                      <p className="text-xs text-muted">Export data and analytics</p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/settings/audit"
                  className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-purple-100 p-2">
                      <svg className="h-5 w-5 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Audit Logs</p>
                      <p className="text-xs text-muted">View system activity</p>
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
