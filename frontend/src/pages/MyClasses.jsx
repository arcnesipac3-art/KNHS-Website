import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { getMyClasses } from '../lib/academicApi'

export default function MyClasses() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isStudent = user?.role === 'student'
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'

  useEffect(() => {
    async function loadClasses() {
      try {
        const classData = await getMyClasses()
        setClasses(classData)
      } catch (err) {
        console.error('Failed to load classes:', err)
        setError('Failed to load classes. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadClasses()
  }, [])

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
            <p className="mt-4 text-muted">Loading your classes...</p>
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
            <h1 className="text-3xl font-bold text-text">My Classes</h1>
            <p className="mt-1 text-muted">
              {isStudent ? 'Classes you are enrolled in' : 'Classes you are teaching'}
            </p>
          </div>
          
          {isStudent && (
            <Link to="/classes/join">
              <Button>
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Join Class
              </Button>
            </Link>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Classes Grid */}
        {classes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classData={classItem}
                isTeacher={isTeacher}
              />
            ))}
          </div>
        ) : (
          // Empty State
          <Card>
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <svg className="h-8 w-8 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-text">
                {isStudent ? 'No classes yet' : 'No classes assigned'}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {isStudent
                  ? "You haven't joined any classes yet. Use a join code from your teacher to enroll."
                  : 'No classes have been assigned to you yet. Contact your administrator.'}
              </p>
              {isStudent && (
                <div className="mt-6">
                  <Link to="/classes/join">
                    <Button>Join Your First Class</Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Stats Footer */}
        {classes.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                {isStudent ? 'Enrolled in' : 'Teaching'} {classes.length} {classes.length === 1 ? 'class' : 'classes'}
              </span>
              <span className="text-muted">
                Current Academic Year: SY {new Date().getFullYear()}-{new Date().getFullYear() + 1}
              </span>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}

/**
 * ClassCard Component
 * Displays a single class card with metadata
 */
function ClassCard({ classData, isTeacher }) {
  const {
    id,
    name,
    grade_level,
    section,
    strand,
    adviser_name,
    subject_count,
    student_count,
    join_code,
  } = classData

  return (
    <Link to={`/classes/${id}`}>
      <Card className="group transition-all hover:shadow-lg hover:border-knhs-purple">
        {/* Header with Grade Badge */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-text group-hover:text-knhs-purple transition-colors">
              {name}
            </h3>
            <p className="mt-1 text-sm text-muted">
              Grade {grade_level} {section && `- ${section}`}
            </p>
          </div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-knhs-purple">
            {strand || `G${grade_level}`}
          </span>
        </div>

        {/* Metadata */}
        <div className="space-y-2 border-t border-gray-100 pt-4">
          {/* Adviser */}
          <div className="flex items-center gap-2 text-sm">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-muted">
              Adviser: <span className="font-medium text-text">{adviser_name || 'Not assigned'}</span>
            </span>
          </div>

          {/* Student Count */}
          <div className="flex items-center gap-2 text-sm">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-muted">
              {student_count || 0} {student_count === 1 ? 'student' : 'students'}
            </span>
          </div>

          {/* Subject Count */}
          <div className="flex items-center gap-2 text-sm">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-muted">
              {subject_count || 0} {subject_count === 1 ? 'subject' : 'subjects'}
            </span>
          </div>

          {/* Join Code (Teacher Only) */}
          {isTeacher && join_code && (
            <div className="mt-3 rounded-lg bg-purple-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-900">Join Code:</span>
                <code className="text-sm font-bold text-knhs-purple tracking-wider">
                  {join_code}
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-xs text-muted">
            {isTeacher ? 'Manage class' : 'View details'}
          </span>
          <svg className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>
    </Link>
  )
}
