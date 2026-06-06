import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { announcementApi } from '../lib/learningApi'

export default function AnnouncementList() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, unread

  const canCreate = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'principal'

  useEffect(() => {
    loadAnnouncements()
  }, [filter])

  async function loadAnnouncements() {
    setLoading(true)
    setError(null)

    try {
      let data
      if (filter === 'unread') {
        const response = await announcementApi.getUnread()
        data = response.data
      } else {
        const response = await announcementApi.getAll({ exclude_expired: true })
        data = response.data
      }
      
      // Handle both array and paginated responses
      const announcements = Array.isArray(data) ? data : (data?.results ?? [])
      
      setAnnouncements(announcements)
    } catch (err) {
      console.error('Failed to load announcements:', err)
      setError('Failed to load announcements. Please try again.')
      setAnnouncements([]) // Reset to empty array on error
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAsRead(announcementId) {
    try {
      await announcementApi.markRead(announcementId)
      // Refresh announcements
      loadAnnouncements()
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  async function handleDelete(announcementId) {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return
    }

    try {
      await announcementApi.delete(announcementId)
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId))
    } catch (err) {
      console.error('Failed to delete announcement:', err)
      alert('Failed to delete announcement. You may not have permission.')
    }
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Announcements</h1>
            <p className="mt-2 text-muted">School and class announcements</p>
          </div>
          {canCreate && (
            <Link to="/announcements/create">
              <Button>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Announcement
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-knhs-purple text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Announcements
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-knhs-purple text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread Only
            </button>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="border-l-4 border-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 font-medium text-red-900">{error}</p>
            </div>
          </Card>
        )}

        {/* Announcements List */}
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
              <p className="mt-4 text-muted">Loading announcements...</p>
            </div>
          </div>
        ) : announcements.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-text">No Announcements</h3>
              <p className="mt-2 text-sm text-muted">
                {filter === 'unread' ? 'You have no unread announcements.' : 'There are no announcements yet.'}
              </p>
              {canCreate && filter === 'all' && (
                <div className="mt-6">
                  <Link to="/announcements/create">
                    <Button>Create First Announcement</Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                canDelete={canCreate && announcement.author_id === user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  )
}

// ============================================================================
// ANNOUNCEMENT CARD COMPONENT
// ============================================================================

function AnnouncementCard({ announcement, onMarkAsRead, onDelete, canDelete }) {
  const [expanded, setExpanded] = useState(false)

  const priorityColors = {
    normal: 'bg-blue-100 text-blue-800',
    urgent: 'bg-red-100 text-red-800',
    important: 'bg-amber-100 text-amber-800',
  }

  const audienceLabels = {
    school: 'School-wide',
    grade: `Grade ${announcement.audience_ref_name || ''}`,
    strand: announcement.audience_ref_name || 'Strand',
    class: announcement.audience_ref_name || 'Class',
    role: announcement.audience_ref_name || 'Role',
  }

  const isUnread = announcement.is_read === false

  return (
    <Card className={`transition-all ${isUnread ? 'border-l-4 border-l-knhs-purple bg-purple-50' : ''}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-text">{announcement.title}</h3>
              {isUnread && (
                <span className="rounded-full bg-knhs-purple px-2 py-0.5 text-xs font-medium text-white">
                  New
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>By {announcement.author_name || 'Unknown'}</span>
              <span>•</span>
              <span>{formatDateTime(announcement.published_at || announcement.created_at)}</span>
              <span>•</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[announcement.priority] || priorityColors.normal}`}>
                {announcement.priority === 'urgent' ? '🔴 Urgent' : announcement.priority === 'important' ? '⚠️ Important' : 'ℹ️ Normal'}
              </span>
              <span>•</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {audienceLabels[announcement.audience_type] || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isUnread && (
              <button
                onClick={() => onMarkAsRead(announcement.id)}
                className="rounded-lg bg-knhs-purple px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
                title="Mark as read"
              >
                Mark Read
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(announcement.id)}
                className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
                title="Delete announcement"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="prose prose-sm max-w-none">
          {expanded || announcement.body.length < 300 ? (
            <p className="text-text whitespace-pre-wrap">{announcement.body}</p>
          ) : (
            <>
              <p className="text-text whitespace-pre-wrap">{announcement.body.slice(0, 300)}...</p>
              <button
                onClick={() => setExpanded(true)}
                className="mt-2 text-sm font-medium text-knhs-purple hover:underline"
              >
                Read more
              </button>
            </>
          )}
          {expanded && announcement.body.length >= 300 && (
            <button
              onClick={() => setExpanded(false)}
              className="mt-2 text-sm font-medium text-knhs-purple hover:underline"
            >
              Show less
            </button>
          )}
        </div>

        {/* Attachments */}
        {announcement.attachments && announcement.attachments.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <p className="mb-2 text-sm font-medium text-text">Attachments:</p>
            <div className="space-y-2">
              {announcement.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-sm font-medium text-knhs-purple">{attachment.filename || `Attachment ${index + 1}`}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDateTime(dateString) {
  if (!dateString) return 'Unknown date'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
