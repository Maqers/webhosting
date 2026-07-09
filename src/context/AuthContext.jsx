import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { sendPhoneOtp, verifyPhoneOtp, refreshSession, logoutSession } from '../config/supabaseConfig'

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
  }, [])

  // Rehydrate/refresh on load
  useEffect(() => {
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
