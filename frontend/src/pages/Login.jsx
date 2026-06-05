import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { ROLE_HOME, school } from '../styles/design-tokens'
import DepEdHeader from '../components/layout/DepEdHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const handleSessionExpired = () => {
      setError('Your session expired. Please sign in again.')
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login(email.trim().toLowerCase(), password)
      const nextPath = location.state?.from?.pathname
      navigate(
        user.must_change_password
          ? '/force-password-change'
          : nextPath || ROLE_HOME[user.role] || '/dashboard',
        { replace: true },
      )
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        'Unable to sign in. Please check your credentials.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DepEdHeader />
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-10 lg:flex-row lg:gap-12 lg:py-16">
        <div className="mb-8 max-w-lg text-center lg:mb-0 lg:text-left">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-knhs-purple text-xl font-bold text-white lg:mx-0">
            KN
          </div>
          <h1 className="text-3xl font-bold text-knhs-purple">{school.name}</h1>
          <p className="mt-2 text-lg text-muted">{school.tagline}</p>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            Sign in to access classes, assignments, grades, announcements, and school services.
          </p>
        </div>

        <Card title="Portal Sign In" subtitle="Use your school email and password." className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-knhs-purple focus:ring-2 focus:ring-purple-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-24 text-sm outline-none transition-colors focus:border-knhs-purple focus:ring-2 focus:ring-purple-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 text-sm font-medium text-knhs-purple hover:text-purple-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <div className="mt-5 flex flex-col gap-2 text-center text-sm text-muted">
            <Link to="/enrollment/track" className="hover:text-knhs-purple">Track enrollment</Link>
            <Link to="/" className="hover:text-knhs-purple">Back to public site</Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
