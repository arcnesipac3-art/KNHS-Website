import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'

export default function EnrollmentApplication() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [touched, setTouched] = useState({})
  
  const [formData, setFormData] = useState({
    // Personal Information
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    birth_date: '',
    sex: '',
    lrn: '',
    
    // Contact Information
    email: '',
    phone: '',
    address: '',
    barangay: '',
    municipality: '',
    province: '',
    zip_code: '',
    
    // Academic Information
    grade_level: '',
    strand: '', // For SHS only
    previous_school: '',
    
    // Parent/Guardian Information
    guardian_name: '',
    guardian_relationship: '',
    guardian_phone: '',
    guardian_email: '',
    
    // Documents (URLs)
    birth_certificate_url: '',
    report_card_url: '',
    good_moral_url: '',
    
    // Additional
    notes: ''
  })

  const validateField = (name, value) => {
    const errors = {}
    
    switch (name) {
      case 'first_name':
        if (!value.trim()) errors.first_name = 'First name is required'
        else if (value.trim().length < 2) errors.first_name = 'First name must be at least 2 characters'
        break
      case 'last_name':
        if (!value.trim()) errors.last_name = 'Last name is required'
        else if (value.trim().length < 2) errors.last_name = 'Last name must be at least 2 characters'
        break
      case 'birth_date':
        if (!value) errors.birth_date = 'Birth date is required'
        else {
          const birthDate = new Date(value)
          const today = new Date()
          const age = today.getFullYear() - birthDate.getFullYear()
          if (age < 5 || age > 25) errors.birth_date = 'Please enter a valid birth date'
        }
        break
      case 'sex':
        if (!value) errors.sex = 'Sex is required'
        break
      case 'lrn':
        if (value && !/^\d{12}$/.test(value)) errors.lrn = 'LRN must be exactly 12 digits'
        break
      case 'email':
        if (!value.trim()) errors.email = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Please enter a valid email address'
        break
      case 'phone':
        if (!value.trim()) errors.phone = 'Phone number is required'
        else if (!/^09\d{9}$/.test(value.replace(/\s/g, ''))) errors.phone = 'Phone number must be 11 digits starting with 09'
        break
      case 'address':
        if (!value.trim()) errors.address = 'Address is required'
        break
      case 'grade_level':
        if (!value) errors.grade_level = 'Grade level is required'
        break
      case 'strand':
        if (['11', '12'].includes(formData.grade_level) && !value) errors.strand = 'Strand is required for Senior High School'
        break
      case 'guardian_name':
        if (!value.trim()) errors.guardian_name = 'Guardian name is required'
        break
      case 'guardian_relationship':
        if (!value) errors.guardian_relationship = 'Relationship is required'
        break
      case 'guardian_phone':
        if (!value.trim()) errors.guardian_phone = 'Guardian phone is required'
        else if (!/^09\d{9}$/.test(value.replace(/\s/g, ''))) errors.guardian_phone = 'Phone number must be 11 digits starting with 09'
        break
      case 'guardian_email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.guardian_email = 'Please enter a valid email address'
        break
      case 'zip_code':
        if (value && !/^\d{4}$/.test(value)) errors.zip_code = 'ZIP code must be 4 digits'
        break
      default:
        break
    }
    
    return errors
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Validate field on change if it has been touched
    if (touched[name]) {
      const errors = validateField(name, value)
      setFieldErrors(prev => ({ ...prev, ...errors }))
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    
    const errors = validateField(name, value)
    setFieldErrors(prev => ({ ...prev, ...errors }))
  }

  function validateForm() {
    const allErrors = {}
    const fieldsToValidate = [
      'first_name', 'last_name', 'birth_date', 'sex', 'email', 'phone', 
      'address', 'grade_level', 'guardian_name', 'guardian_relationship', 'guardian_phone'
    ]
    
    // Add strand validation for SHS
    if (['11', '12'].includes(formData.grade_level)) {
      fieldsToValidate.push('strand')
    }
    
    fieldsToValidate.forEach(field => {
      const errors = validateField(field, formData[field])
      Object.assign(allErrors, errors)
    })
    
    // Validate optional fields if they have values
    if (formData.lrn) {
      const lrnErrors = validateField('lrn', formData.lrn)
      Object.assign(allErrors, lrnErrors)
    }
    if (formData.guardian_email) {
      const emailErrors = validateField('guardian_email', formData.guardian_email)
      Object.assign(allErrors, emailErrors)
    }
    if (formData.zip_code) {
      const zipErrors = validateField('zip_code', formData.zip_code)
      Object.assign(allErrors, zipErrors)
    }
    
    return allErrors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    
    // Validate all fields
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
      setError('Please fix the errors before submitting')
      return
    }

    setLoading(true)

    try {
      // Submit application
      const { data } = await api.post('/enrollment-applications/', {
        applicant_data: {
          personal: {
            first_name: formData.first_name,
            middle_name: formData.middle_name,
            last_name: formData.last_name,
            suffix: formData.suffix,
            birth_date: formData.birth_date,
            sex: formData.sex,
            lrn: formData.lrn
          },
          contact: {
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            barangay: formData.barangay,
            municipality: formData.municipality,
            province: formData.province,
            zip_code: formData.zip_code
          },
          academic: {
            previous_school: formData.previous_school
          },
          guardian: {
            name: formData.guardian_name,
            relationship: formData.guardian_relationship,
            phone: formData.guardian_phone,
            email: formData.guardian_email
          },
          documents: {
            birth_certificate_url: formData.birth_certificate_url,
            report_card_url: formData.report_card_url,
            good_moral_url: formData.good_moral_url
          }
        },
        grade_level: formData.grade_level,
        strand: formData.strand || null,
        notes: formData.notes
      })

      // Success - navigate to tracking page with tracking number
      navigate(`/enrollment/track?number=${data.tracking_number}`, {
        state: { showSuccess: true }
      })
    } catch (err) {
      console.error('Enrollment application failed:', err)
      setError(err.response?.data?.error || err.message || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  const isSeniorHigh = ['11', '12'].includes(formData.grade_level)
  
  // Calculate form progress
  const requiredFields = [
    'first_name', 'last_name', 'birth_date', 'sex', 'email', 'phone',
    'address', 'grade_level', 'guardian_name', 'guardian_relationship', 'guardian_phone'
  ]
  const filledRequiredFields = requiredFields.filter(field => formData[field]?.trim()).length
  const progress = Math.round((filledRequiredFields / requiredFields.length) * 100)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-text">Enrollment Application</h1>
        <p className="mt-2 text-muted">
          School Year 2026-2027 · Kiwalan National High School
        </p>
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

        {/* Info Alert */}
        <Card className="mb-6 border-l-4 border-l-knhs-purple bg-purple-50">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 flex-shrink-0 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-knhs-purple">Important Information</h3>
              <ul className="mt-2 space-y-1 text-sm text-purple-900">
                <li>• Fill in all required fields marked with an asterisk (*)</li>
                <li>• Upload documents to Google Drive or similar and provide shareable links</li>
                <li>• You will receive a tracking number after submission</li>
                <li>• Check your application status using the tracking number</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-l-4 border-l-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 font-medium text-red-900">{error}</p>
            </div>
          </Card>
        )}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-text">Personal Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  First Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.first_name && touched.first_name
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.first_name && touched.first_name}
                  aria-describedby={fieldErrors.first_name ? 'first_name-error' : undefined}
                />
                {fieldErrors.first_name && touched.first_name && (
                  <p id="first_name-error" className="mt-1 text-xs text-red-600">{fieldErrors.first_name}</p>
                )}
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Last Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.last_name && touched.last_name
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.last_name && touched.last_name}
                  aria-describedby={fieldErrors.last_name ? 'last_name-error' : undefined}
                />
                {fieldErrors.last_name && touched.last_name && (
                  <p id="last_name-error" className="mt-1 text-xs text-red-600">{fieldErrors.last_name}</p>
                )}
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Suffix</label>
                <input
                  type="text"
                  name="suffix"
                  value={formData.suffix}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Jr., Sr., III, etc."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Birth Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.birth_date && touched.birth_date
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.birth_date && touched.birth_date}
                  aria-describedby={fieldErrors.birth_date ? 'birth_date-error' : undefined}
                />
                {fieldErrors.birth_date && touched.birth_date && (
                  <p id="birth_date-error" className="mt-1 text-xs text-red-600">{fieldErrors.birth_date}</p>
                )}
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Sex <span className="text-red-600">*</span>
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.sex && touched.sex
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.sex && touched.sex}
                  aria-describedby={fieldErrors.sex ? 'sex-error' : undefined}
                >
                  <option value="">Select...</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
                {fieldErrors.sex && touched.sex && (
                  <p id="sex-error" className="mt-1 text-xs text-red-600">{fieldErrors.sex}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-text">Learner Reference Number (LRN)</label>
                <input
                  type="text"
                  name="lrn"
                  value={formData.lrn}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="12-digit LRN (if available)"
                  maxLength={12}
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.lrn && touched.lrn
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.lrn && touched.lrn}
                  aria-describedby={fieldErrors.lrn ? 'lrn-error' : undefined}
                />
                {fieldErrors.lrn && touched.lrn && (
                  <p id="lrn-error" className="mt-1 text-xs text-red-600">{fieldErrors.lrn}</p>
                )}
                <p className="mt-1 text-xs text-muted">If you don't have an LRN yet, leave this blank</p>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-text">Contact Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.email && touched.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.email && touched.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
                {fieldErrors.email && touched.email && (
                  <p id="email-error" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  placeholder="09XX XXX XXXX"
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.phone && touched.phone
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.phone && touched.phone}
                  aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                />
                {fieldErrors.phone && touched.phone && (
                  <p id="phone-error" className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-text">
                  Complete Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  placeholder="House No., Street Name"
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.address && touched.address
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.address && touched.address}
                  aria-describedby={fieldErrors.address ? 'address-error' : undefined}
                />
                {fieldErrors.address && touched.address && (
                  <p id="address-error" className="mt-1 text-xs text-red-600">{fieldErrors.address}</p>
                )}
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Barangay</label>
                <input
                  type="text"
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Municipality/City</label>
                <input
                  type="text"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Iligan City"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Province</label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Lanao del Norte"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">ZIP Code</label>
                <input
                  type="text"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="9200"
                  maxLength={4}
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.zip_code && touched.zip_code
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.zip_code && touched.zip_code}
                  aria-describedby={fieldErrors.zip_code ? 'zip_code-error' : undefined}
                />
                {fieldErrors.zip_code && touched.zip_code && (
                  <p id="zip_code-error" className="mt-1 text-xs text-red-600">{fieldErrors.zip_code}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Academic Information */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-text">Academic Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Applying for Grade Level <span className="text-red-600">*</span>
                </label>
                <select
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.grade_level && touched.grade_level
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.grade_level && touched.grade_level}
                  aria-describedby={fieldErrors.grade_level ? 'grade_level-error' : undefined}
                >
                  <option value="">Select grade level...</option>
                  <option value="7">Grade 7 (Junior High)</option>
                  <option value="8">Grade 8 (Junior High)</option>
                  <option value="9">Grade 9 (Junior High)</option>
                  <option value="10">Grade 10 (Junior High)</option>
                  <option value="11">Grade 11 (Senior High)</option>
                  <option value="12">Grade 12 (Senior High)</option>
                </select>
                {fieldErrors.grade_level && touched.grade_level && (
                  <p id="grade_level-error" className="mt-1 text-xs text-red-600">{fieldErrors.grade_level}</p>
                )}
              </div>
              
              {isSeniorHigh && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">
                    Strand <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="strand"
                    value={formData.strand}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required={isSeniorHigh}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                      fieldErrors.strand && touched.strand
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                    }`}
                    aria-invalid={fieldErrors.strand && touched.strand}
                    aria-describedby={fieldErrors.strand ? 'strand-error' : undefined}
                  >
                    <option value="">Select strand...</option>
                    <option value="STEM">STEM (Science, Technology, Engineering, Mathematics)</option>
                    <option value="ABM">ABM (Accountancy, Business, Management)</option>
                    <option value="HUMSS">HUMSS (Humanities and Social Sciences)</option>
                    <option value="GAS">GAS (General Academic Strand)</option>
                    <option value="TVL">TVL (Technical-Vocational-Livelihood)</option>
                  </select>
                  {fieldErrors.strand && touched.strand && (
                    <p id="strand-error" className="mt-1 text-xs text-red-600">{fieldErrors.strand}</p>
                  )}
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-text">Previous School Attended</label>
                <input
                  type="text"
                  name="previous_school"
                  value={formData.previous_school}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Name of last school attended"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
            </div>
          </Card>

          {/* Parent/Guardian Information */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-text">Parent/Guardian Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-text">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="guardian_name"
                  value={formData.guardian_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.guardian_name && touched.guardian_name
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.guardian_name && touched.guardian_name}
                  aria-describedby={fieldErrors.guardian_name ? 'guardian_name-error' : undefined}
                />
                {fieldErrors.guardian_name && touched.guardian_name && (
                  <p id="guardian_name-error" className="mt-1 text-xs text-red-600">{fieldErrors.guardian_name}</p>
                )}
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Relationship <span className="text-red-600">*</span>
                </label>
                <select
                  name="guardian_relationship"
                  value={formData.guardian_relationship}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.guardian_relationship && touched.guardian_relationship
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.guardian_relationship && touched.guardian_relationship}
                  aria-describedby={fieldErrors.guardian_relationship ? 'guardian_relationship-error' : undefined}
                >
                  <option value="">Select...</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
                {fieldErrors.guardian_relationship && touched.guardian_relationship && (
                  <p id="guardian_relationship-error" className="mt-1 text-xs text-red-600">{fieldErrors.guardian_relationship}</p>
                )}
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="guardian_phone"
                  value={formData.guardian_phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  placeholder="09XX XXX XXXX"
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.guardian_phone && touched.guardian_phone
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.guardian_phone && touched.guardian_phone}
                  aria-describedby={fieldErrors.guardian_phone ? 'guardian_phone-error' : undefined}
                />
                {fieldErrors.guardian_phone && touched.guardian_phone && (
                  <p id="guardian_phone-error" className="mt-1 text-xs text-red-600">{fieldErrors.guardian_phone}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-text">Email</label>
                <input
                  type="email"
                  name="guardian_email"
                  value={formData.guardian_email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.guardian_email && touched.guardian_email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-knhs-purple focus:ring-knhs-purple/20'
                  }`}
                  aria-invalid={fieldErrors.guardian_email && touched.guardian_email}
                  aria-describedby={fieldErrors.guardian_email ? 'guardian_email-error' : undefined}
                />
                {fieldErrors.guardian_email && touched.guardian_email && (
                  <p id="guardian_email-error" className="mt-1 text-xs text-red-600">{fieldErrors.guardian_email}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Document Upload */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-text">Required Documents</h2>
            <p className="mb-4 text-sm text-muted">
              Upload your documents to Google Drive, Dropbox, or OneDrive and paste the shareable link below. Make sure the links are set to "Anyone with the link can view".
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Birth Certificate (PSA Copy)
                </label>
                <input
                  type="url"
                  name="birth_certificate_url"
                  value={formData.birth_certificate_url}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Report Card (Latest)
                </label>
                <input
                  type="url"
                  name="report_card_url"
                  value={formData.report_card_url}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Certificate of Good Moral
                </label>
                <input
                  type="url"
                  name="good_moral_url"
                  value={formData.good_moral_url}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
            </div>
          </Card>

          {/* Additional Notes */}
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-text">Additional Information</h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Notes (Optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
                placeholder="Any additional information you'd like to share..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
              />
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </form>
    </div>
  )
}
