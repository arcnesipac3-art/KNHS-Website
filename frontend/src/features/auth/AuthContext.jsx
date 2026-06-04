import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { clearAccessToken, setAccessToken } from '../../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const bootstrap = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh/')
      setAccessToken(data.access_token)
      const me = await api.get('/auth/me/')
      setUser(me.data)
    } catch {
      clearAccessToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password })
    setAccessToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout/')
    } catch {
      // ignore
    } finally {
      clearAccessToken()
      setUser(null)
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser: bootstrap,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, bootstrap],
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
