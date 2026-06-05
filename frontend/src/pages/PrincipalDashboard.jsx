import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function PrincipalDashboard() {
  const { user } = useAuth()

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="rounded-2xl bg-gradient-to-r from-knhs-purple to-purple-700 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">School Principal</p>
          <h1 className="text-3xl font-bold">{user?.display_name || user?.email}</h1>
          <p className="mt-1 text-purple-100">Executive oversight • Approval workflows</p>
        </div>

        <Card title="Principal Dashboard" subtitle="Coming in Phase 2">
          <div className="space-y-4 text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">Executive Dashboard</h3>
              <p className="mt-2 text-muted max-w-md mx-auto">
                School-wide analytics, approval center for grade publication and enrollment, audit logs, and official announcements.
              </p>
            </div>
            <div className="flex gap-3 justify-center mt-6">
              <Link to="/approvals">
                <Button variant="secondary">Approval Center (Phase 2)</Button>
              </Link>
              <Link to="/reports">
                <Button variant="secondary">School Analytics (Phase 2)</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </PortalLayout>
  )
}
