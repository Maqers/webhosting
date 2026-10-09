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

// Maps our PostHog event names to GA4's standard e-commerce event names so
// GTM (container GTM-N885WBGL, see index.html) can build funnels from the
// same call sites without a second set of tracking calls sprinkled around.
const GA4_EVENT_MAP = {
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  RemoveFromCart: 'remove_from_cart',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
  ContactWhatsAppClicked: 'contact',
}

// GA4 e-commerce reports (item name, items added/checked out/purchased) are
// empty unless events carry an `ecommerce.items` array. Callers pass either a
// single product (product_id/title/price/category_id) or `items` (cart lines).
const GA4_ECOMMERCE_EVENTS = new Set(['view_item', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase'])

function buildGa4Items(props) {
  if (Array.isArray(props.items) && props.items.length) {
    return props.items.map(i => ({
      item_id: String(i.id),
      item_name: i.title,
      price: Number(i.price) || 0,
      quantity: i.qty || 1,
      ...(i.categoryId && { item_category: i.categoryId }),
    }))
  }
  if (props.product_id != null) {
    return [{
      item_id: String(props.product_id),
      item_name: props.title,
      price: Number(props.price) || 0,
      quantity: props.quantity || 1,
      ...(props.category_id && { item_category: props.category_id }),
    }]
  }
  return []
}

export function trackEvent(name, props = {}) {
  const { items, ...posthogProps } = props
  if (initialized) posthog.capture(name, posthogProps)

  const ga4Name = GA4_EVENT_MAP[name]
  if (ga4Name) {
    window.dataLayer = window.dataLayer || []
    if (GA4_ECOMMERCE_EVENTS.has(ga4Name)) {
      const ga4Items = buildGa4Items(props)
      const value = props.value != null
        ? Number(props.value)
        : ga4Items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      // Clear the previous ecommerce object so items never leak between events.
      window.dataLayer.push({ ecommerce: null })
      window.dataLayer.push({
        event: ga4Name,
        ...posthogProps,
        ecommerce: {
          currency: 'INR',
          value,
          ...(props.order_id && { transaction_id: props.order_id }),
          items: ga4Items,
        },
      })
    } else {
      window.dataLayer.push({ event: ga4Name, ...posthogProps })
    }
  }
}
