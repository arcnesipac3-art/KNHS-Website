/**
 * PostHog Analytics Configuration
 */
import posthog from 'posthog-js'

const POSTHOG_PROJECT_ID = import.meta.env.VITE_POSTHOG_PROJECT_ID
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'

export const initPostHog = () => {
  if (POSTHOG_PROJECT_ID && import.meta.env.PROD) {
    posthog.init(POSTHOG_PROJECT_ID, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false, // Disable automatic event capture for privacy
      persistence: 'localStorage',
    })
    console.log('PostHog initialized')
  }
}

export const trackEvent = (eventName, properties = {}) => {
  if (POSTHOG_PROJECT_ID && import.meta.env.PROD) {
    posthog.capture(eventName, properties)
  }
}

export const identifyUser = (userId, properties = {}) => {
  if (POSTHOG_PROJECT_ID && import.meta.env.PROD) {
    posthog.identify(userId, properties)
  }
}

export const resetUser = () => {
  if (POSTHOG_PROJECT_ID && import.meta.env.PROD) {
    posthog.reset()
  }
}

export default posthog
