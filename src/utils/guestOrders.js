import { supabaseRest } from '../config/supabaseConfig'

const KEY = 'maqers_guest_orders'

// Orders placed while not logged in are remembered here (not lost) so that
// logging in later — even in a future visit — automatically attaches them
// to the account, instead of requiring login before checkout.
export function saveGuestOrder(order) {
  try {
    const existing = JSON.parse(localStorage.getItem(KEY) || '[]')
    existing.push(order)
    localStorage.setItem(KEY, JSON.stringify(existing))
  } catch { /* ignore */ }
}

export function getGuestOrders() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function clearGuestOrders() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

// Called whenever a session becomes active (login or rehydration) — pushes
// any remembered guest orders up to Supabase under the now-known user_id.
// Orders that fail to save are kept for the next attempt rather than lost;
// successful ones are removed individually so a partial failure never
// re-submits (and duplicates) ones that already saved.
export async function claimGuestOrders(userId, accessToken) {
  const orders = getGuestOrders()
  if (orders.length === 0) return

  const remaining = []
  for (const order of orders) {
    try {
      await supabaseRest('orders', { method: 'POST', accessToken, body: { ...order, user_id: userId } })
    } catch (err) {
      console.error('Claiming guest order failed:', err)
      remaining.push(order)
    }
  }

  if (remaining.length > 0) {
    try { localStorage.setItem(KEY, JSON.stringify(remaining)) } catch { /* ignore */ }
  } else {
    clearGuestOrders()
  }
}
