import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { NEW_USER_COUPON } from '../data/offers'
import { trackEvent } from '../utils/analytics'
import './WelcomeOffer.css'

const SEEN_KEY = 'maqers_welcome_offer_seen'
const DELAY_MS = 12000
// Pages where a popup would get in the way of a task already under way
const SKIP_PATHS = ['/admin', '/checkout']

const seenBefore = () => { try { return !!localStorage.getItem(SEEN_KEY) } catch { return true } }
const markSeen = () => { try { localStorage.setItem(SEEN_KEY, String(Date.now())) } catch { /* ignore */ } }

// Shown once per browser, about 12 seconds into a logged-out visit: log in for
// MAQERSNEW, 5% off the first order. Terms live at checkout, not here.
export default function WelcomeOffer() {
  const { isLoggedIn, loading, loginModalOpen, openLoginModal } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const stateRef = useRef({})
  stateRef.current = { isLoggedIn, loginModalOpen, path: location.pathname }

  useEffect(() => {
    if (loading || isLoggedIn || seenBefore()) return
    const t = setTimeout(() => {
      const { isLoggedIn: inNow, loginModalOpen: modalUp, path } = stateRef.current
      if (inNow || modalUp || SKIP_PATHS.some(p => path.startsWith(p))) return
      markSeen()
      setOpen(true)
      trackEvent('WelcomeOfferShown', { code: NEW_USER_COUPON.code })
    }, DELAY_MS)
    return () => clearTimeout(t)
  }, [loading, isLoggedIn])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Logging in some other way while it is up makes it redundant
  useEffect(() => { if (isLoggedIn) setOpen(false) }, [isLoggedIn])

  if (!open) return null

  const claim = () => {
    trackEvent('WelcomeOfferClaim', { code: NEW_USER_COUPON.code })
    setOpen(false)
    openLoginModal()
  }

  return (
    <div className="welcome-offer-overlay" onClick={() => setOpen(false)}>
      <div className="welcome-offer" role="dialog" aria-modal="true" aria-labelledby="welcome-offer-title" onClick={e => e.stopPropagation()}>
        <button className="welcome-offer-close" onClick={() => setOpen(false)} aria-label="Close" type="button">×</button>
        <p className="welcome-offer-eyebrow">New to Maqers?</p>
        <h2 className="welcome-offer-title" id="welcome-offer-title">
          {NEW_USER_COUPON.percent}% off your first order
        </h2>
        <p className="welcome-offer-sub">Log in and use this code at checkout.</p>
        <div className="welcome-offer-code" aria-label={`Coupon code ${NEW_USER_COUPON.code}`}>{NEW_USER_COUPON.code}</div>
        <button className="welcome-offer-cta" onClick={claim} type="button">Log in to claim</button>
        <button className="welcome-offer-later" onClick={() => setOpen(false)} type="button">Maybe later</button>
      </div>
    </div>
  )
}
