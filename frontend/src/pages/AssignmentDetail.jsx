import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { assignmentApi, submissionApi } from '../lib/learningApi'

export default function AssignmentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [mySubmission, setMySubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isStudent = user?.role === 'student'
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'

  useEffect(() => {
    async function loadAssignment() {
      try {
        const { data } = await assignmentApi.getById(id)
        setAssignment(data)

        if (isTeacher) {
          // Load all submissions for teacher
          const { data: submissionsData } = await assignmentApi.getSubmissions(id)
          setSubmissions(submissionsData)
        } else if (isStudent) {
          // Check if student has submitted
          const { data: allSubmissions } = await submissionApi.getAll({ assignment: id })
          const mySubmit = allSubmissions.find(s => s.student === user.id)
          setMySubmission(mySubmit)
        }
      } catch (err) {
        console.error('Failed to load assignment:', err)
        setError('Failed to load assignment details')
      } finally {
        setLoading(false)
      }
    }
    loadAssignment()
  }, [id, isTeacher, isStudent, user?.id])

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
            <p className="mt-4 text-muted">Loading assignment...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  if (error || !assignment) {
    return (
      <PortalLayout>
        <Card>
          <div className="py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-text">Assignment Not Found</h3>
            <p className="mt-2 text-sm text-muted">{error || 'This assignment does not exist or you do not have access'}</p>
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

  const dueDate = new Date(assignment.due_date)
  const isOverdue = dueDate < new Date()
  const hasSubmitted = !!mySubmission

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted">
          <Link to="/assignments" className="hover:text-knhs-purple">Assignments</Link>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-text">{assignment.title}</span>
        </nav>

        {/* Assignment Header */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-text">{assignment.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {assignment.class_subject_name || 'Subject'}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due: {dueDate.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    {assignment.max_score} points
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              {isStudent && (
                <div>
                  {hasSubmitted ? (
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      mySubmission.is_late ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {mySubmission.is_late ? 'Submitted Late' : 'Submitted'}
                    </span>
                  ) : isOverdue ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                      Overdue
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                      Not Submitted
                    </span>
                  )}
                </div>
              )}

              {isTeacher && (
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  assignment.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {assignment.status}
                </span>
              )}
            </div>

            {/* Description */}
            {assignment.description && (
              <div className="prose prose-sm max-w-none border-t border-gray-100 pt-4">
                <div className="whitespace-pre-wrap text-text">{assignment.description}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Student View: Submission Form or Status */}
        {isStudent && (
          <>
            {hasSubmitted ? (
              <SubmissionStatus submission={mySubmission} assignment={assignment} />
            ) : (
              <SubmissionForm assignmentId={id} assignment={assignment} isOverdue={isOverdue} />
            )}
          </>
        )}

        {/* Teacher View: Submissions List */}
        {isTeacher && (
          <SubmissionsList submissions={submissions} assignment={assignment} />
        )}
      </div>
    </PortalLayout>
  )
}

// ============================================================================
// STUDENT COMPONENTS
// ============================================================================

function SubmissionForm({ assignmentId, assignment, isOverdue }) {
  const navigate = useNavigate()
  const [textResponse, setTextResponse] = useState('')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles(selectedFiles)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!textResponse.trim() && files.length === 0) {
      setError('Please provide either a text response or upload files')
      return
    }

    setSubmitting(true)

    try {
      // In production, you'd upload files to storage first and get URLs
      const fileUrls = files.map(f => f.name) // Placeholder

      await submissionApi.submit({
        assignment_id: assignmentId,
        text_response: textResponse,
        file_urls: fileUrls,
      })

      // Success - redirect or show confirmation
      navigate('/assignments', { state: { message: 'Assignment submitted successfully!' } })
    } catch (err) {
      console.error('Submission error:', err)
      setError(err.response?.data?.error || 'Failed to submit assignment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title="Your Submission" subtitle={isOverdue && assignment.allow_late ? 'Late submission allowed' : ''}>
      {isOverdue && !assignment.allow_late ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Submission Closed</p>
              <p className="mt-1 text-xs text-red-700">The due date has passed and late submissions are not allowed.</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Text Response */}
          <div>
            <label htmlFor="response" className="block text-sm font-medium text-text">
              Your Answer
            </label>
            <textarea
              id="response"
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              rows={6}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-text placeholder-gray-400 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
              placeholder="Type your response here..."
              disabled={submitting}
            />
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="files" className="block text-sm font-medium text-text">
              Attach Files (Optional)
            </label>
            <div className="mt-2">
              <input
                type="file"
                id="files"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-knhs-purple hover:file:bg-purple-100"
                disabled={submitting}
              />
            </div>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Late Warning */}
          {isOverdue && assignment.allow_late && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-amber-800">This submission will be marked as late</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/assignments')}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Assignment'
              )}
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}

function SubmissionStatus({ submission, assignment }) {
  return (
    <Card title="Your Submission">
      <div className="space-y-4">
        {/* Submission Info */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Submitted on:</p>
              <p className="text-sm text-muted">{new Date(submission.submitted_at).toLocaleString()}</p>
            </div>
            {submission.is_late && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                Late Submission
              </span>
            )}
          </div>
        </div>

        {/* Text Response */}
        {submission.text_response && (
          <div>
            <p className="text-sm font-medium text-text">Your Answer:</p>
            <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
              <p className="whitespace-pre-wrap text-sm text-text">{submission.text_response}</p>
            </div>
          </div>
        )}

        {/* Files */}
        {submission.file_urls && submission.file_urls.length > 0 && (
          <div>
            <p className="text-sm font-medium text-text">Attached Files:</p>
            <div className="mt-2 space-y-2">
              {submission.file_urls.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-knhs-purple hover:bg-purple-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  File {index + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Grade (if graded) */}
        {submission.score !== null && submission.score !== undefined && (
          <div className="rounded-lg border-l-4 border-l-green-500 bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Graded</p>
                {submission.feedback && (
                  <p className="mt-1 text-sm text-green-800">{submission.feedback}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-900">{submission.score}</p>
                <p className="text-xs text-green-700">out of {assignment.max_score}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ============================================================================
// TEACHER COMPONENTS
// ============================================================================

function SubmissionsList({ submissions, assignment }) {
  const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'late' || s.status === 'graded').length
  const gradedCount = submissions.filter(s => s.status === 'graded').length

  return (
    <Card title="Student Submissions" subtitle={`${submittedCount} submitted • ${gradedCount} graded`}>
      {submissions.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {submissions.map((submission) => (
            <SubmissionRow key={submission.id} submission={submission} assignment={assignment} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="mt-4 text-sm text-muted">No submissions yet</p>
        </div>
      )}
    </Card>
  )
}

function SubmissionRow({ submission, assignment }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1">
        <p className="font-medium text-text">{submission.student_name || 'Unknown Student'}</p>
        <div className="mt-1 flex items-center gap-4 text-xs text-muted">
          <span>Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
          {submission.is_late && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">Late</span>
          )}
          {submission.score !== null && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800">
              {submission.score}/{assignment.max_score}
            </span>
          )}
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => navigate(`/submissions/${submission.id}`)}
      >
        {submission.score !== null ? 'Review' : 'Grade'}
      </Button>
    </div>
  )
}
