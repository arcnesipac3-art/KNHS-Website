import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { announcementApi } from '../lib/learningApi'
import { classroomApi } from '../lib/academicApi'

export default function CreateAnnouncement() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const classParam = searchParams.get('class')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState('normal')
  const [audienceType, setAudienceType] = useState(classParam ? 'class' : 'school')
  const [audienceRefId, setAudienceRefId] = useState(classParam || '')
  const [publishNow, setPublishNow] = useState(true)
  const [scheduledTime, setScheduledTime] = useState('')

  const [classrooms, setClassrooms] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isTeacher = user?.role === 'teacher'
  const isAdmin = user?.role === 'admin'
  const isPrincipal = user?.role === 'principal'
  const canCreateSchoolWide = isAdmin || isPrincipal

  // Access control
  useEffect(() => {
    if (!isTeacher && !isAdmin && !isPrincipal) {
      navigate('/dashboard')
    }
  }, [user, isTeacher, isAdmin, isPrincipal, navigate])

  // Load classrooms for teachers
  useEffect(() => {
    async function loadClassrooms() {
      if (isTeacher || isAdmin) {
        try {
          const { data } = await classroomApi.getAll()
          setClassrooms(data)
        } catch (err) {
          console.error('Failed to load classrooms:', err)
        }
      }
    }
    loadClassrooms()
  }, [isTeacher, isAdmin])

  // Set default audience for teachers (limited to classes)
  useEffect(() => {
    if (isTeacher && !canCreateSchoolWide && audienceType === 'school') {
      setAudienceType('class')
    }
  }, [isTeacher, canCreateSchoolWide, audienceType])

  async function handleSubmit(e) {
    e.preventDefault()
    
    // Validation
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!body.trim()) {
      setError('Body is required')
      return
    }
    if (audienceType !== 'school' && !audienceRefId) {
      setError('Please select an audience')
      return
    }
    if (!publishNow && !scheduledTime) {
      setError('Please select a scheduled publish time')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Create announcement
      const announcementData = {
        title: title.trim(),
        body: body.trim(),
        priority,
        audience_type: audienceType,
        audience_ref_id: audienceType === 'school' ? null : audienceRefId,
      }

      const { data: announcement } = await announcementApi.create(announcementData)

      // Publish announcement
      await announcementApi.publish(announcement.id, {
        publish_now: publishNow,
        scheduled_time: publishNow ? null : scheduledTime,
      })

      // Navigate to announcements list
      navigate('/announcements')
    } catch (err) {
      console.error('Failed to create announcement:', err)
      setError(err.response?.data?.error || 'Failed to create announcement. Please try again.')
      setSaving(false)
    }
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Create Announcement</h1>
            <p className="mt-2 text-muted">Share important information with your audience</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/announcements')}>
            Cancel
          </Button>
        </div>

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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card title="Announcement Details">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-text">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter announcement title"
                  maxLength={200}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                  required
                />
                <p className="mt-1 text-xs text-muted">{title.length}/200 characters</p>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-text">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                >
                  <option value="normal">ℹ️ Normal</option>
                  <option value="important">⚠️ Important</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
                <p className="mt-1 text-xs text-muted">
                  Urgent announcements will be highlighted and sent as notifications
                </p>
              </div>

              {/* Body */}
              <div>
                <label htmlFor="body" className="block text-sm font-medium text-text">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your announcement message here..."
                  rows={8}
                  maxLength={5000}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                  required
                />
                <p className="mt-1 text-xs text-muted">{body.length}/5000 characters</p>
              </div>
            </div>
          </Card>

          {/* Audience Targeting */}
          <Card title="Target Audience">
            <div className="space-y-4">
              {/* Audience Type */}
              <div>
                <label htmlFor="audienceType" className="block text-sm font-medium text-text">
                  Audience Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="audienceType"
                  value={audienceType}
                  onChange={(e) => {
                    setAudienceType(e.target.value)
                    setAudienceRefId('')
                  }}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                  disabled={isTeacher && !canCreateSchoolWide}
                >
                  <option value="school" disabled={isTeacher && !canCreateSchoolWide}>
                    🏫 School-wide (All users)
                  </option>
                  <option value="grade">📚 Specific Grade Level</option>
                  <option value="strand">🎓 Specific Strand (SHS)</option>
                  <option value="class">🏛️ Specific Class</option>
                  <option value="role">👥 Specific Role</option>
                </select>
                {isTeacher && !canCreateSchoolWide && (
                  <p className="mt-1 text-xs text-amber-600">
                    Teachers can only post to their classes or grade levels
                  </p>
                )}
              </div>

              {/* Audience Selection */}
              {audienceType === 'class' && (
                <div>
                  <label htmlFor="classroom" className="block text-sm font-medium text-text">
                    Select Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="classroom"
                    value={audienceRefId}
                    onChange={(e) => setAudienceRefId(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                    required
                  >
                    <option value="">Choose a class...</option>
                    {classrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name} - Grade {classroom.grade_level} {classroom.section}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {audienceType === 'grade' && (
                <div>
                  <label htmlFor="gradeLevel" className="block text-sm font-medium text-text">
                    Select Grade Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gradeLevel"
                    value={audienceRefId}
                    onChange={(e) => setAudienceRefId(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                    required
                  >
                    <option value="">Choose a grade...</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>
              )}

              {audienceType === 'strand' && (
                <div>
                  <label htmlFor="strand" className="block text-sm font-medium text-text">
                    Select Strand <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="strand"
                    value={audienceRefId}
                    onChange={(e) => setAudienceRefId(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                    required
                  >
                    <option value="">Choose a strand...</option>
                    <option value="STEM">STEM - Science, Technology, Engineering, and Mathematics</option>
                    <option value="ABM">ABM - Accountancy, Business, and Management</option>
                    <option value="HUMSS">HUMSS - Humanities and Social Sciences</option>
                    <option value="GAS">GAS - General Academic Strand</option>
                    <option value="TVL">TVL - Technical-Vocational-Livelihood</option>
                  </select>
                </div>
              )}

              {audienceType === 'role' && (
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-text">
                    Select Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    value={audienceRefId}
                    onChange={(e) => setAudienceRefId(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                    required
                  >
                    <option value="">Choose a role...</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="admin">Administrators</option>
                    <option value="principal">Principal</option>
                    <option value="guidance">Guidance Office</option>
                    <option value="registrar">Registrar</option>
                  </select>
                </div>
              )}
            </div>
          </Card>

          {/* Publishing Options */}
          <Card title="Publishing">
            <div className="space-y-4">
              {/* Publish Now */}
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  id="publishNow"
                  checked={publishNow}
                  onChange={() => setPublishNow(true)}
                  className="mt-1 h-4 w-4 text-knhs-purple focus:ring-knhs-purple"
                />
                <div>
                  <label htmlFor="publishNow" className="block text-sm font-medium text-text">
                    Publish immediately
                  </label>
                  <p className="text-xs text-muted">The announcement will be visible right away</p>
                </div>
              </div>

              {/* Schedule */}
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  id="scheduleLater"
                  checked={!publishNow}
                  onChange={() => setPublishNow(false)}
                  className="mt-1 h-4 w-4 text-knhs-purple focus:ring-knhs-purple"
                />
                <div className="flex-1">
                  <label htmlFor="scheduleLater" className="block text-sm font-medium text-text">
                    Schedule for later
                  </label>
                  <p className="mb-2 text-xs text-muted">Choose when to publish this announcement</p>
                  {!publishNow && (
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                      required={!publishNow}
                    />
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/announcements')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Publishing...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  {publishNow ? 'Publish Announcement' : 'Schedule Announcement'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PortalLayout>
  )
}
