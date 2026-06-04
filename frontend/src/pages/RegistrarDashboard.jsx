import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function RegistrarDashboard() {
  const { user } = useAuth()

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="rounded-2xl bg-gradient-to-r from-knhs-purple to-purple-700 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Registrar Office</p>
          <h1 className="text-3xl font-bold">{user?.profile?.full_name || user?.email}</h1>
          <p className="mt-1 text-purple-100">Records management • Enrollment pipeline</p>
        </div>

        <Card title="Registrar Dashboard" subtitle="Coming in Phase 2">
          <div className="space-y-4 text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">Records Management</h3>
              <p className="mt-2 text-muted max-w-md mx-auto">
                Enrollment queue, document verification, student master records, LRN validation, section assignment, and LIS exports.
              </p>
            </div>
            <div className="flex gap-3 justify-center mt-6">
              <Link to="/enrollment">
                <Button variant="secondary">Enrollment Queue (Phase 2)</Button>
              </Link>
              <Link to="/students">
                <Button variant="secondary">Student Records (Phase 2)</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </PortalLayout>
  )
}
