import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { submissionApi } from '../lib/learningApi'

export default function GradeSubmission() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [gradeData, setGradeData] = useState({
    score: '',
    feedback: '',
  })

  // Only teachers and admins can grade
  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return (
      <PortalLayout>
        <Card>
          <div className="py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-text">Access Denied</h3>
            <p className="mt-2 text-sm text-muted">Only teachers can grade submissions.</p>
            <div className="mt-6">
              <Button onClick={() => navigate('/assignments')}>Back to Assignments</Button>
            </div>
          </div>
        </Card>
      </PortalLayout>
    )
  }

  useEffect(() => {
    async function loadSubmission() {
      try {
        const { data } = await submissionApi.getById(id)
        setSubmission(data)
        
        // Pre-fill if already graded
        if (data.score !== null && data.score !== undefined) {
          setGradeData({
            score: data.score.toString(),
            feedback: data.feedback || '',
          })
        }
      } catch (err) {
        console.error('Failed to load submission:', err)
        setError('Failed to load submission')
      } finally {
        setLoading(false)
      }
    }
    loadSubmission()
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setGradeData({
      ...gradeData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!gradeData.score || gradeData.score.trim() === '') {
      setError('Please enter a score')
      return
    }

    const score = parseFloat(gradeData.score)
    if (isNaN(score) || score < 0) {
      setError('Score must be a positive number')
      return
    }

    if (score > submission.assignment_max_score) {
      setError(`Score cannot exceed ${submission.assignment_max_score} points`)
      return
    }

    setGrading(true)

    try {
      await submissionApi.grade(id, {
        score: score,
        feedback: gradeData.feedback,
      })

      setSuccess(true)

      // Refresh submission data
      const { data } = await submissionApi.getById(id)
      setSubmission(data)

      // Show success message briefly, then navigate back
      setTimeout(() => {
        navigate(`/assignments/${submission.assignment_id}`, {
          state: { message: 'Submission graded successfully! Student has been notified.' },
        })
      }, 2000)
    } catch (err) {
      console.error('Failed to grade submission:', err)
      setError(err.response?.data?.error || 'Failed to save grade. Please try again.')
    } finally {
      setGrading(false)
    }
  }

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
            <p className="mt-4 text-muted">Loading submission...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  if (error && !submission) {
    return (
      <PortalLayout>
        <Card>
          <div className="py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-text">Submission Not Found</h3>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <div className="mt-6">
              <Link to="/assignments">
                <Button>Back to Assignments</Button>
              </Link>
            </div>
          </div>
        </Card>
      </PortalLayout>
    )
  }

  const alreadyGraded = submission.score !== null && submission.score !== undefined
  const percentage = alreadyGraded ? Math.round((submission.score / submission.assignment_max_score) * 100) : 0

  return (
    <PortalLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted">
          <Link to="/assignments" className="hover:text-knhs-purple">Assignments</Link>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to={`/assignments/${submission.assignment_id}`} className="hover:text-knhs-purple">
            {submission.assignment_title}
          </Link>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-text">Grade Submission</span>
        </nav>

        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-knhs-purple to-purple-700 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{submission.assignment_title}</h1>
              <p className="mt-2 text-purple-100">
                Student: <span className="font-semibold">{submission.student_name || 'Unknown'}</span>
              </p>
              <div className="mt-2 flex items-center gap-4 text-sm text-purple-200">
                <span>Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
                {submission.is_late && (
                  <span className="rounded-full bg-amber-500 bg-opacity-20 px-2 py-1 text-xs font-medium text-amber-100">
                    Late Submission
                  </span>
                )}
              </div>
            </div>

            {alreadyGraded && (
              <div className="rounded-lg bg-white bg-opacity-20 px-6 py-4 text-center backdrop-blur-sm">
                <p className="text-4xl font-bold">{submission.score}</p>
                <p className="text-sm text-purple-200">out of {submission.assignment_max_score}</p>
                <p className="mt-1 text-xs text-purple-300">{percentage}%</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Submission Content (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Student's Answer */}
            <Card title="Student's Submission">
              {submission.text_response ? (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <p className="whitespace-pre-wrap text-text">{submission.text_response}</p>
                </div>
              ) : (
                <p className="py-4 text-sm text-muted">No text response provided</p>
              )}

              {/* Attached Files */}
              {submission.file_urls && submission.file_urls.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-sm font-medium text-text">Attached Files:</p>
                  <div className="space-y-2">
                    {submission.file_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm hover:bg-gray-100"
                      >
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="flex-1 font-medium text-text">File {index + 1}</span>
                        <svg className="h-5 w-5 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Assignment Instructions (for reference) */}
            {submission.assignment_description && (
              <Card title="Assignment Instructions" subtitle="For reference">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-sm text-muted">{submission.assignment_description}</p>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Grading Form (1/3) */}
          <div className="space-y-6">
            {/* Success Message */}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">Grade Saved!</p>
                    <p className="mt-1 text-xs text-green-700">Redirecting...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Grading Form */}
            <Card title={alreadyGraded ? 'Edit Grade' : 'Grade Submission'}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Score Input */}
                <div>
                  <label htmlFor="score" className="block text-sm font-medium text-text">
                    Score <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      id="score"
                      name="score"
                      value={gradeData.score}
                      onChange={handleChange}
                      min="0"
                      max={submission.assignment_max_score}
                      step="0.5"
                      placeholder="0"
                      className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-lg font-bold text-text placeholder-gray-400 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                      disabled={grading || success}
                      required
                    />
                    <span className="text-lg font-medium text-muted">/ {submission.assignment_max_score}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">Enter the score earned by the student</p>
                </div>

                {/* Feedback */}
                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-text">
                    Feedback (Optional)
                  </label>
                  <textarea
                    id="feedback"
                    name="feedback"
                    value={gradeData.feedback}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Provide feedback to help the student improve..."
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-text placeholder-gray-400 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                    disabled={grading || success}
                  />
                  <p className="mt-1 text-xs text-muted">Written feedback will be visible to the student</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={grading || success}
                    className="w-full"
                  >
                    {grading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : alreadyGraded ? (
                      'Update Grade'
                    ) : (
                      'Save Grade'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(`/assignments/${submission.assignment_id}`)}
                    disabled={grading || success}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>

            {/* Grading Rubric / Help */}
            <Card className="bg-blue-50 border-blue-200">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">Grading Tips</h3>
                    <ul className="mt-2 space-y-1 text-xs text-blue-800">
                      <li>• Be consistent with your grading criteria</li>
                      <li>• Provide specific, actionable feedback</li>
                      <li>• Late submissions may warrant point deductions</li>
                      <li>• Students will receive a notification when graded</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Submission Info */}
            <Card title="Submission Details">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Status:</span>
                  <span className={`font-medium ${submission.is_late ? 'text-amber-600' : 'text-green-600'}`}>
                    {submission.is_late ? 'Late' : 'On Time'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Submitted:</span>
                  <span className="font-medium text-text">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </span>
                </div>
                {submission.graded_at && (
                  <div className="flex justify-between">
                    <span className="text-muted">Graded:</span>
                    <span className="font-medium text-text">
                      {new Date(submission.graded_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Max Points:</span>
                  <span className="font-medium text-text">{submission.assignment_max_score}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
