import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import { schoolSettingsApi } from '../../lib/settingsApi'
import AcademicCalendarPanelComponent from './AcademicCalendarPanel'

export default function SchoolSettingsPanel() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [activeSection, setActiveSection] = useState('branding')

  // Form state
  const [formData, setFormData] = useState({
    // Branding
    school_name: '',
    school_short_name: '',
    school_logo_url: '',
    primary_color: '',
    secondary_color: '',
    // Enrollment
    enrollment_enabled: true,
    enrollment_message: '',
    enrollment_start_date: '',
    enrollment_end_date: '',
    // Security
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_digit: true,
    password_require_special: false,
    session_timeout_minutes: 480,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const { data } = await schoolSettingsApi.get()
      // Handle both paginated {results:[]} and plain array responses
      const list = Array.isArray(data) ? data : (data?.results ?? [])
      if (list.length > 0) {
        const settingsData = list[0]
        setSettings(settingsData)
        setFormData(prev => ({ ...prev, ...settingsData }))
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to load settings:', err)
      setError('Failed to load school settings. Please try again.')
      setLoading(false)
    }
  }

  function handleChange(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Use the id from the loaded settings object, not from formData
      const payload = { ...formData, id: settings?.id }
      if (!payload.id) {
        // No settings exist yet — this shouldn't happen but guard anyway
        setError('Settings not loaded yet. Please refresh and try again.')
        setSaving(false)
        return
      }
      await schoolSettingsApi.update(payload)
      setSuccessMessage('Settings saved successfully!')
      await loadSettings()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to save settings:', err)
      // React error #31: don't render objects directly — extract a string
      const errMsg = err.response?.data?.error
        || err.response?.data?.detail
        || (typeof err.response?.data === 'string' ? err.response.data : null)
        || 'Failed to save settings. Please try again.'
      setError(errMsg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
          <p className="mt-4 text-muted">Loading settings...</p>
        </div>
      </div>
    )
  }

  const sections = [
    { id: 'branding', label: 'Branding', icon: '🎨' },
    { id: 'enrollment', label: 'Enrollment', icon: '📝' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'calendar', label: 'Academic Calendar', icon: '📅' },
  ]

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="flex-1 font-medium text-green-900">{successMessage}</p>
            <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
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
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => !section.badge && setActiveSection(section.id)}
            disabled={!!section.badge}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-knhs-purple text-white'
                : section.badge
                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{section.icon}</span>
            <span>{section.label}</span>
            {section.badge && (
              <span className="rounded-full bg-gray-300 px-2 py-0.5 text-xs text-gray-600">
                {section.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Branding Section */}
      {activeSection === 'branding' && (
        <BrandingSection formData={formData} onChange={handleChange} />
      )}

      {/* Enrollment Section */}
      {activeSection === 'enrollment' && (
        <EnrollmentSection formData={formData} onChange={handleChange} />
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <SecuritySection formData={formData} onChange={handleChange} />
      )}

      {/* Academic Calendar Section */}
      {activeSection === 'calendar' && (
        <AcademicCalendarSection />
      )}

      {/* Save Button */}
      {activeSection !== 'calendar' && (
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
          <Button variant="secondary" onClick={loadSettings} disabled={saving}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  )
}

// Individual section components continue below...


function BrandingSection({ formData, onChange }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-purple-50 p-4">
        <h3 className="font-semibold text-purple-900">🎨 School Branding</h3>
        <p className="mt-1 text-sm text-purple-700">
          Customize your school's identity, colors, and branding across the portal.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* School Name */}
        <div>
          <label className="block text-sm font-medium text-text">
            School Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.school_name}
            onChange={(e) => onChange('school_name', e.target.value)}
            className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
          />
        </div>

        {/* Short Name */}
        <div>
          <label className="block text-sm font-medium text-text">
            Short Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.school_short_name}
            onChange={(e) => onChange('school_short_name', e.target.value)}
            className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
          />
          <p className="mt-1 text-xs text-muted">Used in navigation and headers</p>
        </div>

        {/* Logo URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text">
            School Logo URL
          </label>
          <input
            type="url"
            value={formData.school_logo_url}
            onChange={(e) => onChange('school_logo_url', e.target.value)}
            placeholder="https://example.com/logo.png"
            className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
          />
          <p className="mt-1 text-xs text-muted">Public URL to your school logo image</p>
        </div>

        {/* Primary Color */}
        <div>
          <label className="block text-sm font-medium text-text">
            Primary Color
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={formData.primary_color}
              onChange={(e) => onChange('primary_color', e.target.value)}
              className="h-10 w-20 cursor-pointer rounded-lg border border-gray-300"
            />
            <input
              type="text"
              value={formData.primary_color}
              onChange={(e) => onChange('primary_color', e.target.value)}
              placeholder="#6B21A8"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
            />
          </div>
          <p className="mt-1 text-xs text-muted">Main brand color (hex format)</p>
        </div>

        {/* Secondary Color */}
        <div>
          <label className="block text-sm font-medium text-text">
            Secondary Color
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={formData.secondary_color}
              onChange={(e) => onChange('secondary_color', e.target.value)}
              className="h-10 w-20 cursor-pointer rounded-lg border border-gray-300"
            />
            <input
              type="text"
              value={formData.secondary_color}
              onChange={(e) => onChange('secondary_color', e.target.value)}
              placeholder="#FCD34D"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
            />
          </div>
          <p className="mt-1 text-xs text-muted">Accent color (hex format)</p>
        </div>
      </div>
    </div>
  )
}

