import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { useLocation } from 'react-router-dom'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api, { getAccessToken, getWebSocketBaseUrl, ensureValidToken } from '../lib/api'

export default function Messages() {
  const { user } = useAuth()
  const location = useLocation()
  const [threads, setThreads] = useState([])
  const [selectedThread, setSelectedThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [searchUsers, setSearchUsers] = useState('')
  const [availableUsers, setAvailableUsers] = useState([])
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [subject, setSubject] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [friends, setFriends] = useState([])
  const [socketConnected, setSocketConnected] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const subscribedThreadRef = useRef(null)
  const selectedThreadRef = useRef(null)
  const debounceTimeoutRef = useRef(null)
  const messageCacheRef = useRef(new Map())
  const activeMessagesRequestRef = useRef(0)
  const activeUserSearchRef = useRef(0)

  useEffect(() => {
    loadThreads()
  }, [])

  useEffect(() => {
    // Handle navigation from Friends page with selectedThreadId
    if (location.state?.selectedThreadId && threads.length > 0) {
      const threadId = location.state.selectedThreadId
      const thread = threads.find(t => t.id === threadId)
      if (thread) {
        setSelectedThread(thread)
      }
    }
  }, [location.state?.selectedThreadId, threads])

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id)
      if (selectedThread.unread_count > 0) {
        markThreadRead(selectedThread.id)
      }
    }
  }, [selectedThread])

  useEffect(() => {
    selectedThreadRef.current = selectedThread
  }, [selectedThread])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (showNewConversation) {
      loadFriends()
    }
  }, [showNewConversation])

  useEffect(() => {
    // Debounce search input to reduce API calls
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchUsers)
    }, 300)
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [searchUsers])

  useEffect(() => {
    if (showNewConversation && debouncedSearch.length >= 2) {
      loadAvailableUsers()
    }
  }, [showNewConversation, debouncedSearch])

  useEffect(() => {
    let cancelled = false
    let reconnectAttempts = 0
    let heartbeatIntervalRef = null

    async function getValidToken() {
      return await ensureValidToken()
    }

    function connect() {
      getValidToken().then(token => {
        if (cancelled) return
        if (!token) {
          reconnectTimeoutRef.current = window.setTimeout(connect, 1000)
          return
        }

        const socket = new WebSocket(
          `${getWebSocketBaseUrl()}/ws/messages/?token=${encodeURIComponent(token)}`
        )
        socketRef.current = socket

      socket.onopen = () => {
        if (cancelled) return
        setSocketConnected(true)
        reconnectAttempts = 0

        if (heartbeatIntervalRef) {
          clearInterval(heartbeatIntervalRef)
        }
        heartbeatIntervalRef = setInterval(() => {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'ping' }))
          }
        }, 25000)

        if (selectedThreadRef.current?.id) {
          socket.send(
            JSON.stringify({
              type: 'thread.subscribe',
              thread_id: selectedThreadRef.current.id,
            })
          )
          subscribedThreadRef.current = selectedThreadRef.current.id
        }
      }

      socket.onmessage = (event) => {
        if (cancelled) return
        let payload
        try {
          payload = JSON.parse(event.data)
        } catch {
          return
        }

        if (payload.type === 'pong') {
          return
        }

        if (payload.type === 'message.created') {
          if (payload.thread_id === selectedThreadRef.current?.id) {
            const nextMessages = reconcileMessage(
              messageCacheRef.current.get(payload.thread_id) || [],
              payload.message,
              payload.client_id,
              user
            )
            messageCacheRef.current.set(payload.thread_id, nextMessages)
            setMessages(nextMessages)
            if (payload.message.sender !== user?.id && payload.message.sender_email !== user?.email) {
              markThreadRead(payload.thread_id, { silent: true })
            }
          }
          return
        }

        if (payload.type === 'thread.updated') {
          applyThreadUpdate(payload.thread)
        }

        if (payload.type === 'error') {
          console.error('WebSocket server error:', payload.message)
        }
      }

      socket.onerror = (error) => {
        if (cancelled) return
        console.error('WebSocket error:', error)
      }

      socket.onclose = (event) => {
        if (cancelled) return
        setSocketConnected(false)
        if (heartbeatIntervalRef) {
          clearInterval(heartbeatIntervalRef)
          heartbeatIntervalRef = null
        }
        console.log('WebSocket closed:', event.code, event.reason)

        const isAbnormal = event.code === 1006
        const isAuthFailure = event.code === 4401 || event.code === 4001
        const isPolicyViolation = event.code === 1008

        if (!cancelled) {
          if (isAuthFailure) {
            console.log('Auth failure, waiting for token refresh...')
            reconnectTimeoutRef.current = window.setTimeout(connect, 2000)
            return
          }

          reconnectAttempts += 1
          const backoff = Math.min(2000 * Math.pow(1.5, reconnectAttempts - 1), 30000)
          reconnectTimeoutRef.current = window.setTimeout(connect, backoff)
        }
      }
    })
  }

  const handleSessionExpired = () => {
      reconnectAttempts = 0
      if (!cancelled) {
        connect()
      }
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    connect()

    return () => {
      cancelled = true
      setSocketConnected(false)
      window.removeEventListener('auth:session-expired', handleSessionExpired)
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current)
      }
      if (heartbeatIntervalRef) {
        clearInterval(heartbeatIntervalRef)
      }
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, 'Component unmounting')
      }
      socketRef.current = null
    }
  }, [user?.id])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return

    if (subscribedThreadRef.current && subscribedThreadRef.current !== selectedThread?.id) {
      socket.send(
        JSON.stringify({
          type: 'thread.unsubscribe',
          thread_id: subscribedThreadRef.current,
        })
      )
      subscribedThreadRef.current = null
    }

    if (selectedThread?.id) {
      socket.send(JSON.stringify({ type: 'thread.subscribe', thread_id: selectedThread.id }))
      subscribedThreadRef.current = selectedThread.id
    }
  }, [selectedThread?.id])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const applyThreadUpdate = useCallback((thread) => {
    setThreads((prev) => sortThreads(upsertThread(prev, thread)))
    setSelectedThread((prev) => (prev?.id === thread.id ? thread : prev))
  }, [])

  const updateCachedMessages = useCallback((threadId, nextMessages) => {
    messageCacheRef.current.set(threadId, nextMessages)
    if (selectedThreadRef.current?.id === threadId) {
      setMessages(nextMessages)
    }
  }, [])

  const promoteThreadLocally = useCallback((threadId, message) => {
    const previewThread = {
      ...selectedThreadRef.current,
      id: threadId,
      updated_at: message.created_at,
      unread_count: 0,
      last_message: {
        id: message.id,
        thread: threadId,
        sender: message.sender,
        sender_name: message.sender_name,
        sender_email: message.sender_email,
        content: message.content,
        is_read: true,
        created_at: message.created_at,
      },
    }
    applyThreadUpdate(previewThread)
  }, [applyThreadUpdate])

  async function loadAvailableUsers() {
    const requestId = activeUserSearchRef.current + 1
    activeUserSearchRef.current = requestId
    setLoadingUsers(true)
    try {
      const response = await api.get('/users/', { params: { search: debouncedSearch } })
      if (requestId !== activeUserSearchRef.current) return
      const users = Array.isArray(response.data) ? response.data : (response.data?.results ?? [])
      // Filter out current user and already selected participants
      const filtered = users.filter(u => 
        u.id !== user?.id && !selectedParticipants.find(p => p.id === u.id)
      )
      setAvailableUsers(filtered)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  async function loadFriends() {
    try {
      const response = await api.get('/friendships/my_friends/')
      const friendsList = response.data || []
      // Filter out already selected participants
      const filtered = friendsList.filter(f => 
        !selectedParticipants.find(p => p.id === f.id)
      )
      setFriends(filtered)
    } catch (error) {
      console.error('Failed to load friends:', error)
      setFriends([])
    }
  }

  async function loadThreads() {
    try {
      const response = await api.get('/message-threads/')
      setThreads(sortThreads(response.data.results || response.data))
    } catch (error) {
      console.error('Failed to load message threads:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(threadId) {
    const cachedMessages = messageCacheRef.current.get(threadId)
    if (cachedMessages) {
      setMessages(cachedMessages)
      setMessagesLoading(false)
      return
    }

    const requestId = activeMessagesRequestRef.current + 1
    activeMessagesRequestRef.current = requestId
    setMessagesLoading(true)
    try {
      const response = await api.get(`/messages/?thread=${threadId}`)
      if (requestId !== activeMessagesRequestRef.current) return
      const nextMessages = dedupeMessages(response.data.results || response.data)
      messageCacheRef.current.set(threadId, nextMessages)
      setMessages(nextMessages)
    } catch (error) {
      console.error('Failed to load messages:', error)
      if (requestId === activeMessagesRequestRef.current) {
        setMessages([])
      }
    } finally {
      if (requestId === activeMessagesRequestRef.current) {
        setMessagesLoading(false)
      }
    }
  }

  async function markThreadRead(threadId, options = {}) {
    try {
      await api.post(`/message-threads/${threadId}/mark_read/`)
      setThreads((prev) =>
        prev.map((thread) => (thread.id === threadId ? { ...thread, unread_count: 0 } : thread))
      )
      setSelectedThread((prev) => (prev?.id === threadId ? { ...prev, unread_count: 0 } : prev))
    } catch (error) {
      if (!options.silent) {
        console.error('Failed to mark thread as read:', error)
      }
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedThread) return

    const content = newMessage.trim()
    const clientId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const optimisticMessage = {
      id: clientId,
      thread: selectedThread.id,
      sender: user?.id,
      sender_name: user?.display_name || user?.email || 'You',
      sender_email: user?.email,
      content,
      is_read: true,
      created_at: new Date().toISOString(),
      pending: true,
    }

    setNewMessage('')
    const optimisticMessages = reconcileMessage(
      messageCacheRef.current.get(selectedThread.id) || [],
      optimisticMessage,
      clientId,
      user
    )
    updateCachedMessages(selectedThread.id, optimisticMessages)
    promoteThreadLocally(selectedThread.id, optimisticMessage)

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'message.send',
          thread_id: selectedThread.id,
          content,
          client_id: clientId,
        })
      )
      return
    }

    setSending(true)
    try {
      const response = await api.post('/messages/', {
        thread: selectedThread.id,
        content,
      })
      const nextMessages = reconcileMessage(
        messageCacheRef.current.get(selectedThread.id) || [],
        response.data,
        clientId,
        user
      )
      updateCachedMessages(selectedThread.id, nextMessages)
      promoteThreadLocally(selectedThread.id, response.data)
      await markThreadRead(selectedThread.id, { silent: true })
    } catch (error) {
      console.error('Failed to send message:', error)
      const rolledBackMessages = removePendingMessage(
        messageCacheRef.current.get(selectedThread.id) || [],
        clientId
      )
      updateCachedMessages(selectedThread.id, rolledBackMessages)
      setNewMessage(content)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function handleDeleteConversation(threadId) {
    if (!window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return
    }
    try {
      await api.delete(`/message-threads/${threadId}/delete_conversation/`)
      messageCacheRef.current.delete(threadId)
      setThreads(prev => prev.filter(t => t.id !== threadId))
      if (selectedThread?.id === threadId) {
        setSelectedThread(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      alert('Failed to delete conversation. Please try again.')
    }
  }

  async function handleStartConversation(e) {
    e.preventDefault()
    if (selectedParticipants.length === 0) {
      alert('Please select at least one participant')
      return
    }
    if (!initialMessage.trim()) {
      alert('Please enter a message')
      return
    }

    try {
      const response = await api.post('/message-threads/start_conversation/', {
        participant_ids: selectedParticipants.map(p => p.id),
        subject: subject || undefined,
        initial_message: initialMessage,
      })
      const thread = response.data
      setShowNewConversation(false)
      setSelectedParticipants([])
      setSubject('')
      setInitialMessage('')
      setSearchUsers('')
      setAvailableUsers([])
      messageCacheRef.current.delete(thread.id)
      applyThreadUpdate(thread)
      setSelectedThread(thread)
    } catch (error) {
      console.error('Failed to start conversation:', error)
      alert('Failed to start conversation. Please try again.')
    }
  }

  const handleAddParticipant = useCallback((user) => {
    setSelectedParticipants(prev => [...prev, user])
    setAvailableUsers(prev => prev.filter(u => u.id !== user.id))
    setSearchUsers('')
  }, [])

  const handleRemoveParticipant = useCallback((userId) => {
    setSelectedParticipants(prev => prev.filter(p => p.id !== userId))
  }, [])

  const getAvatar = useCallback((name) => {
    return name ? name.charAt(0).toUpperCase() : '?'
  }, [])

  const getAvatarColor = useCallback((name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-red-500'
    ]
    const index = name ? name.charCodeAt(0) % colors.length : 0
    return colors[index]
  }, [])

  const formatTime = useCallback((dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }, [])

  const formatMessageTime = useCallback((dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }, [])

  const selectedThreadTitle = useMemo(() => {
    if (!selectedThread) return ''
    const otherParticipants = selectedThread.participants_detail.filter((p) => !p.is_current_user)
    return selectedThread.subject || otherParticipants.map((p) => p.name).join(', ')
  }, [selectedThread])

  const socketStatusLabel = socketConnected
    ? 'Live sync is on'
    : 'Live sync unavailable. Messaging still works.'

  return (
    <PortalLayout>
      <div className="h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-text">Messages</h1>
            <p className="text-sm text-muted">Direct messaging with teachers and students</p>
            <p className={`mt-1 text-xs ${socketConnected ? 'text-green-600' : 'text-amber-600'}`}>
              {socketStatusLabel}
            </p>
          </div>
          <Button onClick={() => setShowNewConversation(true)}>
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Message
          </Button>
        </div>

        {showNewConversation && (
          <Card className="mb-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">New Message</h2>
              <button
                onClick={() => {
                  setShowNewConversation(false)
                  setSelectedParticipants([])
                  setSubject('')
                  setInitialMessage('')
                  setSearchUsers('')
                  setAvailableUsers([])
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleStartConversation} className="space-y-4">
              {/* Participant Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text">
                  To: {selectedParticipants.length > 0 && `${selectedParticipants.length} selected`}
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedParticipants.map(participant => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm"
                    >
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColor(participant.display_name || participant.email)}`}>
                        {getAvatar(participant.display_name || participant.email)}
                      </div>
                      <span className="text-text">{participant.display_name || participant.email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Friend Suggestions */}
                {!searchUsers && friends.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-2 text-xs font-medium text-muted">Suggested Friends</p>
                    <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                      {friends.slice(0, 5).map(friend => (
                        <div
                          key={friend.id}
                          onClick={() => handleAddParticipant(friend)}
                          className="flex cursor-pointer items-center gap-3 p-2 hover:bg-gray-50"
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColor(friend.display_name || friend.email)}`}>
                            {getAvatar(friend.display_name || friend.email)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text">{friend.display_name || friend.email}</p>
                            <p className="text-xs text-muted">{friend.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    value={searchUsers}
                    onChange={e => setSearchUsers(e.target.value)}
                    placeholder="Search for people..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {loadingUsers && (
                  <p className="mt-2 text-xs text-muted">Searching people...</p>
                )}
                {searchUsers.length >= 2 && availableUsers.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                    {availableUsers.map(user => (
                      <div
                        key={user.id}
                        onClick={() => handleAddParticipant(user)}
                        className="flex cursor-pointer items-center gap-3 p-3 hover:bg-gray-50"
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(user.display_name || user.email)}`}>
                          {getAvatar(user.display_name || user.email)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text">{user.display_name || user.email}</p>
                          <p className="text-xs text-muted">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Subject (optional)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Conversation subject"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Message</label>
                <textarea
                  value={initialMessage}
                  onChange={e => setInitialMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Type your message..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => {
                    setShowNewConversation(false)
                    setSelectedParticipants([])
                    setSubject('')
                    setInitialMessage('')
                    setSearchUsers('')
                    setAvailableUsers([])
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={selectedParticipants.length === 0 || !initialMessage.trim()}>
                  Send Message
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Main Chat Layout */}
        <div className="flex h-[calc(100%-8rem)] gap-4">
          {/* Conversation List */}
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white lg:w-80">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-text">Conversations</h2>
            </div>
            <div className="overflow-y-auto">
              {loading ? (
                <div className="p-4 text-sm text-muted">
                  Loading conversations...
                </div>
              ) : threads.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="mt-4 text-sm text-muted">No conversations yet</p>
                  <p className="mt-1 text-xs text-muted">Click "New Message" to start a conversation</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {threads.map(thread => {
                    const otherParticipants = thread.participants_detail.filter(p => !p.is_current_user)
                    const displayName = otherParticipants.map(p => p.name).join(', ') || 'Unknown'
                    const lastMessage = thread.last_message
                    return (
                      <div
                        key={thread.id}
                        className={`group relative cursor-pointer p-4 transition-colors hover:bg-gray-50 ${
                          selectedThread?.id === thread.id ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div
                          onClick={() => setSelectedThread(thread)}
                          className="flex items-start gap-3"
                        >
                          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${getAvatarColor(displayName)}`}>
                            {getAvatar(displayName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="truncate text-sm font-semibold text-text">{displayName}</p>
                              {lastMessage && (
                                <span className="ml-2 text-xs text-muted">{formatTime(lastMessage.created_at)}</span>
                              )}
                            </div>
                            {thread.subject && (
                              <p className="mt-1 truncate text-xs font-medium text-knhs-purple">{thread.subject}</p>
                            )}
                            {lastMessage && (
                              <p className="mt-1 truncate text-xs text-muted">
                                {lastMessage.sender === user?.id || lastMessage.sender_email === user?.email ? 'You: ' : ''}
                                {lastMessage.content}
                              </p>
                            )}
                          </div>
                          {thread.unread_count > 0 && (
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-knhs-purple text-xs text-white">
                              {thread.unread_count}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteConversation(thread.id)
                          }}
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                          title="Delete conversation"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {selectedThread ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(selectedThread.participants_detail.filter(p => !p.is_current_user).map(p => p.name).join(', '))}`}>
                      {getAvatar(selectedThread.participants_detail.filter(p => !p.is_current_user).map(p => p.name).join(', '))}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-text">
                        {selectedThreadTitle}
                      </h2>
                      <p className="text-xs text-muted">
                        {selectedThread.participants_detail.filter(p => !p.is_current_user).map(p => p.name).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex h-[calc(100%-140px)] flex-col overflow-y-auto p-4">
                  {messagesLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-muted">Loading conversation...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map(message => {
                        const isOwn = message.sender === user?.id || message.sender_email === user?.email
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex max-w-[70%] gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColor(message.sender_name)}`}>
                                {getAvatar(message.sender_name)}
                              </div>
                              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                <div
                                  className={`rounded-2xl px-4 py-2 ${
                                    isOwn
                                      ? 'bg-knhs-purple text-white'
                                      : 'bg-gray-100 text-text'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                                  <span>{formatMessageTime(message.created_at)}</span>
                                  {message.pending && <span>Sending...</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple/20"
                    />
                    <Button 
                      type="submit" 
                      disabled={sending || !newMessage.trim()}
                      className="rounded-full"
                    >
                      <svg className="h-5 w-5 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15-2-15-2z" />
                      </svg>
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="mt-4 text-lg font-medium text-text">Select a conversation</p>
                  <p className="mt-2 text-sm text-muted">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}

function dedupeMessages(items) {
  const seen = new Set()
  return (items || []).filter((item) => {
    if (!item?.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function upsertMessage(messages, message) {
  const next = dedupeMessages([...(messages || []), message])
  return next.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

function reconcileMessage(messages, message, clientId, currentUser) {
  const next = [...(messages || [])]
  const optimisticIndex = next.findIndex((item) =>
    item.id === clientId ||
    (
      item.pending &&
      item.sender === currentUser?.id &&
      item.content === message.content
    )
  )

  if (optimisticIndex >= 0) {
    next[optimisticIndex] = { ...message, pending: false }
    return next.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }

  return upsertMessage(next, { ...message, pending: false })
}

function removePendingMessage(messages, clientId) {
  return (messages || []).filter((message) => message.id !== clientId)
}

function upsertThread(threads, thread) {
  const next = (threads || []).filter((item) => item.id !== thread.id)
  next.unshift(thread)
  return next
}

function sortThreads(threads) {
  return [...(threads || [])].sort(
    (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
  )
}
