import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'

export default function ForcePasswordChange() {
  const { refreshUser } = useAuth()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/auth/change-password/', {
        old_password: '',   // backend skips this check when must_change_password=true
        new_password: newPassword,
      })
      await refreshUser()
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      const msg =
        (typeof data?.error === 'string' ? data.error : null) ||
        data?.error?.message ||
        data?.new_password?.[0] ||
        data?.detail ||
        'Unable to set password. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-md">
        <Card title="Set Your Password" subtitle="Choose a new password to continue.">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Setting password...' : 'Set Password'}
            </Button>
          </form>
        </Card>
      </div>
    </PortalLayout>
  )
}
