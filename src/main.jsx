import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import { initAnalytics } from './utils/analytics'
import posthog from 'posthog-js'
import { PostHogProvider, PostHogErrorBoundary } from '@posthog/react'
import './index.css'

initAnalytics()

// Register Service Worker for caching and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope)
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error)
      })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <PostHogErrorBoundary>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </PostHogErrorBoundary>
    </PostHogProvider>
  </React.StrictMode>,
)