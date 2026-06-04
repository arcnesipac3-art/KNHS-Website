import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { school } from '../styles/design-tokens'

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center md:py-24">
          <p className="text-sm font-semibold uppercase tracking-wider text-knhs-purple">
            {school.tagline}
          </p>
          <h1 className="mt-3 text-4xl font-bold text-text md:text-5xl">{school.name}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">{school.location}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login">
              <Button>Enter Portal</Button>
            </Link>
            <Link to="/about">
              <Button variant="secondary">Learn More</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card title="Academic Excellence" subtitle="DepEd-aligned K–12 programs for Grades 7–12.">
            <p className="text-sm text-muted">
              Junior and Senior High School tracks designed to prepare learners for higher education and employment.
            </p>
          </Card>
          <Card title="Digital Learning" subtitle="Official school portal for classes and records.">
            <p className="text-sm text-muted">
              Assignments, grades, materials, and announcements in one secure platform.
            </p>
          </Card>
          <Card title="Community" subtitle="Serving Kiwalan and Iligan City.">
            <p className="text-sm text-muted">
              Building responsible, competent, and values-driven graduates for the nation.
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}
