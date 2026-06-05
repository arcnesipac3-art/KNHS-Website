import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'

export default function EnrollmentApplication() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
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

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.first_name || !formData.last_name || !formData.birth_date) {
        throw new Error('Please fill in all required fields')
      }

      if (!formData.email || !formData.phone) {
        throw new Error('Contact information is required')
      }

      if (!formData.grade_level) {
        throw new Error('Please select a grade level')
      }

      if (['11', '12'].includes(formData.grade_level) && !formData.strand) {
        throw new Error('Please select a strand for Senior High School')
      }

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

  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text">Enrollment Application</h1>
          <p className="mt-2 text-muted">
            School Year 2026-2027 · Kiwalan National High School
          </p>
        </div>

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
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
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
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Suffix</label>
                <input
                  type="text"
                  name="suffix"
                  value={formData.suffix}
                  onChange={handleChange}
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
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Sex <span className="text-red-600">*</span>
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                >
                  <option value="">Select...</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-text">Learner Reference Number (LRN)</label>
                <input
                  type="text"
                  name="lrn"
                  value={formData.lrn}
                  onChange={handleChange}
                  placeholder="12-digit LRN (if available)"
                  maxLength={12}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
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
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
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
                  required
                  placeholder="09XX XXX XXXX"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
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
                  required
                  placeholder="House No., Street Name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Barangay</label>
                <input
                  type="text"
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleChange}
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
                  placeholder="9200"
                  maxLength={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
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
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                >
                  <option value="">Select grade level...</option>
                  <option value="7">Grade 7 (Junior High)</option>
                  <option value="8">Grade 8 (Junior High)</option>
                  <option value="9">Grade 9 (Junior High)</option>
                  <option value="10">Grade 10 (Junior High)</option>
                  <option value="11">Grade 11 (Senior High)</option>
                  <option value="12">Grade 12 (Senior High)</option>
                </select>
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
                    required={isSeniorHigh}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                  >
                    <option value="">Select strand...</option>
                    <option value="STEM">STEM (Science, Technology, Engineering, Mathematics)</option>
                    <option value="ABM">ABM (Accountancy, Business, Management)</option>
                    <option value="HUMSS">HUMSS (Humanities and Social Sciences)</option>
                    <option value="GAS">GAS (General Academic Strand)</option>
                    <option value="TVL">TVL (Technical-Vocational-Livelihood)</option>
                  </select>
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-text">Previous School Attended</label>
                <input
                  type="text"
                  name="previous_school"
                  value={formData.previous_school}
                  onChange={handleChange}
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
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-text">
                  Relationship <span className="text-red-600">*</span>
                </label>
                <select
                  name="guardian_relationship"
                  value={formData.guardian_relationship}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                >
                  <option value="">Select...</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
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
                  required
                  placeholder="09XX XXX XXXX"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-text">Email</label>
                <input
                  type="email"
                  name="guardian_email"
                  value={formData.guardian_email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
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
    </PublicLayout>
  )
}
