import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { learningMaterialApi } from '../lib/learningApi'
import { classroomApi, classSubjectApi } from '../lib/academicApi'

export default function Materials() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const classParam = searchParams.get('class')

  const [classrooms, setClassrooms] = useState([])
  const [subjects, setSubjects] = useState([])
  const [materials, setMaterials] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState(classParam || '')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'
  const isStudent = user?.role === 'student'

  // Load classrooms
  useEffect(() => {
    async function loadClassrooms() {
      try {
        const { data } = await classroomApi.getAll()
        setClassrooms(data)
      } catch (err) {
        console.error('Failed to load classrooms:', err)
        setError('Failed to load classes')
      }
    }
    loadClassrooms()
  }, [])

  // Load subjects when classroom changes
  useEffect(() => {
    async function loadSubjects() {
      if (!selectedClassroom) {
        setSubjects([])
        setSelectedSubject('')
        return
      }

      try {
        const { data } = await classSubjectApi.getAll({ classroom: selectedClassroom })
        setSubjects(data)
      } catch (err) {
        console.error('Failed to load subjects:', err)
        setError('Failed to load subjects')
      }
    }
    loadSubjects()
  }, [selectedClassroom])

  // Load materials when subject changes
  useEffect(() => {
    async function loadMaterials() {
      if (!selectedSubject) {
        setMaterials([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const { data } = await learningMaterialApi.getAll({ class_subject: selectedSubject })
        setMaterials(data)
      } catch (err) {
        console.error('Failed to load materials:', err)
        setError('Failed to load materials')
      } finally {
        setLoading(false)
      }
    }
    loadMaterials()
  }, [selectedSubject])

  async function handleDelete(materialId) {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return
    }

    try {
      await learningMaterialApi.delete(materialId)
      setMaterials((prev) => prev.filter((m) => m.id !== materialId))
    } catch (err) {
      console.error('Failed to delete material:', err)
      alert('Failed to delete material. You may not have permission.')
    }
  }

  const selectedClassroomData = classrooms.find((c) => c.id === selectedClassroom)
  const selectedSubjectData = subjects.find((s) => s.id === selectedSubject)

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Learning Materials</h1>
            <p className="mt-2 text-muted">Access study materials, modules, and resources</p>
          </div>
          {isTeacher && selectedSubject && (
            <Link to={`/materials/upload?subject=${selectedSubject}`}>
              <Button>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Material
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Classroom Selector */}
            <div>
              <label htmlFor="classroom" className="block text-sm font-medium text-text">
                Select Class
              </label>
              <select
                id="classroom"
                value={selectedClassroom}
                onChange={(e) => {
                  setSelectedClassroom(e.target.value)
                  setSelectedSubject('')
                }}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
              >
                <option value="">Choose a class...</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name} - Grade {classroom.grade_level}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selector */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-text">
                Select Subject
              </label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                disabled={!selectedClassroom}
              >
                <option value="">Choose a subject...</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Class Info Banner */}
          {selectedClassroomData && selectedSubjectData && (
            <div className="mt-6 rounded-lg bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedClassroomData.name} - {selectedSubjectData.subject_name}
                  </h3>
                  <p className="text-sm text-green-200">
                    {materials.length} material{materials.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

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

        {/* Materials List */}
        {selectedSubject ? (
          <Card title="Available Materials">
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
                  <p className="mt-4 text-muted">Loading materials...</p>
                </div>
              </div>
            ) : materials.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-text">No Materials Yet</h3>
                <p className="mt-2 text-sm text-muted">
                  {isTeacher
                    ? 'Upload your first learning material to share with students.'
                    : 'Your teacher has not uploaded any materials yet.'}
                </p>
                {isTeacher && (
                  <div className="mt-6">
                    <Link to={`/materials/upload?subject=${selectedSubject}`}>
                      <Button>Upload First Material</Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {materials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onDelete={handleDelete}
                    canDelete={isTeacher && material.uploaded_by === user?.id}
                  />
                ))}
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-text">Select Class and Subject</h3>
              <p className="mt-2 text-sm text-muted">
                Choose a class and subject from the dropdowns above to view learning materials.
              </p>
              <div className="mt-6 text-left">
                <p className="text-sm font-medium text-text">What are Learning Materials?</p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  <li>• Study modules and lesson guides</li>
                  <li>• Reference materials and reading resources</li>
                  <li>• Daily Lesson Logs (DLL)</li>
                  <li>• Supplementary worksheets and activities</li>
                  <li>• Video links and multimedia resources</li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PortalLayout>
  )
}

// ============================================================================
// MATERIAL CARD COMPONENT
// ============================================================================

function MaterialCard({ material, onDelete, canDelete }) {
  const typeIcons = {
    module: '📚',
    worksheet: '📝',
    reference: '📖',
    dll: '📋',
    video: '🎥',
    other: '📄',
  }

  const typeLabels = {
    module: 'Module',
    worksheet: 'Worksheet',
    reference: 'Reference',
    dll: 'Daily Lesson Log',
    video: 'Video',
    other: 'Document',
  }

  const icon = typeIcons[material.type] || typeIcons.other
  const label = typeLabels[material.type] || typeLabels.other

  return (
    <Card className="transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-4">
          {/* Icon */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-2xl">
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text">{material.title}</h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {label}
              </span>
            </div>
            {material.description && (
              <p className="mt-1 text-sm text-muted line-clamp-2">{material.description}</p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-muted">
              <span>Uploaded by {material.uploader_name || 'Teacher'}</span>
              <span>•</span>
              <span>{formatDate(material.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {material.file_url && (
            <a
              href={material.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-200"
            >
              Download
            </a>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(material.id)}
              className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
              title="Delete material"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(dateString) {
  if (!dateString) return 'Unknown date'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
