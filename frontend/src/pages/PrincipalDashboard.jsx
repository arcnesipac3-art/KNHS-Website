import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'

export default function PrincipalDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    pendingEnrollments: 0,
    totalStudents: 0,
    totalTeachers: 0
  })

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data } = await api.get('/system/dashboard/')
        setDashboard(data)

        // Load stats
        const [gradesRes, usersRes] = await Promise.all([
          api.get('/grades/approval_queue/'),
          api.get('/users/')
        ])

        setStats({
          pendingApprovals: Array.isArray(gradesRes.data) ? gradesRes.data.length : (gradesRes.data?.results?.length ?? 0),
          pendingEnrollments: 0,
          totalStudents: (Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.results ?? [])).filter(u => u.role === 'student').length,
          totalTeachers: (Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.results ?? [])).filter(u => u.role === 'teacher').length
        })
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

  return (
    <PortalLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Welcome back, Principal</p>
          <h1 className="text-3xl font-bold">{user?.display_name || user?.email}</h1>
          <p className="mt-1 text-purple-100">Executive Dashboard • Kiwalan National High School</p>
          <p className="mt-2 text-sm text-purple-200">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link to="/approvals">
            <Button>
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Approval Center
              </span>
            </Button>
          </Link>
          <Link to="/users">
            <Button variant="secondary">User Management</Button>
          </Link>
          <Link to="/enrollment">
            <Button variant="secondary">Enrollment Review</Button>
          </Link>
          <Link to="/announcements/create">
            <Button variant="secondary">Post Announcement</Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{stats.pendingApprovals}</p>
                <p className="text-sm text-muted">Pending Approvals</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-3">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{stats.totalStudents}</p>
                <p className="text-sm text-muted">Total Students</p>
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
                <p className="text-2xl font-bold text-text">{stats.totalTeachers}</p>
                <p className="text-sm text-muted">Faculty Members</p>
              </div>
              <div className="rounded-lg bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text">{stats.pendingEnrollments}</p>
                <p className="text-sm text-muted">Enrollment Apps</p>
              </div>
              <div className="rounded-lg bg-purple-100 p-3">
                <svg className="h-6 w-6 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Pending Approvals */}
          <div className="lg:col-span-2">
            <Card title="Pending Grade Approvals" subtitle="Grades awaiting your review">
              {stats.pendingApprovals > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <svg className="h-6 w-6 flex-shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-semibold text-amber-900">
                          {stats.pendingApprovals} grade submission{stats.pendingApprovals !== 1 ? 's' : ''} awaiting review
                        </p>
                        <p className="mt-1 text-sm text-amber-700">
                          Teachers have submitted grades for your approval. Review and approve them to make them visible to students.
                        </p>
                        <Link to="/approvals" className="mt-3 inline-block">
                          <Button size="sm">Review Now →</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-text">All Caught Up!</h3>
                  <p className="mt-2 text-sm text-muted">
                    No pending grade approvals at this time.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <Card title="Quick Links">
              <div className="space-y-2">
                <Link
                  to="/approvals"
                  className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-amber-100 p-2">
                      <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Approval Center</p>
                      <p className="text-xs text-muted">Review and approve grades</p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/users"
                  className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-blue-100 p-2">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">User Management</p>
                      <p className="text-xs text-muted">View staff and students</p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/enrollment"
                  className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-purple-100 p-2">
                      <svg className="h-5 w-5 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Enrollment Review</p>
                      <p className="text-xs text-muted">Process applications</p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/announcements"
                  className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-green-100 p-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Announcements</p>
                      <p className="text-xs text-muted">Communicate to school</p>
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
