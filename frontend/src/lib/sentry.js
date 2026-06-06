/**
 * Sentry Error Tracking Configuration
 */
import * as Sentry from '@sentry/react'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
const SENTRY_ENABLED = !!SENTRY_DSN && import.meta.env.PROD

export const initSentry = () => {
  if (SENTRY_ENABLED) {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
      replaysSessionSampleRate: 0.1, // 10% of sessions for replay
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors for replay
      environment: import.meta.env.MODE,
      sendDefaultPii: false, // Don't send personally identifiable information
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies
          delete event.request.headers
        }
        return event
      },
    })
    console.log('Sentry initialized')
  }
}

export const captureException = (error, context = {}) => {
  if (SENTRY_ENABLED) {
    Sentry.captureException(error, { extra: context })
  }
}

export const captureMessage = (message, level = 'info', context = {}) => {
  if (SENTRY_ENABLED) {
    Sentry.captureMessage(message, level, { extra: context })
  }
}

export const setUserContext = (user) => {
  if (SENTRY_ENABLED && user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    })
  }
}

export const resetUserContext = () => {
  if (SENTRY_ENABLED) {
    Sentry.setUser(null)
  }
}

export default Sentry
