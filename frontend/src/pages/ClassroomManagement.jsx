import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { classroomApi, academicYearApi, getTeachers, createClassroom, updateClassroom, deleteClassroom } from '../lib/academicApi'

export default function ClassroomManagement() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [classrooms, setClassrooms] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    grade_level: '7',
    section: '',
    strand: '',
    academic_year: '',
    adviser: '',
  })

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <PortalLayout>
        <Card>
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium text-text">Access Denied</h3>
            <p className="mt-2 text-sm text-muted">Only administrators can manage classrooms.</p>
          </div>
        </Card>
      </PortalLayout>
    )
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [classroomsRes, yearsRes, teachersRes] = await Promise.all([
          classroomApi.getAll(),
          academicYearApi.getAll(),
          getTeachers(),
        ])

        const classroomsArr = Array.isArray(classroomsRes.data) ? classroomsRes.data : (classroomsRes.data?.results ?? [])
        const yearsArr = Array.isArray(yearsRes.data) ? yearsRes.data : (yearsRes.data?.results ?? [])
        
        setClassrooms(classroomsArr)
        setAcademicYears(yearsArr)
        setTeachers(teachersRes)
        
        // Set default academic year to current
        const currentYear = yearsArr.find(y => y.is_current)
        if (currentYear) {
          setFormData(prev => ({ ...prev, academic_year: currentYear.id }))
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleOpenModal = (classroom = null) => {
    if (classroom) {
      setEditingClassroom(classroom)
      setFormData({
        name: classroom.name,
        grade_level: classroom.grade_level,
        section: classroom.section || '',
        strand: classroom.strand || '',
        academic_year: classroom.academic_year,
        adviser: classroom.adviser || '',
      })
    } else {
      setEditingClassroom(null)
      setFormData({
        name: '',
        grade_level: '7',
        section: '',
        strand: '',
        academic_year: academicYears.find(y => y.is_current)?.id || '',
        adviser: '',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingClassroom(null)
    setFormData({
      name: '',
      grade_level: '7',
      section: '',
      strand: '',
      academic_year: academicYears.find(y => y.is_current)?.id || '',
      adviser: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      if (editingClassroom) {
        await updateClassroom(editingClassroom.id, formData)
        // Update local state
        setClassrooms(classrooms.map(c => 
          c.id === editingClassroom.id ? { ...c, ...formData } : c
        ))
      } else {
        const newClassroom = await createClassroom(formData)
        setClassrooms([...classrooms, newClassroom])
      }
      handleCloseModal()
    } catch (err) {
      console.error('Failed to save classroom:', err)
      setError(err.response?.data?.detail || 'Failed to save classroom. Please try again.')
    }
  }

  const handleDelete = async (classroomId) => {
    if (!confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      return
    }

    try {
      await deleteClassroom(classroomId)
      setClassrooms(classrooms.filter(c => c.id !== classroomId))
    } catch (err) {
      console.error('Failed to delete classroom:', err)
      setError('Failed to delete classroom. Please try again.')
    }
  }

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
            <p className="mt-4 text-muted">Loading classrooms...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Classroom Management</h1>
            <p className="mt-1 text-muted">Create and manage classrooms for the school</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Classroom
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Classrooms List */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">Grade</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">Section</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">Strand</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">Adviser</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">Academic Year</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text">Students</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classrooms.length > 0 ? (
                  classrooms.map((classroom) => (
                    <tr key={classroom.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-text">{classroom.name}</td>
                      <td className="px-4 py-3 text-sm text-muted">Grade {classroom.grade_level}</td>
                      <td className="px-4 py-3 text-sm text-muted">{classroom.section || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted">{classroom.strand || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {teachers.find(t => t.id === classroom.adviser)?.display_name || 'Not assigned'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {academicYears.find(y => y.id === classroom.academic_year)?.label || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{classroom.student_count || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/classrooms/${classroom.id}/subjects`)}
                          >
                            Subjects
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/classrooms/${classroom.id}/students`)}
                          >
                            Students
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenModal(classroom)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(classroom.id)}
                            title="Delete classroom"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-muted">
                      No classrooms found. Create your first classroom to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="max-w-lg w-full">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-text">
                {editingClassroom ? 'Edit Classroom' : 'Create Classroom'}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {editingClassroom ? 'Update classroom information' : 'Add a new classroom to the system'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Class Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                  placeholder="e.g., Grade 7 - Section A"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Grade Level</label>
                  <select
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                    required
                  >
                    {[7, 8, 9, 10, 11, 12].map(grade => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                    placeholder="e.g., A, B, C"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Strand</label>
                <select
                  value={formData.strand}
                  onChange={(e) => setFormData({ ...formData, strand: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                >
                  <option value="">None</option>
                  <option value="STEM">STEM</option>
                  <option value="ABM">ABM</option>
                  <option value="HUMSS">HUMSS</option>
                  <option value="GAS">GAS</option>
                  <option value="TVL">TVL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Academic Year</label>
                <select
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                  required
                >
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>
                      {year.label} {year.is_current ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Adviser</label>
                <select
                  value={formData.adviser}
                  onChange={(e) => setFormData({ ...formData, adviser: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                >
                  <option value="">Not assigned</option>
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
                  {editingClassroom ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PortalLayout>
  )
}
