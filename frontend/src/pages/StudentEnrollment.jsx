import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { getClassroomDetails, getStudents, enrollStudent, removeStudent } from '../lib/academicApi'

export default function StudentEnrollment() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [classData, setClassData] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    student: '',
  })

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <PortalLayout>
        <Card>
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium text-text">Access Denied</h3>
            <p className="mt-2 text-sm text-muted">Only administrators can enroll students.</p>
          </div>
        </Card>
      </PortalLayout>
    )
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [classroomData, studentsData] = await Promise.all([
          getClassroomDetails(id),
          getStudents(),
        ])

        setClassData(classroomData)
        setStudents(studentsData)
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
      student: '',
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData({
      student: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      await enrollStudent({
        classroom: id,
        student: formData.student,
      })
      
      // Reload classroom data
      const classroomData = await getClassroomDetails(id)
      setClassData(classroomData)
      handleCloseModal()
    } catch (err) {
      console.error('Failed to enroll student:', err)
      setError(err.response?.data?.detail || 'Failed to enroll student. Please try again.')
    }
  }

  const handleRemove = async (enrollmentId) => {
    if (!confirm('Are you sure you want to remove this student from the classroom?')) {
      return
    }

    try {
      await removeStudent(enrollmentId)
      
      // Reload classroom data
      const classroomData = await getClassroomDetails(id)
      setClassData(classroomData)
    } catch (err) {
      console.error('Failed to remove student:', err)
      setError('Failed to remove student. Please try again.')
    }
  }

  // Filter students who are not already enrolled in this classroom
  const availableStudents = students.filter(
    student => !classData?.enrollments.some(e => e.student === student.id)
  )

  // Filter available students by search query
  const filteredStudents = availableStudents.filter(
    student => 
      student.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
            <p className="mt-4 text-muted">Loading enrollments...</p>
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
            Enroll Student
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Enrolled Students */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-text">Enrolled Students ({classData.enrollments.length})</h3>
            <p className="text-sm text-muted">Students currently enrolled in this classroom</p>
          </div>

          {classData.enrollments.length > 0 ? (
            <div className="space-y-3">
              {classData.enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-text">{enrollment.student_name || 'Unknown'}</h4>
                    <p className="mt-1 text-sm text-muted">
                      Status: <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        enrollment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {enrollment.status}
                      </span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemove(enrollment.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-muted">No students enrolled yet. Enroll your first student to get started.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="max-w-lg w-full">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-text">Enroll Student</h2>
              <p className="mt-1 text-sm text-muted">Add a student to this classroom</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Search Students</label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Select Student</label>
                <select
                  value={formData.student}
                  onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                  required
                >
                  <option value="">Select a student</option>
                  {filteredStudents.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.display_name} ({student.email})
                    </option>
                  ))}
                </select>
                {filteredStudents.length === 0 && searchQuery && (
                  <p className="mt-2 text-sm text-muted">No students found matching your search.</p>
                )}
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
                  Enroll
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PortalLayout>
  )
}
