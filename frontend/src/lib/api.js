import axios from 'axios'

// Use environment variable for API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  timeout: 60000, // 60s — handles Render cold starts (free tier sleeps after inactivity)
  headers: {
    'Content-Type': 'application/json',
  },
})

let accessToken = null
let refreshPromise = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function getWebSocketBaseUrl() {
  const url = new URL(API_BASE_URL)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString().replace(/\/$/, '')
}

export function clearAccessToken() {
  accessToken = null
}

function isTokenExpired(token) {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export async function ensureValidToken() {
  if (!accessToken || isTokenExpired(accessToken)) {
    if (!refreshPromise) {
      refreshPromise = api.post('/auth/refresh/').finally(() => {
        refreshPromise = null
      })
    }
    try {
      const { data } = await refreshPromise
      setAccessToken(data.access_token)
      return data.access_token
    } catch {
      clearAccessToken()
      window.dispatchEvent(new CustomEvent('auth:session-expired'))
      return null
    }
  }
  return accessToken
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // --- Handle 401 Unauthorized (token refresh) ---
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true
      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh/').finally(() => {
          refreshPromise = null
        })
      }
      try {
        const { data } = await refreshPromise
        setAccessToken(data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        clearAccessToken()
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
      }
    }

    // --- Handle 429 Too Many Requests (rate limit retry with backoff) ---
    if (error.response?.status === 429 && original) {
      const retryCount = original._retryCount || 0
      const MAX_RETRIES = 3

      if (retryCount < MAX_RETRIES) {
        original._retryCount = retryCount + 1

        // Respect Retry-After header if present (seconds), otherwise exponential backoff
        const retryAfterHeader = error.response.headers?.['retry-after']
        const delayMs = retryAfterHeader
          ? parseInt(retryAfterHeader, 10) * 1000
          : Math.min(1000 * 2 ** retryCount, 8000) // 1s, 2s, 4s (capped at 8s)

        await new Promise((resolve) => setTimeout(resolve, delayMs))
        return api(original)
      }
    }

    return Promise.reject(error)
  },
)

export default api

