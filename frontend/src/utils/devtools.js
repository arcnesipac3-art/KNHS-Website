/**
 * Development Tools & Debugging Utilities
 * 
 * Helper functions to debug authentication state, API calls, and component behavior
 */

// Enable debug logging in development
const isDev = import.meta.env.DEV

/**
 * Log authentication state changes
 */
export function logAuthState(action, data) {
  if (!isDev) return
  
  console.group(`🔐 Auth: ${action}`)
  console.log('Timestamp:', new Date().toISOString())
  console.log('Data:', data)
  console.groupEnd()
}

/**
 * Log API requests and responses
 */
export function logApiCall(method, url, data, response) {
  if (!isDev) return
  
  console.group(`📡 API: ${method.toUpperCase()} ${url}`)
  console.log('Request:', data)
  console.log('Response:', response)
  console.log('Status:', response?.status)
  console.groupEnd()
}

/**
 * Log cookie information
 */
export function logCookies() {
  if (!isDev) return
  
  const cookies = document.cookie.split(';').map(c => c.trim())
  console.group('🍪 Cookies')
  cookies.forEach(cookie => {
    const [name, value] = cookie.split('=')
    console.log(`${name}:`, value?.substring(0, 50) + (value?.length > 50 ? '...' : ''))
  })
  console.groupEnd()
}

/**
 * Log localStorage/sessionStorage
 */
export function logStorage() {
  if (!isDev) return
  
  console.group('💾 Storage')
  console.log('localStorage:', Object.keys(localStorage))
  console.log('sessionStorage:', Object.keys(sessionStorage))
  console.groupEnd()
}

/**
 * Check authentication status and log details
 */
export function checkAuthStatus() {
  if (!isDev) return
  
  console.group('🔍 Auth Status Check')
  logCookies()
  logStorage()
  
  // Check if we have an access token (in memory)
  console.log('Has access token in memory:', window.__accessToken ? 'YES' : 'NO')
  
  // Check API base URL
  console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'localhost:8000')
  
  console.groupEnd()
}

/**
 * Test API connection
 */
export async function testApiConnection() {
  if (!isDev) return
  
  console.group('🧪 Testing API Connection')
  
  try {
    const healthUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/health/`
    console.log('Testing:', healthUrl)
    
    const response = await fetch(healthUrl)
    const data = await response.json()
    
    console.log('✅ API is reachable')
    console.log('Health status:', data)
  } catch (error) {
    console.error('❌ API connection failed:', error.message)
  }
  
  console.groupEnd()
}

/**
 * Debug component mount/unmount
 */
export function useDebugLifecycle(componentName) {
  if (!isDev) return
  
  console.log(`🔵 ${componentName} mounted`)
  
  return () => {
    console.log(`🔴 ${componentName} unmounted`)
  }
}

/**
 * Make debugging functions available globally in dev mode
 */
if (isDev && typeof window !== 'undefined') {
  window.__knhsDebug = {
    checkAuthStatus,
    testApiConnection,
    logCookies,
    logStorage,
    version: '1.0.0'
  }
  
  console.log('🛠️ KNHS Debug Tools loaded. Access via window.__knhsDebug')
  console.log('Available commands:')
  console.log('  window.__knhsDebug.checkAuthStatus()')
  console.log('  window.__knhsDebug.testApiConnection()')
  console.log('  window.__knhsDebug.logCookies()')
  console.log('  window.__knhsDebug.logStorage()')
}

export default {
  logAuthState,
  logApiCall,
  logCookies,
  logStorage,
  checkAuthStatus,
  testApiConnection,
  useDebugLifecycle,
}
