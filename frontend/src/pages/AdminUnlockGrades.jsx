import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { gradeApi } from '../lib/learningApi'
import { quarterApi } from '../lib/academicApi'
import GradeStatusBadge from '../components/ui/GradeStatusBadge'

export default function AdminUnlockGrades() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [quarters, setQuarters] = useState([])
  const [selectedQuarter, setSelectedQuarter] = useState('')
  const [lockedGrades, setLockedGrades] = useState([])
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockTarget, setUnlockTarget] = useState(null)
  const [unlockReason, setUnlockReason] = useState('')

  const isAdmin = user?.role === 'admin'

  // Access control - admin only
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard')
    }
  }, [user, isAdmin, navigate])

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
    if (isAdmin) {
      loadQuarters()
    }
  }, [isAdmin])

  // Load locked grades when quarter changes
  useEffect(() => {
    async function loadLockedGrades() {
      if (!selectedQuarter) {
        setLockedGrades([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Get all grades with status 'locked' or 'published'
        const { data } = await gradeApi.getAll({
          quarter: selectedQuarter,
          status: 'locked,published'
        })

        // Group by class_subject
        const grouped = {}
        data.forEach((grade) => {
          const key = grade.class_subject_id
          if (!grouped[key]) {
            grouped[key] = {
              class_subject_id: grade.class_subject_id,
              quarter_id: grade.quarter_id,
              classroom_name: grade.classroom_name || 'Unknown',
              subject_name: grade.subject_name || 'Unknown',
              teacher_name: grade.teacher_name || 'Unassigned',
              quarter_name: grade.quarter_name || 'Unknown',
              status: grade.status,
              student_count: 0,
              grades: []
            }
          }
          grouped[key].student_count++
          grouped[key].grades.push(grade)
        })

        setLockedGrades(Object.values(grouped))
      } catch (err) {
        console.error('Failed to load locked grades:', err)
        setError('Failed to load grades. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadLockedGrades()
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

  function openUnlockModal(item) {
    setUnlockTarget(item)
    setUnlockReason('')
    setShowUnlockModal(true)
  }

  function closeUnlockModal() {
    setShowUnlockModal(false)
    setUnlockTarget(null)
    setUnlockReason('')
  }

  async function handleUnlock() {
    if (!unlockReason || unlockReason.trim().length < 20) {
      alert('Please provide a detailed reason (at least 20 characters). This is an emergency action that requires explanation.')
      return
    }

    if (!window.confirm('⚠️ EMERGENCY ACTION: This will unlock grades that are part of permanent records. Are you absolutely sure?')) {
      return
    }

    setProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Unlock all grades in this group
      const unlockPromises = unlockTarget.grades.map((grade) =>
        gradeApi.unlock(grade.id, { reason: unlockReason.trim() })
      )
      
      await Promise.all(unlockPromises)

      setSuccessMessage(
        `Successfully unlocked ${unlockTarget.student_count} grade(s) for ${unlockTarget.subject_name}. ` +
        `Teachers can now edit these grades. This action has been logged.`
      )
      
      // Reload locked grades
      const { data } = await gradeApi.getAll({
        quarter: selectedQuarter,
        status: 'locked,published'
      })

      const grouped = {}
      data.forEach((grade) => {
        const key = grade.class_subject_id
        if (!grouped[key]) {
          grouped[key] = {
            class_subject_id: grade.class_subject_id,
            quarter_id: grade.quarter_id,
            classroom_name: grade.classroom_name || 'Unknown',
            subject_name: grade.subject_name || 'Unknown',
            teacher_name: grade.teacher_name || 'Unassigned',
            quarter_name: grade.quarter_name || 'Unknown',
            status: grade.status,
            student_count: 0,
            grades: []
          }
        }
        grouped[key].student_count++
        grouped[key].grades.push(grade)
      })

      setLockedGrades(Object.values(grouped))
      
      closeUnlockModal()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to unlock grades:', err)
      setError(err.response?.data?.error || 'Failed to unlock grades. Please try again.')
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
            <h1 className="text-3xl font-bold text-text">🔓 Admin Grade Unlock</h1>
            <p className="mt-2 text-muted">Emergency unlocking of locked/published grades</p>
            <div className="mt-3 rounded-lg border-2 border-amber-500 bg-amber-50 p-3">
              <p className="flex items-start gap-2 text-sm font-medium text-amber-900">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  <strong>Warning:</strong> This feature should only be used in emergency situations (e.g., data entry errors, DepEd corrections).
                  All unlock actions are permanently logged and auditable.
                </span>
              </p>
            </div>
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

            {selectedQuarterData && lockedGrades.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted">Locked Grade Sets</p>
                <p className="text-3xl font-bold text-purple-600">{lockedGrades.length}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Locked Grades List */}
        <Card title="Locked/Published Grades" subtitle={selectedQuarterData ? selectedQuarterData.name : 'Select a quarter'}>
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
                <p className="mt-4 text-muted">Loading grades...</p>
              </div>
            </div>
          ) : lockedGrades.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-text">No Locked Grades</h3>
              <p className="mt-2 text-sm text-muted">
                {selectedQuarter
                  ? 'No locked or published grades found for this quarter.'
                  : 'Please select a quarter to view locked grades.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lockedGrades.map((item) => {
                const key = `${item.class_subject_id}:${item.quarter_id}`
                const isExpanded = expandedItems.has(key)

                return (
                  <div key={key} className="rounded-lg border-2 border-purple-200 bg-white p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-text">{item.subject_name}</h3>
                          <GradeStatusBadge status={item.status} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
                          <span>📚 {item.classroom_name}</span>
                          <span>👨‍🏫 {item.teacher_name}</span>
                          <span>👥 {item.student_count} student{item.student_count !== 1 ? 's' : ''}</span>
                          <span>📅 {item.quarter_name}</span>
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
                    <div className="mt-4 flex items-center gap-3 border-t border-gray-200 pt-4">
                      <Button
                        variant="secondary"
                        onClick={() => openUnlockModal(item)}
                        disabled={processing}
                      >
                        🔓 Emergency Unlock
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

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-text">🔓 Emergency Grade Unlock</h3>
                <p className="text-sm text-muted">This action will be permanently logged</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
              <h4 className="font-semibold text-amber-900">About to unlock:</h4>
              <p className="mt-1 text-sm text-amber-800">
                <strong>{unlockTarget?.subject_name}</strong> - {unlockTarget?.classroom_name}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                {unlockTarget?.student_count} student grades ({unlockTarget?.status})
              </p>
            </div>

            <div className="mt-4">
              <label htmlFor="unlock-reason" className="block text-sm font-medium text-text">
                Emergency Unlock Reason (Required) *
              </label>
              <textarea
                id="unlock-reason"
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                rows={5}
                placeholder="e.g., DepEd requested correction to student LRN #12345's grade due to miscalculation discovered during audit..."
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
              />
              <p className="mt-1 text-xs text-muted">
                Minimum 20 characters. Be very specific about why this emergency unlock is necessary.
                This reason will be permanently stored in audit logs.
              </p>
            </div>

            <div className="mt-4 space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <p className="font-semibold">⚠️ Security & Compliance Notice:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>This action bypasses principal approval workflow</li>
                <li>Unlocked grades return to draft/computed state</li>
                <li>Teachers can edit unlocked grades</li>
                <li>This action is permanently logged with your admin ID</li>
                <li>Audit trail is available to DepEd inspectors</li>
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={closeUnlockModal} disabled={processing}>
                Cancel
              </Button>
              <Button onClick={handleUnlock} disabled={processing || unlockReason.trim().length < 20}>
                {processing ? 'Unlocking...' : '🔓 Emergency Unlock'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  )
}
