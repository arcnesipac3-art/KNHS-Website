import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
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
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const [showLockModal, setShowLockModal] = useState(false)
  const [lockTarget, setLockTarget] = useState(null)
  
  const [showCommentsModal, setShowCommentsModal] = useState(false)
  const [commentsTarget, setCommentsTarget] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentIsInternal, setCommentIsInternal] = useState(false)
  
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyTarget, setHistoryTarget] = useState(null)
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('pending') // 'pending' or 'history'

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
        const quarterList = Array.isArray(data) ? data : (data?.results ?? [])
        setQuarters(quarterList)
        
        // Auto-select current quarter
        const current = quarterList.find((q) => q.is_active)
        if (current) {
          setSelectedQuarter(current.id)
        } else if (quarterList.length > 0) {
          setSelectedQuarter(quarterList[0].id)
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
        const queueList = Array.isArray(data) ? data : (data?.results ?? [])
        setApprovalQueue(queueList)
        setSelectedItems(new Set()) // Clear selections when queue changes
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
  
  function toggleSelectItem(key) {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }
  
  function selectAll() {
    const allKeys = approvalQueue.map(item => `${item.class_subject_id}:${item.quarter_id}`)
    setSelectedItems(new Set(allKeys))
  }
  
  function deselectAll() {
    setSelectedItems(new Set())
  }

  function deselectAll() {
    setSelectedItems(new Set())
  }
  
  async function handleBulkApprove() {
    if (selectedItems.size === 0) {
      alert('Please select at least one grade set to approve')
      return
    }
    
    if (!window.confirm(`Approve ${selectedItems.size} selected grade set(s)?`)) {
      return
    }

    setProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const items = Array.from(selectedItems).map(key => {
        const [class_subject_id, quarter_id] = key.split(':')
        return { class_subject_id, quarter_id }
      })
      
      const { data } = await gradeApi.bulkApprove({
        items,
        reason: 'Bulk approval by principal'
      })

      setSuccessMessage(`Successfully approved ${data.total_published} grades across ${selectedItems.size} grade sets. Students can now view their grades.`)
      
      // Reload queue
      const queueRes = await gradeApi.getApprovalQueue({ quarter: selectedQuarter })
      setApprovalQueue(queueRes.data)
      setSelectedItems(new Set())
      
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to bulk approve grades:', err)
      setError(err.response?.data?.error || 'Failed to bulk approve grades. Please try again.')
    } finally {
      setProcessing(false)
    }
  }
  
  async function handleBulkReject() {
    if (selectedItems.size === 0) {
      alert('Please select at least one grade set to reject')
      return
    }
    
    setRejectTarget({ isBulk: true, count: selectedItems.size })
    setRejectReason('')
    setShowRejectModal(true)
  }
  
  async function openCommentsModal(item) {
    setCommentsTarget(item)
    setComments([])
    setNewComment('')
    setShowCommentsModal(true)
    
    // Load existing comments
    try {
      const { data } = await gradeApi.getReviewComments({
        class_subject: item.class_subject_id,
        quarter: item.quarter_id
      })
      setComments(data)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }
  
  async function handleAddComment() {
    if (!newComment.trim() || newComment.trim().length < 10) {
      alert('Please enter a comment with at least 10 characters')
      return
    }
    
    try {
      const { data } = await gradeApi.addReviewComment({
        class_subject_id: commentsTarget.class_subject_id,
        quarter_id: commentsTarget.quarter_id,
        comment: newComment.trim(),
        is_internal: commentIsInternal
      })
      
      setComments(prev => [data, ...prev])
      setNewComment('')
      setCommentIsInternal(false)
    } catch (err) {
      console.error('Failed to add comment:', err)
      alert('Failed to add comment. Please try again.')
    }
  }
  
  async function openHistoryModal(item) {
    setHistoryTarget(item)
    setHistory([])
    setShowHistoryModal(true)
    
    // Load approval history
    try {
      const { data } = await gradeApi.getApprovalHistory({
        class_subject: item.class_subject_id,
        quarter: item.quarter_id,
        limit: 20
      })
      setHistory(data.results.length > 0 ? data.results[0].events : [])
    } catch (err) {
      console.error('Failed to load history:', err)
    }
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
      if (rejectTarget.isBulk) {
        // Bulk reject
        const items = Array.from(selectedItems).map(key => {
          const [class_subject_id, quarter_id] = key.split(':')
          return { class_subject_id, quarter_id }
        })
        
        const { data } = await gradeApi.bulkReject({
          items,
          reason: rejectReason.trim()
        })

        setSuccessMessage(`Rejected ${data.total_rejected} grades across ${selectedItems.size} grade sets for revision.`)
        setSelectedItems(new Set())
      } else {
        // Single reject
        await gradeApi.reject({
          class_subject_id: rejectTarget.class_subject_id,
          quarter_id: rejectTarget.quarter_id,
          reason: rejectReason.trim()
        })

        setSuccessMessage(`Grades for ${rejectTarget.subject_name} have been returned to ${rejectTarget.teacher_name} for revision.`)
      }
      
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
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-muted">Selected</p>
                  <p className="text-2xl font-bold text-knhs-purple">{selectedItems.size}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">Pending</p>
                  <p className="text-3xl font-bold text-amber-600">{approvalQueue.length}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Bulk Actions Bar */}
          {approvalQueue.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={selectedItems.size === approvalQueue.length ? deselectAll : selectAll}
                >
                  {selectedItems.size === approvalQueue.length ? '☐ Deselect All' : '☑ Select All'}
                </Button>
                {selectedItems.size > 0 && (
                  <span className="text-sm text-muted">
                    {selectedItems.size} selected
                  </span>
                )}
              </div>
              
              {selectedItems.size > 0 && (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleBulkApprove}
                    disabled={processing}
                    size="sm"
                  >
                    ✅ Approve Selected ({selectedItems.size})
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleBulkReject}
                    disabled={processing}
                    size="sm"
                  >
                    ❌ Reject Selected ({selectedItems.size})
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Approval Queue */}
        <Card title="Pending Approvals" subtitle={selectedQuarterData ? selectedQuarterData.name : 'Select a quarter'}>
          {loading ? (
            <div className="space-y-4">
              <Skeleton variant="card" count={3} />
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
                const isSelected = selectedItems.has(key)

                return (
                  <div key={key} className={`rounded-lg border-2 ${isSelected ? 'border-knhs-purple' : 'border-amber-200'} bg-white p-4`}>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(key)}
                          className="mt-1 h-5 w-5 rounded border-gray-300 text-knhs-purple focus:ring-knhs-purple"
                        />
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
                    <div className="mt-4 flex items-center flex-wrap gap-3 border-t border-gray-200 pt-4">
                      <Button
                        onClick={() => handleApprove(item)}
                        disabled={processing}
                        size="sm"
                      >
                        ✅ Approve & Publish
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openRejectModal(item)}
                        disabled={processing}
                        size="sm"
                      >
                        ❌ Reject for Revision
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openCommentsModal(item)}
                        disabled={processing}
                        size="sm"
                      >
                        💬 Comments
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openHistoryModal(item)}
                        disabled={processing}
                        size="sm"
                      >
                        📜 History
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openLockModal(item)}
                        disabled={processing}
                        size="sm"
                      >
                        🔒 Lock
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
            <h3 className="text-xl font-bold text-text">
              {rejectTarget?.isBulk ? `Reject ${rejectTarget.count} Grade Sets` : 'Reject Grades for Revision'}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {rejectTarget?.isBulk 
                ? `Provide a reason for rejecting the ${rejectTarget.count} selected grade sets. This will be sent to the respective teachers.`
                : `Please provide a detailed reason why these grades need revision. This will be sent to ${rejectTarget?.teacher_name}.`
              }
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

      {/* Comments Modal */}
      {showCommentsModal && commentsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-text">Review Comments</h3>
                <p className="text-sm text-muted">
                  {commentsTarget.subject_name} - {commentsTarget.classroom_name}
                </p>
              </div>
              <button onClick={() => setShowCommentsModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Add Comment Form */}
            <div className="mb-6 border-b border-gray-200 pb-6">
              <label className="block text-sm font-medium text-text mb-2">Add Comment</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder="Enter your review comment or feedback..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
              />
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={commentIsInternal}
                    onChange={(e) => setCommentIsInternal(e.target.checked)}
                    className="rounded border-gray-300 text-knhs-purple focus:ring-knhs-purple"
                  />
                  Internal note (visible only to principals/admins)
                </label>
                <Button size="sm" onClick={handleAddComment} disabled={newComment.trim().length < 10}>
                  Add Comment
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              <h4 className="font-semibold text-text">Comments ({comments.length})</h4>
              {comments.length === 0 ? (
                <p className="text-center text-sm text-muted py-8">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text">{comment.author_name}</span>
                          <span className="text-xs text-muted">({comment.author_role})</span>
                          {comment.is_internal && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                              Internal
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-text">{comment.comment}</p>
                      </div>
                      <span className="text-xs text-muted">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-text">Approval History</h3>
                <p className="text-sm text-muted">
                  {historyTarget.subject_name} - {historyTarget.classroom_name}
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* History Timeline */}
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-center text-sm text-muted py-8">No history available</p>
              ) : (
                history.map((event, index) => (
                  <div key={event.id} className="relative pl-8">
                    {/* Timeline dot */}
                    {index < history.length - 1 && (
                      <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    <div className={`absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 ${
                      event.action === 'approved' || event.action === 'published' 
                        ? 'border-green-500 bg-green-100'
                        : event.action === 'edited' && event.metadata?.result === 'rejected'
                        ? 'border-red-500 bg-red-100'
                        : 'border-blue-500 bg-blue-100'
                    }`}></div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              event.action === 'approved' || event.action === 'published'
                                ? 'bg-green-100 text-green-800'
                                : event.action === 'edited' && event.metadata?.result === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {event.action_display}
                            </span>
                            {event.metadata?.bulk_operation && (
                              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                                Bulk Operation
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-text">
                            <span className="font-medium">{event.actor_name}</span>
                            {event.actor_role && <span className="text-muted"> ({event.actor_role})</span>}
                          </p>
                          {event.reason && (
                            <p className="mt-2 text-sm text-muted italic">"{event.reason}"</p>
                          )}
                        </div>
                        <span className="text-xs text-muted whitespace-nowrap">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  )
}
