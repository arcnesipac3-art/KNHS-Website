import { useState, useEffect } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'

export default function NotificationSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    // Email Notifications
    email_assignments: true,
    email_grades: true,
    email_announcements: true,
    email_attendance: false,
    email_materials: false,
    
    // In-App Notifications
    inapp_assignments: true,
    inapp_grades: true,
    inapp_announcements: true,
    inapp_attendance: true,
    inapp_materials: true,
    inapp_submissions: true,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    try {
      const response = await api.get('/communications/notification-preferences/')
      setSettings(response.data)
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  function handleToggle(key) {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave() {
    setLoading(true)
    try {
      await api.put('/communications/notification-preferences/', settings)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text">Notification Settings</h1>
          <p className="mt-2 text-muted">Manage how you receive notifications</p>
        </div>

        {initialLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-knhs-purple border-t-transparent"></div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <Card className="border-l-4 border-l-green-500 bg-green-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 font-medium text-green-900">Notification preferences saved!</p>
            </div>
          </Card>
        )}

        {/* Email Notifications */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-text">Email Notifications</h2>
          <p className="mb-6 text-sm text-muted">Choose what updates you want to receive via email</p>
          
          <div className="space-y-4">
            <NotificationToggle
              label="Assignments"
              description="New assignments, deadlines, and submission confirmations"
              checked={settings.email_assignments}
              onChange={() => handleToggle('email_assignments')}
            />
            <NotificationToggle
              label="Grades"
              description="New grades and report cards published"
              checked={settings.email_grades}
              onChange={() => handleToggle('email_grades')}
            />
            <NotificationToggle
              label="Announcements"
              description="Important school and class announcements"
              checked={settings.email_announcements}
              onChange={() => handleToggle('email_announcements')}
            />
            <NotificationToggle
              label="Attendance"
              description="Attendance marked and absence alerts"
              checked={settings.email_attendance}
              onChange={() => handleToggle('email_attendance')}
            />
            <NotificationToggle
              label="Learning Materials"
              description="New study materials uploaded"
              checked={settings.email_materials}
              onChange={() => handleToggle('email_materials')}
            />
          </div>
        </Card>

        {/* In-App Notifications */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-text">In-App Notifications</h2>
          <p className="mb-6 text-sm text-muted">Choose what updates appear in your notification panel</p>
          
          <div className="space-y-4">
            <NotificationToggle
              label="Assignments"
              description="New assignments and deadline reminders"
              checked={settings.inapp_assignments}
              onChange={() => handleToggle('inapp_assignments')}
            />
            <NotificationToggle
              label="Grades"
              description="New grades published"
              checked={settings.inapp_grades}
              onChange={() => handleToggle('inapp_grades')}
            />
            <NotificationToggle
              label="Announcements"
              description="School and class announcements"
              checked={settings.inapp_announcements}
              onChange={() => handleToggle('inapp_announcements')}
            />
            <NotificationToggle
              label="Attendance"
              description="Attendance updates"
              checked={settings.inapp_attendance}
              onChange={() => handleToggle('inapp_attendance')}
            />
            <NotificationToggle
              label="Learning Materials"
              description="New materials uploaded"
              checked={settings.inapp_materials}
              onChange={() => handleToggle('inapp_materials')}
            />
            <NotificationToggle
              label="Submissions"
              description="Assignment submission confirmations and grading updates"
              checked={settings.inapp_submissions}
              onChange={() => handleToggle('inapp_submissions')}
            />
          </div>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Coming Soon: Advanced Features</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>• Push notifications for mobile devices</li>
                <li>• SMS notifications for urgent alerts</li>
                <li>• Quiet hours scheduling</li>
                <li>• Notification digest (daily/weekly summaries)</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </PortalLayout>
  )
}

// ============================================================================
// COMPONENTS
// ============================================================================

function NotificationToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
      <div className="flex-1">
        <p className="font-medium text-text">{label}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-offset-2 ${
          checked ? 'bg-knhs-purple' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
