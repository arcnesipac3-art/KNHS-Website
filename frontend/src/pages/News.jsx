import { newsItems, upcomingEvents } from '../data/schoolContent'

export default function News() {
  const categoryColors = {
    Achievement: 'bg-gold/10 text-gold border-gold/20',
    Announcement: 'bg-knhs-purple/10 text-knhs-purple border-knhs-purple/20',
    'School Event': 'bg-depedBlue/10 text-depedBlue border-depedBlue/20',
    Academic: 'bg-purple-100 text-purple-700 border-purple-200',
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-text">News & Events</h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-muted">
          Stay updated with KNHS activities, achievements, and announcements
        </p>
      </div>

      {/* Latest News Section */}
      <div className="mb-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text">Latest News</h2>
          <div className="text-sm text-muted">
            {newsItems.length} {newsItems.length === 1 ? 'article' : 'articles'}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {newsItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${
                    categoryColors[item.category] || 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {item.category}
                </span>
                <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
              </div>

              <h3 className="mb-3 text-lg font-semibold leading-snug text-text">{item.title}</h3>

              <p className="flex-grow text-sm leading-relaxed text-muted">{item.excerpt}</p>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="text-sm font-medium text-knhs-purple hover:text-knhs-purple-light">
                  Read more →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="mb-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text">Upcoming Events</h2>
          <div className="text-sm text-muted">
            {upcomingEvents.length} {upcomingEvents.length === 1 ? 'event' : 'events'} scheduled
          </div>
        </div>

        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:flex-row"
            >
              {/* Date Box */}
              <div className="flex shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-knhs-purple to-purple-600 p-4 text-white md:w-24">
                <div className="text-2xl font-bold">
                  {new Date(event.date).getDate()}
                </div>
                <div className="text-xs font-medium uppercase">
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                </div>
                <div className="text-sm">
                  {new Date(event.date).getFullYear()}
                </div>
              </div>

              {/* Event Details */}
              <div className="flex-grow">
                <h3 className="mb-2 text-lg font-semibold text-text">{event.title}</h3>
                <div className="mb-3 flex items-center gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {event.location}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stay Connected CTA */}
      <div className="mt-12 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 p-8 text-center">
        <h3 className="mb-4 text-xl font-bold text-text">Stay Connected</h3>
        <p className="mx-auto mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          For the latest announcements and real-time updates, log in to the KNHS Digital Campus Portal.
          Current students and staff can access personalized news and event notifications.
        </p>
        <a
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-knhs-purple px-6 py-3 font-medium text-white transition-colors hover:bg-knhs-purple-light"
        >
          Access Portal
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  )
}
