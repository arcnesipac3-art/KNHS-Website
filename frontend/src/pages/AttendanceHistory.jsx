import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { attendanceApi } from '../lib/learningApi'
import { classroomApi } from '../lib/academicApi'

const STATUS_LABELS = { P: 'Present', A: 'Absent', L: 'Late', E: 'Excused' }
const STATUS_STYLES = {
  P: 'bg-green-100 text-green-800',
  A: 'bg-red-100 text-red-800',
  L: 'bg-amber-100 text-amber-800',
  E: 'bg-blue-100 text-blue-800',
}

function getDateRange(days) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

export default function AttendanceHistory() {
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'
  const isStudent = user?.role === 'student'

  const [records, setRecords] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [range, setRange] = useState('30')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    loadClassrooms()
  }, [])

  useEffect(() => {
    loadRecords()
  }, [selectedClassroom, range])

  async function loadClassrooms() {
    const res = await classroomApi.getAll().catch(() => ({ data: [] }))
    const arr = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
    setClassrooms(arr)
    if (arr.length > 0 && isTeacher) {
      setSelectedClassroom(arr[0].id)
    }
  }

  async function loadRecords() {
    setLoading(true)
    const { from, to } = getDateRange(parseInt(range))
    const params = { date_from: from, date_to: to }
    if (selectedClassroom) params.classroom = selectedClassroom

    const [recRes, sumRes] = await Promise.allSettled([
      attendanceApi.getAll(params),
      selectedClassroom ? attendanceApi.getSummary(selectedClassroom, from, to) : Promise.resolve({ data: [] }),
    ])

    if (recRes.status === 'fulfilled') {
      const d = recRes.value.data
      setRecords(Array.isArray(d) ? d : (d?.results ?? []))
    }
    if (sumRes.status === 'fulfilled' && selectedClassroom) {
      const d = sumRes.value.data
      setSummary(Array.isArray(d) ? d : (d?.results ?? []))
    }
    setLoading(false)
  }

  // Compute personal stats for student view
  const myStats = isStudent ? {
    total: records.length,
    present: records.filter(r => r.status === 'P').length,
    absent: records.filter(r => r.status === 'A').length,
    late: records.filter(r => r.status === 'L').length,
    excused: records.filter(r => r.status === 'E').length,
  } : null

  const attendanceRate = myStats && myStats.total > 0
    ? Math.round((myStats.present / myStats.total) * 100)
    : null

  return (
    <PortalLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Attendance</h1>
            <p className="mt-2 text-muted">
              {isTeacher ? 'Review attendance records for your classes' : 'Your attendance history'}
            </p>
          </div>
          {isTeacher && (
            <a href="/attendance/mark">
              <Button>Mark Attendance</Button>
            </a>
          )}
        </div>

        {/* Student stats */}
        {isStudent && myStats && !loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Card className="sm:col-span-1 border-l-4 border-l-knhs-purple text-center">
              <p className="text-2xl font-bold text-knhs-purple">{attendanceRate ?? '—'}%</p>
              <p className="mt-1 text-xs text-muted">Rate</p>
            </Card>
            {[
              { key: 'present', label: 'Present', color: 'text-green-600' },
              { key: 'absent', label: 'Absent', color: 'text-red-600' },
              { key: 'late', label: 'Late', color: 'text-amber-600' },
              { key: 'excused', label: 'Excused', color: 'text-blue-600' },
            ].map(({ key, label, color }) => (
              <Card key={key} className="text-center">
                <p className={`text-2xl font-bold ${color}`}>{myStats[key]}</p>
                <p className="mt-1 text-xs text-muted">{label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="flex flex-wrap gap-4">
            {isTeacher && classrooms.length > 0 && (
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm font-medium text-text">Class</label>
                <select value={selectedClassroom}
                  onChange={e => setSelectedClassroom(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">All Classes</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-text">Period</label>
              <select value={range} onChange={e => setRange(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last quarter (~90 days)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Teacher summary table */}
        {isTeacher && summary && summary.length > 0 && (
          <Card title="Class Summary">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="pb-3">Student</th>
                    <th className="pb-3 text-center">Present</th>
                    <th className="pb-3 text-center">Absent</th>
                    <th className="pb-3 text-center">Late</th>
                    <th className="pb-3 text-center">Excused</th>
                    <th className="pb-3 text-center">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.map(s => (
                    <tr key={s.student_id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-text">{s.student_name}</td>
                      <td className="py-3 text-center text-green-700">{s.present_count}</td>
                      <td className="py-3 text-center text-red-700">{s.absent_count}</td>
                      <td className="py-3 text-center text-amber-700">{s.late_count}</td>
                      <td className="py-3 text-center text-blue-700">{s.excused_count}</td>
                      <td className="py-3 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          s.attendance_rate >= 90 ? 'bg-green-100 text-green-800' :
                          s.attendance_rate >= 75 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {s.attendance_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Individual records */}
        <Card title={`Records (${records.length})`}>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-200" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-muted">
              No attendance records found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="pb-3">Date</th>
                    {isTeacher && <th className="pb-3">Student</th>}
                    {isTeacher && <th className="pb-3">Class</th>}
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-text">
                        {new Date(r.date).toLocaleDateString('en-PH', {
                          weekday: 'short', month: 'short', day: 'numeric'
                        })}
                      </td>
                      {isTeacher && (
                        <td className="py-3 text-text">
                          {r.student_name || r.class_enrollment_detail?.student_name || '—'}
                        </td>
                      )}
                      {isTeacher && (
                        <td className="py-3 text-muted">
                          {r.classroom_name || r.class_enrollment_detail?.classroom_name || '—'}
                        </td>
                      )}
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status] || 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABELS[r.status] || r.status}
                        </span>
                      </td>
                      <td className="py-3 text-muted">{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PortalLayout>
  )
}
