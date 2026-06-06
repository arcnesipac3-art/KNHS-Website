import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'

export default function Messages() {
  const { user } = useAuth()
  const [threads, setThreads] = useState([])
  const [selectedThread, setSelectedThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [searchUsers, setSearchUsers] = useState('')
  const [availableUsers, setAvailableUsers] = useState([])
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [subject, setSubject] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadThreads()
  }, [])

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id)
    }
  }, [selectedThread])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (showNewConversation && searchUsers.length >= 2) {
      loadAvailableUsers()
    }
  }, [showNewConversation, searchUsers])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadAvailableUsers() {
    setLoadingUsers(true)
    try {
      const response = await api.get('/users/', { params: { search: searchUsers } })
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

  async function loadThreads() {
    try {
      const response = await api.get('/message-threads/')
      setThreads(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to load message threads:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(threadId) {
    try {
      const response = await api.get(`/messages/?thread=${threadId}`)
      setMessages(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedThread) return

    setSending(true)
    try {
      const response = await api.post(`/messages/`, {
        thread: selectedThread.id,
        content: newMessage,
      })
      setMessages([...messages, response.data])
      setNewMessage('')
      
      // Mark thread as read
      await api.post(`/message-threads/${selectedThread.id}/mark_read/`)
      
      // Refresh threads to update last message
      loadThreads()
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
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
      setShowNewConversation(false)
      setSelectedParticipants([])
      setSubject('')
      setInitialMessage('')
      setSearchUsers('')
      setAvailableUsers([])
      loadThreads()
      setSelectedThread(response.data)
    } catch (error) {
      console.error('Failed to start conversation:', error)
      alert('Failed to start conversation. Please try again.')
    }
  }

  function handleAddParticipant(user) {
    setSelectedParticipants([...selectedParticipants, user])
    setAvailableUsers(availableUsers.filter(u => u.id !== user.id))
    setSearchUsers('')
  }

  function handleRemoveParticipant(userId) {
    setSelectedParticipants(selectedParticipants.filter(p => p.id !== userId))
  }

  function getAvatar(name) {
    return name ? name.charAt(0).toUpperCase() : '?'
  }

  function getAvatarColor(name) {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-red-500'
    ]
    const index = name ? name.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

  function formatTime(dateString) {
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
  }

  function formatMessageTime(dateString) {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <PortalLayout>
      <div className="h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-text">Messages</h1>
            <p className="text-sm text-muted">Direct messaging with teachers and students</p>
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
                  <div className="mt-2 flex items-center justify-center py-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-knhs-purple border-t-transparent"></div>
                  </div>
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
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-knhs-purple border-t-transparent"></div>
                </div>
              ) : threads.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="mt-2 text-sm text-muted">No conversations yet</p>
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
                        onClick={() => setSelectedThread(thread)}
                        className={`cursor-pointer p-4 transition-colors hover:bg-gray-50 ${
                          selectedThread?.id === thread.id ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
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
                                {lastMessage.sender_name === user?.display_name || lastMessage.sender === user?.email ? 'You: ' : ''}
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
                        {selectedThread.subject || selectedThread.participants_detail.filter(p => !p.is_current_user).map(p => p.name).join(', ')}
                      </h2>
                      <p className="text-xs text-muted">
                        {selectedThread.participants_detail.filter(p => !p.is_current_user).map(p => p.name).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex h-[calc(100%-140px)] flex-col overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map(message => {
                        const isOwn = message.sender === user.email
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
                                <span className="mt-1 text-xs text-muted">
                                  {formatMessageTime(message.created_at)}
                                </span>
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
                      {sending ? (
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15-2-15-2z" />
                        </svg>
                      )}
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
