import Card from '../components/ui/Card'
import { school } from '../styles/design-tokens'

export default function Contact() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Card title="Contact Us" subtitle="Get in touch with the school">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-text">School</dt>
            <dd className="text-muted">{school.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-text">Address</dt>
            <dd className="text-muted">{school.location}</dd>
          </div>
          <div>
            <dt className="font-medium text-text">Email</dt>
            <dd className="text-muted">info@kiwalan-nhs.edu.ph</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
