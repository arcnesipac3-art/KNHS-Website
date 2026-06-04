import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { assignmentApi } from '../lib/learningApi'
import { classroomApi, classSubjectApi } from '../lib/academicApi'

export default function CreateAssignment() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const classId = searchParams.get('class')

  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    class_subject_id: '',
    title: '',
    description: '',
    due_date: '',
    due_time: '23:59',
    max_score: 100,
    allow_late: false,
    attachments: [],
  })

  // Only teachers and admins can create assignments
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
            <p className="mt-2 text-sm text-muted">Only teachers can create assignments.</p>
            <div className="mt-6">
              <Button onClick={() => navigate('/assignments')}>Back to Assignments</Button>
            </div>
          </div>
        </Card>
      </PortalLayout>
    )
  }

  useEffect(() => {
    async function loadData() {
      try {
        // Load teacher's classes
        const { data: classesData } = await classroomApi.getAll()
        setClasses(classesData)

        // If class is pre-selected, load its subjects
        if (classId) {
          const { data: subjectsData } = await classSubjectApi.getAll({ classroom: classId })
          setSubjects(subjectsData)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load classes and subjects')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [classId])

  const handleClassChange = async (classroomId) => {
    setFormData({ ...formData, class_subject_id: '' })
    if (classroomId) {
      try {
        const { data: subjectsData } = await classSubjectApi.getAll({ classroom: classroomId })
        setSubjects(subjectsData)
      } catch (err) {
        console.error('Failed to load subjects:', err)
      }
    } else {
      setSubjects([])
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.class_subject_id) {
      setError('Please select a class and subject')
      return
    }
    if (!formData.title.trim()) {
      setError('Please enter an assignment title')
      return
    }
    if (!formData.due_date) {
      setError('Please set a due date')
      return
    }

    setSubmitting(true)

    try {
      // Combine date and time
      const dueDateTime = `${formData.due_date}T${formData.due_time}:00`

      const payload = {
        class_subject_id: formData.class_subject_id,
        title: formData.title,
        description: formData.description,
        due_date: dueDateTime,
        max_score: parseInt(formData.max_score),
        allow_late: formData.allow_late,
        status: publish ? 'published' : 'draft',
      }

      const { data } = await assignmentApi.create(payload)

      // If publishing, call publish endpoint
      if (publish) {
        await assignmentApi.publish(data.id)
      }

      navigate('/assignments', {
        state: {
          message: publish
            ? 'Assignment published successfully! Students have been notified.'
            : 'Assignment saved as draft.',
        },
      })
    } catch (err) {
      console.error('Failed to create assignment:', err)
      setError(err.response?.data?.error || 'Failed to create assignment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
            <p className="mt-4 text-muted">Loading...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  // Set default date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().split('T')[0]

  return (
    <PortalLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text">Create Assignment</h1>
          <p className="mt-1 text-muted">Create a new assignment for your students</p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <Card>
            <div className="space-y-6">
              {/* Class Selection */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="classroom" className="block text-sm font-medium text-text">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="classroom"
                    onChange={(e) => handleClassChange(e.target.value)}
                    defaultValue={classId || ''}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                    disabled={submitting}
                    required
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="class_subject_id" className="block text-sm font-medium text-text">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="class_subject_id"
                    name="class_subject_id"
                    value={formData.class_subject_id}
                    onChange={handleChange}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                    disabled={submitting || subjects.length === 0}
                    required
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
                  {subjects.length === 0 && (
                    <p className="mt-1 text-xs text-muted">Select a class first</p>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-text">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Chapter 5 Homework"
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text placeholder-gray-400 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-text">
                  Instructions
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={8}
                  placeholder="Provide detailed instructions for this assignment..."
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-text placeholder-gray-400 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-muted">
                  Explain what students need to do, what format to use, and any other requirements
                </p>
              </div>

              {/* Due Date & Time */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label htmlFor="due_date" className="block text-sm font-medium text-text">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    min={defaultDate}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                    disabled={submitting}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="due_time" className="block text-sm font-medium text-text">
                    Due Time
                  </label>
                  <input
                    type="time"
                    id="due_time"
                    name="due_time"
                    value={formData.due_time}
                    onChange={handleChange}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Points */}
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label htmlFor="max_score" className="block text-sm font-medium text-text">
                    Points
                  </label>
                  <input
                    type="number"
                    id="max_score"
                    name="max_score"
                    value={formData.max_score}
                    onChange={handleChange}
                    min="1"
                    max="1000"
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-text">Options</p>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="allow_late"
                    checked={formData.allow_late}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-knhs-purple focus:ring-knhs-purple"
                    disabled={submitting}
                  />
                  <div>
                    <span className="text-sm font-medium text-text">Allow late submissions</span>
                    <p className="text-xs text-muted">Students can submit after the due date (marked as late)</p>
                  </div>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 border-t border-gray-200 pt-6">
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
                  variant="secondary"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Publishing...
                    </span>
                  ) : (
                    'Publish'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </form>

        {/* Help Card */}
        <Card className="bg-purple-50 border-purple-200">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-purple-900">Publishing Tips</h3>
              <ul className="mt-2 space-y-1 text-sm text-purple-800">
                <li>• <strong>Save Draft:</strong> Save without notifying students. You can edit and publish later.</li>
                <li>• <strong>Publish:</strong> Makes assignment visible to students and sends notifications immediately.</li>
                <li>• Use clear, specific instructions to help students understand what's expected.</li>
                <li>• Set realistic due dates considering students' schedules and other assignments.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </PortalLayout>
  )
}
