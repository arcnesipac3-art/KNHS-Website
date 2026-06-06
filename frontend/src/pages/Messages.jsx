import { useState, useEffect } from 'react'
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

  useEffect(() => {
    loadThreads()
  }, [])

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id)
    }
  }, [selectedThread])

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
    const formData = new FormData(e.target)
    const participantIds = formData.get('participant_ids').split(',').map(id => id.trim())
    const subject = formData.get('subject')
    const initialMessage = formData.get('initial_message')

    try {
      const response = await api.post('/message-threads/start_conversation/', {
        participant_ids: participantIds,
        subject,
        initial_message,
      })
      setShowNewConversation(false)
      loadThreads()
      setSelectedThread(response.data)
    } catch (error) {
      console.error('Failed to start conversation:', error)
      alert('Failed to start conversation. Please check participant IDs.')
    }
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Messages</h1>
            <p className="mt-2 text-muted">Direct messaging with teachers and students</p>
          </div>
          <Button onClick={() => setShowNewConversation(true)}>
            New Conversation
          </Button>
        </div>

        {showNewConversation && (
          <Card className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-text">Start New Conversation</h2>
            <form onSubmit={handleStartConversation} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text">
                  Participant IDs (comma-separated)
                </label>
                <input
                  type="text"
                  name="participant_ids"
                  required
                  placeholder="e.g., uuid1, uuid2"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Subject (optional)</label>
                <input
                  type="text"
                  name="subject"
                  placeholder="Conversation subject"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Message</label>
                <textarea
                  name="initial_message"
                  required
                  rows={4}
                  placeholder="Type your message..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowNewConversation(false)}>
                  Cancel
                </Button>
                <Button type="submit">Start Conversation</Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Thread List */}
          <Card className="lg:col-span-1">
            <h2 className="mb-4 text-lg font-semibold text-text">Conversations</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-knhs-purple border-t-transparent"></div>
              </div>
            ) : threads.length === 0 ? (
              <p className="text-muted">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {threads.map(thread => (
                  <div
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50 ${
                      selectedThread?.id === thread.id ? 'border-knhs-purple bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {thread.subject && (
                          <p className="font-medium text-text">{thread.subject}</p>
                        )}
                        <p className="mt-1 text-sm text-muted">
                          {thread.participants_detail
                            .filter(p => !p.is_current_user)
                            .map(p => p.name)
                            .join(', ')}
                        </p>
                        {thread.last_message && (
                          <p className="mt-2 truncate text-sm text-muted">
                            {thread.last_message.sender_name}: {thread.last_message.content}
                          </p>
                        )}
                      </div>
                      {thread.unread_count > 0 && (
                        <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-knhs-purple text-xs text-white">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Message View */}
          <Card className="lg:col-span-2">
            {selectedThread ? (
              <>
                <div className="mb-4 border-b border-gray-200 pb-4">
                  <h2 className="text-lg font-semibold text-text">
                    {selectedThread.subject || 'Conversation'}
                  </h2>
                  <p className="text-sm text-muted">
                    {selectedThread.participants_detail
                      .filter(p => !p.is_current_user)
                      .map(p => p.name)
                      .join(', ')}
                  </p>
                </div>

                <div className="mb-4 max-h-96 space-y-4 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-muted">No messages yet</p>
                  ) : (
                    messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === user.email ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.sender === user.email
                              ? 'bg-knhs-purple text-white'
                              : 'bg-gray-100 text-text'
                          }`}
                        >
                          <p className="text-sm font-medium">{message.sender_name}</p>
                          <p className="mt-1">{message.content}</p>
                          <p className="mt-1 text-xs opacity-75">
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    {sending ? 'Sending...' : 'Send'}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted">Select a conversation to view messages</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PortalLayout>
  )
}
