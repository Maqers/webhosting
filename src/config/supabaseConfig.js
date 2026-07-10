// Shared Supabase project config, reused by AuthContext, Checkout, and OrderHistory.
// Same public anon key already embedded in AdminPortal.jsx.
export const SUPABASE_URL = "https://ipkyssauulddtthrebnw.supabase.co"
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwa3lzc2F1dWxkZHR0aHJlYm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDAyMTEsImV4cCI6MjA4MTYxNjIxMX0.TIZuwR0Vu2cyhhpGuCoB38fC6K8ZtnW17NeVzHWc-n0"

// ── Phone OTP auth (Supabase GoTrue REST API) ──────────────────────────────
// Requires a Phone provider (e.g. Twilio) configured in the Supabase dashboard
// under Authentication → Providers → Phone before this will actually send SMS.

export async function sendPhoneOtp(phone) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ phone }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.msg || err.error_description || 'Could not send OTP')
  }
  return true
}

export async function verifyPhoneOtp(phone, token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ type: 'sms', phone, token }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.msg || err.error_description || 'Invalid or expired code')
  }
  return res.json() // { access_token, refresh_token, expires_in, user }
}

export async function refreshSession(refreshToken) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) return null
  return res.json()
}

export async function logoutSession(accessToken) {
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    })
  } catch { /* best effort */ }
}

// Generic authenticated REST helper for Postgrest tables (orders, user_carts, ...)
// Falls back to the anon key when no user session exists (RLS will reject writes).
export async function supabaseRest(path, { method = 'GET', accessToken, body, headers = {} } = {}) {
  const baseHeaders = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
  }
  if (method !== 'GET') baseHeaders.Prefer = 'return=representation'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...baseHeaders, ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Request failed (${res.status})`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}
