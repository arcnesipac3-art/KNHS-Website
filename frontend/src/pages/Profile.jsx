import { useState, useEffect } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar_url: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
      })
    }
  }, [user])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { data } = await api.patch('/auth/profile/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        avatar_url: formData.avatar_url,
      })

      // Update user context
      updateUser(data)
      
      setSuccess(true)
      setEditing(false)
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Profile update failed:', err)
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    // Reset form data to original user data
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      avatar_url: user.avatar_url || '',
    })
    setEditing(false)
    setError(null)
  }

  const roleLabels = {
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Administrator',
    principal: 'Principal',
    registrar: 'Registrar',
    guidance: 'Guidance Counselor',
    parent: 'Parent/Guardian',
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text">My Profile</h1>
          <p className="mt-2 text-muted">View and manage your account information</p>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="border-l-4 border-l-green-500 bg-green-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 font-medium text-green-900">Profile updated successfully!</p>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-l-4 border-l-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 font-medium text-red-900">{error}</p>
            </div>
          </Card>
        )}

        {/* Profile Card */}
        <Card>
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-semibold text-text">Personal Information</h2>
            {!editing && (
              <Button onClick={() => setEditing(true)}>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            {/* Avatar */}
            <div className="mb-6 flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-knhs-purple text-3xl font-bold text-white">
                {formData.first_name?.[0]}{formData.last_name?.[0]}
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-text">Avatar URL (Optional)</label>
                <input
                  type="url"
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
                <p className="mt-1 text-xs text-muted">Provide a link to your profile picture</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* First Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-text">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
                />
                <p className="mt-1 text-xs text-muted">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="09XX XXX XXXX"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </form>
        </Card>

        {/* Account Information (Read-only) */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-text">Account Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted">Role</p>
              <p className="mt-1 text-base font-semibold text-text">{roleLabels[user?.role] || user?.role}</p>
            </div>

            {user?.role === 'student' && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted">LRN</p>
                  <p className="mt-1 text-base font-semibold text-text">{user?.lrn || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted">Grade Level</p>
                  <p className="mt-1 text-base font-semibold text-text">Grade {user?.grade_level || 'Not set'}</p>
                </div>
                {user?.strand && (
                  <div>
                    <p className="text-sm font-medium text-muted">Strand</p>
                    <p className="mt-1 text-base font-semibold text-text">{user.strand}</p>
                  </div>
                )}
              </>
            )}

            {user?.role === 'teacher' && user?.employee_id && (
              <div>
                <p className="text-sm font-medium text-muted">Employee ID</p>
                <p className="mt-1 text-base font-semibold text-text">{user.employee_id}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted">Member Since</p>
              <p className="mt-1 text-base font-semibold text-text">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted">Account Status</p>
              <div className="mt-1">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                  user?.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-text">Account Settings</h2>
          <div className="space-y-3">
            <a
              href="/settings/password"
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-knhs-purple hover:bg-purple-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <svg className="h-5 w-5 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-text">Change Password</p>
                  <p className="text-sm text-muted">Update your account password</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            <a
              href="/settings/notifications"
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-knhs-purple hover:bg-purple-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-text">Notification Preferences</p>
                  <p className="text-sm text-muted">Manage your notification settings</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </Card>
      </div>
    </PortalLayout>
  )
}
