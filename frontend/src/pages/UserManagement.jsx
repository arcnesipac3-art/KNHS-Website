import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    role: '',
    is_active: '',
    search: '',
  })
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    teachers: 0,
    staff: 0,
  })

  const roleLabels = {
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Admin',
    principal: 'Principal',
    guidance: 'Guidance',
    registrar: 'Registrar',
  }

  const roleBadgeColors = {
    student: 'bg-blue-100 text-blue-700',
    teacher: 'bg-green-100 text-green-700',
    admin: 'bg-purple-100 text-purple-700',
    principal: 'bg-gold/20 text-gold',
    guidance: 'bg-pink-100 text-pink-700',
    registrar: 'bg-orange-100 text-orange-700',
  }

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.role) params.append('role', filters.role)
      if (filters.is_active) params.append('is_active', filters.is_active)
      if (filters.search) params.append('search', filters.search)

      const response = await api.get(`/api/v1/users/?${params.toString()}`)
      setUsers(response.data)

      // Calculate stats
      const allUsers = response.data
      setStats({
        total: allUsers.length,
        students: allUsers.filter((u) => u.role === 'student').length,
        teachers: allUsers.filter((u) => u.role === 'teacher').length,
        staff: allUsers.filter((u) =>
          ['admin', 'principal', 'guidance', 'registrar'].includes(u.role)
        ).length,
      })

      setError(null)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError('Failed to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to deactivate ${userEmail}?`)) {
      return
    }

    try {
      await api.post(`/api/v1/users/${userId}/deactivate/`)
      loadUsers()
    } catch (err) {
      console.error('Failed to deactivate user:', err)
      alert('Failed to deactivate user. Please try again.')
    }
  }

  const handleActivate = async (userId) => {
    try {
      await api.post(`/api/v1/users/${userId}/activate/`)
      loadUsers()
    } catch (err) {
      console.error('Failed to activate user:', err)
      alert('Failed to activate user. Please try again.')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">User Management</h1>
          <p className="mt-2 text-muted">Manage student and teacher accounts</p>
        </div>
        <Link to="/users/create">
          <Button>
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create User
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <Card title="Total Users" subtitle={stats.total.toString()}>
          <div className="mt-2 text-xs text-muted">All active accounts</div>
        </Card>
        <Card title="Students" subtitle={stats.students.toString()}>
          <div className="mt-2 text-xs text-muted">Enrolled learners</div>
        </Card>
        <Card title="Teachers" subtitle={stats.teachers.toString()}>
          <div className="mt-2 text-xs text-muted">Teaching staff</div>
        </Card>
        <Card title="Staff" subtitle={stats.staff.toString()}>
          <div className="mt-2 text-xs text-muted">Admin, Principal, etc.</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Search</label>
          <input
            type="text"
            placeholder="Name, email, or LRN..."
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Role</label>
          <select
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Administrators</option>
            <option value="principal">Principal</option>
            <option value="guidance">Guidance</option>
            <option value="registrar">Registrar</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Status</label>
          <select
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
            value={filters.is_active}
            onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {(filters.role || filters.is_active || filters.search) && (
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => setFilters({ role: '', is_active: '', search: '' })}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-knhs-purple border-t-transparent"></div>
          <p className="mt-4 text-muted">Loading users...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={loadUsers} className="mt-4">
            Retry
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="mt-4 text-muted">No users found</p>
          <p className="mt-2 text-sm text-muted">Try adjusting your filters or create a new user</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  LRN / Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Grade / Strand
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-text">{user.full_name || 'N/A'}</div>
                      <div className="text-sm text-muted">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        roleBadgeColors[user.role] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {user.lrn || user.employee_id || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {user.grade_level
                      ? `Grade ${user.grade_level}${user.strand ? ` - ${user.strand}` : ''}`
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">{formatDate(user.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/users/${user.id}/edit`}>
                        <button className="rounded p-1 text-knhs-purple hover:bg-purple-50">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      </Link>
                      {user.is_active ? (
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(user.id)}
                          className="rounded p-1 text-green-600 hover:bg-green-50"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
