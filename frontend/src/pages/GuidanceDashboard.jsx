import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { userApi } from '../lib/userApi'
import { attendanceApi } from '../lib/learningApi'
import { classroomApi } from '../lib/academicApi'

export default function GuidanceDashboard() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentRecords, setStudentRecords] = useState(null)
  const [loadingRecords, setLoadingRecords] = useState(false)

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    const res = await userApi.getAll({ role: 'student' }).catch(() => ({ data: [] }))
    const arr = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
    setStudents(arr)
    setLoading(false)
  }

  async function openStudentProfile(student) {
    setSelectedStudent(student)
    setLoadingRecords(true)

    const today = new Date().toISOString().split('T')[0]
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [attRes, classRes] = await Promise.allSettled([
      attendanceApi.getAll({ student: student.id, date_from: ninetyDaysAgo, date_to: today }),
      classroomApi.getAll(),
    ])

    const attendance = attRes.status === 'fulfilled'
      ? (Array.isArray(attRes.value.data) ? attRes.value.data : (attRes.value.data?.results ?? []))
      : []

    const present = attendance.filter(r => r.status === 'P').length
    const absent = attendance.filter(r => r.status === 'A').length
    const total = attendance.length
    const rate = total > 0 ? Math.round(present / total * 100) : null

    setStudentRecords({ attendance, present, absent, total, rate })
    setLoadingRecords(false)
  }

  const filtered = students.filter(s => {
    const nameMatch = search === '' ||
      (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.lrn || '').includes(search)
    const gradeMatch = gradeFilter === 'all' || String(s.grade_level) === gradeFilter
    return nameMatch && gradeMatch
  })

  const atRiskStudents = students.filter(s => s.is_active).length  // placeholder stat

  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Guidance Counselor</p>
          <h1 className="text-3xl font-bold">{user?.display_name || user?.email}</h1>
          <p className="mt-1 text-purple-200">Student Support & Case Management</p>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500">
            <p className="text-2xl font-bold text-text">{students.length}</p>
            <p className="text-sm text-muted">Total Students</p>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <p className="text-2xl font-bold text-text">{students.filter(s => s.is_active).length}</p>
            <p className="text-sm text-muted">Active Students</p>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <p className="text-2xl font-bold text-text">{students.filter(s => !s.is_active).length}</p>
            <p className="text-sm text-muted">Inactive Accounts</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Student lookup */}
          <div className="space-y-4 lg:col-span-2">
            <Card title="Student Lookup" subtitle="Search and view student records">
              <div className="mb-4 flex gap-3">
                <input type="text" value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, or LRN..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="all">All Grades</option>
                  {[7,8,9,10,11,12].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-200" />)}
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center text-muted">No students found.</p>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                  {filtered.map(s => (
                    <div key={s.id}
                      className={`flex cursor-pointer items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 ${selectedStudent?.id === s.id ? 'bg-purple-50' : ''}`}
                      onClick={() => openStudentProfile(s)}>
                      <div>
                        <p className="font-medium text-text">{s.full_name || s.email}</p>
                        <p className="text-xs text-muted">
                          {s.grade_level ? `Grade ${s.grade_level}` : 'No grade'}
                          {s.strand ? ` · ${s.strand}` : ''}
                          {s.lrn ? ` · LRN: ${s.lrn}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Student profile panel */}
          <div className="space-y-4">
            {selectedStudent ? (
              <>
                <Card title="Student Profile">
                  <div className="space-y-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-knhs-purple">
                      {(selectedStudent.full_name || selectedStudent.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-text">{selectedStudent.full_name || '—'}</p>
                      <p className="text-sm text-muted">{selectedStudent.email}</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      {selectedStudent.grade_level && (
                        <p><span className="text-muted">Grade:</span> {selectedStudent.grade_level}
                          {selectedStudent.strand ? ` · ${selectedStudent.strand}` : ''}</p>
                      )}
                      {selectedStudent.lrn && (
                        <p><span className="text-muted">LRN:</span> <span className="font-mono">{selectedStudent.lrn}</span></p>
                      )}
                    </div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      selectedStudent.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedStudent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </Card>

                <Card title="Attendance (Last 90 Days)">
                  {loadingRecords ? (
                    <div className="h-20 animate-pulse rounded-lg bg-gray-200" />
                  ) : studentRecords ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Attendance Rate</span>
                        <span className={`font-bold ${
                          studentRecords.rate >= 90 ? 'text-green-600' :
                          studentRecords.rate >= 75 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {studentRecords.rate != null ? `${studentRecords.rate}%` : 'No data'}
                        </span>
                      </div>
                      {studentRecords.rate != null && (
                        <div className="h-2 rounded-full bg-gray-200">
                          <div className={`h-2 rounded-full ${
                            studentRecords.rate >= 90 ? 'bg-green-500' :
                            studentRecords.rate >= 75 ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: `${studentRecords.rate}%` }} />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-center rounded-lg bg-green-50 p-2">
                          <p className="font-bold text-green-700">{studentRecords.present}</p>
                          <p className="text-xs text-muted">Present</p>
                        </div>
                        <div className="text-center rounded-lg bg-red-50 p-2">
                          <p className="font-bold text-red-700">{studentRecords.absent}</p>
                          <p className="text-xs text-muted">Absent</p>
                        </div>
                      </div>
                      {studentRecords.rate < 75 && (
                        <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">
                          ⚠️ Below 75% attendance — follow up recommended
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No attendance data available.</p>
                  )}
                </Card>
              </>
            ) : (
              <Card>
                <div className="py-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="mt-3 text-sm text-muted">Select a student to view their profile</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
