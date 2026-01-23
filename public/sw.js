/**
 * Service Worker for Performance Optimization
 * Caches static assets and API responses for faster loading
 */

const CACHE_NAME = 'premium-catalogue-v1'
const STATIC_CACHE_NAME = 'premium-catalogue-static-v1'
const IMAGE_CACHE_NAME = 'premium-catalogue-images-v1'

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/products',
  '/index.html',
  '/src/main.jsx',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('Cache install error:', err)
      })
    })
  )
  self.skipWaiting() // Activate immediately
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== CACHE_NAME &&
              name !== STATIC_CACHE_NAME &&
              name !== IMAGE_CACHE_NAME
            )
          })
          .map((name) => caches.delete(name))
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle different types of requests
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html')) {
    // Static assets - cache first, then network
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((fetchResponse) => {
            // Cache successful responses
            if (fetchResponse && fetchResponse.status === 200) {
              const responseToCache = fetchResponse.clone()
              caches.open(STATIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache)
              })
            }
            return fetchResponse
          })
        )
      })
    )
  } else if (
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('images.')
  ) {
    // Images - cache first, network fallback
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response
        }
        return fetch(request).then((fetchResponse) => {
          // Cache successful image responses
          if (fetchResponse && fetchResponse.status === 200) {
            const responseToCache = fetchResponse.clone()
            caches.open(IMAGE_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return fetchResponse
        })
      })
    )
  } else {
    // Other requests - network first, cache fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
        })
    )
  }
})

