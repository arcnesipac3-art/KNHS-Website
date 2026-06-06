import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { userApi } from '../lib/userApi'
import { attendanceApi } from '../lib/learningApi'
import { classroomApi } from '../lib/academicApi'
import api from '../lib/api'

export default function GuidanceDashboard() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentRecords, setStudentRecords] = useState(null)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [cases, setCases] = useState([])
  const [selectedCase, setSelectedCase] = useState(null)
  const [showCaseForm, setShowCaseForm] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [studentAlerts, setStudentAlerts] = useState([])
  const [recentNotes, setRecentNotes] = useState([])

  useEffect(() => {
    loadStudents()
    loadCases()
    loadStudentAlerts()
    loadRecentNotes()
  }, [])

  async function loadStudents() {
    const res = await userApi.getAll({ role: 'student' }).catch(() => ({ data: [] }))
    const arr = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
    setStudents(arr)
    setLoading(false)
  }

  async function loadCases() {
    try {
      const response = await api.get('/counseling-cases/')
      setCases(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to load counseling cases:', error)
    }
  }

  async function loadStudentAlerts() {
    try {
      const response = await api.get('/attendance/student-alerts/')
      setStudentAlerts(response.data.results || response.data || [])
    } catch (error) {
      console.error('Failed to load student alerts:', error)
    }
  }

  async function loadRecentNotes() {
    try {
      const response = await api.get('/counseling-cases/recent_notes/')
      setRecentNotes(response.data.results || response.data || [])
    } catch (error) {
      console.error('Failed to load recent notes:', error)
    }
  }

  async function handleCreateCase(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      student_id: formData.get('student_id'),
      case_type: formData.get('case_type'),
      case_type_other: formData.get('case_type_other'),
      title: formData.get('title'),
      description: formData.get('description'),
      severity: formData.get('severity'),
      referral_source: formData.get('referral_source'),
      referral_date: formData.get('referral_date'),
    }

    try {
      await api.post('/counseling-cases/create_case/', data)
      setShowCaseForm(false)
      loadCases()
    } catch (error) {
      console.error('Failed to create case:', error)
      alert('Failed to create case. Please try again.')
    }
  }

  async function handleUpdateStatus(caseId, newStatus) {
    try {
      await api.post(`/counseling-cases/${caseId}/update_status/`, { status: newStatus })
      loadCases()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update status. Please try again.')
    }
  }

  async function handleAddNote(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      note: formData.get('note'),
      is_private: formData.get('is_private') === 'true',
    }

    try {
      await api.post(`/counseling-cases/${selectedCase.id}/add_note/`, data)
      setShowNoteForm(false)
      loadCases()
    } catch (error) {
      console.error('Failed to add note:', error)
      alert('Failed to add note. Please try again.')
    }
  }

  async function handleViewCaseNotes(caseId) {
    try {
      const response = await api.get(`/counseling-cases/${caseId}/notes/`)
      const caseWithNotes = cases.find(c => c.id === caseId)
      if (caseWithNotes) {
        setSelectedCase({ ...caseWithNotes, notes: response.data })
      }
    } catch (error) {
      console.error('Failed to load notes:', error)
    }
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
  const openCases = cases.filter(c => c.status === 'open').length
  const inProgressCases = cases.filter(c => c.status === 'in_progress').length
  const resolvedCases = cases.filter(c => c.status === 'resolved').length

  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Guidance Counselor</p>
          <h1 className="text-3xl font-bold">{user?.display_name || user?.email}</h1>
          <p className="mt-1 text-purple-200">Student Support & Case Management</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowCaseForm(true)}>Create New Case</Button>
          <Link to="/students">
            <Button variant="secondary">Student Lookup</Button>
          </Link>
          <Link to="/counseling-cases">
            <Button variant="secondary">View All Cases</Button>
          </Link>
          <Link to="/reports">
            <Button variant="secondary">Generate Reports</Button>
          </Link>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <p className="text-2xl font-bold text-text">{students.length}</p>
            <p className="text-sm text-muted">Total Students</p>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <p className="text-2xl font-bold text-text">{students.filter(s => s.is_active).length}</p>
            <p className="text-sm text-muted">Active Students</p>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <p className="text-2xl font-bold text-text">{openCases}</p>
            <p className="text-sm text-muted">Open Cases</p>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <p className="text-2xl font-bold text-text">{studentAlerts.length}</p>
            <p className="text-sm text-muted">Student Alerts</p>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Student Alerts */}
            {studentAlerts?.length > 0 && (
              <Card title="Student Alerts" subtitle="Attendance and performance issues">
                <div className="space-y-3">
                  {studentAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 rounded-lg border p-4 ${
                        alert.alert_type === 'attendance' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-text">{alert.student_name}</h4>
                        <p className="text-sm text-muted">
                          {alert.alert_type === 'attendance' ? 'Attendance Issue' : 'Performance Alert'}
                        </p>
                        <p className="text-sm text-muted">{alert.message}</p>
                      </div>
                      <Link to={`/students/${alert.student_id}`}>
                        <Button size="sm" variant="secondary">View</Button>
                      </Link>
                    </div>
                  ))}
                  {studentAlerts.length > 5 && (
                    <Link to="/students" className="block text-center text-sm text-purple-600 hover:underline">
                      View all {studentAlerts.length} alerts →
                    </Link>
                  )}
                </div>
              </Card>
            )}

            {/* Counseling Cases Section */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text">Counseling Cases</h2>
                <Button onClick={() => setShowCaseForm(true)}>Create New Case</Button>
              </div>
              <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-2xl font-bold text-blue-700">{openCases}</p>
                  <p className="text-sm text-blue-600">Open Cases</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-2xl font-bold text-amber-700">{inProgressCases}</p>
                  <p className="text-sm text-amber-600">In Progress</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-2xl font-bold text-green-700">{resolvedCases}</p>
                  <p className="text-sm text-green-600">Resolved</p>
                </div>
              </div>
              {cases.length === 0 ? (
                <p className="py-8 text-center text-muted">No counseling cases found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-2 text-left text-sm font-medium text-text">Student</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-text">Title</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-text">Type</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-text">Severity</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-text">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-text">Created</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-text">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.map(case_ => (
                        <tr key={case_.id} className="border-b border-gray-100">
                          <td className="px-4 py-3 text-sm text-text">{case_.student_name}</td>
                          <td className="px-4 py-3 text-sm text-text">{case_.title}</td>
                          <td className="px-4 py-3 text-sm text-text">{case_.case_type_display}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                case_.severity === 'urgent'
                                  ? 'bg-red-100 text-red-800'
                                  : case_.severity === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : case_.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {case_.severity_display}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                case_.status === 'open'
                                  ? 'bg-blue-100 text-blue-800'
                                  : case_.status === 'in_progress'
                                  ? 'bg-amber-100 text-amber-800'
                                  : case_.status === 'resolved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {case_.status_display}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted">
                            {new Date(case_.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button size="sm" variant="secondary" onClick={() => handleViewCaseNotes(case_.id)}>
                                View
                              </Button>
                              <select
                                value={case_.status}
                                onChange={e => handleUpdateStatus(case_.id, e.target.value)}
                                className="rounded border border-gray-300 px-2 py-1 text-xs"
                              >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-4 lg:space-y-6">
            {/* Recent Notes */}
            {recentNotes?.length > 0 && (
              <Card title="Recent Counseling Notes" subtitle="Latest case notes">
                <div className="space-y-3">
                  {recentNotes.slice(0, 5).map((note) => (
                    <div key={note.id} className="rounded-lg border border-gray-200 p-3">
                      <p className="text-sm font-medium text-text">{note.author_name}</p>
                      <p className="mt-1 text-xs text-muted line-clamp-2">{note.note}</p>
                      <p className="mt-1 text-xs text-muted">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  <Link
                    to="/counseling-cases"
                    className="block text-center text-sm text-purple-600 hover:underline"
                  >
                    View all →
                  </Link>
                </div>
              </Card>
            )}

            {/* Student lookup */}
            <Card title="Student Lookup" subtitle="Search and view student records">
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
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
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {filtered.slice(0, 5).map(s => (
                    <div key={s.id}
                      className={`flex cursor-pointer items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 ${selectedStudent?.id === s.id ? 'bg-purple-50' : ''}`}
                      onClick={() => openStudentProfile(s)}>
                      <div>
                        <p className="font-medium text-text">{s.full_name || s.email}</p>
                        <p className="text-xs text-muted">
                          {s.grade_level ? `Grade ${s.grade_level}` : 'No grade'}
                          {s.strand ? ` · ${s.strand}` : ''}
                        </p>
                      </div>
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                  {filtered.length > 5 && (
                    <Link to="/students" className="block text-center text-sm text-purple-600 hover:underline">
                      View all students →
                    </Link>
                  )}
                </div>
              )}
            </Card>

            {/* Student profile panel */}
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

        {/* Case Form Modal */}
        {showCaseForm && (
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-text">Create New Counseling Case</h2>
            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Student</label>
                <select
                  name="student_id"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.full_name || student.email} (Grade {student.grade_level})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Case Type</label>
                <select
                  name="case_type"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                >
                  <option value="">Select type</option>
                  <option value="academic">Academic Concern</option>
                  <option value="behavioral">Behavioral Issue</option>
                  <option value="personal">Personal Problem</option>
                  <option value="social">Social Issue</option>
                  <option value="family">Family Problem</option>
                  <option value="health">Health/Mental Health</option>
                  <option value="attendance">Attendance Issue</option>
                  <option value="disciplinary">Disciplinary Action</option>
                  <option value="referral">Referral</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Brief title for the case"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Description</label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  placeholder="Detailed description of the case"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Severity</label>
                <select
                  name="severity"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Referral Source</label>
                <input
                  type="text"
                  name="referral_source"
                  placeholder="Who referred this case"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Referral Date</label>
                <input
                  type="date"
                  name="referral_date"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowCaseForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Case</Button>
              </div>
            </form>
          </Card>
        )}

        {/* Case Details Modal */}
        {selectedCase && !showCaseForm && (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text">Case Details</h2>
              <Button variant="secondary" onClick={() => setSelectedCase(null)}>
                Close
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted">Student</p>
                <p className="font-medium text-text">{selectedCase.student_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Title</p>
                <p className="font-medium text-text">{selectedCase.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Type</p>
                <p className="font-medium text-text">{selectedCase.case_type_display}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Description</p>
                <p className="text-text">{selectedCase.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Severity</p>
                <p className="font-medium text-text">{selectedCase.severity_display}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Status</p>
                <p className="font-medium text-text">{selectedCase.status_display}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Referral Source</p>
                <p className="text-text">{selectedCase.referral_source || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Created</p>
                <p className="text-text">{new Date(selectedCase.created_at).toLocaleString()}</p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text">Notes</h3>
                  <Button size="sm" onClick={() => setShowNoteForm(true)}>
                    Add Note
                  </Button>
                </div>
                {selectedCase.notes && selectedCase.notes.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCase.notes.map(note => (
                      <div key={note.id} className="rounded-lg bg-gray-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-medium text-text">{note.author_name}</p>
                          <p className="text-xs text-muted">
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm text-text">{note.note}</p>
                        {note.is_private && (
                          <p className="mt-1 text-xs text-amber-600">Private note</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">No notes yet.</p>
                )}
              </div>

              {showNoteForm && (
                <form onSubmit={handleAddNote} className="space-y-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text">Note</label>
                    <textarea
                      name="note"
                      required
                      rows={3}
                      placeholder="Enter your note"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="is_private" value="true" className="rounded border-gray-300" />
                      <span className="text-sm font-medium text-text">Private note (guidance only)</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => setShowNoteForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Note</Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        )}
      </div>
    </PortalLayout>
  )
}
