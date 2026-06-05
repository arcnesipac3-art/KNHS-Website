import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'

export default function ChangePassword() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Validation
    if (formData.new_password.length < 8) {
      setError('New password must be at least 8 characters long')
      setLoading(false)
      return
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    if (formData.current_password === formData.new_password) {
      setError('New password must be different from current password')
      setLoading(false)
      return
    }

    try {
      await api.post('/auth/change-password/', {
        old_password: formData.current_password,
        new_password: formData.new_password,
      })

      setSuccess(true)
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
      
      // Redirect after 2 seconds
      setTimeout(() => navigate('/profile'), 2000)
    } catch (err) {
      console.error('Password change failed:', err)
      setError(err.response?.data?.error || err.response?.data?.old_password?.[0] || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text">Change Password</h1>
          <p className="mt-2 text-muted">Update your account password</p>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="border-l-4 border-l-green-500 bg-green-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-green-900">Password changed successfully!</p>
                <p className="mt-1 text-sm text-green-800">Redirecting to profile...</p>
              </div>
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

        {/* Password Change Form */}
        <Card>
          <h2 className="mb-6 text-xl font-semibold text-text">Update Password</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-text">
                Current Password <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                placeholder="Enter your current password"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-text">
                New Password <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                placeholder="Enter new password (min. 8 characters)"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-text">
                Confirm New Password <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                placeholder="Confirm new password"
              />
            </div>

            {/* Password Requirements */}
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-medium text-blue-900">Password Requirements:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Minimum 8 characters long
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Must be different from current password
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Both new password fields must match
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/profile')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || success}>
                {loading ? 'Changing Password...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Security Tips */}
        <Card>
          <h3 className="mb-3 font-semibold text-text">Security Tips</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Use a strong, unique password that you don't use on other sites
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Never share your password with anyone
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Change your password regularly (every 3-6 months recommended)
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              If you suspect your account has been compromised, change your password immediately
            </li>
          </ul>
        </Card>
      </div>
    </PortalLayout>
  )
}
