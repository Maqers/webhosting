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

// ── Google OAuth (Supabase GoTrue implicit flow) ───────────────────────────
// Requires a Google provider configured in the Supabase dashboard under
// Authentication → Providers → Google (Client ID + Secret from Google Cloud
// Console), with the Supabase callback URL added as an authorized redirect
// URI on the Google OAuth client.
export function getGoogleAuthUrl(redirectTo) {
  return `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`
}

// GoTrue's implicit flow redirects back with the session in the URL hash
// (#access_token=...) rather than as JSON, so once we have the token we
// fetch the user record separately.
export async function getUserFromToken(accessToken) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return res.json()
}

// GoTrue merges `data` into the user's existing user_metadata rather than
// replacing it, so this only needs to send the fields that changed.
export async function updateUserProfile(accessToken, data) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.msg || err.error_description || 'Could not update profile')
  }
  return res.json() // updated user object
}

// ── Review photo storage ────────────────────────────────────────────────────
// Uploads into the public `review_photos` bucket (see reviewsApi.js / the
// project README for the SQL that creates the bucket + its RLS policies).
export async function uploadReviewPhoto(file, accessToken) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/review_photos/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}`, 'Content-Type': file.type },
    body: file,
  })
  if (!res.ok) throw new Error('Photo upload failed')
  return `${SUPABASE_URL}/storage/v1/object/public/review_photos/${path}`
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
