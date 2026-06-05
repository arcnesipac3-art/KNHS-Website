import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import api from '../lib/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PortalLayout from '../components/layout/PortalLayout'

export default function EditUser() {
  const { user: currentUser } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [passwordResetResult, setPasswordResetResult] = useState(null)
  const [formData, setFormData] = useState({
    role: '',
    is_active: true,
    is_approved: true,
    must_change_password: false,
    first_name: '',
    last_name: '',
    middle_name: '',
    lrn: '',
    grade_level: '',
    strand: '',
    phone: '',
  })

  const roleLabels = {
    student: 'Student',
    teacher: 'Teacher',
    admin: 'School Administrator',
    principal: 'Principal',
    guidance: 'Guidance Office',
    registrar: 'Registrar',
  }

  const strands = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL-ICT', 'TVL-HE']
  const gradeLevels = [7, 8, 9, 10, 11, 12]

  useEffect(() => {
    loadUser()
  }, [id])

  const loadUser = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/users/${id}/`)
      setUser(response.data)
      
      // Populate form
      setFormData({
        role: response.data.role,
        is_active: response.data.is_active,
        is_approved: response.data.is_approved,
        must_change_password: response.data.must_change_password,
        first_name: response.data.profile?.first_name || '',
        last_name: response.data.profile?.last_name || '',
        middle_name: response.data.profile?.middle_name || '',
        lrn: response.data.profile?.lrn || '',
        grade_level: response.data.profile?.grade_level || '',
        strand: response.data.profile?.strand || '',
        phone: response.data.profile?.phone || '',
      })
      
      setError(null)
    } catch (err) {
      console.error('Failed to load user:', err)
      setError('Failed to load user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const nextValue = type === 'checkbox' ? checked : value
    setFormData((prev) => {
      const nextState = {
        ...prev,
        [name]: nextValue,
      }

      if (name === 'role' && value !== 'student') {
        nextState.lrn = ''
        nextState.grade_level = ''
        nextState.strand = ''
      }

      if (name === 'grade_level' && parseInt(value || '0', 10) < 11) {
        nextState.strand = ''
      }

      return nextState
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      // Prepare data
      const data = {
        role: formData.role,
        is_active: formData.is_active,
        is_approved: formData.is_approved,
        must_change_password: formData.must_change_password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name,
        phone: formData.phone,
      }

      // Add role-specific fields
      if (formData.role === 'student') {
        data.lrn = formData.lrn
        data.grade_level = parseInt(formData.grade_level) || null
        data.strand = formData.strand
      }

      await api.patch(`/users/${id}/`, data)
      navigate('/users')
    } catch (err) {
      console.error('Failed to update user:', err)
      if (err.response?.data) {
        const errors = err.response.data
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n')
        setError(errorMessages || 'Failed to update user. Please check the form.')
      } else {
        setError('Failed to update user. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!window.confirm('Reset password for this user?')) {
      return
    }

    try {
      setPasswordResetResult(null)
      const response = await api.post(`/users/${id}/reset_password/`)
      setPasswordResetResult(response.data)
    } catch (err) {
      console.error('Failed to reset password:', err)
      alert('Failed to reset password. Please try again.')
    }
  }

  const isStudent = formData.role === 'student'
  const isTeacher = formData.role === 'teacher'

  if (currentUser?.role !== 'admin') {
    return (
      <PortalLayout>
        <Card>
          <div className="py-8 text-center">
            <h2 className="text-lg font-semibold text-text">Access Denied</h2>
            <p className="mt-2 text-sm text-muted">Only administrators can edit user accounts.</p>
          </div>
        </Card>
      </PortalLayout>
    )
  }

  if (loading) {
    return (
      <PortalLayout>
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-knhs-purple border-t-transparent"></div>
          <p className="mt-4 text-muted">Loading user...</p>
        </div>
      </div>
      </PortalLayout>
    )
  }

  if (error && !user) {
    return (
      <PortalLayout>
      <div className="flex min-h-[400px] items-center justify-center">
        <Card title="Error">
          <p className="text-red-600">{error}</p>
          <Button onClick={loadUser} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
    <div>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Edit User</h1>
            <p className="mt-2 text-muted">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleResetPassword}>
            Reset Password
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Account Status */}
            <Card title="Account Status" subtitle="Manage account access">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-knhs-purple focus:ring-knhs-purple"
                    />
                    <label htmlFor="is_active" className="text-sm text-text">
                      Account is active (user can log in)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_approved"
                      name="is_approved"
                      checked={formData.is_approved}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-knhs-purple focus:ring-knhs-purple"
                    />
                    <label htmlFor="is_approved" className="text-sm text-text">
                      Account is approved
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="must_change_password"
                      name="must_change_password"
                      checked={formData.must_change_password}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-knhs-purple focus:ring-knhs-purple"
                    />
                    <label htmlFor="must_change_password" className="text-sm text-text">
                      Force password change on next login
                    </label>
                  </div>
                </div>
              </div>
            </Card>

            {passwordResetResult && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">Password reset successful.</p>
                <p className="mt-2 text-sm text-green-700">
                  Temporary password:
                  {' '}
                  <span className="font-mono font-semibold">{passwordResetResult.temporary_password}</span>
                </p>
                <p className="mt-1 text-xs text-green-700">The user will be required to change it on next login.</p>
              </div>
            )}

            {/* Personal Information */}
            <Card title="Personal Information" subtitle="User's name and contact">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                      value={formData.first_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                      value={formData.last_name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text">Middle Name</label>
                  <input
                    type="text"
                    name="middle_name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                    value={formData.middle_name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="09XX XXX XXXX"
                  />
                </div>
              </div>
            </Card>

            {/* Student-specific fields */}
            {isStudent && (
              <Card title="Student Information" subtitle="Academic details">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text">
                      Learner Reference Number (LRN)
                    </label>
                    <input
                      type="text"
                      name="lrn"
                      maxLength={12}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                      value={formData.lrn}
                      onChange={handleChange}
                      placeholder="12-digit LRN"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">Grade Level</label>
                      <select
                        name="grade_level"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                        value={formData.grade_level}
                        onChange={handleChange}
                      >
                        <option value="">Select grade level</option>
                        {gradeLevels.map((level) => (
                          <option key={level} value={level}>
                            Grade {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">Strand</label>
                      <select
                        name="strand"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                        value={formData.strand}
                        onChange={handleChange}
                        disabled={parseInt(formData.grade_level) < 11}
                      >
                        <option value="">Select strand</option>
                        {strands.map((strand) => (
                          <option key={strand} value={strand}>
                            {strand}
                          </option>
                        ))}
                      </select>
                      {parseInt(formData.grade_level) < 11 && (
                        <p className="mt-1 text-xs text-muted">Strand is for SHS (Grade 11-12) only</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Teacher-specific fields */}
            {isTeacher && (
              <Card title="Teacher Information" subtitle="Employment details">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text">Employee ID</label>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-text">
                      {user?.profile?.employee_id || 'Will be generated automatically when you save'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      Employee ID is generated automatically for teacher accounts.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="whitespace-pre-line text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/users')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </PortalLayout>
  )
}
