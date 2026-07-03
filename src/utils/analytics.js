import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

let initialized = false

export function initAnalytics() {
  if (initialized || !POSTHOG_KEY) return
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: '2026-05-30',
    capture_pageview: false, // we capture manually on route change (SPA)
    capture_pageleave: true,
  })
  initialized = true
}

export function trackPageview(path) {
  if (!initialized) return
  posthog.capture('$pageview', { $current_url: window.location.href, path })
}

export function trackEvent(name, props = {}) {
  if (!initialized) return
  posthog.capture(name, props)
}
