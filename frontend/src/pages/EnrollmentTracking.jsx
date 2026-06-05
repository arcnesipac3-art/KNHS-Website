import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'

export default function EnrollmentTracking() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get('number') || '')
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Show success message if redirected from application form
  useEffect(() => {
    if (searchParams.get('number') && window.history.state?.showSuccess) {
      setShowSuccess(true)
      loadApplication(searchParams.get('number'))
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [])

  async function loadApplication(number) {
    setLoading(true)
    setError(null)

    try {
      const { data } = await api.get(`/enrollment-applications/track/?tracking_number=${number}`)
      setApplication(data)
    } catch (err) {
      console.error('Failed to load application:', err)
      setError(err.response?.data?.error || 'Application not found. Please check your tracking number.')
      setApplication(null)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number')
      return
    }
    loadApplication(trackingNumber)
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text">Track Your Enrollment</h1>
          <p className="mt-2 text-muted">
            Enter your tracking number to check your application status
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <Card className="mb-6 border-l-4 border-l-green-500 bg-green-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Application Submitted Successfully!</h3>
                <p className="mt-1 text-sm text-green-800">
                  Your tracking number is <span className="font-mono font-bold">{trackingNumber}</span>. 
                  Save this number to check your application status later.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Search Form */}
        <Card className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder="Enter tracking number (e.g., ENR-2026-ABCD1234)"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Track'}
            </Button>
          </form>
        </Card>

        {/* Error Message */}
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

        {/* Application Details */}
        {application && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted">Tracking Number</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-text">{application.tracking_number}</p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
              </div>
              
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted">Applicant Name</p>
                  <p className="mt-1 font-semibold text-text">
                    {application.applicant_data?.personal?.first_name}{' '}
                    {application.applicant_data?.personal?.middle_name}{' '}
                    {application.applicant_data?.personal?.last_name}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted">Grade Level</p>
                  <p className="mt-1 font-semibold text-text">
                    Grade {application.grade_level}
                    {application.strand && ` - ${application.strand}`}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted">Email</p>
                  <p className="mt-1 text-text">{application.applicant_data?.contact?.email}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted">Phone</p>
                  <p className="mt-1 text-text">{application.applicant_data?.contact?.phone}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted">Submitted On</p>
                  <p className="mt-1 text-text">{formatDate(application.submitted_at)}</p>
                </div>
                
                {application.reviewed_at && (
                  <div>
                    <p className="text-sm font-medium text-muted">Reviewed On</p>
                    <p className="mt-1 text-text">{formatDate(application.reviewed_at)}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Status Timeline */}
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-text">Application Timeline</h2>
              <div className="space-y-4">
                <TimelineItem
                  status="completed"
                  title="Application Submitted"
                  description="Your application has been received"
                  date={application.submitted_at}
                />
                
                <TimelineItem
                  status={['under_review', 'approved', 'rejected'].includes(application.status) ? 'completed' : 'pending'}
                  title="Under Review"
                  description="Registrar is reviewing your documents"
                  date={application.status === 'under_review' ? application.updated_at : null}
                />
                
                <TimelineItem
                  status={application.status === 'approved' ? 'completed' : application.status === 'rejected' ? 'failed' : 'pending'}
                  title={application.status === 'rejected' ? 'Application Decision' : 'Approval'}
                  description={
                    application.status === 'approved'
                      ? 'Your application has been approved!'
                      : application.status === 'rejected'
                      ? 'Application needs revision'
                      : 'Waiting for final decision'
                  }
                  date={['approved', 'rejected'].includes(application.status) ? application.reviewed_at : null}
                />
              </div>
            </Card>

            {/* Reviewer Notes */}
            {application.reviewer_notes && (
              <Card className="border-l-4 border-l-blue-500 bg-blue-50">
                <h3 className="font-semibold text-blue-900">Notes from Registrar</h3>
                <p className="mt-2 text-sm text-blue-800 whitespace-pre-line">{application.reviewer_notes}</p>
              </Card>
            )}

            {/* Status-Specific Messages */}
            {application.status === 'pending' && (
              <Card className="border-l-4 border-l-amber-500 bg-amber-50">
                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 flex-shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900">Application Pending</h3>
                    <p className="mt-1 text-sm text-amber-800">
                      Your application is in queue. Our registrar will review it within 3-5 business days.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {application.status === 'approved' && (
              <Card className="border-l-4 border-l-green-500 bg-green-50">
                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900">Application Approved!</h3>
                    <p className="mt-1 text-sm text-green-800">
                      Congratulations! Your enrollment application has been approved. 
                      Please wait for further instructions via email or phone.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {application.status === 'rejected' && (
              <Card className="border-l-4 border-l-red-500 bg-red-50">
                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900">Application Needs Revision</h3>
                    <p className="mt-1 text-sm text-red-800">
                      Please review the notes from the registrar and submit a new application with the required changes.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                Back to Home
              </Button>
              {application.status === 'rejected' && (
                <Button onClick={() => navigate('/enrollment/apply')}>
                  Submit New Application
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        {!application && !loading && (
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-text">Need Help?</h2>
            <div className="space-y-3 text-sm text-muted">
              <p>• Your tracking number was sent to your email after submitting your application</p>
              <p>• Tracking numbers are in the format: ENR-2026-XXXXXXXX</p>
              <p>• Applications are typically reviewed within 3-5 business days</p>
              <p>• For inquiries, contact the registrar at registrar@knhs.edu.ph or call (063) 123-4567</p>
            </div>
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => navigate('/enrollment/apply')}>
                Submit New Application
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PublicLayout>
  )
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  const labels = {
    pending: 'Pending',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Needs Revision',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  )
}

function TimelineItem({ status, title, description, date }) {
  const iconStyles = {
    completed: 'bg-green-500 text-white',
    pending: 'bg-gray-300 text-gray-600',
    failed: 'bg-red-500 text-white',
  }

  return (
    <div className="flex gap-4">
      {/* Icon */}
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${iconStyles[status]}`}>
          {status === 'completed' && (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {status === 'pending' && (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          )}
          {status === 'failed' && (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="mt-1 h-full w-0.5 bg-gray-300"></div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <h3 className={`font-semibold ${status === 'completed' ? 'text-text' : 'text-gray-500'}`}>
          {title}
        </h3>
        <p className={`mt-1 text-sm ${status === 'completed' ? 'text-muted' : 'text-gray-400'}`}>
          {description}
        </p>
        {date && (
          <p className="mt-1 text-xs text-gray-400">{formatDate(date)}</p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
