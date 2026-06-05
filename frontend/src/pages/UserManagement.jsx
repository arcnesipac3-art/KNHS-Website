import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { userApi } from '../lib/userApi'

// Generate a secure temporary password
function generateTempPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$'
  const all = upper + lower + digits + special
  // Guarantee at least one of each character class
  let pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ]
  for (let i = 0; i < 8; i++) {
    pwd.push(all[Math.floor(Math.random() * all.length)])
  }
  // Shuffle
  return pwd.sort(() => Math.random() - 0.5).join('')
}

// Extract a human-readable error string from any DRF error shape
function extractError(err) {
  const data = err.response?.data
  if (!data) return err.message || 'An error occurred'
  if (data.message) return data.message
  if (typeof data.error === 'string') return data.error
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

const ROLE_LABELS = {
  student: 'Student',
  teacher: 'Teacher',
  registrar: 'Registrar',
  guidance: 'Guidance Counselor',
  principal: 'Principal',
  admin: 'Administrator',
}

export default function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const [filters, setFilters] = useState({ role: 'all', is_active: 'all', search: '' })

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [tempPassword, setTempPassword] = useState(null)
  const [newUserName, setNewUserName] = useState('')

  useEffect(() => { loadUsers() }, [filters])

  useEffect(() => {
    if (successMessage || error) {
      const t = setTimeout(() => { setSuccessMessage(null); setError(null) }, 6000)
      return () => clearTimeout(t)
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
      setUsers(Array.isArray(data) ? data : (data?.results ?? []))
    } catch (err) {
      setError('Failed to load users. Please try again.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(userId, userName) {
    if (!confirm(`Delete ${userName}? This cannot be undone.`)) return
    try {
      await userApi.delete(userId)
      setSuccessMessage(`${userName} deleted.`)
      loadUsers()
    } catch (err) { setError(extractError(err)) }
  }

  async function handleToggleActive(userId, isActive, userName) {
    const action = isActive ? 'deactivate' : 'activate'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${userName}?`)) return
    try {
      isActive ? await userApi.deactivate(userId) : await userApi.activate(userId)
      setSuccessMessage(`${userName} ${action}d.`)
      loadUsers()
    } catch (err) { setError(extractError(err)) }
  }

  async function handleResetPassword(userId, userName) {
    if (!confirm(`Reset password for ${userName}? They must change it on next login.`)) return
    try {
      const { data } = await userApi.resetPassword(userId)
      setTempPassword(data.temporary_password)
      setNewUserName(userName)
      setShowPasswordModal(true)
    } catch (err) { setError(extractError(err)) }
  }

  function closeModals() {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowPasswordModal(false)
    setSelectedUser(null)
    setTempPassword(null)
    setNewUserName('')
  }

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'principal') {
    return (
      <PortalLayout>
        <div className="mx-auto max-w-4xl py-12 text-center">
          <h1 className="text-2xl font-bold text-text">Access Denied</h1>
          <p className="mt-4 text-muted">You don't have permission to manage users.</p>
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
            <p className="mt-2 text-muted">Manage students, teachers, and staff accounts</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowCreateModal(true)}>+ Add User</Button>
          )}
        </div>

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
            <div>
              <label className="block text-sm font-medium text-text">Role</label>
              <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2">
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Administrators</option>
                <option value="principal">Principal</option>
                <option value="registrar">Registrar</option>
                <option value="guidance">Guidance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text">Status</label>
              <select value={filters.is_active} onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2">
                <option value="all">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text">Search</label>
              <input type="text" value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Name, email, LRN..."
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2" />
            </div>
          </div>
        </Card>

        {/* User Table */}
        <Card title={`Users (${users.length})`}>
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple" />
              <p className="mt-4 text-muted">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-muted">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm font-semibold text-gray-600">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">ID / LRN</th>
                    <th className="pb-3">Status</th>
                    {isAdmin && <th className="pb-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="text-sm">
                      <td className="py-4">
                        <p className="font-medium text-text">{u.full_name || '—'}</p>
                        {u.grade_level && (
                          <p className="text-xs text-muted">Grade {u.grade_level}{u.strand ? ` · ${u.strand}` : ''}</p>
                        )}
                      </td>
                      <td className="py-4 text-muted">{u.email}</td>
                      <td className="py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                          u.role === 'student' ? 'bg-green-100 text-green-800' :
                          u.role === 'principal' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="py-4 font-mono text-xs text-muted">{u.lrn || u.employee_id || '—'}</td>
                      <td className="py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => { setSelectedUser(u); setShowEditModal(true) }}
                              className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                              Edit
                            </button>
                            <button onClick={() => handleResetPassword(u.id, u.full_name || u.email)}
                              className="rounded-lg border border-blue-300 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">
                              Reset Pwd
                            </button>
                            <button onClick={() => handleToggleActive(u.id, u.is_active, u.full_name || u.email)}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                                u.is_active
                                  ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                                  : 'border-green-300 text-green-700 hover:bg-green-50'
                              }`}>
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            {u.role !== 'admin' && (
                              <button onClick={() => handleDelete(u.id, u.full_name || u.email)}
                                className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50">
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

        {showCreateModal && (
          <CreateUserModal
            onClose={closeModals}
            onSuccess={(password, name) => {
              setTempPassword(password)
              setNewUserName(name)
              setShowCreateModal(false)
              setShowPasswordModal(true)
              setSuccessMessage(`User ${name} created successfully`)
              loadUsers()
            }}
          />
        )}
        {showEditModal && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={closeModals}
            onSuccess={() => { closeModals(); setSuccessMessage('User updated.'); loadUsers() }}
          />
        )}
        {showPasswordModal && tempPassword && (
          <PasswordModal password={tempPassword} userName={newUserName} onClose={closeModals} />
        )}
      </div>
    </PortalLayout>
  )
}


// ─── Create User Modal ───────────────────────────────────────────────────────

function CreateUserModal({ onClose, onSuccess }) {
  const [role, setRole] = useState('student')
  const [formData, setFormData] = useState({
    email: '', first_name: '', last_name: '', phone: '',
    lrn: '', grade_level: '', strand: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const generatedPassword = useState(() => generateTempPassword())[0]

  const isStudent = role === 'student'
  const isSHS = isStudent && (formData.grade_level === '11' || formData.grade_level === '12')

  function set(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: generatedPassword,
        must_change_password: true,
        is_approved: true,
        role,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone || '',
      }
      if (isStudent) {
        payload.lrn = formData.lrn.replace(/\D/g, '')
        payload.grade_level = formData.grade_level ? parseInt(formData.grade_level) : null
        payload.strand = isSHS ? formData.strand : ''
      }
      await userApi.create(payload)
      onSuccess(generatedPassword, `${formData.first_name} ${formData.last_name}`.trim())
    } catch (err) {
      setError(extractError(err))
      setSaving(false)
    }
  }

  const roles = [
    { value: 'student', label: 'Student', color: 'bg-green-500' },
    { value: 'teacher', label: 'Teacher', color: 'bg-blue-500' },
    { value: 'registrar', label: 'Registrar', color: 'bg-amber-500' },
    { value: 'guidance', label: 'Guidance', color: 'bg-purple-500' },
    { value: 'principal', label: 'Principal', color: 'bg-red-500' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-text">Create New User</h3>
            <p className="text-xs text-muted">Password auto-generated · user must change on first login</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          {/* Role picker */}
          <div>
            <label className="block text-sm font-semibold text-text mb-2">Role</label>
            <div className="flex flex-wrap gap-2">
              {roles.map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all ${
                    role === r.value
                      ? `${r.color} border-transparent text-white shadow-sm`
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text">
                First Name <span className="text-red-500">*</span>
              </label>
              <input type="text" value={formData.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                required placeholder="Juan"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input type="text" value={formData.last_name}
                onChange={(e) => set('last_name', e.target.value)}
                required placeholder="Dela Cruz"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text">
                Email <span className="text-red-500">*</span>
              </label>
              <input type="email" value={formData.email}
                onChange={(e) => set('email', e.target.value)}
                required placeholder="juan@deped.gov.ph"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">Contact Number</label>
              <input type="tel" value={formData.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="09XXXXXXXXX"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Student-specific */}
          {isStudent && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Student Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text">
                    LRN <span className="text-red-500">*</span>
                    <span className="ml-1 font-normal text-xs text-muted">12 digits</span>
                  </label>
                  <input type="text" value={formData.lrn}
                    onChange={(e) => set('lrn', e.target.value.replace(/\D/g, '').slice(0, 12))}
                    required maxLength={12} placeholder="123456789012"
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" />
                  <p className="mt-0.5 text-xs text-muted">{formData.lrn.length}/12</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text">
                    Grade Level <span className="text-red-500">*</span>
                  </label>
                  <select value={formData.grade_level}
                    onChange={(e) => set('grade_level', e.target.value)}
                    required
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Select...</option>
                    <option value="7">Grade 7 (JHS)</option>
                    <option value="8">Grade 8 (JHS)</option>
                    <option value="9">Grade 9 (JHS)</option>
                    <option value="10">Grade 10 (JHS)</option>
                    <option value="11">Grade 11 (SHS)</option>
                    <option value="12">Grade 12 (SHS)</option>
                  </select>
                </div>
              </div>
              {isSHS && (
                <div>
                  <label className="block text-sm font-medium text-text">
                    Strand <span className="text-red-500">*</span>
                  </label>
                  <select value={formData.strand}
                    onChange={(e) => set('strand', e.target.value)}
                    required
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Select strand...</option>
                    <option value="STEM">STEM</option>
                    <option value="ABM">ABM</option>
                    <option value="HUMSS">HUMSS</option>
                    <option value="TVL">TVL</option>
                    <option value="GAS">GAS</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Password notice */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            🔑 A secure temporary password will be shown after creation. The user must change it on first login.
          </div>

          <div className="flex gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Creating...' : `Create ${ROLE_LABELS[role]}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ─── Edit User Modal ─────────────────────────────────────────────────────────

function EditUserModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: user.email || '',
    role: user.role || 'student',
    first_name: user.profile?.first_name || '',
    last_name: user.profile?.last_name || '',
    lrn: user.lrn || user.profile?.lrn || '',
    grade_level: user.grade_level?.toString() || user.profile?.grade_level?.toString() || '',
    strand: user.strand || user.profile?.strand || '',
    phone: user.phone || user.profile?.phone || '',
    is_active: user.is_active,
    is_approved: user.is_approved,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isStudent = formData.role === 'student'
  const isSHS = isStudent && (formData.grade_level === '11' || formData.grade_level === '12')

  function set(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        email: formData.email,
        role: formData.role,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || '',
        is_active: formData.is_active,
        is_approved: formData.is_approved,
      }
      if (isStudent) {
        payload.lrn = formData.lrn || ''
        payload.grade_level = formData.grade_level ? parseInt(formData.grade_level) : null
        payload.strand = isSHS ? formData.strand : ''
      }
      await userApi.update(user.id, payload)
      onSuccess()
    } catch (err) {
      setError(extractError(err))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-text">Edit User</h3>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text">First Name <span className="text-red-500">*</span></label>
              <input type="text" value={formData.first_name} onChange={(e) => set('first_name', e.target.value)}
                required className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">Last Name <span className="text-red-500">*</span></label>
              <input type="text" value={formData.last_name} onChange={(e) => set('last_name', e.target.value)}
                required className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text">Email <span className="text-red-500">*</span></label>
              <input type="email" value={formData.email} onChange={(e) => set('email', e.target.value)}
                required className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">Contact Number</label>
              <input type="tel" value={formData.phone} onChange={(e) => set('phone', e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text">Role</label>
            <select value={formData.role} onChange={(e) => set('role', e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="registrar">Registrar</option>
              <option value="guidance">Guidance Counselor</option>
              <option value="principal">Principal</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {isStudent && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Student Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text">LRN</label>
                  <input type="text" value={formData.lrn}
                    onChange={(e) => set('lrn', e.target.value.replace(/\D/g, '').slice(0, 12))}
                    maxLength={12}
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text">Grade Level</label>
                  <select value={formData.grade_level} onChange={(e) => set('grade_level', e.target.value)}
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Select...</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11 (SHS)</option>
                    <option value="12">Grade 12 (SHS)</option>
                  </select>
                </div>
              </div>
              {isSHS && (
                <div>
                  <label className="block text-sm font-medium text-text">Strand</label>
                  <select value={formData.strand} onChange={(e) => set('strand', e.target.value)}
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Select strand...</option>
                    <option value="STEM">STEM</option>
                    <option value="ABM">ABM</option>
                    <option value="HUMSS">HUMSS</option>
                    <option value="TVL">TVL</option>
                    <option value="GAS">GAS</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 rounded-lg border border-gray-200 p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-knhs-purple" />
              <span className="text-sm text-text">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.is_approved}
                onChange={(e) => set('is_approved', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-knhs-purple" />
              <span className="text-sm text-text">Approved</span>
            </label>
          </div>

          <div className="flex gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ─── Password Modal ───────────────────────────────────────────────────────────

function PasswordModal({ password, userName, onClose }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-bold text-text">
            {userName ? `${userName} created!` : 'User created!'}
          </h3>
          <p className="mt-1 text-sm text-muted">
            Copy the temporary password and share it with the user.
          </p>
        </div>

        <div className="mt-5 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Temporary Password</p>
          <div className="flex items-center justify-between gap-3">
            <code className="text-xl font-mono font-bold tracking-wider text-text">{password}</code>
            <button onClick={handleCopy}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                copied ? 'bg-green-500' : 'bg-knhs-purple hover:bg-purple-700'
              }`}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ This password won't be shown again. The user must change it on their first login.
        </div>

        <Button onClick={onClose} className="mt-5 w-full">Done</Button>
      </div>
    </div>
  )
}
