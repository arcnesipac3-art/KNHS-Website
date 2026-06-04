import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'

/**
 * Dashboard - Role-based router
 * Redirects users to their role-specific dashboard
 */
export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return

    // Route to role-specific dashboards
    switch (user.role) {
      case 'student':
        navigate('/student-dashboard', { replace: true })
        break
      case 'teacher':
        navigate('/teacher-dashboard', { replace: true })
        break
      case 'admin':
        navigate('/admin-dashboard', { replace: true })
        break
      case 'principal':
        navigate('/principal-dashboard', { replace: true })
        break
      case 'guidance':
        navigate('/guidance-dashboard', { replace: true })
        break
      case 'registrar':
        navigate('/registrar-dashboard', { replace: true })
        break
      default:
        // Fallback for unknown roles
        break
    }
  }, [user, navigate])

  // Loading state while redirecting
  return (
    <PortalLayout>
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
          <p className="mt-4 text-muted">Loading your dashboard...</p>
        </div>
      </div>
    </PortalLayout>
  )
}
