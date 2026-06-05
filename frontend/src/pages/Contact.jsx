import Card from '../components/ui/Card'
import { school } from '../styles/design-tokens'
import { contactInfo, officeHours } from '../data/schoolContent'

export default function Contact() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-text">Contact Us</h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-muted">
          Get in touch with Kiwalan National High School
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contact Information Card */}
        <Card title="Contact Information" subtitle="Reach out to us anytime">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-text">School</dt>
              <dd className="mt-1 text-muted">{school.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-text">Address</dt>
              <dd className="mt-1 text-muted">{contactInfo.address}</dd>
            </div>
            <div>
              <dt className="font-semibold text-text">Email</dt>
              <dd className="mt-1">
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-knhs-purple hover:underline"
                >
                  {contactInfo.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-text">Phone</dt>
              <dd className="mt-1 text-muted">{contactInfo.phone}</dd>
            </div>
            <div>
              <dt className="font-semibold text-text">Fax</dt>
              <dd className="mt-1 text-muted">{contactInfo.fax}</dd>
            </div>
          </dl>
        </Card>

        {/* Office Hours Card */}
        <Card title="Office Hours" subtitle="When you can visit us">
          <div className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-text">Regular Schedule</dt>
              <dd className="mt-2 text-muted">{officeHours.schedule}</dd>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-xs font-medium text-knhs-purple">Important Note</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {officeHours.note}
              </p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-muted">
                For immediate assistance regarding enrollment applications, please visit the
                Registrar's Office during office hours or contact us via email.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Directions Section */}
      <div className="mt-8">
        <Card title="How to Get Here" subtitle="Directions and landmarks">
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-3 text-muted">
                Kiwalan National High School is located in Kiwalan, Iligan City, Lanao del Norte.
                The school is accessible via public transportation and private vehicles.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-text">Nearby Landmarks:</h4>
              <ul className="space-y-2 text-muted">
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-knhs-purple/10 text-xs font-bold text-knhs-purple">
                    •
                  </span>
                  <span>Located in the Kiwalan barangay area</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-knhs-purple/10 text-xs font-bold text-knhs-purple">
                    •
                  </span>
                  <span>Accessible via main roads from Iligan City center</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-knhs-purple/10 text-xs font-bold text-knhs-purple">
                    •
                  </span>
                  <span>Public jeepneys and tricycles available</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Links Section */}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-knhs-purple/10">
            <svg className="h-6 w-6 text-knhs-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold text-text">Enrollment</h3>
          <p className="mb-4 text-sm text-muted">Apply for SY 2026-2027</p>
          <a
            href="/enrollment/apply"
            className="inline-flex text-sm font-medium text-knhs-purple hover:underline"
          >
            Apply Now →
          </a>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-knhs-purple/10">
            <svg className="h-6 w-6 text-knhs-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold text-text">About Us</h3>
          <p className="mb-4 text-sm text-muted">Mission, Vision, Faculty</p>
          <a
            href="/about"
            className="inline-flex text-sm font-medium text-knhs-purple hover:underline"
          >
            Learn More →
          </a>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-knhs-purple/10">
            <svg className="h-6 w-6 text-knhs-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold text-text">Academics</h3>
          <p className="mb-4 text-sm text-muted">Programs & Curriculum</p>
          <a
            href="/academics"
            className="inline-flex text-sm font-medium text-knhs-purple hover:underline"
          >
            View Programs →
          </a>
        </div>
      </div>
    </div>
  )
}
