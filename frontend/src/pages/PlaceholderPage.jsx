import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'

export default function PlaceholderPage({ title, description }) {
  return (
    <PortalLayout>
      <Card title={title} subtitle={description}>
        <p className="text-sm text-muted">
          This section is planned for an upcoming Phase 1 sprint. The navigation and layout
          shell are in place so features can be added incrementally.
        </p>
      </Card>
    </PortalLayout>
  )
}
