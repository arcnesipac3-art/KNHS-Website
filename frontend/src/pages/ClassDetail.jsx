import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { getClassroomDetails } from '../lib/academicApi'
import { announcementApi, assignmentApi, learningMaterialApi } from '../lib/learningApi'

export default function ClassDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('stream')
  const [classData, setClassData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isStudent = user?.role === 'student'
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'

  useEffect(() => {
    async function loadClass() {
      try {
        const data = await getClassroomDetails(id)
        setClassData(data)
      } catch (err) {
        console.error('Failed to load class:', err)
        setError('Failed to load class details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadClass()
  }, [id])

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
            <p className="mt-4 text-muted">Loading class...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  if (error || !classData) {
    return (
      <PortalLayout>
        <Card>
          <div className="py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-text">Class Not Found</h3>
            <p className="mt-2 text-sm text-muted">{error || 'This class does not exist or you do not have access to it.'}</p>
            <div className="mt-6">
              <Link to="/classes">
                <Button>Back to My Classes</Button>
              </Link>
            </div>
          </div>
        </Card>
      </PortalLayout>
    )
  }

  const { classroom, subjects, enrollments } = classData

  const tabs = [
    { id: 'stream', label: 'Stream', icon: StreamIcon },
    { id: 'assignments', label: 'Assignments', icon: AssignmentIcon },
    { id: 'materials', label: 'Materials', icon: MaterialIcon },
    { id: 'grades', label: 'Grades', icon: GradeIcon },
    { id: 'attendance', label: 'Attendance', icon: AttendanceIcon },
    { id: 'people', label: 'People', icon: PeopleIcon },
  ]

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Class Header */}
        <div className="rounded-2xl bg-gradient-to-r from-knhs-purple to-purple-700 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{classroom.name}</h1>
                <span className="rounded-full bg-white bg-opacity-20 px-3 py-1 text-sm font-semibold">
                  {classroom.strand || `Grade ${classroom.grade_level}`}
                </span>
              </div>
              <p className="mt-2 text-purple-100">
                Grade {classroom.grade_level} {classroom.section && `• Section ${classroom.section}`}
              </p>
              <p className="mt-1 text-sm text-purple-200">
                Adviser: {classroom.adviser_name || 'Not assigned'}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold">{enrollments?.length || 0}</p>
                <p className="text-xs text-purple-200">Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{subjects?.length || 0}</p>
                <p className="text-xs text-purple-200">Subjects</p>
              </div>
            </div>
          </div>

          {/* Teacher: Join Code */}
          {isTeacher && classroom.join_code && (
            <div className="mt-4 rounded-lg bg-white bg-opacity-10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span className="text-sm">Join Code:</span>
                  <code className="text-lg font-bold tracking-widest">{classroom.join_code}</code>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigator.clipboard.writeText(classroom.join_code)}
                >
                  Copy Code
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-knhs-purple text-knhs-purple'
                      : 'border-transparent text-muted hover:border-gray-300 hover:text-text'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'stream' && <StreamTab classroom={classroom} isTeacher={isTeacher} classroomId={id} />}
          {activeTab === 'assignments' && <AssignmentsTab classroomId={id} subjects={subjects} isTeacher={isTeacher} />}
          {activeTab === 'materials' && <MaterialsTab classroomId={id} subjects={subjects} isTeacher={isTeacher} />}
          {activeTab === 'grades' && <GradesTab classroomId={id} subjects={subjects} isStudent={isStudent} />}
          {activeTab === 'attendance' && <AttendanceTab classroomId={id} enrollments={enrollments} isTeacher={isTeacher} />}
          {activeTab === 'people' && <PeopleTab classroom={classroom} enrollments={enrollments} isTeacher={isTeacher} />}
        </div>
      </div>
    </PortalLayout>
  )
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function StreamTab({ classroom, isTeacher, classroomId }) {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const { data } = await announcementApi.getAll({ classroom: classroomId })
        const announcementsArr = Array.isArray(data) ? data : (data?.results ?? [])
        setAnnouncements(announcementsArr)
      } catch (err) {
        console.error('Failed to load announcements:', err)
        setError('Failed to load announcements')
      } finally {
        setLoading(false)
      }
    }
    loadAnnouncements()
  }, [classroomId])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Stream (2/3) */}
      <div className="space-y-6 lg:col-span-2">
        <Card title="Class Stream" subtitle="Recent activity and announcements">
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
              <p className="mt-4 text-sm text-muted">Loading announcements...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text">{announcement.title}</h3>
                      <p className="mt-2 text-sm text-muted">{announcement.content}</p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                        <span>{formatDate(announcement.created_at)}</span>
                        {announcement.author_name && (
                          <span>by {announcement.author_name}</span>
                        )}
                        {announcement.priority === 'urgent' && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-muted">No recent announcements</p>
              <p className="mt-1 text-xs text-muted">Announcements will appear here when posted</p>
            </div>
          )}
        </Card>
      </div>

      {/* Sidebar (1/3) */}
      <div className="space-y-6">
        <Card title="Quick Actions">
          <div className="space-y-2">
            {isTeacher ? (
              <>
                <Link to={`/assignments/create?class=${classroom.id}`} className="block">
                  <Button className="w-full justify-start" variant="secondary">
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Assignment
                  </Button>
                </Link>
                <Link to={`/announcements/create?class=${classroom.id}`} className="block">
                  <Button className="w-full justify-start" variant="secondary">
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                    Post Announcement
                  </Button>
                </Link>
                <Link to={`/attendance/mark?classroom=${classroom.id}`} className="block">
                  <Button className="w-full justify-start" variant="secondary">
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Mark Attendance
                  </Button>
                </Link>
                <Link to={`/materials/upload?class=${classroom.id}`} className="block">
                  <Button className="w-full justify-start" variant="secondary">
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Material
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to={`/assignments?class=${classroom.id}`} className="block">
                  <Button className="w-full justify-start" variant="secondary">
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    View Assignments
                  </Button>
                </Link>
                <Link to={`/materials?class=${classroom.id}`} className="block">
                  <Button className="w-full justify-start" variant="secondary">
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    View Materials
                  </Button>
                </Link>
                <Link to={`/grades?class=${classroom.id}`} className="block">
                  <Button className="w-full justify-start" variant="secondary">
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    View Grades
                  </Button>
                </Link>
              </>
            )}
          </div>
        </Card>

        <Card title="Upcoming" subtitle="Next 7 days">
          <div className="space-y-3">
            <div className="text-center py-8">
              <p className="text-sm text-muted">No upcoming items</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function AssignmentsTab({ classroomId, subjects, isTeacher }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadAssignments() {
      try {
        // Get assignments for all subjects in this classroom
        const subjectIds = subjects.map(s => s.id)
        const allAssignments = []
        
        for (const subjectId of subjectIds) {
          const { data } = await assignmentApi.getAll({ class_subject: subjectId })
          const assignmentsArr = Array.isArray(data) ? data : (data?.results ?? [])
          allAssignments.push(...assignmentsArr)
        }
        
        // Sort by due date (newest first)
        allAssignments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setAssignments(allAssignments)
      } catch (err) {
        console.error('Failed to load assignments:', err)
        setError('Failed to load assignments')
      } finally {
        setLoading(false)
      }
    }
    loadAssignments()
  }, [classroomId, subjects])

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'closed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">Assignments</h3>
        {isTeacher && (
          <Link to={`/assignments/create?class=${classroomId}`}>
            <Button size="sm">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Assignment
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
          <p className="mt-4 text-sm text-muted">Loading assignments...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-lg border border-gray-200 bg-white p-4 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-text">{assignment.title}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{assignment.description || 'No description'}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                    <span>Due: {formatDate(assignment.due_date)}</span>
                    {assignment.subject_name && (
                      <span>• {assignment.subject_name}</span>
                    )}
                    {assignment.max_points && (
                      <span>• {assignment.max_points} points</span>
                    )}
                  </div>
                </div>
                <Link to={`/assignments/${assignment.id}`}>
                  <Button size="sm" variant="secondary">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <svg className="h-8 w-8 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-text">No assignments yet</h3>
          <p className="mt-2 text-sm text-muted">
            {isTeacher ? 'Create your first assignment to get started' : 'Assignments will appear here when posted'}
          </p>
          {isTeacher && (
            <div className="mt-6">
              <Link to={`/assignments/create?class=${classroomId}`}>
                <Button>Create Your First Assignment</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function MaterialsTab({ classroomId, subjects, isTeacher }) {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadMaterials() {
      try {
        // Get materials for all subjects in this classroom
        const subjectIds = subjects.map(s => s.id)
        const allMaterials = []
        
        for (const subjectId of subjectIds) {
          const { data } = await learningMaterialApi.getAll({ class_subject: subjectId })
          const materialsArr = Array.isArray(data) ? data : (data?.results ?? [])
          allMaterials.push(...materialsArr)
        }
        
        // Sort by upload date (newest first)
        allMaterials.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
        setMaterials(allMaterials)
      } catch (err) {
        console.error('Failed to load materials:', err)
        setError('Failed to load materials')
      } finally {
        setLoading(false)
      }
    }
    loadMaterials()
  }, [classroomId, subjects])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getFileIcon = (fileType) => {
    if (!fileType) return null
    const type = fileType.toLowerCase()
    if (type.includes('pdf')) {
      return (
        <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h2v2h-2v-2zm0-4h2v2h-2V9zm-4 4h2v2H6v-2zm0-4h2v2H6V9z"/>
        </svg>
      )
    }
    if (type.includes('image')) {
      return (
        <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      )
    }
    if (type.includes('doc') || type.includes('word')) {
      return (
        <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h2v2h-2v-2zm0-4h2v2h-2V9zm-4 4h2v2H6v-2zm0-4h2v2H6V9z"/>
        </svg>
      )
    }
    return (
      <svg className="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h2v2h-2v-2zm0-4h2v2h-2V9zm-4 4h2v2H6v-2zm0-4h2v2H6V9z"/>
      </svg>
    )
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">Learning Materials</h3>
        {isTeacher && (
          <Link to={`/materials/upload?class=${classroomId}`}>
            <Button size="sm">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Material
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
          <p className="mt-4 text-sm text-muted">Loading materials...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : materials.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:border-purple-300 transition-colors"
            >
              <div className="flex-shrink-0">
                {getFileIcon(material.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-text truncate">{material.title}</h4>
                <p className="mt-1 text-sm text-muted truncate">{material.description || 'No description'}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                  <span>{formatDate(material.uploaded_at)}</span>
                  {material.subject_name && (
                    <span>• {material.subject_name}</span>
                  )}
                  {material.file_size && (
                    <span>• {(material.file_size / 1024).toFixed(1)} KB</span>
                  )}
                </div>
              </div>
              <a
                href={material.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <Button size="sm" variant="secondary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </Button>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-text">No materials yet</h3>
          <p className="mt-2 text-sm text-muted">
            {isTeacher ? 'Upload your first material to get started' : 'Materials will appear here when uploaded'}
          </p>
          {isTeacher && (
            <div className="mt-6">
              <Link to={`/materials/upload?class=${classroomId}`}>
                <Button>Upload Your First Material</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function GradesTab({ classroomId, subjects, isStudent }) {
  return (
    <Card>
      <div className="py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-text">Grades</h3>
        <p className="mt-2 text-sm text-muted">
          {isStudent ? 'Your grades will be shown here when published' : 'Grade management interface coming soon'}
        </p>
      </div>
    </Card>
  )
}

function AttendanceTab({ classroomId, enrollments, isTeacher }) {
  return (
    <Card>
      <div className="py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-text">Attendance</h3>
        <p className="mt-2 text-sm text-muted">
          {isTeacher ? 'Mark daily attendance for your students' : 'Your attendance records will be shown here'}
        </p>
        {isTeacher && (
          <div className="mt-6">
            <Link to={`/attendance/mark?classroom=${classroomId}`}>
              <Button>Mark Attendance</Button>
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}

function PeopleTab({ classroom, enrollments, isTeacher }) {
  return (
    <div className="space-y-6">
      {/* Adviser Card */}
      <Card title="Class Adviser">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <svg className="h-6 w-6 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-text">{classroom.adviser_name || 'Not assigned'}</p>
            <p className="text-sm text-muted">Class Adviser</p>
          </div>
        </div>
      </Card>

      {/* Students List */}
      <Card title="Students" subtitle={`${enrollments?.length || 0} enrolled`}>
        {enrollments && enrollments.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {enrollments.map((enrollment, index) => (
              <div key={enrollment.id || index} className="flex items-center gap-3 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                  {enrollment.student_name ? enrollment.student_name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text">{enrollment.student_name || 'Unknown'}</p>
                  <p className="text-xs text-muted">
                    {enrollment.student_lrn ? `LRN: ${enrollment.student_lrn}` : 'Student'}
                  </p>
                </div>
                {enrollment.status && (
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    enrollment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {enrollment.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted">No students enrolled yet</p>
            {isTeacher && (
              <p className="mt-1 text-xs text-muted">Share the join code with students to get started</p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

// ============================================================================
// TAB ICONS
// ============================================================================

function StreamIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  )
}

function AssignmentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function MaterialIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function GradeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  )
}

function AttendanceIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function PeopleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
