import { useState } from 'react'
import { useAuth } from '../../features/auth/AuthContext'

/**
 * Debug Panel - Shows authentication state in development
 * 
 * Add to your app with: <DebugPanel />
 * Only visible in development mode
 */
export default function DebugPanel() {
  const { user, loading, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  
  // Only show in development
  if (import.meta.env.PROD) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-purple-700"
      >
        🛠️ Debug
      </button>
      
      {/* Debug Panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-96 rounded-lg bg-white p-4 shadow-2xl border border-gray-200">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Debug Info</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            {/* Auth Status */}
            <div className="rounded bg-gray-50 p-3">
              <div className="mb-1 font-semibold text-gray-700">Auth Status</div>
              <div className="space-y-1 text-gray-600">
                <div>Loading: <span className={loading ? 'text-yellow-600' : 'text-green-600'}>{loading ? 'Yes' : 'No'}</span></div>
                <div>Authenticated: <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>{isAuthenticated ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
            
            {/* User Info */}
            {user && (
              <div className="rounded bg-gray-50 p-3">
                <div className="mb-1 font-semibold text-gray-700">User Info</div>
                <div className="space-y-1 text-xs font-mono text-gray-600">
                  <div>Email: {user.email}</div>
                  <div>Role: <span className="font-bold text-purple-600">{user.role}</span></div>
                  <div>Name: {user.first_name} {user.last_name}</div>
                  {user.must_change_password && (
                    <div className="text-red-600">⚠️ Must change password</div>
                  )}
                </div>
              </div>
            )}
            
            {/* API Config */}
            <div className="rounded bg-gray-50 p-3">
              <div className="mb-1 font-semibold text-gray-700">API Config</div>
              <div className="space-y-1 text-xs font-mono text-gray-600">
                <div className="break-all">
                  Base URL: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
                </div>
              </div>
            </div>
            
            {/* Cookies */}
            <div className="rounded bg-gray-50 p-3">
              <div className="mb-1 font-semibold text-gray-700">Cookies</div>
              <div className="max-h-32 overflow-auto text-xs font-mono text-gray-600">
                {document.cookie.split(';').map((c, i) => {
                  const [name, value] = c.trim().split('=')
                  return (
                    <div key={i} className="mb-1">
                      <span className="font-bold">{name}:</span> {value?.substring(0, 30)}{value?.length > 30 ? '...' : ''}
                    </div>
                  )
                })}
                {!document.cookie && <div className="text-gray-400">No cookies</div>}
              </div>
            </div>
            
            {/* Console Commands */}
            <div className="rounded bg-gray-50 p-3">
              <div className="mb-1 font-semibold text-gray-700">Console Commands</div>
              <div className="space-y-1 text-xs font-mono text-gray-600">
                <div>window.__knhsDebug.checkAuthStatus()</div>
                <div>window.__knhsDebug.testApiConnection()</div>
                <div>window.__knhsDebug.logCookies()</div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => window.__knhsDebug?.checkAuthStatus()}
                className="flex-1 rounded bg-purple-600 px-3 py-2 text-xs text-white hover:bg-purple-700"
              >
                Check Auth
              </button>
              <button
                onClick={() => window.__knhsDebug?.testApiConnection()}
                className="flex-1 rounded bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700"
              >
                Test API
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 rounded bg-gray-600 px-3 py-2 text-xs text-white hover:bg-gray-700"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
