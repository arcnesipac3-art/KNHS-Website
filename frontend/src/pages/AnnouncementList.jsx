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
      
      const results = Array.isArray(data) ? data : (data?.results ?? [])
      setAnnouncements(results)
    } catch (err) {
      console.error('Failed to load announcements:', err)
      setError('Failed to load announcements. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLike(id, isLiked) {
    try {
      if (isLiked) {
        await announcementApi.unlike(id)
      } else {
        await announcementApi.like(id)
      }
      // Optimistic update or refresh
      setAnnouncements(prev => prev.map(a => {
        if (a.id === id) {
          return {
            ...a,
            is_liked: !isLiked,
            likes_count: isLiked ? a.likes_count - 1 : a.likes_count + 1
          }
        }
        return a
      }))
    } catch (err) {
      console.error('Failed to like/unlike:', err)
    }
  }

  async function handleComment(id, content) {
    try {
      const response = await announcementApi.comment(id, content)
      setAnnouncements(prev => prev.map(a => {
        if (a.id === id) {
          return {
            ...a,
            comments_count: a.comments_count + 1,
            comments: [...(a.comments || []), response.data]
          }
        }
        return a
      }))
    } catch (err) {
      console.error('Failed to comment:', err)
    }
  }

  async function handleMarkAsRead(announcementId) {
    try {
      await announcementApi.markRead(announcementId)
      setAnnouncements(prev => prev.map(a => 
        a.id === announcementId ? { ...a, is_read: true } : a
      ))
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
      alert('Failed to delete announcement.')
    }
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-4 border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div>
            <h1 className="text-2xl font-bold text-text">Feed</h1>
            <p className="text-sm text-muted">Latest from Kiwalan National High School</p>
          </div>
          <div className="flex gap-2">
            {canCreate && (
              <Link to="/announcements/create">
                <Button size="sm" className="rounded-full">
                  <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-4 text-sm font-bold transition-colors relative ${
              filter === 'all' ? 'text-text' : 'text-muted hover:bg-gray-50'
            }`}
          >
            For you
            {filter === 'all' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-knhs-purple" />}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-4 text-sm font-bold transition-colors relative ${
              filter === 'unread' ? 'text-text' : 'text-muted hover:bg-gray-50'
            }`}
          >
            Unread
            {filter === 'unread' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-knhs-purple" />}
          </button>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="flex py-20 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="text-5xl">📢</div>
            <h3 className="text-xl font-bold text-text">No posts yet</h3>
            <p className="text-muted">Check back later for school updates.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 -mx-4 sm:mx-0 border-x border-gray-200">
            {announcements.map((announcement) => (
              <AnnouncementFeedItem
                key={announcement.id}
                announcement={announcement}
                onLike={handleLike}
                onComment={handleComment}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                canDelete={canCreate && (announcement.author === user?.id || user?.role === 'admin')}
              />
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  )
}

function AnnouncementFeedItem({ announcement, onLike, onComment, onMarkAsRead, onDelete, canDelete }) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')

  const priorityColors = {
    normal: 'text-blue-500',
    urgent: 'text-red-500',
    important: 'text-amber-500',
  }

  const audienceLabels = {
    school: 'School',
    grade: `Grade ${announcement.audience_ref_name || ''}`,
    strand: announcement.audience_ref_name || 'Strand',
    classroom: announcement.audience_ref_name || 'Class',
    role: announcement.audience_ref_name || 'Role',
  }

  const isUnread = announcement.is_read === false

  const handleSubmitComment = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    onComment(announcement.id, commentText)
    setCommentText('')
  }

  return (
    <div className={`p-4 transition-colors hover:bg-gray-50/50 ${isUnread ? 'bg-purple-50/30' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {announcement.author_avatar ? (
            <img src={announcement.author_avatar} alt="" className="h-10 w-10 rounded-full object-cover border border-gray-100" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-knhs-purple flex items-center justify-center text-white font-bold">
              {announcement.author_name?.charAt(0) || 'U'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex flex-wrap items-center gap-1.5 text-[15px]">
              <span className="font-bold text-text hover:underline cursor-pointer">{announcement.author_name}</span>
              <span className="text-muted">@{announcement.author_name?.toLowerCase().replace(/\s/g, '')}</span>
              <span className="text-muted">·</span>
              <span className="text-muted text-sm">{formatDateTime(announcement.published_at || announcement.created_at)}</span>
              {announcement.priority !== 'normal' && (
                <>
                  <span className="text-muted">·</span>
                  <span className={`font-medium text-xs ${priorityColors[announcement.priority]}`}>
                    {announcement.priority.toUpperCase()}
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isUnread && (
                <button 
                  onClick={() => onMarkAsRead(announcement.id)}
                  className="w-2 h-2 rounded-full bg-knhs-purple" 
                  title="New"
                />
              )}
              {canDelete && (
                <button onClick={() => onDelete(announcement.id)} className="text-muted hover:text-red-500 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="mt-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {audienceLabels[announcement.audience_type]}
            </span>
          </div>

          <h3 className="mt-2 text-base font-bold text-text">{announcement.title}</h3>
          <p className="mt-1 text-[15px] text-text whitespace-pre-wrap leading-normal">{announcement.body}</p>

          {/* Attachments */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="mt-3 grid gap-2 grid-cols-1 sm:grid-cols-2">
              {announcement.attachments.map((attachment, index) => {
                const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(attachment.file_url)
                return (
                  <a
                    key={index}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50"
                  >
                    {isImage ? (
                      <img src={attachment.file_url} alt="" className="w-full h-40 object-cover group-hover:opacity-90 transition-opacity" />
                    ) : (
                      <div className="flex items-center gap-3 p-3 h-20">
                        <div className="h-10 w-10 flex-shrink-0 rounded bg-purple-100 flex items-center justify-center text-knhs-purple">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text truncate">{attachment.filename}</p>
                          <p className="text-xs text-muted">File</p>
                        </div>
                      </div>
                    )}
                  </a>
                )
              })}
            </div>
          )}

          {/* Interactions */}
          <div className="mt-4 flex items-center justify-between max-w-md -ml-2">
            <button 
              onClick={() => setShowComments(!showComments)}
              className="group flex items-center gap-2 text-muted hover:text-blue-500 transition-colors p-2"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-sm">{announcement.comments_count || 0}</span>
            </button>

            <button 
              onClick={() => onLike(announcement.id, announcement.is_liked)}
              className={`group flex items-center gap-2 transition-colors p-2 ${announcement.is_liked ? 'text-pink-600' : 'text-muted hover:text-pink-600'}`}
            >
              <div className={`p-2 rounded-full ${announcement.is_liked ? 'bg-pink-50' : 'group-hover:bg-pink-50'}`}>
                <svg className={`h-5 w-5 ${announcement.is_liked ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-sm">{announcement.likes_count || 0}</span>
            </button>

            <button className="group flex items-center gap-2 text-muted hover:text-green-500 transition-colors p-2">
              <div className="p-2 rounded-full group-hover:bg-green-50">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                  ME
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Post your reply"
                    className="w-full bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-knhs-purple outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!commentText.trim()}
                  className="text-knhs-purple font-bold text-sm disabled:opacity-50 px-2"
                >
                  Reply
                </button>
              </form>

              <div className="space-y-4">
                {announcement.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      {comment.author_avatar ? (
                        <img src={comment.author_avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                          {comment.author_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-text">{comment.author_name}</span>
                        <span className="text-muted text-xs">{formatDateTime(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-text leading-tight">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatDateTime(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffSecs < 60) return `${diffSecs}s`
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
