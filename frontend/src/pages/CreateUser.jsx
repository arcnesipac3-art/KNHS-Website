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
  const [fieldErrors, setFieldErrors] = useState({})
  const [touched, setTouched] = useState({})
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
    phone: '',
    must_change_password: true,
    is_approved: true,
  })

  const validateField = (name, value) => {
    const errors = {}
    
    switch (name) {
      case 'email':
        if (!value.trim()) errors.email = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Please enter a valid email address'
        break
      case 'password':
        if (!value) errors.password = 'Password is required'
        else if (value.length < 8) errors.password = 'Password must be at least 8 characters'
        else if (!/[A-Z]/.test(value)) errors.password = 'Password must contain at least one uppercase letter'
        else if (!/[a-z]/.test(value)) errors.password = 'Password must contain at least one lowercase letter'
        else if (!/[0-9]/.test(value)) errors.password = 'Password must contain at least one number'
        break
      case 'first_name':
        if (!value.trim()) errors.first_name = 'First name is required'
        else if (value.trim().length < 2) errors.first_name = 'First name must be at least 2 characters'
        break
      case 'last_name':
        if (!value.trim()) errors.last_name = 'Last name is required'
        else if (value.trim().length < 2) errors.last_name = 'Last name must be at least 2 characters'
        break
      case 'lrn':
        if (formData.role === 'student' && !value) errors.lrn = 'LRN is required for students'
        else if (value && !/^\d{12}$/.test(value)) errors.lrn = 'LRN must be exactly 12 digits'
        break
      case 'grade_level':
        if (formData.role === 'student' && !value) errors.grade_level = 'Grade level is required for students'
        break
      case 'strand':
        if (formData.role === 'student' && parseInt(formData.grade_level) >= 11 && !value) errors.strand = 'Strand is required for Senior High School'
        break
      case 'phone':
        if (value && !/^09\d{9}$/.test(value.replace(/\s/g, ''))) errors.phone = 'Phone number must be 11 digits starting with 09'
        break
      default:
        break
    }
    
    return errors
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
    
    // Validate field on change if it has been touched
    if (touched[name]) {
      const errors = validateField(name, nextValue)
      setFieldErrors(prev => ({ ...prev, ...errors }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    
    const errors = validateField(name, value)
    setFieldErrors(prev => ({ ...prev, ...errors }))
  }

  const validateForm = () => {
    const allErrors = {}
    const fieldsToValidate = ['email', 'password', 'first_name', 'last_name']
    
    // Add student-specific fields
    if (formData.role === 'student') {
      fieldsToValidate.push('lrn', 'grade_level')
      if (parseInt(formData.grade_level) >= 11) {
        fieldsToValidate.push('strand')
      }
    }
    
    // Validate optional fields if they have values
    if (formData.phone) {
      fieldsToValidate.push('phone')
    }
    
    fieldsToValidate.forEach(field => {
      const errors = validateField(field, formData[field])
      Object.assign(allErrors, errors)
    })
    
    return allErrors
  }

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
    
    // Validate all fields
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
      setError('Please fix the errors before creating the user')
      return
    }

    setLoading(true)

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
        data.lrn = formData.lrn.trim()
        data.grade_level = formData.grade_level ? parseInt(formData.grade_level) : null
        if (formData.strand) data.strand = formData.strand
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
    } finally {
      setLoading(false)
    }
  }

  const isStudent = formData.role === 'student'
  const isTeacher = formData.role === 'teacher'
  
  // Calculate form progress
  const requiredFields = ['email', 'password', 'first_name', 'last_name']
  if (isStudent) requiredFields.push('lrn', 'grade_level')
  const filledRequiredFields = requiredFields.filter(field => formData[field]?.trim()).length
  const progress = Math.round((filledRequiredFields / requiredFields.length) * 100)

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

        {/* Form Progress */}
        <Card className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-text">Form Progress</span>
            <span className="text-muted">{progress}% Complete</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div 
              className="h-2 rounded-full bg-knhs-purple transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>

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
                    className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                      fieldErrors.email && touched.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                    }`}
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="user@example.com"
                    aria-invalid={fieldErrors.email && touched.email}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  />
                  {fieldErrors.email && touched.email && (
                    <p id="email-error" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                  )}
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
                    onBlur={handleBlur}
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
                      className={`flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                        fieldErrors.password && touched.password
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                      }`}
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Min 8 characters"
                      aria-invalid={fieldErrors.password && touched.password}
                      aria-describedby={fieldErrors.password ? 'password-error' : 'password-hint'}
                    />
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      Generate
                    </Button>
                  </div>
                  {fieldErrors.password && touched.password && (
                    <p id="password-error" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                  )}
                  <p id="password-hint" className="mt-1 text-xs text-muted">
                    Password must be at least 8 characters with uppercase, lowercase, and numbers
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
                      className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                        fieldErrors.first_name && touched.first_name
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                      }`}
                      value={formData.first_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={fieldErrors.first_name && touched.first_name}
                      aria-describedby={fieldErrors.first_name ? 'first_name-error' : undefined}
                    />
                    {fieldErrors.first_name && touched.first_name && (
                      <p id="first_name-error" className="mt-1 text-xs text-red-600">{fieldErrors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                        fieldErrors.last_name && touched.last_name
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                      }`}
                      value={formData.last_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={fieldErrors.last_name && touched.last_name}
                      aria-describedby={fieldErrors.last_name ? 'last_name-error' : undefined}
                    />
                    {fieldErrors.last_name && touched.last_name && (
                      <p id="last_name-error" className="mt-1 text-xs text-red-600">{fieldErrors.last_name}</p>
                    )}
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
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                      fieldErrors.phone && touched.phone
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                    }`}
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="09XX XXX XXXX"
                    aria-invalid={fieldErrors.phone && touched.phone}
                    aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                  />
                  {fieldErrors.phone && touched.phone && (
                    <p id="phone-error" className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
                  )}
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
                      className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                        fieldErrors.lrn && touched.lrn
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                      }`}
                      value={formData.lrn}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="12-digit LRN"
                      aria-invalid={fieldErrors.lrn && touched.lrn}
                      aria-describedby={fieldErrors.lrn ? 'lrn-error' : undefined}
                    />
                    {fieldErrors.lrn && touched.lrn && (
                      <p id="lrn-error" className="mt-1 text-xs text-red-600">{fieldErrors.lrn}</p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">
                        Grade Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="grade_level"
                        required={isStudent}
                        className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                          fieldErrors.grade_level && touched.grade_level
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                        }`}
                        value={formData.grade_level}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={fieldErrors.grade_level && touched.grade_level}
                        aria-describedby={fieldErrors.grade_level ? 'grade_level-error' : undefined}
                      >
                        <option value="">Select grade level</option>
                        {gradeLevels.map((level) => (
                          <option key={level} value={level}>
                            Grade {level}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.grade_level && touched.grade_level && (
                        <p id="grade_level-error" className="mt-1 text-xs text-red-600">{fieldErrors.grade_level}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-text">
                        Strand {parseInt(formData.grade_level) >= 11 && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        name="strand"
                        required={parseInt(formData.grade_level) >= 11}
                        className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                          fieldErrors.strand && touched.strand
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                        }`}
                        value={formData.strand}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={parseInt(formData.grade_level) < 11}
                        aria-invalid={fieldErrors.strand && touched.strand}
                        aria-describedby={fieldErrors.strand ? 'strand-error' : undefined}
                      >
                        <option value="">Select strand</option>
                        {strands.map((strand) => (
                          <option key={strand} value={strand}>
                            {strand}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.strand && touched.strand && (
                        <p id="strand-error" className="mt-1 text-xs text-red-600">{fieldErrors.strand}</p>
                      )}
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
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    Employee ID is generated automatically when the teacher account is created.
                  </p>
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
