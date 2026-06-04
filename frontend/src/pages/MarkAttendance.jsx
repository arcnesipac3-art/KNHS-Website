import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { classroomApi } from '../lib/academicApi'
import { attendanceApi } from '../lib/learningApi'

export default function MarkAttendance() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const classroomId = searchParams.get('classroom')

  const [classrooms, setClassrooms] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState(classroomId || '')
  const [selectedDate, setSelectedDate] = useState(getTodayDateString())
  const [enrollments, setEnrollments] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'

  // Access control: Only teachers and admins can mark attendance
  useEffect(() => {
    if (!isTeacher) {
      navigate('/dashboard')
    }
  }, [user, isTeacher, navigate])

  // Load classrooms on mount
  useEffect(() => {
    async function loadClassrooms() {
      try {
        const { data } = await classroomApi.getAll()
        setClassrooms(data)
        if (classroomId && data.some((c) => c.id === classroomId)) {
          setSelectedClassroom(classroomId)
        }
      } catch (err) {
        console.error('Failed to load classrooms:', err)
        setError('Failed to load your classes. Please try again.')
      }
    }
    if (isTeacher) {
      loadClassrooms()
    }
  }, [isTeacher, classroomId])

  // Load enrollments when classroom changes
  useEffect(() => {
    async function loadEnrollments() {
      if (!selectedClassroom) {
        setEnrollments([])
        setAttendance({})
        return
      }

      setLoading(true)
      setError(null)
      setSuccessMessage(null)

      try {
        const { data } = await classroomApi.getEnrollments(selectedClassroom, 'active')
        setEnrollments(data)

        // Initialize attendance with 'P' (Present) for all students
        const initialAttendance = {}
        data.forEach((enrollment) => {
          initialAttendance[enrollment.id] = 'P'
        })
        setAttendance(initialAttendance)

        // Try to load existing attendance for this date
        try {
          const { data: existingRecords } = await attendanceApi.getAll({
            classroom: selectedClassroom,
            date_from: selectedDate,
            date_to: selectedDate,
          })

          // Map existing records to attendance state
          existingRecords.forEach((record) => {
            if (record.enrollment_id && initialAttendance.hasOwnProperty(record.enrollment_id)) {
              initialAttendance[record.enrollment_id] = record.status
            }
          })
          setAttendance(initialAttendance)
        } catch (err) {
          // If no records exist, that's fine, keep defaults
          console.log('No existing attendance records for this date')
        }
      } catch (err) {
        console.error('Failed to load enrollments:', err)
        setError('Failed to load class roster. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadEnrollments()
  }, [selectedClassroom, selectedDate])

  function handleAttendanceChange(enrollmentId, status) {
    setAttendance((prev) => ({
      ...prev,
      [enrollmentId]: status,
    }))
  }

  function handleMarkAllPresent() {
    const allPresent = {}
    enrollments.forEach((enrollment) => {
      allPresent[enrollment.id] = 'P'
    })
    setAttendance(allPresent)
  }

  async function handleSave() {
    if (!selectedClassroom || enrollments.length === 0) {
      setError('Please select a class with students')
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Build attendance records array
      const attendanceRecords = enrollments.map((enrollment) => ({
        enrollment_id: enrollment.id,
        status: attendance[enrollment.id] || 'P',
      }))

      await attendanceApi.bulkMark({
        classroom_id: selectedClassroom,
        date: selectedDate,
        attendance: attendanceRecords,
      })

      setSuccessMessage(`Attendance saved successfully for ${formatDate(selectedDate)}`)
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to save attendance:', err)
      setError(err.response?.data?.error || 'Failed to save attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const selectedClassroomData = classrooms.find((c) => c.id === selectedClassroom)

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Mark Attendance</h1>
            <p className="mt-2 text-muted">Record daily attendance for your class</p>
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
              <div className="flex-1">
                <p className="font-medium text-green-900">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-600 hover:text-green-800"
              >
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
              <div className="flex-1">
                <p className="font-medium text-red-900">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Card>
        )}

        {/* Controls */}
        <Card>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Class Selector */}
            <div>
              <label htmlFor="classroom" className="block text-sm font-medium text-text">
                Select Class
              </label>
              <select
                id="classroom"
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
              >
                <option value="">Choose a class...</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name} - Grade {classroom.grade_level} {classroom.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-text">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getTodayDateString()}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
              />
            </div>
          </div>

          {/* Class Info Banner */}
          {selectedClassroomData && (
            <div className="mt-6 rounded-lg bg-gradient-to-r from-knhs-purple to-purple-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedClassroomData.name}</h3>
                  <p className="text-sm text-purple-200">
                    Grade {selectedClassroomData.grade_level} • {enrollments.length} students • {formatDate(selectedDate)}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleMarkAllPresent}
                  disabled={loading || enrollments.length === 0}
                >
                  Mark All Present
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Attendance Table */}
        {selectedClassroom && (
          <Card title="Class Roster" subtitle="Mark attendance status for each student">
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
                  <p className="mt-4 text-muted">Loading roster...</p>
                </div>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-text">No Students Enrolled</h3>
                <p className="mt-2 text-sm text-muted">This class has no active students yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left">
                      <th className="px-4 py-3 text-sm font-semibold text-text">#</th>
                      <th className="px-4 py-3 text-sm font-semibold text-text">Student Name</th>
                      <th className="px-4 py-3 text-sm font-semibold text-text">LRN</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-text">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {enrollments.map((enrollment, index) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-muted">{index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-knhs-purple">
                              {enrollment.student_name ? enrollment.student_name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <p className="font-medium text-text">{enrollment.student_name || 'Unknown'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted">
                          {enrollment.student_lrn || 'N/A'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-2">
                            <AttendanceButton
                              status="P"
                              label="Present"
                              color="green"
                              active={attendance[enrollment.id] === 'P'}
                              onClick={() => handleAttendanceChange(enrollment.id, 'P')}
                            />
                            <AttendanceButton
                              status="A"
                              label="Absent"
                              color="red"
                              active={attendance[enrollment.id] === 'A'}
                              onClick={() => handleAttendanceChange(enrollment.id, 'A')}
                            />
                            <AttendanceButton
                              status="L"
                              label="Late"
                              color="amber"
                              active={attendance[enrollment.id] === 'L'}
                              onClick={() => handleAttendanceChange(enrollment.id, 'L')}
                            />
                            <AttendanceButton
                              status="E"
                              label="Excused"
                              color="blue"
                              active={attendance[enrollment.id] === 'E'}
                              onClick={() => handleAttendanceChange(enrollment.id, 'E')}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Save Button */}
            {enrollments.length > 0 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                <div className="text-sm text-muted">
                  <p>
                    <span className="font-medium text-text">{enrollments.length}</span> students •{' '}
                    <span className="font-medium text-green-600">
                      {Object.values(attendance).filter((s) => s === 'P').length} Present
                    </span>{' '}
                    •{' '}
                    <span className="font-medium text-red-600">
                      {Object.values(attendance).filter((s) => s === 'A').length} Absent
                    </span>{' '}
                    •{' '}
                    <span className="font-medium text-amber-600">
                      {Object.values(attendance).filter((s) => s === 'L').length} Late
                    </span>{' '}
                    •{' '}
                    <span className="font-medium text-blue-600">
                      {Object.values(attendance).filter((s) => s === 'E').length} Excused
                    </span>
                  </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Attendance
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Help Text */}
        {!selectedClassroom && (
          <Card>
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-text">Select a Class to Begin</h3>
              <p className="mt-2 text-sm text-muted">
                Choose a class from the dropdown above to mark attendance for your students.
              </p>
              <div className="mt-6 text-left">
                <p className="text-sm font-medium text-text">Attendance Status Guide:</p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  <li className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-green-100 text-xs font-bold text-green-700">P</span>
                    <span>Present - Student attended class</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-red-100 text-xs font-bold text-red-700">A</span>
                    <span>Absent - Student did not attend</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-amber-100 text-xs font-bold text-amber-700">L</span>
                    <span>Late - Student arrived late</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-700">E</span>
                    <span>Excused - Absent with valid reason</span>
                  </li>
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
// ATTENDANCE BUTTON COMPONENT
// ============================================================================

function AttendanceButton({ status, label, color, active, onClick }) {
  const colorClasses = {
    green: {
      active: 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2',
      inactive: 'bg-green-100 text-green-700 hover:bg-green-200',
    },
    red: {
      active: 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2',
      inactive: 'bg-red-100 text-red-700 hover:bg-red-200',
    },
    amber: {
      active: 'bg-amber-600 text-white ring-2 ring-amber-600 ring-offset-2',
      inactive: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    },
    blue: {
      active: 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2',
      inactive: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    },
  }

  const classes = active ? colorClasses[color].active : colorClasses[color].inactive

  return (
    <button
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition-all ${classes}`}
      title={label}
    >
      {status}
    </button>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getTodayDateString() {
  // Get today's date in Asia/Manila timezone (Philippines)
  const today = new Date()
  const offset = 8 * 60 // UTC+8 in minutes
  const localTime = today.getTime() + (today.getTimezoneOffset() + offset) * 60000
  const manilaDate = new Date(localTime)
  
  const year = manilaDate.getFullYear()
  const month = String(manilaDate.getMonth() + 1).padStart(2, '0')
  const day = String(manilaDate.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
