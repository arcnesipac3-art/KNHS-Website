import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ROLE_HOME } from '../../styles/design-tokens'

export function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl bg-white px-6 py-4 shadow-sm">
          <p className="text-sm text-muted">Loading portal...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (user.must_change_password && location.pathname !== '/force-password-change') {
    return <Navigate to="/force-password-change" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home = ROLE_HOME[user.role] || '/dashboard'
    return <Navigate to={home} replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    )
  }

  if (user) {
    if (user.must_change_password) {
      return <Navigate to="/force-password-change" replace />
    }
    const home = ROLE_HOME[user.role] || '/dashboard'
    return <Navigate to={home} replace />
  }

  return <Outlet />
}
