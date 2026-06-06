import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { clearAccessToken, setAccessToken } from '../../lib/api'
import { logAuthState } from '../../utils/devtools'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isBootstrapped, setIsBootstrapped] = useState(false)

  const bootstrap = useCallback(async () => {
    // Prevent multiple simultaneous bootstrap calls
    if (isBootstrapped) return
    
    logAuthState('bootstrap:start', { timestamp: new Date().toISOString() })
    try {
      const { data } = await api.post('/auth/refresh/')
      logAuthState('bootstrap:refresh-success', { access_token: data.access_token?.substring(0, 20) + '...' })
      setAccessToken(data.access_token)
      const me = await api.get('/auth/me/')
      logAuthState('bootstrap:user-loaded', { user: me.data })
      setUser(me.data)
      setIsBootstrapped(true)
    } catch (error) {
      logAuthState('bootstrap:failed', { error: error.message, status: error.response?.status })
      clearAccessToken()
      setUser(null)
    } finally {
      setLoading(false)
      logAuthState('bootstrap:complete', {})
    }
  }, [isBootstrapped])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const login = async (email, password) => {
    logAuthState('login:attempt', { email })
    const { data } = await api.post('/auth/login/', { email, password })
    logAuthState('login:success', { user: data.user, access_token: data.access_token?.substring(0, 20) + '...' })
    setAccessToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    logAuthState('logout:start', {})
    try {
      await api.post('/auth/logout/')
      logAuthState('logout:success', {})
    } catch (error) {
      logAuthState('logout:error', { error: error.message })
      // ignore
    } finally {
      clearAccessToken()
      setUser(null)
      logAuthState('logout:complete', {})
    }
  }

  const updateUser = useCallback((updatedData) => {
    logAuthState('updateUser:start', { updatedData })
    setUser((prevUser) => {
      const nextUser = { ...prevUser, ...updatedData }
      logAuthState('updateUser:complete', { updatedUser: nextUser })
      return nextUser
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      updateUser,
      refreshUser: bootstrap,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, bootstrap, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
