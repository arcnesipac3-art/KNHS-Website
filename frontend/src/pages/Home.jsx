import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { school } from '../styles/design-tokens'

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center md:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-knhs-purple/10 px-4 py-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-knhs-purple">
              {school.tagline}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-text md:text-6xl">{school.name}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted md:text-xl">
            Quality DepEd K-12 education in {school.location}
          </p>
          <p className="mx-auto mt-2 max-w-3xl text-base text-muted">
            Empowering learners through excellence, integrity, and innovation since our founding.
            A center of quality basic education aligned with the MATATAG curriculum.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg">Enter Portal</Button>
            </Link>
            <Link to="/enrollment/apply">
              <Button variant="secondary" size="lg">Apply for Enrollment</Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" size="lg">Learn More</Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-3xl font-bold text-knhs-purple">Grades 7-12</div>
              <div className="mt-2 text-sm font-medium text-muted">Complete K-12 Programs</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-3xl font-bold text-knhs-purple">4 SHS Strands</div>
              <div className="mt-2 text-sm font-medium text-muted">STEM, ABM, HUMSS, GAS</div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-3xl font-bold text-knhs-purple">100% Digital</div>
              <div className="mt-2 text-sm font-medium text-muted">Modern Learning Portal</div>
            </div>
          </div>
        </div>
      </section>

      {/* School Highlights Section */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-text md:text-4xl">Why Choose KNHS?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            We provide quality education that develops responsible, competent, and values-driven learners
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card title="Academic Excellence" subtitle="DepEd-aligned K-12 MATATAG curriculum">
            <p className="text-sm text-muted">
              Comprehensive Junior and Senior High School programs designed to prepare learners for higher education, employment, and lifelong learning.
            </p>
          </Card>
          <Card title="Digital Learning" subtitle="Modern online portal for all students">
            <p className="text-sm text-muted">
              Access assignments, submit work, view grades, download materials, and receive announcements through our secure digital campus platform.
            </p>
          </Card>
          <Card title="Values Formation" subtitle="Character development at the core">
            <p className="text-sm text-muted">
              Building responsible citizens through excellence, integrity, compassion, innovation, nationalism, and collaboration.
            </p>
          </Card>
          <Card title="Community Focus" subtitle="Serving Iligan City and beyond">
            <p className="text-sm text-muted">
              Strong partnerships with parents, alumni, and local stakeholders to support every learner's success.
            </p>
          </Card>
        </div>
      </section>

      {/* Enrollment CTA Section */}
      <section className="bg-gradient-to-br from-knhs-purple to-purple-700">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">Enrollment Now Open</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-purple-100">
            School Year 2026-2027 enrollment is now accepting applications for incoming Grade 7 and Grade 11 students.
            Apply online and track your application status in real-time.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/enrollment/apply">
              <Button size="lg" className="bg-white text-knhs-purple hover:bg-gray-100">
                Apply Now
              </Button>
            </Link>
            <Link to="/enrollment/track">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Track Application
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-purple-200">
            Questions about enrollment? Visit our Contact page or call the Registrar's Office.
          </p>
        </div>
      </section>
    </div>
  )
}
