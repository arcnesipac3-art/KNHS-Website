import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { notificationApi } from '../../lib/learningApi'

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)

  // Load unread count on mount
  useEffect(() => {
    loadUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  async function loadUnreadCount() {
    try {
      const { data } = await notificationApi.getUnreadCount()
      setUnreadCount(data.count || 0)
    } catch (err) {
      console.error('Failed to load unread count:', err)
    }
  }

  async function loadNotifications() {
    setLoading(true)
    try {
      const { data } = await notificationApi.getAll()
      setNotifications(data.slice(0, 10)) // Show last 10
    } catch (err) {
      console.error('Failed to load notifications:', err)
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
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        title="Notifications"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-lg font-semibold text-text">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm font-medium text-knhs-purple hover:text-purple-800"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="mt-2 text-sm text-muted">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkAsRead}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-3 text-center">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-knhs-purple hover:text-purple-800"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// NOTIFICATION ITEM COMPONENT
// ============================================================================

function NotificationItem({ notification, onMarkRead, onClose }) {
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

  const icon = typeIcons[notification.type] || typeIcons.info
  const colorClass = typeColors[notification.type] || typeColors.info

  function handleClick() {
    if (!notification.is_read) {
      onMarkRead(notification.id)
    }
    if (notification.link) {
      onClose()
    }
  }

  const NotificationWrapper = notification.link ? Link : 'div'
  const wrapperProps = notification.link
    ? { to: notification.link, onClick: handleClick }
    : { onClick: handleClick }

  return (
    <NotificationWrapper
      {...wrapperProps}
      className={`block px-4 py-3 transition-colors hover:bg-gray-50 ${
        !notification.is_read ? 'bg-purple-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm ${colorClass}`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.is_read ? 'font-semibold text-text' : 'font-medium text-text'}`}>
            {notification.title}
          </p>
          {notification.body && (
            <p className="mt-1 text-sm text-muted line-clamp-2">{notification.body}</p>
          )}
          <p className="mt-1 text-xs text-muted">{formatTime(notification.created_at)}</p>
        </div>

        {/* Unread Indicator */}
        {!notification.is_read && (
          <div className="flex-shrink-0">
            <div className="h-2 w-2 rounded-full bg-knhs-purple"></div>
          </div>
        )}
      </div>
    </NotificationWrapper>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatTime(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
