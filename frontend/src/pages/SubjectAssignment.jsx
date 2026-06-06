import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { getClassroomDetails, subjectApi, getTeachers, assignSubjectToClassroom, removeSubjectFromClassroom } from '../lib/academicApi'

export default function SubjectAssignment() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [classData, setClassData] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    teacher: '',
  })

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <PortalLayout>
        <Card>
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium text-text">Access Denied</h3>
            <p className="mt-2 text-sm text-muted">Only administrators can assign subjects.</p>
          </div>
        </Card>
      </PortalLayout>
    )
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [classroomData, subjectsData, teachersData] = await Promise.all([
          getClassroomDetails(id),
          subjectApi.getAll({ active_only: true }),
          getTeachers(),
        ])

        setClassData(classroomData)
        setSubjects(Array.isArray(subjectsData) ? subjectsData : (subjectsData?.results ?? []))
        setTeachers(teachersData)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleOpenModal = () => {
    setFormData({
      subject: '',
      teacher: '',
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData({
      subject: '',
      teacher: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      await assignSubjectToClassroom({
        classroom: id,
        subject: formData.subject,
        teacher: formData.teacher,
      })
      
      // Reload classroom data
      const classroomData = await getClassroomDetails(id)
      setClassData(classroomData)
      handleCloseModal()
    } catch (err) {
      console.error('Failed to assign subject:', err)
      setError(err.response?.data?.detail || 'Failed to assign subject. Please try again.')
    }
  }

  const handleRemove = async (classSubjectId) => {
    if (!confirm('Are you sure you want to remove this subject assignment?')) {
      return
    }

    try {
      await removeSubjectFromClassroom(classSubjectId)
      
      // Reload classroom data
      const classroomData = await getClassroomDetails(id)
      setClassData(classroomData)
    } catch (err) {
      console.error('Failed to remove subject:', err)
      setError('Failed to remove subject. Please try again.')
    }
  }

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
            <p className="mt-4 text-muted">Loading subject assignments...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  if (!classData) {
    return (
      <PortalLayout>
        <Card>
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium text-text">Classroom Not Found</h3>
            <p className="mt-2 text-sm text-muted">This classroom does not exist.</p>
            <div className="mt-6">
              <Button onClick={() => navigate('/classrooms/manage')}>Back to Classrooms</Button>
            </div>
          </div>
        </Card>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="secondary"
              onClick={() => navigate('/classrooms/manage')}
              className="mb-4"
            >
              ← Back to Classrooms
            </Button>
            <h1 className="text-3xl font-bold text-text">{classData.classroom.name}</h1>
            <p className="mt-1 text-muted">
              Grade {classData.classroom.grade_level} {classData.classroom.section && `- Section ${classData.classroom.section}`}
            </p>
          </div>
          <Button onClick={handleOpenModal}>
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Assign Subject
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Subject Assignments */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-text">Subject Assignments</h3>
            <p className="text-sm text-muted">Subjects assigned to this classroom</p>
          </div>

          {classData.subjects.length > 0 ? (
            <div className="space-y-3">
              {classData.subjects.map((classSubject) => (
                <div
                  key={classSubject.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-text">{classSubject.subject_name}</h4>
                    <p className="mt-1 text-sm text-muted">
                      Teacher: {classSubject.teacher_name || 'Not assigned'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemove(classSubject.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-muted">No subjects assigned yet. Assign your first subject to get started.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="max-w-lg w-full">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-text">Assign Subject</h2>
              <p className="mt-1 text-sm text-muted">Add a subject to this classroom</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects
                    .filter(s => !classData.subjects.some(cs => cs.subject === s.id))
                    .map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Teacher</label>
                <select
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                  required
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Assign
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PortalLayout>
  )
}
