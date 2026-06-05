import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { gradeApi } from '../lib/learningApi'
import { quarterApi } from '../lib/academicApi'
import GradeStatusBadge from '../components/ui/GradeStatusBadge'

export default function ApprovalCenter() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [quarters, setQuarters] = useState([])
  const [selectedQuarter, setSelectedQuarter] = useState('')
  const [approvalQueue, setApprovalQueue] = useState([])
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const [showLockModal, setShowLockModal] = useState(false)
  const [lockTarget, setLockTarget] = useState(null)

  const isPrincipal = user?.role === 'principal' || user?.role === 'admin'

  // Access control
  useEffect(() => {
    if (!isPrincipal) {
      navigate('/dashboard')
    }
  }, [user, isPrincipal, navigate])

  // Load quarters on mount
  useEffect(() => {
    async function loadQuarters() {
      try {
        const { data } = await quarterApi.getAll()
        setQuarters(data)
        
        // Auto-select current quarter
        const current = data.find((q) => q.is_active)
        if (current) {
          setSelectedQuarter(current.id)
        } else if (data.length > 0) {
          setSelectedQuarter(data[0].id)
        }
      } catch (err) {
        console.error('Failed to load quarters:', err)
        setError('Failed to load quarters')
      }
    }
    if (isPrincipal) {
      loadQuarters()
    }
  }, [isPrincipal])

  // Load approval queue when quarter changes
  useEffect(() => {
    async function loadApprovalQueue() {
      if (!selectedQuarter) {
        setApprovalQueue([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const { data } = await gradeApi.getApprovalQueue({ quarter: selectedQuarter })
        setApprovalQueue(data)
      } catch (err) {
        console.error('Failed to load approval queue:', err)
        setError('Failed to load pending approvals. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadApprovalQueue()
  }, [selectedQuarter])

  function toggleExpand(key) {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  async function handleApprove(item) {
    if (!window.confirm(`Approve ${item.student_count} grade(s) for ${item.subject_name} (${item.classroom_name})?`)) {
      return
    }

    setProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await gradeApi.publish({
        class_subject_id: item.class_subject_id,
        quarter_id: item.quarter_id,
        reason: 'Grades reviewed and approved by principal'
      })

      setSuccessMessage(`Successfully approved ${item.student_count} grade(s) for ${item.subject_name}. Students can now view their grades.`)
      
      // Reload queue
      const { data } = await gradeApi.getApprovalQueue({ quarter: selectedQuarter })
      setApprovalQueue(data)
      
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to approve grades:', err)
      setError(err.response?.data?.error || 'Failed to approve grades. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  function openLockModal(item) {
    setLockTarget(item)
    setShowLockModal(true)
  }

  function closeLockModal() {
    setShowLockModal(false)
    setLockTarget(null)
  }

  async function handleLock() {
    setProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await gradeApi.lock({
        class_subject_id: lockTarget.class_subject_id,
        quarter_id: lockTarget.quarter_id
      })

      setSuccessMessage(`Grades for ${lockTarget.subject_name} have been locked. They can no longer be edited.`)
      
      // Reload queue
      const { data } = await gradeApi.getApprovalQueue({ quarter: selectedQuarter })
      setApprovalQueue(data)
      
      closeLockModal()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to lock grades:', err)
      setError(err.response?.data?.error || 'Failed to lock grades. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  function openRejectModal(item) {
    setRejectTarget(item)
    setRejectReason('')
    setShowRejectModal(true)
  }

  function closeRejectModal() {
    setShowRejectModal(false)
    setRejectTarget(null)
    setRejectReason('')
  }

  async function handleReject() {
    if (!rejectReason || rejectReason.trim().length < 10) {
      alert('Please provide a detailed reason (at least 10 characters)')
      return
    }

    setProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await gradeApi.reject({
        class_subject_id: rejectTarget.class_subject_id,
        quarter_id: rejectTarget.quarter_id,
        reason: rejectReason.trim()
      })

      setSuccessMessage(`Grades for ${rejectTarget.subject_name} have been returned to ${rejectTarget.teacher_name} for revision.`)
      
      // Reload queue
      const { data } = await gradeApi.getApprovalQueue({ quarter: selectedQuarter })
      setApprovalQueue(data)
      
      closeRejectModal()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to reject grades:', err)
      setError(err.response?.data?.error || 'Failed to reject grades. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const selectedQuarterData = quarters.find((q) => q.id === selectedQuarter)

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Grade Approval Center</h1>
            <p className="mt-2 text-muted">Review and approve grades submitted by teachers</p>
          </div>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Card className="border-l-4 border-green-500 bg-green-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 font-medium text-green-900">{successMessage}</p>
              <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-l-4 border-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 font-medium text-red-900">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Card>
        )}

        {/* Quarter Selector */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label htmlFor="quarter" className="block text-sm font-medium text-text">
                Select Quarter
              </label>
              <select
                id="quarter"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="mt-2 block w-64 rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
              >
                {quarters.length === 0 && <option value="">No quarters available</option>}
                {quarters.map((quarter) => (
                  <option key={quarter.id} value={quarter.id}>
                    {quarter.name}
                    {quarter.is_active && ' (Current)'}
                  </option>
                ))}
              </select>
            </div>

            {selectedQuarterData && approvalQueue.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted">Pending Approvals</p>
                <p className="text-3xl font-bold text-amber-600">{approvalQueue.length}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Approval Queue */}
        <Card title="Pending Approvals" subtitle={selectedQuarterData ? selectedQuarterData.name : 'Select a quarter'}>
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
                <p className="mt-4 text-muted">Loading approvals...</p>
              </div>
            </div>
          ) : approvalQueue.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-text">All Caught Up!</h3>
              <p className="mt-2 text-sm text-muted">
                {selectedQuarter
                  ? 'No pending grade approvals for this quarter.'
                  : 'Please select a quarter to view pending approvals.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvalQueue.map((item, index) => {
                const key = `${item.class_subject_id}:${item.quarter_id}`
                const isExpanded = expandedItems.has(key)

                return (
                  <div key={key} className="rounded-lg border-2 border-amber-200 bg-white p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-text">{item.subject_name}</h3>
                          <GradeStatusBadge status="pending_approval" />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
                          <span>📚 {item.classroom_name}</span>
                          <span>👨‍🏫 {item.teacher_name}</span>
                          <span>👥 {item.student_count} student{item.student_count !== 1 ? 's' : ''}</span>
                          <span>📅 {item.quarter_name}</span>
                        </div>
                        {item.latest_submitted_at && (
                          <p className="mt-1 text-xs text-muted">
                            Submitted: {new Date(item.latest_submitted_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleExpand(key)}
                        className="ml-4 rounded-lg p-2 hover:bg-gray-100"
                      >
                        <svg
                          className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <h4 className="mb-3 text-sm font-semibold text-text">Student Grades</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-muted">Student</th>
                                <th className="px-3 py-2 text-center font-medium text-muted">WW</th>
                                <th className="px-3 py-2 text-center font-medium text-muted">PT</th>
                                <th className="px-3 py-2 text-center font-medium text-muted">QA</th>
                                <th className="px-3 py-2 text-center font-medium text-muted">Grade</th>
                                <th className="px-3 py-2 text-center font-medium text-muted">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {item.grades.map((grade) => (
                                <tr key={grade.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-3">
                                    <div>
                                      <p className="font-medium text-text">{grade.student_name}</p>
                                      <p className="text-xs text-muted">{grade.student_lrn}</p>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-center text-muted">
                                    {grade.ww_score ? Number(grade.ww_score).toFixed(2) : '-'}
                                  </td>
                                  <td className="px-3 py-3 text-center text-muted">
                                    {grade.pt_score ? Number(grade.pt_score).toFixed(2) : '-'}
                                  </td>
                                  <td className="px-3 py-3 text-center text-muted">
                                    {grade.qa_score ? Number(grade.qa_score).toFixed(2) : '-'}
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                                      grade.transmuted_grade >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {grade.transmuted_grade}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                      grade.transmuted_grade >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {grade.is_passing ? 'Passed' : 'Needs Improvement'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-3 border-t border-gray-200 pt-4">
                      <Button
                        onClick={() => handleApprove(item)}
                        disabled={processing}
                      >
                        ✅ Approve & Publish
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openRejectModal(item)}
                        disabled={processing}
                      >
                        ❌ Reject for Revision
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openLockModal(item)}
                        disabled={processing}
                      >
                        🔒 Lock Grades
                      </Button>
                      {!isExpanded && (
                        <button
                          onClick={() => toggleExpand(key)}
                          className="ml-auto text-sm text-knhs-purple hover:underline"
                        >
                          View {item.student_count} grade{item.student_count !== 1 ? 's' : ''} →
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-text">Reject Grades for Revision</h3>
            <p className="mt-2 text-sm text-muted">
              Please provide a detailed reason why these grades need revision. This will be sent to {rejectTarget?.teacher_name}.
            </p>

            <div className="mt-4">
              <label htmlFor="reject-reason" className="block text-sm font-medium text-text">
                Reason for Rejection *
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={5}
                placeholder="e.g., Please review the QA scores for students 5 and 7. They seem inconsistent with their WW and PT scores..."
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
              />
              <p className="mt-1 text-xs text-muted">
                Minimum 10 characters. Be specific to help the teacher correct the issues.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={closeRejectModal} disabled={processing}>
                Cancel
              </Button>
              <Button onClick={handleReject} disabled={processing || rejectReason.trim().length < 10}>
                {processing ? 'Rejecting...' : 'Reject Grades'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Modal */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <svg className="h-6 w-6 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-text">Lock Grades</h3>
                <p className="text-sm text-muted">Permanent record protection</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
              <h4 className="font-semibold text-purple-900">About to lock:</h4>
              <p className="mt-1 text-sm text-purple-800">
                <strong>{lockTarget?.subject_name}</strong> - {lockTarget?.classroom_name}
              </p>
              <p className="mt-1 text-xs text-purple-700">
                {lockTarget?.student_count} student grades
              </p>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-muted">
                  <strong>Warning:</strong> Once locked, these grades cannot be edited by teachers or principals.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-muted">
                  Only system administrators can unlock grades in emergency situations.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-muted">
                  Locking creates a permanent record for DepEd compliance and report cards.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={closeLockModal} disabled={processing}>
                Cancel
              </Button>
              <Button onClick={handleLock} disabled={processing}>
                {processing ? 'Locking...' : '🔒 Lock Grades'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  )
}
