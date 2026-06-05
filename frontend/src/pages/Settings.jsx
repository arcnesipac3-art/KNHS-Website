import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'

export default function Settings() {
  return (
    <PortalLayout>
      <Card title="Settings">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            School settings and academic calendar coming soon.
          </p>
          <p className="text-sm text-muted">
            This section is planned for an upcoming Phase 1 sprint. The navigation and
            layout shell are in place so features can be added incrementally.
          </p>
        </div>
      </Card>
    </PortalLayout>
  )
}
