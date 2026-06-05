import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { userApi } from '../lib/userApi'

// Helper: extract a human-readable error string from any DRF error shape
function extractError(err) {
  const data = err.response?.data
  if (!data) return err.message || 'An error occurred'
  // Shape: { code, message, details }
  if (data.message) return data.message
  // Shape: { error: "string" }
  if (typeof data.error === 'string') return data.error
  // Shape: { field: ["msg", ...], ... } — DRF validation errors
  if (typeof data === 'object') {
    const messages = []
    for (const [field, errors] of Object.entries(data)) {
      if (Array.isArray(errors)) messages.push(`${field}: ${errors.join(', ')}`)
      else if (typeof errors === 'string') messages.push(`${field}: ${errors}`)
    }
    if (messages.length > 0) return messages.join(' | ')
  }
  return 'An error occurred'
}

export default function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Filters
  const [filters, setFilters] = useState({
    role: 'all',
    is_active: 'all',
    search: '',
  })

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [tempPassword, setTempPassword] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [filters])

  useEffect(() => {
    // Clear messages after 5 seconds
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, error])

  async function loadUsers() {
    try {
      setLoading(true)
      setError(null)

      const params = {}
      if (filters.role !== 'all') params.role = filters.role
      if (filters.is_active !== 'all') params.is_active = filters.is_active
      if (filters.search) params.search = filters.search

      const { data } = await userApi.getAll(params)
      // Handle both paginated { count, results: [...] } and plain array responses
      const list = Array.isArray(data) ? data : (data?.results ?? [])
      setUsers(list)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError('Failed to load users. Please try again.')
      setUsers([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(userId, userName) {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return
    }
    try {
      await userApi.delete(userId)
      setSuccessMessage(`User ${userName} deleted successfully`)
      loadUsers()
    } catch (err) {
      setError(extractError(err))
    }
  }

  async function handleActivateDeactivate(userId, isActive, userName) {
    const action = isActive ? 'deactivate' : 'activate'
    if (!confirm(`Are you sure you want to ${action} ${userName}?`)) return
    try {
      if (isActive) {
        await userApi.deactivate(userId)
      } else {
        await userApi.activate(userId)
      }
      setSuccessMessage(`User ${userName} ${action}d successfully`)
      loadUsers()
    } catch (err) {
      setError(extractError(err))
    }
  }

  async function handleResetPassword(userId, userName) {
    if (!confirm(`Reset password for ${userName}? They will be forced to change it on next login.`)) return
    try {
      const { data } = await userApi.resetPassword(userId)
      setTempPassword(data.temporary_password)
      setShowPasswordModal(true)
      setSuccessMessage(`Password reset for ${userName}`)
      loadUsers()
    } catch (err) {
      setError(extractError(err))
    }
  }

  function openEditModal(user) {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  function closeModals() {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowPasswordModal(false)
    setSelectedUser(null)
    setTempPassword(null)
  }

  function handleCreateSuccess() {
    closeModals()
    setSuccessMessage('User created successfully')
    loadUsers()
  }

  function handleUpdateSuccess() {
    closeModals()
    setSuccessMessage('User updated successfully')
    loadUsers()
  }


  // Check permission
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'principal') {
    return (
      <PortalLayout>
        <div className="mx-auto max-w-4xl py-12 text-center">
          <h1 className="text-2xl font-bold text-text">Access Denied</h1>
          <p className="mt-4 text-muted">You don't have permission to access user management.</p>
        </div>
      </PortalLayout>
    )
  }

  const isAdmin = currentUser?.role === 'admin'

  return (
    <PortalLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">User Management</h1>
            <p className="mt-2 text-muted">
              Manage students, teachers, and staff accounts
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowCreateModal(true)}>
              + Add User
            </Button>
          )}
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
            <p className="font-medium text-green-900">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
            <p className="font-medium text-red-900">{error}</p>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-text">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Administrators</option>
                <option value="principal">Principal</option>
                <option value="registrar">Registrar</option>
                <option value="guidance">Guidance</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-text">Status</label>
              <select
                value={filters.is_active}
                onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-text">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Name, email, LRN..."
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
          </div>
        </Card>


        {/* User List */}
        <Card title={`Users (${users.length})`}>
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
              <p className="mt-4 text-muted">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-muted">
              No users found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm font-semibold text-gray-600">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Status</th>
                    {isAdmin && <th className="pb-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="text-sm">
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-text">{user.full_name || user.email}</p>
                          {user.grade_level && (
                            <p className="text-xs text-muted">Grade {user.grade_level}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-muted">{user.email}</td>
                      <td className="py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'student' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 text-muted">
                        {user.lrn || user.employee_id || '—'}
                      </td>
                      <td className="py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleResetPassword(user.id, user.full_name || user.email)}
                              className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                            >
                              Reset Password
                            </button>
                            <button
                              onClick={() => handleActivateDeactivate(user.id, user.is_active, user.full_name || user.email)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                                user.is_active
                                  ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                                  : 'border-green-300 text-green-700 hover:bg-green-50'
                              }`}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleDelete(user.id, user.full_name || user.email)}
                                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modals */}
        {showCreateModal && (
          <CreateUserModal
            onClose={closeModals}
            onSuccess={handleCreateSuccess}
          />
        )}

        {showEditModal && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={closeModals}
            onSuccess={handleUpdateSuccess}
          />
        )}

        {showPasswordModal && tempPassword && (
          <PasswordModal
            password={tempPassword}
            onClose={closeModals}
          />
        )}
      </div>
    </PortalLayout>
  )
}


// Create User Modal
function CreateUserModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    first_name: '',
    last_name: '',
    lrn: '',
    grade_level: '',
    contact_number: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Build clean payload — only send fields the backend expects
      const payload = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.contact_number || '',
      }
      if (formData.role === 'student') {
        payload.lrn = formData.lrn || ''
        payload.grade_level = formData.grade_level ? parseInt(formData.grade_level) : null
      }
      await userApi.create(payload)
      onSuccess()
    } catch (err) {
      setError(extractError(err))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-text">Create New User</h3>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="registrar">Registrar</option>
                <option value="guidance">Guidance</option>
                <option value="principal">Principal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>

            {formData.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text">LRN</label>
                  <input
                    type="text"
                    value={formData.lrn}
                    onChange={(e) => setFormData({ ...formData, lrn: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text">Grade Level</label>
                  <select
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  >
                    <option value="">Select grade</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>
              </>
            )}

            {formData.role !== 'student' && (
              <div>
                <label className="block text-sm font-medium text-text">Employee ID</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text">Contact Number</label>
              <input
                type="tel"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


// Edit User Modal
function EditUserModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: user.email || '',
    role: user.role || 'student',
    first_name: user.profile?.first_name || '',
    last_name: user.profile?.last_name || '',
    lrn: user.lrn || user.profile?.lrn || '',
    employee_id: user.employee_id || user.profile?.employee_id || '',
    grade_level: user.grade_level || user.profile?.grade_level || '',
    contact_number: user.phone || user.profile?.phone || '',
    is_active: user.is_active,
    is_approved: user.is_approved,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await userApi.update(user.id, formData)
      onSuccess()
    } catch (err) {
      setError(extractError(err))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-text">Edit User</h3>
        <p className="mt-1 text-sm text-muted">Editing: {user.email}</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="registrar">Registrar</option>
                <option value="guidance">Guidance</option>
                <option value="principal">Principal</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>

            {formData.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text">LRN</label>
                  <input
                    type="text"
                    value={formData.lrn}
                    onChange={(e) => setFormData({ ...formData, lrn: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text">Grade Level</label>
                  <select
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  >
                    <option value="">Select grade</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>
              </>
            )}

            {formData.role !== 'student' && (
              <div>
                <label className="block text-sm font-medium text-text">Employee ID</label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text">Contact Number</label>
              <input
                type="tel"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-knhs-purple"
              />
              <span className="text-sm text-text">Account is active</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_approved}
                onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-knhs-purple"
              />
              <span className="text-sm text-text">Account is approved</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Password Modal
function PasswordModal({ password, onClose }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h3 className="text-xl font-bold text-text">Temporary Password Generated</h3>
        <p className="mt-2 text-sm text-muted">
          Copy this password and provide it to the user. They must change it on first login.
        </p>

        <div className="mt-4 rounded-lg bg-gray-100 p-4">
          <div className="flex items-center justify-between">
            <code className="text-lg font-mono text-text">{password}</code>
            <button
              onClick={handleCopy}
              className="rounded-lg bg-knhs-purple px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Important:</strong> This password will not be shown again. Make sure to copy it before closing.
          </p>
        </div>

        <div className="mt-6">
          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    </div>
  )
}
