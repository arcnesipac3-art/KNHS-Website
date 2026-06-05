import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import api from '../lib/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PortalLayout from '../components/layout/PortalLayout'

export default function CreateUser() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tempPassword, setTempPassword] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    first_name: '',
    last_name: '',
    middle_name: '',
    lrn: '',
    grade_level: '',
    strand: '',
    employee_id: '',
    phone: '',
    must_change_password: true,
    is_approved: true,
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

      if (name === 'role' && value !== 'teacher') {
        nextState.employee_id = ''
      }

      if (name === 'grade_level' && parseInt(value || '0', 10) < 11) {
        nextState.strand = ''
      }

      return nextState
    })
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      // Prepare data
      const data = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        middle_name: formData.middle_name.trim(),
        must_change_password: formData.must_change_password,
        is_approved: formData.is_approved,
      }

      // Add role-specific fields
      if (formData.role === 'student') {
        if (!formData.lrn || !formData.grade_level) {
          setError('LRN and Grade Level are required for students')
          setLoading(false)
          return
        }
        data.lrn = formData.lrn.trim()
        data.grade_level = formData.grade_level ? parseInt(formData.grade_level) : null
        if (formData.strand) data.strand = formData.strand
      } else if (formData.role === 'teacher') {
        if (!formData.employee_id) {
          setError('Employee ID is required for teachers')
          setLoading(false)
          return
        }
        data.employee_id = formData.employee_id.trim()
      }

      if (formData.phone) data.phone = formData.phone.trim()

      await api.post('/users/', data)
      
      setTempPassword(formData.password)
    } catch (err) {
      console.error('Failed to create user:', err)
      if (err.response?.data) {
        const errors = err.response.data
        // Handle both field errors and non-field errors
        const errorMessages = []
        
        Object.entries(errors).forEach(([field, messages]) => {
          if (field === 'non_field_errors') {
            errorMessages.push(Array.isArray(messages) ? messages.join(', ') : messages)
          } else {
            const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            errorMessages.push(`${fieldLabel}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          }
        })
        
        setError(errorMessages.join('\n') || 'Failed to create user. Please check the form.')
      } else {
        setError('Failed to create user. Please check your connection and try again.')
      }
      setLoading(false)
    }
  }

  const isStudent = formData.role === 'student'
  const isTeacher = formData.role === 'teacher'

  if (user?.role !== 'admin') {
    return (
      <PortalLayout>
        <Card>
          <div className="py-8 text-center">
            <h2 className="text-lg font-semibold text-text">Access Denied</h2>
            <p className="mt-2 text-sm text-muted">Only administrators can create user accounts.</p>
          </div>
        </Card>
      </PortalLayout>
    )
  }

  if (tempPassword) {
    return (
      <PortalLayout>
        <div className="mx-auto max-w-2xl">
        <Card title="User Created Successfully!" subtitle="Save and share these credentials securely.">
          <div className="space-y-6">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="mb-4 text-sm text-green-800">
                The user account has been created. Please share these credentials securely:
              </p>
              <div className="space-y-2 rounded bg-white p-4">
                <div>
                  <span className="text-xs font-medium text-gray-600">Email:</span>
                  <p className="font-mono text-sm font-medium text-text">{formData.email}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600">Temporary Password:</span>
                  <p className="font-mono text-sm font-medium text-text">{tempPassword}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-xs font-medium text-yellow-800">
                ⚠️ The user must change this password on their first login.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setTempPassword(null)
                setFormData({
                  email: '',
                  password: '',
                  role: 'student',
                  first_name: '',
                  last_name: '',
                  middle_name: '',
                  lrn: '',
                  grade_level: '',
                  strand: '',
                  employee_id: '',
                  phone: '',
                  must_change_password: true,
                  is_approved: true,
                })
              }}>
                Create Another
              </Button>
              <Button onClick={() => navigate('/users')}>
                Back to User List
              </Button>
            </div>
          </div>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Create New User</h1>
          <p className="mt-2 text-muted">Add a new student, teacher, or staff account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Account Information */}
            <Card title="Account Information" subtitle="Login credentials and role">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                  />
                </div>

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

                <div>
                  <label className="mb-1 block text-sm font-medium text-text">
                    Temporary Password <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="password"
                      required
                      minLength={8}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 8 characters"
                    />
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      Generate
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    User will be required to change this password on first login
                  </p>
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
                    Force password change on first login
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
                    Account approved (active immediately)
                  </label>
                </div>
              </div>
            </Card>

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
              <Card title="Student Information" subtitle="Academic details for students">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text">
                      Learner Reference Number (LRN) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lrn"
                      required={isStudent}
                      maxLength={12}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                      value={formData.lrn}
                      onChange={handleChange}
                      placeholder="12-digit LRN"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">
                        Grade Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="grade_level"
                        required={isStudent}
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
                      <label className="mb-1 block text-sm font-medium text-text">
                        Strand {parseInt(formData.grade_level) >= 11 && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        name="strand"
                        required={parseInt(formData.grade_level) >= 11}
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
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="employee_id"
                    required={isTeacher}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                    value={formData.employee_id}
                    onChange={handleChange}
                    placeholder="e.g., TCH-2026-001"
                  />
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
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </PortalLayout>
  )
}