function EnrollmentSection({ formData, onChange }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-900">📝 Enrollment Control</h3>
        <p className="mt-1 text-sm text-blue-700">
          Manage public enrollment availability and set enrollment windows.
        </p>
      </div>

      <div className="space-y-6">
        {/* Enrollment Toggle */}
        <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
          <input
            type="checkbox"
            checked={formData.enrollment_enabled}
            onChange={(e) => onChange('enrollment_enabled', e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-gray-300 text-knhs-purple focus:ring-knhs-purple"
          />
          <div className="flex-1">
            <h4 className="font-semibold text-text">Enable Public Enrollment</h4>
            <p className="mt-1 text-sm text-muted">
              When enabled, prospective students can submit enrollment applications through the public portal.
            </p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
            formData.enrollment_enabled
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {formData.enrollment_enabled ? 'Open' : 'Closed'}
          </div>
        </div>

        {/* Enrollment Message */}
        <div>
          <label className="block text-sm font-medium text-text">
            Closed Message
          </label>
          <textarea
            value={formData.enrollment_message}
            onChange={(e) => onChange('enrollment_message', e.target.value)}
            rows={3}
            placeholder="Enrollment is currently closed. Please check back later."
            className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
          />
          <p className="mt-1 text-xs text-muted">Displayed when enrollment is closed</p>
        </div>

        {/* Enrollment Dates */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-text">
              Enrollment Start Date
            </label>
            <input
              type="date"
              value={formData.enrollment_start_date || ''}
              onChange={(e) => onChange('enrollment_start_date', e.target.value)}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
            />
            <p className="mt-1 text-xs text-muted">Optional: When enrollment period begins</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text">
              Enrollment End Date
            </label>
            <input
              type="date"
              value={formData.enrollment_end_date || ''}
              onChange={(e) => onChange('enrollment_end_date', e.target.value)}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
            />
            <p className="mt-1 text-xs text-muted">Optional: When enrollment period ends</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SecuritySection({ formData, onChange }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-red-50 p-4">
        <h3 className="font-semibold text-red-900">🔒 Security Policies</h3>
        <p className="mt-1 text-sm text-red-700">
          Configure password requirements, session timeouts, and account lockout policies.
        </p>
      </div>

      {/* Password Requirements */}
      <div className="space-y-4">
        <h4 className="font-semibold text-text">Password Requirements</h4>
        
        <div>
          <label className="block text-sm font-medium text-text">
            Minimum Length
          </label>
          <input
            type="number"
            min="6"
            max="32"
            value={formData.password_min_length}
            onChange={(e) => onChange('password_min_length', parseInt(e.target.value))}
            className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20 md:w-32"
          />
          <p className="mt-1 text-xs text-muted">6-32 characters</p>
        </div>

        <div className="space-y-3">
          {[
            { key: 'password_require_uppercase', label: 'Require Uppercase Letter (A-Z)' },
            { key: 'password_require_lowercase', label: 'Require Lowercase Letter (a-z)' },
            { key: 'password_require_digit', label: 'Require Digit (0-9)' },
            { key: 'password_require_special', label: 'Require Special Character (!@#$%...)' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData[key]}
                onChange={(e) => onChange(key, e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-knhs-purple focus:ring-knhs-purple"
              />
              <span className="text-sm text-text">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Session & Lockout */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            min="15"
            max="1440"
            value={formData.session_timeout_minutes}
            onChange={(e) => onChange('session_timeout_minutes', parseInt(e.target.value))}
            className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
          />
          <p className="mt-1 text-xs text-muted">15-1440 minutes (24 hours max)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text">
            Max Login Attempts
          </label>
          <input
            type="number"
            min="3"
            max="10"
            value={formData.max_login_attempts}
            onChange={(e) => onChange('max_login_attempts', parseInt(e.target.value))}
            className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
          />
          <p className="mt-1 text-xs text-muted">3-10 attempts before lockout</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text">
            Lockout Duration (minutes)
          </label>
          <input
            type="number"
            min="5"
            max="120"
            value={formData.lockout_duration_minutes}
            onChange={(e) => onChange('lockout_duration_minutes', parseInt(e.target.value))}
            className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
          />
          <p className="mt-1 text-xs text-muted">5-120 minutes</p>
        </div>
      </div>
    </div>
  )
}

function ComingSoonSection({ title, description }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <div className="text-6xl">📅</div>
        <h3 className="text-xl font-bold text-text">{title}</h3>
        <p className="text-sm text-muted">{description}</p>
        <div className="flex justify-center gap-2">
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
            Phase 1
          </span>
          <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  )
}

function AcademicCalendarSection() {
  return <AcademicCalendarPanelComponent />
}
