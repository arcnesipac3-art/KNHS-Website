import { useState, useEffect } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { friendshipApi } from '../lib/learningApi'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function Friends() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchUsers, setSearchUsers] = useState('')
  const [availableUsers, setAvailableUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [startingConversation, setStartingConversation] = useState(false)

  useEffect(() => {
    loadFriends()
    loadPendingRequests()
  }, [])

  useEffect(() => {
    if (searchUsers.length >= 2) {
      loadAvailableUsers()
    }
  }, [searchUsers])

  async function loadFriends() {
    try {
      const response = await friendshipApi.getMyFriends()
      setFriends(response.data)
    } catch (error) {
      console.error('Failed to load friends:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPendingRequests() {
    try {
      const response = await friendshipApi.getPendingRequests()
      setPendingRequests(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to load pending requests:', error)
    }
  }

  async function loadAvailableUsers() {
    setLoadingUsers(true)
    try {
      const response = await api.get('/users/', { params: { search: searchUsers } })
      const users = Array.isArray(response.data) ? response.data : (response.data?.results ?? [])
      // Filter out current user and existing friends
      const friendIds = friends.map(f => f.id)
      const filtered = users.filter(u => 
        u.id !== user?.id && !friendIds.includes(u.id)
      )
      setAvailableUsers(filtered)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  async function handleSendFriendRequest(userId) {
    try {
      await friendshipApi.sendRequest({ recipient_id: userId })
      setSearchUsers('')
      setAvailableUsers([])
      alert('Friend request sent!')
    } catch (error) {
      console.error('Failed to send friend request:', error)
      alert('Failed to send friend request. Please try again.')
    }
  }

  async function handleAcceptRequest(friendshipId) {
    try {
      await friendshipApi.accept(friendshipId)
      loadPendingRequests()
      loadFriends()
    } catch (error) {
      console.error('Failed to accept friend request:', error)
      alert('Failed to accept friend request. Please try again.')
    }
  }

  async function handleRejectRequest(friendshipId) {
    try {
      await friendshipApi.reject(friendshipId)
      loadPendingRequests()
    } catch (error) {
      console.error('Failed to reject friend request:', error)
      alert('Failed to reject friend request. Please try again.')
    }
  }

  async function handleUnfriend(friendshipId) {
    if (!window.confirm('Are you sure you want to unfriend this person?')) {
      return
    }
    try {
      await friendshipApi.unfriend(friendshipId)
      loadFriends()
    } catch (error) {
      console.error('Failed to unfriend:', error)
      alert('Failed to unfriend. Please try again.')
    }
  }

  async function handleStartConversation(friendId) {
    setStartingConversation(true)
    try {
      const response = await api.post('/message-threads/start_conversation/', {
        participant_ids: [friendId],
        initial_message: '',
      })
      navigate(`/messages`, { state: { selectedThreadId: response.data.id } })
    } catch (error) {
      console.error('Failed to start conversation:', error)
      alert('Failed to start conversation. Please try again.')
    } finally {
      setStartingConversation(false)
    }
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

  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text">Friends</h1>
          <p className="mt-2 text-muted">Connect with teachers and students</p>
        </div>

        {/* Add Friends */}
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-text">Add Friends</h2>
          <div className="relative">
            <input
              type="text"
              value={searchUsers}
              onChange={e => setSearchUsers(e.target.value)}
              placeholder="Search for people to add..."
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
                  className="flex items-center justify-between p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(user.display_name || user.email)}`}>
                      {getAvatar(user.display_name || user.email)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">{user.display_name || user.email}</p>
                      <p className="text-xs text-muted">{user.email}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleSendFriendRequest(user.id)}>
                    Add Friend
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Friends List */}
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-text">
              My Friends ({friends.length})
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-knhs-purple border-t-transparent"></div>
              </div>
            ) : friends.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="mt-4 text-sm text-muted">No friends yet</p>
                <p className="mt-1 text-xs text-muted">Search for people above to add friends</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map(friend => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white ${getAvatarColor(friend.display_name || friend.email)}`}>
                        {getAvatar(friend.display_name || friend.email)}
                      </div>
                      <div>
                        <p className="font-medium text-text">{friend.display_name || friend.email}</p>
                        <p className="text-sm text-muted">{friend.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => handleStartConversation(friend.id)}
                        disabled={startingConversation}
                      >
                        {startingConversation ? 'Starting...' : 'Message'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUnfriend(friend.friendship_id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Unfriend
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Requests */}
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-text">
              Pending Requests ({pendingRequests.length})
            </h2>
            {pendingRequests.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="mt-4 text-sm text-muted">No pending friend requests</p>
                <p className="mt-1 text-xs text-muted">When people send you requests, they'll appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white ${getAvatarColor(request.requester_name || request.requester_email)}`}>
                        {getAvatar(request.requester_name || request.requester_email)}
                      </div>
                      <div>
                        <p className="font-medium text-text">{request.requester_name || request.requester_email}</p>
                        <p className="text-sm text-muted">Sent a friend request</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PortalLayout>
  )
}
