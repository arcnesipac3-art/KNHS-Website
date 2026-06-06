import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api, { clearAccessToken, setAccessToken } from '../../lib/api'
import { logAuthState } from '../../utils/devtools'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Use a ref instead of state to avoid re-render loops.
  // Changing a ref does NOT trigger a re-render, so `bootstrap` keeps
  // the same function reference across the component's lifetime.
  const bootstrappedRef = useRef(false)

  const bootstrap = useCallback(async () => {
    // Prevent multiple simultaneous bootstrap calls
    if (bootstrappedRef.current) return
    bootstrappedRef.current = true
    
    logAuthState('bootstrap:start', { timestamp: new Date().toISOString() })
    try {
      const { data } = await api.post('/auth/refresh/')
      logAuthState('bootstrap:refresh-success', { access_token: data.access_token?.substring(0, 20) + '...' })
      setAccessToken(data.access_token)
      const me = await api.get('/auth/me/')
      logAuthState('bootstrap:user-loaded', { user: me.data })
      setUser(me.data)
    } catch (error) {
      logAuthState('bootstrap:failed', { error: error.message, status: error.response?.status })
      clearAccessToken()
      setUser(null)
      // Allow retry on next explicit call (e.g. refreshUser after re-login)
      bootstrappedRef.current = false
    } finally {
      setLoading(false)
      logAuthState('bootstrap:complete', {})
    }
  }, []) // No dependencies — stable reference forever

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const login = async (email, password) => {
    logAuthState('login:attempt', { email })
    const { data } = await api.post('/auth/login/', { email, password })
    logAuthState('login:success', { user: data.user, access_token: data.access_token?.substring(0, 20) + '...' })
    setAccessToken(data.access_token)
    setUser(data.user)
    bootstrappedRef.current = true
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
      bootstrappedRef.current = false
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
    // bootstrap and updateUser are stable refs (empty deps), so only
    // user/loading changes will produce a new context value.
    [user, loading, updateUser, bootstrap],
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
