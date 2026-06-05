import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import { academicCalendarApi } from '../../lib/academicApi'

export default function AcademicCalendarPanel() {
  const [activeTab, setActiveTab] = useState('years')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // State
  const [academicYears, setAcademicYears] = useState([])
  const [quarters, setQuarters] = useState([])
  const [events, setEvents] = useState([])
  const [selectedYearId, setSelectedYearId] = useState(null)

  // Modals
  const [showYearModal, setShowYearModal] = useState(false)
  const [showQuarterModal, setShowQuarterModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedYearId && activeTab === 'quarters') {
      loadQuarters(selectedYearId)
    }
  }, [selectedYearId, activeTab])

  async function loadData() {
    try {
      setLoading(true)
      const [yearsRes, eventsRes] = await Promise.all([
        academicCalendarApi.getAcademicYears(),
        academicCalendarApi.getEvents()
      ])
      setAcademicYears(yearsRes.data)
      setEvents(eventsRes.data)
      
      // Set selected year to current year
      const currentYear = yearsRes.data.find(y => y.is_current)
      if (currentYear) {
        setSelectedYearId(currentYear.id)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load academic calendar data')
    } finally {
      setLoading(false)
    }
  }

  async function loadQuarters(yearId) {
    try {
      const { data } = await academicCalendarApi.getQuarters(yearId)
      setQuarters(data)
    } catch (err) {
      console.error('Failed to load quarters:', err)
    }
  }

  function openYearModal(year = null) {
    setEditingItem(year)
    setShowYearModal(true)
  }

  function openQuarterModal(quarter = null) {
    setEditingItem(quarter)
    setShowQuarterModal(true)
  }

  function openEventModal(event = null) {
    setEditingItem(event)
    setShowEventModal(true)
  }

  function closeModals() {
    setShowYearModal(false)
    setShowQuarterModal(false)
    setShowEventModal(false)
    setEditingItem(null)
  }

  async function handleSetCurrent(yearId) {
    try {
      await academicCalendarApi.setCurrentAcademicYear(yearId)
      setSuccessMessage('Current academic year updated')
      loadData()
    } catch (err) {
      setError('Failed to set current academic year')
    }
  }

  async function handleDeleteYear(id) {
    if (!confirm('Delete this academic year? This will also delete all quarters and grades.')) return
    try {
      await academicCalendarApi.deleteAcademicYear(id)
      setSuccessMessage('Academic year deleted')
      loadData()
    } catch (err) {
      setError('Failed to delete academic year')
    }
  }

  async function handleDeleteQuarter(id) {
    if (!confirm('Delete this quarter? This will also delete associated grades.')) return
    try {
      await academicCalendarApi.deleteQuarter(id)
      setSuccessMessage('Quarter deleted')
      loadQuarters(selectedYearId)
    } catch (err) {
      setError('Failed to delete quarter')
    }
  }

  async function handleDeleteEvent(id) {
    if (!confirm('Delete this event?')) return
    try {
      await academicCalendarApi.deleteEvent(id)
      setSuccessMessage('Event deleted')
      loadData()
    } catch (err) {
      setError('Failed to delete event')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
          <p className="mt-4 text-muted">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
          <p className="font-medium text-green-900">{successMessage}</p>
        </div>
      )}
      {error && (
        <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
          <p className="font-medium text-red-900">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="rounded-lg bg-purple-50 p-4">
        <h3 className="font-semibold text-purple-900">📅 Academic Calendar Management</h3>
        <p className="mt-1 text-sm text-purple-700">
          Manage academic years, quarters, and school events.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'years', label: 'Academic Years', icon: '📚' },
          { id: 'quarters', label: 'Quarters', icon: '📊' },
          { id: 'events', label: 'School Events', icon: '🗓️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
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

      {/* Content */}
      {activeTab === 'years' && (
        <AcademicYearsTab
          years={academicYears}
          onAdd={() => openYearModal()}
          onEdit={openYearModal}
          onSetCurrent={handleSetCurrent}
          onDelete={handleDeleteYear}
        />
      )}
      {activeTab === 'quarters' && (
        <QuartersTab
          quarters={quarters}
          years={academicYears}
          selectedYearId={selectedYearId}
          onYearChange={setSelectedYearId}
          onAdd={() => openQuarterModal()}
          onEdit={openQuarterModal}
          onDelete={handleDeleteQuarter}
        />
      )}
      {activeTab === 'events' && (
        <EventsTab
          events={events}
          years={academicYears}
          onAdd={() => openEventModal()}
          onEdit={openEventModal}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Modals */}
      {showYearModal && (
        <AcademicYearModal
          year={editingItem}
          onClose={closeModals}
          onSuccess={() => {
            closeModals()
            loadData()
            setSuccessMessage(editingItem ? 'Academic year updated' : 'Academic year created')
          }}
        />
      )}
      {showQuarterModal && (
        <QuarterModal
          quarter={editingItem}
          years={academicYears}
          selectedYearId={selectedYearId}
          onClose={closeModals}
          onSuccess={() => {
            closeModals()
            loadQuarters(selectedYearId)
            setSuccessMessage(editingItem ? 'Quarter updated' : 'Quarter created')
          }}
        />
      )}
      {showEventModal && (
        <EventModal
          event={editingItem}
          years={academicYears}
          onClose={closeModals}
          onSuccess={() => {
            closeModals()
            loadData()
            setSuccessMessage(editingItem ? 'Event updated' : 'Event created')
          }}
        />
      )}
    </div>
  )
}

// Academic Years Tab
function AcademicYearsTab({ years, onAdd, onEdit, onSetCurrent, onDelete }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted">Manage school years and set the current active year.</p>
        <Button onClick={onAdd}>+ Add Academic Year</Button>
      </div>

      <div className="space-y-3">
        {years.map((year) => (
          <div key={year.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-text">{year.label}</h4>
                  {year.is_current && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {year.start_date} to {year.end_date} • {year.quarters_count} quarters
                </p>
              </div>
              <div className="flex gap-2">
                {!year.is_current && (
                  <button
                    onClick={() => onSetCurrent(year.id)}
                    className="rounded-lg border border-green-300 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
                  >
                    Set Current
                  </button>
                )}
                <button
                  onClick={() => onEdit(year)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(year.id)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {years.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-sm text-muted">No academic years yet. Add one to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Quarters Tab
function QuartersTab({ quarters, years, selectedYearId, onYearChange, onAdd, onEdit, onDelete }) {
  const selectedYear = years.find(y => y.id === selectedYearId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-text">Academic Year</label>
          <select
            value={selectedYearId || ''}
            onChange={(e) => onYearChange(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text"
          >
            <option value="">Select academic year</option>
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.label} {year.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={onAdd} disabled={!selectedYearId}>+ Add Quarter</Button>
      </div>

      {selectedYearId && (
        <div className="space-y-3">
          {quarters.map((quarter) => (
            <div key={quarter.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-text">{quarter.name}</h4>
                    {quarter.is_active && (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Quarter {quarter.number} • {quarter.start_date} to {quarter.end_date}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(quarter)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(quarter.id)}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {quarters.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-sm text-muted">No quarters for this academic year yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Events Tab
function EventsTab({ events, years, onAdd, onEdit, onDelete }) {
  const [filterType, setFilterType] = useState('all')

  const filteredEvents = filterType === 'all'
    ? events
    : events.filter(e => e.event_type === filterType)

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'holiday', label: 'Holidays' },
    { value: 'activity', label: 'Activities' },
    { value: 'deadline', label: 'Deadlines' },
    { value: 'exam', label: 'Exams' },
    { value: 'meeting', label: 'Meetings' },
  ]

  const eventTypeColors = {
    holiday: 'bg-red-100 text-red-800',
    activity: 'bg-blue-100 text-blue-800',
    deadline: 'bg-yellow-100 text-yellow-800',
    exam: 'bg-purple-100 text-purple-800',
    meeting: 'bg-green-100 text-green-800',
    other: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="block rounded-lg border border-gray-300 px-4 py-2 text-text"
        >
          {eventTypes.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <Button onClick={onAdd}>+ Add Event</Button>
      </div>

      <div className="space-y-3">
        {filteredEvents.map((event) => (
          <div key={event.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-text">{event.title}</h4>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${eventTypeColors[event.event_type]}`}>
                    {event.event_type_display}
                  </span>
                  {event.is_school_wide && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      School-wide
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {event.start_date}
                  {event.end_date && event.end_date !== event.start_date && ` to ${event.end_date}`}
                  {event.academic_year_label && ` • ${event.academic_year_label}`}
                </p>
                {event.description && (
                  <p className="mt-2 text-sm text-gray-600">{event.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(event)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(event.id)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-sm text-muted">No events found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Academic Year Modal
function AcademicYearModal({ year, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    label: year?.label || '',
    start_date: year?.start_date || '',
    end_date: year?.end_date || '',
    is_current: year?.is_current || false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (year) {
        await academicCalendarApi.updateAcademicYear(year.id, formData)
      } else {
        await academicCalendarApi.createAcademicYear(formData)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save academic year')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h3 className="text-xl font-bold text-text">
          {year ? 'Edit Academic Year' : 'Add Academic Year'}
        </h3>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., SY 2024-2025"
              required
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.is_current}
              onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300 text-knhs-purple"
            />
            <span className="text-sm text-text">Set as current academic year</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : year ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Quarter Modal
function QuarterModal({ quarter, years, selectedYearId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    academic_year: quarter?.academic_year || selectedYearId || '',
    number: quarter?.number || 1,
    name: quarter?.name || '',
    start_date: quarter?.start_date || '',
    end_date: quarter?.end_date || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (quarter) {
        await academicCalendarApi.updateQuarter(quarter.id, formData)
      } else {
        await academicCalendarApi.createQuarter(formData)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save quarter')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h3 className="text-xl font-bold text-text">
          {quarter ? 'Edit Quarter' : 'Add Quarter'}
        </h3>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text">Academic Year</label>
            <select
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              required
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="">Select academic year</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>{year.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text">Quarter Number</label>
              <select
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., First Quarter"
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : quarter ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Event Modal
function EventModal({ event, years, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_type: event?.event_type || 'other',
    start_date: event?.start_date || '',
    end_date: event?.end_date || '',
    academic_year: event?.academic_year || '',
    is_school_wide: event?.is_school_wide ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = { ...formData }
      // Convert empty strings to null
      if (!payload.end_date) payload.end_date = null
      if (!payload.academic_year) payload.academic_year = null

      if (event) {
        await academicCalendarApi.updateEvent(event.id, payload)
      } else {
        await academicCalendarApi.createEvent(payload)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save event')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h3 className="text-xl font-bold text-text">
          {event ? 'Edit Event' : 'Add Event'}
        </h3>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Christmas Break"
              required
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text">Event Type</label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              required
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="holiday">Holiday</option>
              <option value="activity">School Activity</option>
              <option value="deadline">Deadline</option>
              <option value="exam">Examination</option>
              <option value="meeting">Meeting</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">End Date</label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
              />
              <p className="mt-1 text-xs text-muted">Optional for multi-day events</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text">Academic Year</label>
            <select
              value={formData.academic_year || ''}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="">No specific year</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>{year.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.is_school_wide}
              onChange={(e) => setFormData({ ...formData, is_school_wide: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300 text-knhs-purple"
            />
            <span className="text-sm text-text">School-wide event (visible to all)</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : event ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
