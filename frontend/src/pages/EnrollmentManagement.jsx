import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'

export default function EnrollmentManagement() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [filter, setFilter] = useState('all') // all, pending, under_review, approved, rejected
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [reviewMode, setReviewMode] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [filter])

  async function loadApplications() {
    setLoading(true)
    setError(null)

    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const { data } = await api.get('/enrollment-applications/', { params })
      setApplications(data)
    } catch (err) {
      console.error('Failed to load applications:', err)
      setError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  function openReviewModal(application) {
    setSelectedApplication(application)
    setReviewMode(true)
  }

  function closeReviewModal() {
    setSelectedApplication(null)
    setReviewMode(false)
  }

  async function handleReview(applicationId, status, notes) {
    try {
      await api.patch(`/enrollment-applications/${applicationId}/review/`, {
        status,
        reviewer_notes: notes,
      })
      
      // Refresh list
      await loadApplications()
      closeReviewModal()
    } catch (err) {
      console.error('Failed to review application:', err)
      alert('Failed to update application status')
    }
  }

  // Filter stats
  const stats = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    under_review: applications.filter((a) => a.status === 'under_review').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }

  // Check user permission
  if (!['admin', 'registrar'].includes(user?.role)) {
    return (
      <PortalLayout>
        <Card>
          <div className="py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-text">Access Denied</h2>
            <p className="mt-2 text-sm text-muted">You don't have permission to access enrollment management.</p>
          </div>
        </Card>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text">Enrollment Management</h1>
          <p className="mt-2 text-muted">Review and manage enrollment applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <StatsCard
            label="All Applications"
            value={stats.all}
            color="gray"
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <StatsCard
            label="Pending Review"
            value={stats.pending}
            color="amber"
            active={filter === 'pending'}
            onClick={() => setFilter('pending')}
          />
          <StatsCard
            label="Under Review"
            value={stats.under_review}
            color="blue"
            active={filter === 'under_review'}
            onClick={() => setFilter('under_review')}
          />
          <StatsCard
            label="Approved"
            value={stats.approved}
            color="green"
            active={filter === 'approved'}
            onClick={() => setFilter('approved')}
          />
          <StatsCard
            label="Needs Revision"
            value={stats.rejected}
            color="red"
            active={filter === 'rejected'}
            onClick={() => setFilter('rejected')}
          />
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-l-4 border-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 font-medium text-red-900">{error}</p>
            </div>
          </Card>
        )}

        {/* Applications Table */}
        <Card>
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
                <p className="mt-4 text-muted">Loading applications...</p>
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-text">No Applications Found</h3>
              <p className="mt-2 text-sm text-muted">
                {filter === 'all'
                  ? 'No enrollment applications have been submitted yet.'
                  : `No applications with status "${filter.replace('_', ' ')}".`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-sm font-medium text-muted">
                    <th className="px-4 py-3">Tracking #</th>
                    <th className="px-4 py-3">Applicant Name</th>
                    <th className="px-4 py-3">Grade Level</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((application) => (
                    <ApplicationRow
                      key={application.id}
                      application={application}
                      onReview={openReviewModal}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Review Modal */}
      {reviewMode && selectedApplication && (
        <ReviewModal
          application={selectedApplication}
          onClose={closeReviewModal}
          onSubmit={handleReview}
        />
      )}
    </PortalLayout>
  )
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatsCard({ label, value, color, active, onClick }) {
  const colors = {
    gray: active ? 'border-gray-500 bg-gray-50' : 'border-gray-200',
    amber: active ? 'border-amber-500 bg-amber-50' : 'border-gray-200',
    blue: active ? 'border-blue-500 bg-blue-50' : 'border-gray-200',
    green: active ? 'border-green-500 bg-green-50' : 'border-gray-200',
    red: active ? 'border-red-500 bg-red-50' : 'border-gray-200',
  }

  const textColors = {
    gray: 'text-gray-900',
    amber: 'text-amber-900',
    blue: 'text-blue-900',
    green: 'text-green-900',
    red: 'text-red-900',
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${colors[color]}`}
    >
      <p className={`text-3xl font-bold ${textColors[color]}`}>{value}</p>
      <p className="mt-1 text-sm font-medium text-muted">{label}</p>
    </button>
  )
}

function ApplicationRow({ application, onReview }) {
  const personal = application.applicant_data?.personal || {}
  const contact = application.applicant_data?.contact || {}

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <span className="font-mono text-sm">{application.tracking_number}</span>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-text">
            {personal.first_name} {personal.last_name}
          </p>
          {personal.lrn && (
            <p className="text-xs text-muted">LRN: {personal.lrn}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-text">Grade {application.grade_level}</p>
        {application.strand && (
          <p className="text-xs text-muted">{application.strand}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="text-sm">
          <p className="text-text">{contact.email}</p>
          <p className="text-muted">{contact.phone}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-muted">{formatShortDate(application.submitted_at)}</p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={application.status} />
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onReview(application)}
          className="text-sm font-medium text-knhs-purple hover:text-purple-700"
        >
          Review
        </button>
      </td>
    </tr>
  )
}

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
    rejected: 'Revision Needed',
  }

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  )
}

function ReviewModal({ application, onClose, onSubmit }) {
  const [status, setStatus] = useState(application.status)
  const [notes, setNotes] = useState(application.reviewer_notes || '')
  const [submitting, setSubmitting] = useState(false)

  const personal = application.applicant_data?.personal || {}
  const contact = application.applicant_data?.contact || {}
  const academic = application.applicant_data?.academic || {}
  const guardian = application.applicant_data?.guardian || {}
  const documents = application.applicant_data?.documents || {}

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    try {
      await onSubmit(application.id, status, notes)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-xl font-semibold text-text">Review Application</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Application Details */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-text">Application Details</h3>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted">Tracking Number</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{application.tracking_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted">Submitted</p>
                  <p className="mt-1 text-sm">{formatLongDate(application.submitted_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="mb-3 font-semibold text-text">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoField label="Full Name" value={`${personal.first_name} ${personal.middle_name || ''} ${personal.last_name} ${personal.suffix || ''}`.trim()} />
              <InfoField label="Birth Date" value={personal.birth_date} />
              <InfoField label="Sex" value={personal.sex === 'M' ? 'Male' : 'Female'} />
              <InfoField label="LRN" value={personal.lrn || 'Not provided'} />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="mb-3 font-semibold text-text">Contact Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoField label="Email" value={contact.email} />
              <InfoField label="Phone" value={contact.phone} />
              <div className="md:col-span-2">
                <InfoField label="Address" value={`${contact.address || ''}, ${contact.barangay || ''}, ${contact.municipality || ''}, ${contact.province || ''} ${contact.zip_code || ''}`.trim()} />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="mb-3 font-semibold text-text">Academic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoField label="Grade Level" value={`Grade ${application.grade_level}`} />
              {application.strand && <InfoField label="Strand" value={application.strand} />}
              <div className="md:col-span-2">
                <InfoField label="Previous School" value={academic.previous_school || 'Not provided'} />
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div>
            <h3 className="mb-3 font-semibold text-text">Parent/Guardian Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoField label="Name" value={guardian.name} />
              <InfoField label="Relationship" value={guardian.relationship} />
              <InfoField label="Phone" value={guardian.phone} />
              <InfoField label="Email" value={guardian.email || 'Not provided'} />
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="mb-3 font-semibold text-text">Submitted Documents</h3>
            <div className="space-y-2">
              {documents.birth_certificate_url && (
                <DocumentLink label="Birth Certificate" url={documents.birth_certificate_url} />
              )}
              {documents.report_card_url && (
                <DocumentLink label="Report Card" url={documents.report_card_url} />
              )}
              {documents.good_moral_url && (
                <DocumentLink label="Good Moral Certificate" url={documents.good_moral_url} />
              )}
              {!documents.birth_certificate_url && !documents.report_card_url && !documents.good_moral_url && (
                <p className="text-sm text-muted">No documents submitted</p>
              )}
            </div>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-6">
            <h3 className="mb-4 font-semibold text-text">Your Review</h3>
            
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-text">
                Status Decision
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
              >
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approve</option>
                <option value="rejected">Request Revision</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-text">
                Notes for Applicant
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any notes or instructions for the applicant..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Review'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-1 text-sm text-text">{value || 'N/A'}</p>
    </div>
  )
}

function DocumentLink({ label, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-knhs-purple hover:text-purple-700"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {label}
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatShortDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatLongDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
