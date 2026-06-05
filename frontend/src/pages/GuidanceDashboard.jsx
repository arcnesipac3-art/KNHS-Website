import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function GuidanceDashboard() {
  const { user } = useAuth()

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="rounded-2xl bg-gradient-to-r from-knhs-purple to-purple-700 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Guidance Office</p>
          <h1 className="text-3xl font-bold">{user?.display_name || user?.email}</h1>
          <p className="mt-1 text-purple-100">Student welfare • Counseling support</p>
        </div>

        <Card title="Guidance Dashboard" subtitle="Coming in Phase 2">
          <div className="space-y-4 text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">Guidance Management</h3>
              <p className="mt-2 text-muted max-w-md mx-auto">
                Student lookup, counseling case notes, referral tracking, appointments, and welfare monitoring tools.
              </p>
            </div>
            <div className="flex gap-3 justify-center mt-6">
              <Link to="/students">
                <Button variant="secondary">Student Lookup (Phase 2)</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </PortalLayout>
  )
}
