import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'

export default function RegistrarDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentApplications, setRecentApplications] = useState([])
  const [studentStats, setStudentStats] = useState({ total: 0, active: 0, byGrade: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [enrollRes, studentRes] = await Promise.allSettled([
      api.get('/enrollment-applications/', { params: { page_size: 10 } }),
      api.get('/users/', { params: { role: 'student' } }),
    ])

    if (enrollRes.status === 'fulfilled') {
      const d = enrollRes.value.data
      const apps = Array.isArray(d) ? d : (d?.results ?? [])
      setRecentApplications(apps)

      // Compute stats from the list
      setStats(prev => ({
        ...prev,
        total: d?.count ?? apps.length,
        pending: apps.filter(a => a.status === 'pending').length,
        under_review: apps.filter(a => a.status === 'under_review').length,
        approved: apps.filter(a => a.status === 'approved').length,
        rejected: apps.filter(a => a.status === 'rejected').length,
      }))
    }

    if (studentRes.status === 'fulfilled') {
      const students = Array.isArray(studentRes.value.data) ? studentRes.value.data : (studentRes.value.data?.results ?? [])
      setStudentStats({
        total: students.length,
        active: students.filter(s => s.is_active).length,
        byGrade: students.reduce((acc, s) => {
          acc[s.grade_level] = (acc[s.grade_level] || 0) + 1
          return acc
        }, {}),
      })
    }

    setLoading(false)
  }

  const STATUS_STYLES = {
    pending: 'bg-gray-100 text-gray-700',
    under_review: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  const STATUS_LABELS = {
    pending: 'Pending',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-700 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Welcome back, Registrar</p>
          <h1 className="text-3xl font-bold">{user?.display_name || user?.email}</h1>
          <p className="mt-1 text-amber-100">Enrollment Queue & Student Records</p>
          <p className="mt-2 text-sm text-amber-200">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link to="/enrollment">
            <Button>View Enrollment Queue</Button>
          </Link>
          <Link to="/students">
            <Button variant="secondary">Student Records</Button>
          </Link>
          <Link to="/exports">
            <Button variant="secondary">Exports</Button>
          </Link>
        </div>

        {/* Stats */}
        {!loading && stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="border-l-4 border-l-gray-400">
              <p className="text-2xl font-bold text-text">{stats.pending}</p>
              <p className="text-sm text-muted">Pending Review</p>
              {stats.pending > 0 && (
                <Link to="/enrollment" className="mt-2 block text-xs text-knhs-purple hover:underline">
                  Review now →
                </Link>
              )}
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <p className="text-2xl font-bold text-blue-600">{stats.under_review}</p>
              <p className="text-sm text-muted">Under Review</p>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-sm text-muted">Approved</p>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-sm text-muted">Rejected</p>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <p className="text-2xl font-bold text-text">{studentStats.total}</p>
              <p className="text-sm text-muted">Total Students</p>
            </Card>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent applications */}
          <div className="lg:col-span-2">
            <Card title="Recent Applications" subtitle="Latest enrollment submissions">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />)}
                </div>
              ) : recentApplications.length === 0 ? (
                <p className="py-8 text-center text-muted">No enrollment applications yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentApplications.slice(0, 8).map(app => (
                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3">
                      <div>
                        <p className="font-medium text-text">
                          {app.first_name} {app.last_name}
                        </p>
                        <p className="text-xs text-muted">
                          {app.tracking_number} · Grade {app.grade_level}
                          {app.strand ? ` · ${app.strand}` : ''}
                          {' · '}
                          {new Date(app.created_at).toLocaleDateString('en-PH', {
                            month: 'short', day: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[app.status] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[app.status] || app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <Link to="/enrollment" className="text-sm font-medium text-knhs-purple hover:underline">
                  View all applications →
                </Link>
              </div>
            </Card>
          </div>

          {/* Quick links */}
          <div className="space-y-4 lg:space-y-6">
            {/* Student Statistics */}
            <Card title="Student Statistics" subtitle="Current enrollment by grade">
              {!loading && studentStats.total > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Total Students</span>
                    <span className="font-semibold text-text">{studentStats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Active Students</span>
                    <span className="font-semibold text-green-600">{studentStats.active}</span>
                  </div>
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <p className="text-xs font-medium text-muted mb-2">By Grade Level</p>
                    {Object.entries(studentStats.byGrade).sort(([a], [b]) => a - b).map(([grade, count]) => (
                      <div key={grade} className="flex justify-between text-sm">
                        <span className="text-muted">Grade {grade}</span>
                        <span className="font-semibold text-text">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">Unable to load student statistics.</p>
              )}
            </Card>

            <Card title="Registrar Tools">
              <div className="space-y-2">
                {[
                  { to: '/enrollment', label: 'Enrollment Queue', desc: 'Review pending applications', icon: '📋' },
                  { to: '/students', label: 'Student Records', desc: 'Look up student information', icon: '👥' },
                  { to: '/users', label: 'User Accounts', desc: 'View all system accounts', icon: '🔑' },
                  { to: '/exports', label: 'Data Exports', desc: 'Export class lists and records', icon: '📊' },
                  { to: '/announcements', label: 'Announcements', desc: 'View school announcements', icon: '📢' },
                ].map(({ to, label, desc, icon }) => (
                  <Link key={to} to={to}
                    className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 hover:border-knhs-purple transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <div>
                        <p className="text-sm font-medium text-text">{label}</p>
                        <p className="text-xs text-muted">{desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <Card title="Enrollment Status">
              {loading ? (
                <div className="h-24 animate-pulse rounded-lg bg-gray-200" />
              ) : stats ? (
                <div className="space-y-2">
                  {[
                    { label: 'Total Received', value: stats.total, color: 'text-text' },
                    { label: 'Needs Attention', value: stats.pending + stats.under_review, color: 'text-amber-600' },
                    { label: 'Processed', value: stats.approved + stats.rejected, color: 'text-green-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-muted">{label}</span>
                      <span className={`font-semibold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Unable to load stats.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
