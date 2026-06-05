import Card from '../components/ui/Card'
import { school } from '../styles/design-tokens'
import { mission, vision, coreValues, facultyList } from '../data/schoolContent'

export default function About() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-text">About KNHS</h1>
        <p className="mt-4 text-lg text-muted">{school.location}</p>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-gray-600">
          Kiwalan National High School is a public secondary school committed to quality
          basic education aligned with the Department of Education K-12 curriculum.
          We support learners, teachers, and staff with modern tools for teaching, learning,
          and school administration.
        </p>
      </div>

      {/* Mission Section */}
      <div className="mb-8">
        <Card title="Our Mission" subtitle="Committed to quality, accessible, and inclusive education">
          <p className="text-sm leading-relaxed text-gray-600">{mission}</p>
        </Card>
      </div>

      {/* Vision Section */}
      <div className="mb-8">
        <Card title="Our Vision" subtitle="Toward educational excellence in Iligan City and Lanao del Norte">
          <p className="text-sm leading-relaxed text-gray-600">{vision}</p>
        </Card>
      </div>

      {/* Core Values Section */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-text">Core Values</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coreValues.map((value) => (
            <div
              key={value.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-knhs-purple/10">
                <span className="text-xl font-bold text-knhs-purple">
                  {value.name.charAt(0)}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text">{value.name}</h3>
              <p className="text-sm leading-relaxed text-muted">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Faculty & Staff Section */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-text">Our Leadership</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {facultyList.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-knhs-purple to-purple-600 text-2xl font-bold text-white">
                {member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <h3 className="mb-1 text-base font-semibold text-text">{member.name}</h3>
              <p className="text-sm text-knhs-purple">{member.position}</p>
            </div>
          ))}
        </div>
      </div>

      {/* School History Section (Brief) */}
      <div className="mb-8">
        <Card title="Our History" subtitle="Serving the community for years">
          <p className="text-sm leading-relaxed text-gray-600">
            Kiwalan National High School has been a pillar of education in the Kiwalan community,
            serving generations of learners with dedication and excellence. As a public secondary
            school under the Department of Education Division of Iligan City, we continue to evolve
            and adapt to meet the changing needs of our learners while staying true to our mission
            of providing quality, accessible, and inclusive basic education.
          </p>
        </Card>
      </div>
    </div>
  )
}
