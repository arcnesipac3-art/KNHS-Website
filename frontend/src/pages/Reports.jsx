import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { userApi } from '../lib/userApi'
import { classroomApi, academicYearApi, quarterApi } from '../lib/academicApi'
import { attendanceApi, gradeApi } from '../lib/learningApi'

export default function Reports() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'principal' || user?.role === 'registrar'

  const [academicYears, setAcademicYears] = useState([])
  const [quarters, setQuarters] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedQuarter, setSelectedQuarter] = useState('')
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadFilters()
  }, [])

  async function loadFilters() {
    const [yearsRes, quartersRes, classroomsRes] = await Promise.allSettled([
      academicYearApi.getAll(),
      quarterApi.getAll(),
      classroomApi.getAll(),
    ])

    if (yearsRes.status === 'fulfilled') {
      const d = yearsRes.value.data
      const arr = Array.isArray(d) ? d : (d?.results ?? [])
      setAcademicYears(arr)
      const current = arr.find(y => y.is_current)
      if (current) setSelectedYear(current.id)
    }
    if (quartersRes.status === 'fulfilled') {
      const d = quartersRes.value.data
      const arr = Array.isArray(d) ? d : (d?.results ?? [])
      setQuarters(arr)
      const active = arr.find(q => q.is_active)
      if (active) setSelectedQuarter(active.id)
    }
    if (classroomsRes.status === 'fulfilled') {
      const d = classroomsRes.value.data
      setClassrooms(Array.isArray(d) ? d : (d?.results ?? []))
    }

    setLoading(false)
  }

  function showMessage(text, type = 'success') {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }

  // Download helper — takes blob data and triggers browser download
  function downloadBlob(data, filename, mimeType = 'text/csv') {
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // SF9 batch download for a class (PDF — already built)
  async function handleSF9Batch() {
    if (!selectedClassroom || !selectedYear) {
      showMessage('Please select a class and academic year first.', 'error')
      return
    }
    setGenerating('sf9')
    try {
      const res = await gradeApi.getClassSF9Batch({ classroom: selectedClassroom, academic_year: selectedYear })
      const data = res.data
      if (!data || !data.students || data.students.length === 0) {
        showMessage('No student data found for this class.', 'error')
        return
      }
      showMessage(`SF9 data loaded for ${data.students.length} students. Use Report Cards page to download individual PDFs.`)
    } catch (err) {
      showMessage('Failed to generate SF9 data. Please try again.', 'error')
    } finally {
      setGenerating(null)
    }
  }

  // Class List CSV export
  async function handleClassList() {
    if (!selectedClassroom) {
      showMessage('Please select a class first.', 'error')
      return
    }
    setGenerating('classlist')
    try {
      const classroom = classrooms.find(c => c.id === selectedClassroom)
      const studentsRes = await userApi.getAll({ role: 'student' })
      const allStudents = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data?.results ?? [])

      // Build CSV
      const headers = ['LRN', 'Last Name', 'First Name', 'Grade Level', 'Strand', 'Email', 'Status']
      const rows = allStudents.map(s => [
        s.lrn || '',
        s.profile?.last_name || s.full_name?.split(' ').slice(-1)[0] || '',
        s.profile?.first_name || s.full_name?.split(' ')[0] || '',
        s.grade_level || '',
        s.strand || '',
        s.email || '',
        s.is_active ? 'Active' : 'Inactive',
      ])

      const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
      const classroomName = classroom?.name || 'class'
      downloadBlob(csv, `class-list-${classroomName.replace(/\s+/g, '-')}.csv`)
      showMessage(`Class list downloaded for ${classroomName}.`)
    } catch (err) {
      showMessage('Failed to generate class list.', 'error')
    } finally {
      setGenerating(null)
    }
  }

  // Attendance Summary CSV
  async function handleAttendanceSummary() {
    if (!selectedClassroom) {
      showMessage('Please select a class first.', 'error')
      return
    }
    setGenerating('attendance')
    try {
      const today = new Date().toISOString().split('T')[0]
      const ninetyAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const res = await attendanceApi.getSummary(selectedClassroom, ninetyAgo, today)
      const summary = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])

      const headers = ['Student Name', 'LRN', 'Present', 'Absent', 'Late', 'Excused', 'Total Days', 'Rate (%)']
      const rows = summary.map(s => [
        s.student_name, s.student_lrn || '',
        s.present_count, s.absent_count, s.late_count, s.excused_count,
        s.total_days, s.attendance_rate,
      ])

      const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
      const classroom = classrooms.find(c => c.id === selectedClassroom)
      downloadBlob(csv, `attendance-summary-${classroom?.name || 'class'}.csv`)
      showMessage('Attendance summary downloaded.')
    } catch (err) {
      showMessage('Failed to generate attendance summary.', 'error')
    } finally {
      setGenerating(null)
    }
  }

  // Grade Summary CSV
  async function handleGradeSummary() {
    if (!selectedQuarter) {
      showMessage('Please select a quarter first.', 'error')
      return
    }
    setGenerating('grades')
    try {
      const res = await gradeApi.getAll({ quarter: selectedQuarter })
      const grades = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])

      if (grades.length === 0) {
        showMessage('No grades found for the selected quarter.', 'error')
        return
      }

      const headers = ['Student Name', 'Subject', 'Quarter', 'WW Score', 'PT Score', 'QA Score', 'Transmuted Grade', 'Status']
      const rows = grades.map(g => [
        g.student_name || '',
        g.subject_name || '',
        g.quarter_name || '',
        g.ww_score ?? '',
        g.pt_score ?? '',
        g.qa_score ?? '',
        g.transmuted_grade ?? '',
        g.status || '',
      ])

      const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
      const quarter = quarters.find(q => q.id === selectedQuarter)
      downloadBlob(csv, `grade-summary-${quarter?.name || 'quarter'}.csv`)
      showMessage('Grade summary downloaded.')
    } catch (err) {
      showMessage('Failed to generate grade summary.', 'error')
    } finally {
      setGenerating(null)
    }
  }

  // Student Roster CSV (all students)
  async function handleStudentRoster() {
    setGenerating('roster')
    try {
      const res = await userApi.getAll({ role: 'student' })
      const students = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])

      const headers = ['LRN', 'Last Name', 'First Name', 'Grade Level', 'Strand', 'Email', 'Contact', 'Status', 'Approved']
      const rows = students.map(s => [
        s.lrn || '',
        s.profile?.last_name || '',
        s.profile?.first_name || '',
        s.grade_level || '',
        s.strand || '',
        s.email || '',
        s.profile?.phone || s.phone || '',
        s.is_active ? 'Active' : 'Inactive',
        s.is_approved ? 'Yes' : 'No',
      ])

      const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
      downloadBlob(csv, 'student-roster.csv')
      showMessage(`Student roster downloaded (${students.length} students).`)
    } catch (err) {
      showMessage('Failed to generate student roster.', 'error')
    } finally {
      setGenerating(null)
    }
  }

  const REPORTS = [
    {
      id: 'sf9',
      title: 'SF9 Report Cards',
      desc: 'View and download Form 138 report cards for a class.',
      icon: '📋',
      color: 'border-l-purple-500',
      action: handleSF9Batch,
      note: 'Go to Report Cards page for PDF downloads',
      link: '/report-cards',
      requiresClass: true,
      requiresYear: true,
    },
    {
      id: 'classlist',
      title: 'Class List',
      desc: 'Export student roster for a specific class as CSV.',
      icon: '👥',
      color: 'border-l-blue-500',
      action: handleClassList,
      requiresClass: true,
    },
    {
      id: 'attendance',
      title: 'Attendance Summary',
      desc: 'Export 90-day attendance summary for a class as CSV.',
      icon: '📅',
      color: 'border-l-green-500',
      action: handleAttendanceSummary,
      requiresClass: true,
    },
    {
      id: 'grades',
      title: 'Grade Summary',
      desc: 'Export all grades for a quarter as CSV.',
      icon: '📝',
      color: 'border-l-amber-500',
      action: handleGradeSummary,
      requiresQuarter: true,
    },
    {
      id: 'roster',
      title: 'Student Roster',
      desc: 'Export full list of all enrolled students with LRNs.',
      icon: '📊',
      color: 'border-l-red-500',
      action: handleStudentRoster,
    },
  ]

  return (
    <PortalLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text">Reports & Exports</h1>
          <p className="mt-2 text-muted">Generate and download school reports</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-lg border-l-4 p-4 ${
            message.type === 'error'
              ? 'border-red-500 bg-red-50'
              : 'border-green-500 bg-green-50'
          }`}>
            <p className={`font-medium ${message.type === 'error' ? 'text-red-900' : 'text-green-900'}`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Filters */}
        <Card title="Report Filters" subtitle="Select parameters before generating">
          {loading ? (
            <div className="h-16 animate-pulse rounded-lg bg-gray-200" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-text">Academic Year</label>
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Select year...</option>
                  {academicYears.map(y => (
                    <option key={y.id} value={y.id}>{y.label}{y.is_current ? ' (Current)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text">Quarter</label>
                <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Select quarter...</option>
                  {quarters.map(q => (
                    <option key={q.id} value={q.id}>{q.name}{q.is_active ? ' (Active)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text">Class</label>
                <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Select class...</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* Report cards grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {REPORTS.map(report => {
            const isGenerating = generating === report.id
            const missingClass = report.requiresClass && !selectedClassroom
            const missingYear = report.requiresYear && !selectedYear
            const missingQuarter = report.requiresQuarter && !selectedQuarter
            const disabled = isGenerating || missingClass || missingYear || missingQuarter

            return (
              <Card key={report.id} className={`border-l-4 ${report.color}`}>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{report.icon}</div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-text">{report.title}</h3>
                      <p className="text-sm text-muted">{report.desc}</p>
                    </div>
                    {(missingClass || missingYear || missingQuarter) && (
                      <p className="text-xs text-amber-600">
                        {missingClass ? '⚠ Select a class · ' : ''}
                        {missingYear ? '⚠ Select an academic year · ' : ''}
                        {missingQuarter ? '⚠ Select a quarter' : ''}
                      </p>
                    )}
                    {report.note && (
                      <p className="text-xs text-muted italic">{report.note}</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      {report.link ? (
                        <a href={report.link}>
                          <Button size="sm" variant="secondary">Go to Page</Button>
                        </a>
                      ) : (
                        <Button
                          size="sm"
                          onClick={report.action}
                          disabled={disabled}
                        >
                          {isGenerating ? 'Generating...' : 'Download CSV'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Info box */}
        <Card className="border border-blue-200 bg-blue-50">
          <div className="flex gap-3">
            <span className="text-xl">ℹ️</span>
            <div className="text-sm text-blue-800">
              <p className="font-semibold">About these exports</p>
              <ul className="mt-1 space-y-0.5 text-blue-700">
                <li>• CSV files open in Excel or Google Sheets</li>
                <li>• SF9 Report Cards (PDF) are on the Report Cards page</li>
                <li>• LIS export format is available on request — contact ICT admin</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </PortalLayout>
  )
}
