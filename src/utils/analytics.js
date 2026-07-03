import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
// Routed through our own domain (see /ingest/* rewrites in vercel.json) so ad
// blockers that target posthog.com/i.posthog.com don't drop events.
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || '/ingest'
const POSTHOG_UI_HOST = 'https://eu.posthog.com'

let initialized = false

export function initAnalytics() {
  if (initialized || !POSTHOG_KEY) return
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: POSTHOG_UI_HOST,
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
