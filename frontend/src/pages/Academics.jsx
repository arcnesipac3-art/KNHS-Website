import Card from '../components/ui/Card'
import { jhsProgram, shsStrands, curriculumOverview } from '../data/schoolContent'

export default function Academics() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-text">Academic Programs</h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-muted">
          Quality DepEd K-12 education preparing learners for higher education, employment, and lifelong learning
        </p>
      </div>

      {/* Junior High School Section */}
      <div className="mb-12">
        <Card title={jhsProgram.title} subtitle="Building a strong academic foundation">
          <p className="mb-6 text-sm leading-relaxed text-gray-600">{jhsProgram.description}</p>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-text">Program Highlights:</h4>
            <ul className="space-y-2">
              {jhsProgram.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-knhs-purple/10 text-xs font-bold text-knhs-purple">
                    ✓
                  </span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Senior High School Section */}
      <div className="mb-8">
        <h2 className="mb-6 text-2xl font-bold text-text">Senior High School (Grades 11-12)</h2>
        <p className="mb-8 text-base leading-relaxed text-muted">
          Our Senior High School program offers specialized tracks and strands designed to align with learners'
          interests, aptitudes, and career goals. Each strand provides focused academic preparation while
          maintaining core subject requirements.
        </p>

        {/* Academic Track Strands */}
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="inline-flex rounded-lg bg-knhs-purple px-3 py-1 text-sm font-semibold text-white">
              Academic Track
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {shsStrands
              .filter((strand) => strand.track === 'Academic')
              .map((strand) => (
                <div
                  key={strand.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="mb-1 inline-flex rounded-md bg-purple-50 px-2 py-1 text-xs font-bold text-knhs-purple">
                        {strand.code}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-text">{strand.name}</h3>
                    </div>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-muted">{strand.description}</p>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-700">Sample Specialized Subjects:</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600">{strand.subjects}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Curriculum Overview Section */}
      <div className="mb-8">
        <Card title={curriculumOverview.title} subtitle="MATATAG-enhanced K-12 framework">
          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            {curriculumOverview.description}
          </p>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-text">Curriculum Structure:</h4>
            <ul className="space-y-2">
              {curriculumOverview.structure.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-depedBlue/10 text-xs font-bold text-depedBlue">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Learning Modalities */}
      <div className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 p-8 text-center">
        <h3 className="mb-4 text-xl font-bold text-text">Learning Delivery</h3>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted">
          KNHS implements face-to-face instruction complemented by our digital learning portal,
          providing learners with access to assignments, materials, and resources anytime, anywhere.
          This blended approach enhances engagement and supports diverse learning needs.
        </p>
      </div>
    </div>
  )
}
