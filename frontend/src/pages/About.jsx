import Card from '../components/ui/Card'
import { school } from '../styles/design-tokens'

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Card title="About KNHS" subtitle={school.location}>
        <div className="space-y-4 text-sm leading-relaxed text-gray-600">
          <p>
            Kiwalan National High School is a public secondary school committed to quality
            basic education aligned with the Department of Education K–12 curriculum.
          </p>
          <p>
            This digital campus portal supports learners, teachers, and staff with modern
            tools for teaching, learning, and school administration.
          </p>
        </div>
      </Card>
    </div>
  )
}
