import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { sendPhoneOtp, verifyPhoneOtp, refreshSession, logoutSession, getGoogleAuthUrl, getUserFromToken, updateUserProfile } from '../config/supabaseConfig'
import { claimGuestOrders } from '../utils/guestOrders'

const AuthContext = createContext(null)
const STORAGE_KEY = 'maqers_auth_session'

function toE164(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  return `+${digits}`
}

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadStoredSession)
  const [loading, setLoading] = useState(true)
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  const persist = useCallback((next) => {
    setSession(next)
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
    // Any order placed as a guest (before this login) gets attached to the
    // account the moment a session becomes active — covers OTP verify,
    // Google redirect, and plain session rehydration on return visits.
    if (next?.user?.id && next?.access_token) {
      claimGuestOrders(next.user.id, next.access_token).catch(() => {})
    }
  }, [])

  // Handle the redirect back from Google (GoTrue's implicit flow appends
  // #access_token=...&refresh_token=... to the page URL instead of returning
  // JSON), then fall back to rehydrating/refreshing any stored session.
  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      const params = new URLSearchParams(window.location.hash.slice(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const expires_in = Number(params.get('expires_in')) || 3600
      if (access_token) {
        getUserFromToken(access_token)
          .then(user => persist({ access_token, refresh_token, expires_at: Date.now() + expires_in * 1000, user }))
          .catch(() => {})
          .finally(() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
            setLoading(false)
          })
        return
      }
    }

    const stored = loadStoredSession()
    if (!stored) { setLoading(false); return }

    const isExpired = Date.now() >= (stored.expires_at || 0)
    if (!isExpired) { setLoading(false); return }

    refreshSession(stored.refresh_token)
      .then(refreshed => {
        if (refreshed) {
          persist({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token,
            expires_at: Date.now() + (refreshed.expires_in * 1000),
            user: refreshed.user || stored.user,
          })
        } else {
          persist(null)
        }
      })
      .catch(() => persist(null))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendOtp = useCallback(async (phone) => {
    const e164 = toE164(phone)
    await sendPhoneOtp(e164)
    return e164
  }, [])

  const verifyOtp = useCallback(async (e164Phone, code) => {
    const result = await verifyPhoneOtp(e164Phone, code)
    persist({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_at: Date.now() + (result.expires_in * 1000),
      user: result.user,
    })
    setLoginModalOpen(false)
    return result.user
  }, [persist])

  const loginWithGoogle = useCallback(() => {
    const redirectTo = window.location.origin + window.location.pathname
    window.location.href = getGoogleAuthUrl(redirectTo)
  }, [])

  const updateProfile = useCallback(async (fields) => {
    if (!session?.access_token) throw new Error('Not logged in')
    const updated = await updateUserProfile(session.access_token, fields)
    persist({ ...session, user: updated })
    return updated
  }, [session, persist])

  const logout = useCallback(async () => {
    if (session?.access_token) await logoutSession(session.access_token)
    persist(null)
  }, [session, persist])

  const value = {
    user: session?.user || null,
    accessToken: session?.access_token || null,
    isLoggedIn: !!session?.user,
    loading,
    sendOtp,
    verifyOtp,
    loginWithGoogle,
    updateProfile,
    logout,
    loginModalOpen,
    openLoginModal: () => setLoginModalOpen(true),
    closeLoginModal: () => setLoginModalOpen(false),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
