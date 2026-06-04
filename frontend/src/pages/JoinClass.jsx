import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { classroomApi } from '../lib/academicApi'

export default function JoinClass() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Only students can join classes via code
  if (user?.role !== 'student') {
    return (
      <PortalLayout>
        <Card>
          <div className="py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-text">Access Denied</h3>
            <p className="mt-2 text-sm text-muted">
              Only students can join classes using a join code.
            </p>
            <div className="mt-6">
              <Button onClick={() => navigate('/classes')}>Go to My Classes</Button>
            </div>
          </div>
        </Card>
      </PortalLayout>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validate join code format (6 characters, alphanumeric)
    const cleanCode = joinCode.trim().toUpperCase()
    if (cleanCode.length !== 6) {
      setError('Join code must be exactly 6 characters')
      return
    }

    if (!/^[A-Z0-9]{6}$/.test(cleanCode)) {
      setError('Join code can only contain letters and numbers')
      return
    }

    setLoading(true)

    try {
      const response = await classroomApi.join(cleanCode)
      setSuccess(true)
      setJoinCode('')

      // Show success message briefly, then redirect
      setTimeout(() => {
        navigate(`/classes/${response.data.classroom_id}`)
      }, 1500)
    } catch (err) {
      console.error('Join class error:', err)
      
      // Handle specific error messages from backend
      if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.response?.status === 400) {
        setError('Invalid join code. Please check and try again.')
      } else if (err.response?.status === 409) {
        setError('You are already enrolled in this class.')
      } else if (err.response?.status === 404) {
        setError('Class not found. The join code may have expired.')
      } else {
        setError('Failed to join class. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <svg className="h-8 w-8 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-text">Join a Class</h1>
          <p className="mt-2 text-muted">
            Enter the 6-character join code provided by your teacher
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Join Code Input */}
            <div>
              <label htmlFor="joinCode" className="block text-sm font-medium text-text">
                Join Code
              </label>
              <input
                type="text"
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-bold uppercase tracking-widest text-text placeholder-gray-400 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-50"
                disabled={loading || success}
                autoFocus
              />
              <p className="mt-2 text-xs text-muted">
                The join code is case-insensitive and contains only letters and numbers
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                    <p className="mt-1 text-xs text-red-700">
                      Make sure you entered the code correctly and it hasn't expired.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">Successfully joined class!</p>
                    <p className="mt-1 text-xs text-green-700">Redirecting to class page...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/classes')}
                disabled={loading || success}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || success || joinCode.trim().length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining...
                  </span>
                ) : success ? (
                  'Success!'
                ) : (
                  'Join Class'
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Help Section */}
        <Card className="bg-purple-50 border-purple-200">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-purple-900">Need help?</h3>
              <ul className="mt-2 space-y-1 text-sm text-purple-800">
                <li>• Ask your teacher for the join code</li>
                <li>• Join codes are usually 6 characters (e.g., ABC123)</li>
                <li>• Make sure you're in the correct grade level</li>
                <li>• Contact your adviser if the code doesn't work</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Student Info Card */}
        <Card className="bg-gray-50 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Joining as:</p>
              <p className="mt-1 text-lg font-semibold text-knhs-purple">
                {user?.profile?.full_name || user?.email}
              </p>
              <p className="text-xs text-muted">
                Grade {user?.profile?.grade_level} {user?.profile?.strand && `• ${user?.profile?.strand}`}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <svg className="h-8 w-8 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>
    </PortalLayout>
  )
}
