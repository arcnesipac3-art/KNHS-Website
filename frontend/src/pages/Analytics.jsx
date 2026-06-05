import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { analyticsApi } from '../lib/analyticsApi'
import { quarterApi } from '../lib/academicApi'

export default function Analytics() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Data states
  const [overviewData, setOverviewData] = useState(null)
  const [attendanceData, setAttendanceData] = useState(null)
  const [gradeData, setGradeData] = useState(null)
  const [assignmentData, setAssignmentData] = useState(null)

  // Filter states
  const [quarters, setQuarters] = useState([])
  const [selectedQuarter, setSelectedQuarter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const isPrincipalOrAdmin = user?.role === 'principal' || user?.role === 'admin'

  // Access control
  useEffect(() => {
    if (!isPrincipalOrAdmin) {
      navigate('/dashboard')
    }
  }, [user, isPrincipalOrAdmin, navigate])

  // Load quarters
  useEffect(() => {
    async function loadQuarters() {
      try {
        const { data } = await quarterApi.getAll()
        // Handle both paginated {results:[]} and plain array
        const arr = Array.isArray(data) ? data : (data?.results ?? [])
        setQuarters(arr)
        const current = arr.find((q) => q.is_active)
        if (current) {
          setSelectedQuarter(current.id)
        }
      } catch (err) {
        console.error('Failed to load quarters:', err)
      }
    }
    if (isPrincipalOrAdmin) {
      loadQuarters()
    }
  }, [isPrincipalOrAdmin])

  // Load data based on active tab
  useEffect(() => {
    if (!isPrincipalOrAdmin) return

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        switch (activeTab) {
          case 'overview':
            const overviewRes = await analyticsApi.getDashboardOverview()
            setOverviewData(overviewRes.data)
            break

          case 'attendance':
            const attParams = {}
            if (dateFrom) attParams.date_from = dateFrom
            if (dateTo) attParams.date_to = dateTo
            const attRes = await analyticsApi.getAttendanceOverview(attParams)
            setAttendanceData(attRes.data)
            break

          case 'grades':
            const gradeParams = {}
            if (selectedQuarter) gradeParams.quarter = selectedQuarter
            const gradeRes = await analyticsApi.getGradeAnalytics(gradeParams)
            setGradeData(gradeRes.data)
            break

          case 'assignments':
            const assignRes = await analyticsApi.getAssignmentAnalytics()
            setAssignmentData(assignRes.data)
            break

          default:
            break
        }
      } catch (err) {
        console.error('Failed to load analytics:', err)
        setError('Failed to load analytics data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [activeTab, selectedQuarter, dateFrom, dateTo, isPrincipalOrAdmin])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'grades', label: 'Grades', icon: '📝' },
    { id: 'assignments', label: 'Assignments', icon: '📚' },
  ]

  if (!isPrincipalOrAdmin) {
    return null
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Analytics Dashboard</h1>
            <p className="mt-2 text-muted">Data insights and performance reports</p>
          </div>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-l-4 border-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 font-medium text-red-900">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-knhs-purple text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
              <p className="mt-4 text-muted">Loading analytics...</p>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {!loading && activeTab === 'overview' && overviewData && (
          <OverviewTab data={overviewData} />
        )}

        {/* Attendance Tab */}
        {!loading && activeTab === 'attendance' && (
          <AttendanceTab 
            data={attendanceData}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
        )}

        {/* Grades Tab */}
        {!loading && activeTab === 'grades' && (
          <GradesTab
            data={gradeData}
            quarters={quarters}
            selectedQuarter={selectedQuarter}
            onQuarterChange={setSelectedQuarter}
          />
        )}

        {/* Assignments Tab */}
        {!loading && activeTab === 'assignments' && assignmentData && (
          <AssignmentsTab data={assignmentData} />
        )}
      </div>
    </PortalLayout>
  )
}

// Tab components continue in next section...


function OverviewTab({ data }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Attendance Card */}
      <Card className="border-l-4 border-l-blue-500">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Attendance Rate</span>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-3xl font-bold text-text">{data.attendance.rate}%</p>
          <p className="text-xs text-muted">{data.attendance.period}</p>
          <p className="text-xs text-muted">{data.attendance.total_records} records</p>
        </div>
      </Card>

      {/* Grades Card */}
      <Card className="border-l-4 border-l-green-500">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Passing Rate</span>
            <span className="text-2xl">📝</span>
          </div>
          <p className="text-3xl font-bold text-text">{data.grades.passing_rate}%</p>
          <p className="text-xs text-muted">{data.grades.total_grades} grades</p>
          {data.grades.pending_approvals > 0 && (
            <p className="text-xs font-medium text-amber-600">
              {data.grades.pending_approvals} pending approval
            </p>
          )}
        </div>
      </Card>

      {/* Assignments Card */}
      <Card className="border-l-4 border-l-purple-500">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Recent Assignments</span>
            <span className="text-2xl">📚</span>
          </div>
          <p className="text-3xl font-bold text-text">{data.assignments.total_recent}</p>
          <p className="text-xs text-muted">Last 30 days</p>
          {data.assignments.pending_grading > 0 && (
            <p className="text-xs font-medium text-red-600">
              {data.assignments.pending_grading} need grading
            </p>
          )}
        </div>
      </Card>

      {/* Users Card */}
      <Card className="border-l-4 border-l-amber-500">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Active Users</span>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-text">{data.users.active_students}</p>
          <p className="text-xs text-muted">Students</p>
          <p className="text-xs text-muted">{data.users.active_teachers} Teachers</p>
        </div>
      </Card>

      {/* Current Quarter */}
      {data.current_quarter && data.current_quarter.name && (
        <Card className="md:col-span-2 lg:col-span-4 border-l-4 border-l-knhs-purple">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-2xl">
              📆
            </div>
            <div>
              <p className="text-sm text-muted">Current Academic Period</p>
              <p className="text-xl font-bold text-text">{data.current_quarter.name}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function AttendanceTab({ data, dateFrom, dateTo, onDateFromChange, onDateToChange }) {
  if (!data) {
    return (
      <Card>
        <p className="text-center text-muted">Select date range to view attendance analytics</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-text">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-text">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text"
            />
          </div>
        </div>
      </Card>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Attendance Rate" value={`${data.overall.attendance_rate}%`} color="blue" />
        <StatCard label="Present" value={data.overall.present} color="green" />
        <StatCard label="Absent" value={data.overall.absent} color="red" />
        <StatCard label="Late" value={data.overall.late} color="amber" />
        <StatCard label="Excused" value={data.overall.excused} color="purple" />
      </div>

      {/* Chronic Absences */}
      {data.chronic_absences && data.chronic_absences.length > 0 && (
        <Card title="Students with Chronic Absences" subtitle="Absence rate > 10%">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">Student</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Total Days</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Absent</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.chronic_absences.map((student) => (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-text">{student.student_name}</td>
                    <td className="px-4 py-3 text-center text-muted">{student.total_days}</td>
                    <td className="px-4 py-3 text-center text-red-600 font-semibold">{student.absent_days}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                        {student.absence_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Daily Trends - Simple list */}
      <Card title="Daily Attendance Trends" subtitle="Recent attendance rates">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {data.daily_trends.slice(-14).reverse().map((day) => (
            <div key={day.date} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className={`text-sm font-semibold ${
                  day.rate >= 90 ? 'text-green-600' :
                  day.rate >= 75 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {day.rate}%
                </span>
              </div>
              <div className="mt-1 text-xs text-muted">
                {day.present}/{day.total} present
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function GradesTab({ data, quarters, selectedQuarter, onQuarterChange }) {
  if (!data || data.total_grades === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-muted">No grades found for the selected filters</p>
          {quarters.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-text mb-2">Select Quarter</label>
              <select
                value={selectedQuarter}
                onChange={(e) => onQuarterChange(e.target.value)}
                className="mx-auto block w-64 rounded-lg border border-gray-300 px-4 py-2 text-text"
              >
                {quarters.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quarter Filter */}
      <Card>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text">Quarter</label>
            <select
              value={selectedQuarter}
              onChange={(e) => onQuarterChange(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text"
            >
              {quarters.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Grades" value={data.total_grades} color="blue" />
        <StatCard label="Passing Rate" value={`${data.passing_rate}%`} color="green" />
        <StatCard label="Average Grade" value={data.average_grade} color="purple" />
        <StatCard label="Passing" value={data.distribution.passing} color="green" />
      </div>

      {/* Grade Distribution */}
      <Card title="Grade Distribution" subtitle="DepEd grade ranges">
        <div className="space-y-3">
          {Object.entries(data.grade_ranges).map(([range, count]) => {
            const percentage = ((count / data.total_grades) * 100).toFixed(1)
            const color = range.includes('Outstanding') ? 'bg-green-500' :
                          range.includes('Very Satisfactory') ? 'bg-blue-500' :
                          range.includes('Satisfactory') ? 'bg-purple-500' :
                          range.includes('Fairly') ? 'bg-amber-500' : 'bg-red-500'

            return (
              <div key={range}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text">{range}</span>
                  <span className="text-sm text-muted">{count} ({percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* At-Risk Students */}
      {data.at_risk_students && data.at_risk_students.length > 0 && (
        <Card title="Students at Risk" subtitle="Failing 2+ subjects">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">Student</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Failing Subjects</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Total Subjects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.at_risk_students.map((student) => (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-text">{student.student_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                        {student.failing_subjects}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted">{student.total_subjects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Subject Performance */}
      {data.subject_performance && data.subject_performance.length > 0 && (
        <Card title="Subject Performance" subtitle="Average grades by subject">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">Subject</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Average</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Passing Rate</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.subject_performance.map((subject) => (
                  <tr key={subject.subject_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-text">{subject.subject_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        subject.average_grade >= 90 ? 'bg-green-100 text-green-800' :
                        subject.average_grade >= 75 ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {subject.average_grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted">{subject.passing_rate}%</td>
                    <td className="px-4 py-3 text-center text-muted">{subject.total_students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function AssignmentsTab({ data }) {
  if (!data || data.total_assignments === 0) {
    return (
      <Card>
        <p className="text-center text-muted py-8">No assignments found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Total Assignments" value={data.total_assignments} color="blue" />
        <StatCard label="Submission Rate" value={`${data.submission_rate}%`} color="green" />
        <StatCard label="Average Score" value={data.average_score} color="purple" />
        <StatCard label="Graded" value={data.status_breakdown.graded} color="green" />
        <StatCard label="Pending" value={data.status_breakdown.pending} color="amber" />
      </div>

      {/* Status Breakdown */}
      <Card title="Submission Status" subtitle="Current assignment status">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{data.status_breakdown.on_time}</p>
            <p className="text-sm text-muted">On Time</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-600">{data.status_breakdown.late}</p>
            <p className="text-sm text-muted">Late</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{data.status_breakdown.graded}</p>
            <p className="text-sm text-muted">Graded</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{data.status_breakdown.pending}</p>
            <p className="text-sm text-muted">Pending</p>
          </div>
        </div>
      </Card>

      {/* Assignment Performance */}
      {data.assignment_performance && data.assignment_performance.length > 0 && (
        <Card title="Assignment Performance" subtitle="Lowest submission rates first">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">Assignment</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Due Date</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Submission Rate</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Avg Score</th>
                  <th className="px-4 py-3 text-center font-medium text-muted">Graded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.assignment_performance.map((assignment) => (
                  <tr key={assignment.assignment_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text">{assignment.title}</p>
                      <p className="text-xs text-muted">
                        {assignment.actual_submissions}/{assignment.expected_submissions} submitted
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center text-muted">
                      {new Date(assignment.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        assignment.submission_rate >= 80 ? 'bg-green-100 text-green-800' :
                        assignment.submission_rate >= 60 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {assignment.submission_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted">{assignment.average_score}</td>
                    <td className="px-4 py-3 text-center text-muted">{assignment.graded_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    red: 'border-l-red-500',
    amber: 'border-l-amber-500',
    purple: 'border-l-purple-500',
  }

  return (
    <Card className={`border-l-4 ${colors[color]}`}>
      <div className="space-y-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-2xl font-bold text-text">{value}</p>
      </div>
    </Card>
  )
}
