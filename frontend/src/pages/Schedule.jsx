import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'
import { classroomApi, classSubjectApi } from '../lib/academicApi'

const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
]

const SUBJECT_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-red-100 border-red-300 text-red-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
]

function subjectColor(subjectId) {
  // Deterministic color from subject id
  const idx = subjectId ? parseInt(subjectId.replace(/-/g, '').slice(0, 8), 16) % SUBJECT_COLORS.length : 0
  return SUBJECT_COLORS[idx]
}

export default function Schedule() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isTeacher = user?.role === 'teacher'
  const isStudent = user?.role === 'student'

  const [periods, setPeriods] = useState([])
  const [slots, setSlots] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddPeriod, setShowAddPeriod] = useState(false)
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [classSubjects, setClassSubjects] = useState([])
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    if (selectedClassroom) {
      loadSlots(selectedClassroom)
      loadClassSubjects(selectedClassroom)
    }
  }, [selectedClassroom])

  async function loadAll() {
    setLoading(true)
    const [periodsRes, classroomsRes] = await Promise.allSettled([
      api.get('/periods/'),
      classroomApi.getAll(),
    ])

    if (periodsRes.status === 'fulfilled') {
      const d = periodsRes.value.data
      setPeriods(Array.isArray(d) ? d : (d?.results ?? []))
    }

    if (classroomsRes.status === 'fulfilled') {
      const d = classroomsRes.value.data
      const arr = Array.isArray(d) ? d : (d?.results ?? [])
      setClassrooms(arr)
      if (arr.length > 0) {
        setSelectedClassroom(arr[0].id)
      }
    }

    setLoading(false)
  }

  async function loadSlots(classroomId) {
    const res = await api.get('/timetable/', { params: { classroom: classroomId } }).catch(() => ({ data: [] }))
    const d = res.data
    setSlots(Array.isArray(d) ? d : (d?.results ?? []))
  }

  async function loadClassSubjects(classroomId) {
    const res = await classSubjectApi.getAll({ classroom: classroomId }).catch(() => ({ data: [] }))
    const d = res.data
    setClassSubjects(Array.isArray(d) ? d : (d?.results ?? []))
  }

  function showMsg(text, type = 'success') {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  async function handleDeleteSlot(slotId) {
    if (!confirm('Remove this slot from the timetable?')) return
    try {
      await api.delete(`/timetable/${slotId}/`)
      showMsg('Slot removed.')
      loadSlots(selectedClassroom)
    } catch {
      showMsg('Failed to remove slot.', 'error')
    }
  }

  // Build grid: rows = periods, cols = days
  const grid = {}
  slots.forEach(slot => {
    const key = `${slot.day_of_week}-${slot.period}`
    grid[key] = slot
  })

  const selectedClassroomObj = classrooms.find(c => c.id === selectedClassroom)

  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Class Schedule</h1>
            <p className="mt-2 text-muted">Weekly timetable for classes</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowAddPeriod(true)}>
                + Add Period
              </Button>
              <Button onClick={() => setShowAddSlot(true)} disabled={!selectedClassroom || periods.length === 0}>
                + Add Slot
              </Button>
            </div>
          )}
        </div>

        {message && (
          <div className={`rounded-lg border-l-4 p-3 text-sm font-medium ${
            message.type === 'error' ? 'border-red-500 bg-red-50 text-red-900' : 'border-green-500 bg-green-50 text-green-900'
          }`}>
            {message.text}
          </div>
        )}

        {/* Class selector */}
        {(isAdmin || isTeacher) && classrooms.length > 0 && (
          <Card>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-text whitespace-nowrap">View Class:</label>
              <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </Card>
        )}

        {/* Timetable grid */}
        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
        ) : periods.length === 0 ? (
          <Card>
            <div className="py-16 text-center">
              <p className="text-4xl">📅</p>
              <p className="mt-4 font-semibold text-text">No periods defined yet</p>
              <p className="mt-2 text-sm text-muted">
                {isAdmin
                  ? 'Add periods (time slots) first, then assign subjects to each slot.'
                  : 'The schedule has not been set up yet. Check back later.'}
              </p>
              {isAdmin && (
                <Button className="mt-4" onClick={() => setShowAddPeriod(true)}>
                  + Add First Period
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card title={selectedClassroomObj ? `${selectedClassroomObj.name} — Weekly Timetable` : 'Timetable'}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-500 w-28">
                      Period
                    </th>
                    {DAYS.map(d => (
                      <th key={d.value} className="border border-gray-200 bg-gray-50 px-3 py-2 text-center text-xs font-semibold text-gray-600 min-w-[120px]">
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(period => (
                    <tr key={period.id} className={period.is_break ? 'bg-gray-50' : 'hover:bg-gray-50/50'}>
                      {/* Period label */}
                      <td className="border border-gray-200 px-3 py-2">
                        <p className={`font-medium ${period.is_break ? 'text-gray-400 italic' : 'text-text'}`}>
                          {period.name}
                        </p>
                        <p className="text-xs text-muted">
                          {period.start_time?.slice(0, 5)} – {period.end_time?.slice(0, 5)}
                        </p>
                      </td>

                      {DAYS.map(day => {
                        const key = `${day.value}-${period.id}`
                        const slot = grid[key]

                        if (period.is_break) {
                          return (
                            <td key={day.value} className="border border-gray-200 px-2 py-2 text-center">
                              <span className="text-xs text-gray-400 italic">Break</span>
                            </td>
                          )
                        }

                        return (
                          <td key={day.value} className="border border-gray-200 px-2 py-1.5 align-top">
                            {slot ? (
                              <div className={`rounded-lg border p-2 ${subjectColor(slot.class_subject)}`}>
                                <p className="font-semibold text-xs leading-tight">{slot.subject_name}</p>
                                <p className="mt-0.5 text-xs opacity-80">{slot.teacher_name}</p>
                                {slot.room && <p className="mt-0.5 text-xs opacity-70">📍 {slot.room}</p>}
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="mt-1 text-xs opacity-50 hover:opacity-100 hover:text-red-600"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ) : isAdmin ? (
                              <button
                                onClick={() => {
                                  setShowAddSlot({ periodId: period.id, dayOfWeek: day.value })
                                }}
                                className="h-full w-full rounded-lg border-2 border-dashed border-gray-200 py-3 text-xs text-gray-300 hover:border-knhs-purple hover:text-knhs-purple transition-colors"
                              >
                                + Add
                              </button>
                            ) : (
                              <span className="text-xs text-gray-200">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            {slots.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                {[...new Map(slots.map(s => [s.class_subject, s])).values()].map(s => (
                  <span key={s.class_subject}
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${subjectColor(s.class_subject)}`}>
                    {s.subject_name}
                  </span>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Add Period Modal */}
        {showAddPeriod && (
          <AddPeriodModal
            onClose={() => setShowAddPeriod(false)}
            onSuccess={() => { setShowAddPeriod(false); loadAll(); showMsg('Period added.') }}
          />
        )}

        {/* Add Slot Modal */}
        {showAddSlot && (
          <AddSlotModal
            periods={periods}
            classSubjects={classSubjects}
            classroomId={selectedClassroom}
            prefillPeriod={typeof showAddSlot === 'object' ? showAddSlot.periodId : ''}
            prefillDay={typeof showAddSlot === 'object' ? showAddSlot.dayOfWeek : ''}
            onClose={() => setShowAddSlot(false)}
            onSuccess={() => { setShowAddSlot(false); loadSlots(selectedClassroom); showMsg('Slot added.') }}
          />
        )}
      </div>
    </PortalLayout>
  )
}


function AddPeriodModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', start_time: '', end_time: '', order: 1, is_break: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      // Get current academic year id first
      const yearsRes = await api.get('/academic-years/', { params: { is_current: true } }).catch(() => ({ data: [] }))
      const years = Array.isArray(yearsRes.data) ? yearsRes.data : (yearsRes.data?.results ?? [])
      const currentYear = years.find(y => y.is_current) || years[0]
      if (!currentYear) { setError('No current academic year set.'); setSaving(false); return }

      await api.post('/periods/', { ...form, academic_year: currentYear.id })
      onSuccess()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to add period.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-text">Add Period</h3>
        {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text">Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              required placeholder="e.g., Period 1, Recess"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text">Start Time <span className="text-red-500">*</span></label>
              <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                required className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">End Time <span className="text-red-500">*</span></label>
              <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                required className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text">Display Order</label>
            <input type="number" min="1" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) })}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_break} onChange={e => setForm({ ...form, is_break: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-knhs-purple" />
            <span className="text-sm text-text">This is a break (recess/lunch)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Adding...' : 'Add Period'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}


function AddSlotModal({ periods, classSubjects, classroomId, prefillPeriod, prefillDay, onClose, onSuccess }) {
  const [form, setForm] = useState({
    classroom: classroomId,
    class_subject: '',
    period: prefillPeriod || '',
    day_of_week: prefillDay || '',
    room: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.post('/timetable/', { ...form, day_of_week: parseInt(form.day_of_week) })
      onSuccess()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Failed to add slot.')
      setSaving(false)
    }
  }

  const DAYS = [
    { value: 1, label: 'Monday' }, { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' }, { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-text">Add Timetable Slot</h3>
        {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text">Day <span className="text-red-500">*</span></label>
            <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value })}
              required className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select day...</option>
              {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text">Period <span className="text-red-500">*</span></label>
            <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
              required className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select period...</option>
              {periods.filter(p => !p.is_break).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.start_time?.slice(0, 5)}–{p.end_time?.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text">Subject <span className="text-red-500">*</span></label>
            <select value={form.class_subject} onChange={e => setForm({ ...form, class_subject: e.target.value })}
              required className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select subject...</option>
              {classSubjects.map(cs => (
                <option key={cs.id} value={cs.id}>
                  {cs.subject_name || cs.subject?.name} — {cs.teacher_name || 'No teacher'}
                </option>
              ))}
            </select>
            {classSubjects.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">No subjects assigned to this class yet.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text">Room / Lab</label>
            <input type="text" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}
              placeholder="e.g., Room 201, Science Lab"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving || classSubjects.length === 0} className="flex-1">
              {saving ? 'Adding...' : 'Add Slot'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
