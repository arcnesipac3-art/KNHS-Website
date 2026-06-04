import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { notificationApi } from '../lib/learningApi'

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // all, unread
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadNotifications()
  }, [filter])

  async function loadNotifications() {
    setLoading(true)
    setError(null)

    try {
      const params = filter === 'unread' ? { is_read: false } : {}
      const { data } = await notificationApi.getAll(params)
      setNotifications(data)
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError('Failed to load notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAsRead(notificationId) {
    try {
      await notificationApi.markRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      alert('Failed to mark all as read')
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Notifications</h1>
            <p className="mt-2 text-muted">Stay updated with important alerts and messages</p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead}>Mark All Read</Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-knhs-purple text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Notifications
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-knhs-purple text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
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

        {/* Notifications List */}
        <Card>
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
                <p className="mt-4 text-muted">Loading notifications...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-text">
                {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {filter === 'unread'
                  ? "You're all caught up! All notifications have been read."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </PortalLayout>
  )
}

// ============================================================================
// NOTIFICATION CARD COMPONENT
// ============================================================================

function NotificationCard({ notification, onMarkRead }) {
  const typeIcons = {
    assignment: '📝',
    grade: '📊',
    announcement: '📢',
    attendance: '✅',
    material: '📚',
    submission: '📤',
    info: 'ℹ️',
  }

  const typeColors = {
    assignment: 'bg-blue-100 text-blue-800',
    grade: 'bg-green-100 text-green-800',
    announcement: 'bg-purple-100 text-purple-800',
    attendance: 'bg-amber-100 text-amber-800',
    material: 'bg-teal-100 text-teal-800',
    submission: 'bg-indigo-100 text-indigo-800',
    info: 'bg-gray-100 text-gray-800',
  }

  const typeLabels = {
    assignment: 'Assignment',
    grade: 'Grade',
    announcement: 'Announcement',
    attendance: 'Attendance',
    material: 'Material',
    submission: 'Submission',
    info: 'Info',
  }

  const icon = typeIcons[notification.type] || typeIcons.info
  const colorClass = typeColors[notification.type] || typeColors.info
  const label = typeLabels[notification.type] || 'Notification'

  const CardWrapper = notification.link ? Link : 'div'
  const wrapperProps = notification.link
    ? { to: notification.link }
    : {}

  return (
    <CardWrapper
      {...wrapperProps}
      className={`block rounded-lg border p-4 transition-all hover:shadow-md ${
        !notification.is_read ? 'border-l-4 border-l-knhs-purple bg-purple-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-2xl ${colorClass}`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
              {label}
            </span>
            {!notification.is_read && (
              <span className="flex h-2 w-2 rounded-full bg-knhs-purple"></span>
            )}
          </div>
          <h3 className={`mt-2 text-base ${!notification.is_read ? 'font-bold text-text' : 'font-semibold text-text'}`}>
            {notification.title}
          </h3>
          {notification.body && (
            <p className="mt-1 text-sm text-muted">{notification.body}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted">
            <span>{formatDateTime(notification.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!notification.is_read && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onMarkRead(notification.id)
              }}
              className="rounded-lg bg-knhs-purple px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
              title="Mark as read"
            >
              Mark Read
            </button>
          )}
        </div>
      </div>
    </CardWrapper>
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
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
