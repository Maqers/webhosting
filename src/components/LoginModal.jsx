import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import './LoginModal.css'

const RESEND_SECONDS = 30

function friendlyError(err) {
  if (err?.message === 'Failed to fetch') return "Couldn't reach the login service. Please try again in a moment."
  return err?.message || 'Something went wrong. Please try again.'
}

export default function LoginModal() {
  const { loginModalOpen, closeLoginModal, sendOtp, verifyOtp, loginWithGoogle } = useAuth()
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [e164Phone, setE164Phone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const otpInputRef = useRef(null)

  useEffect(() => {
    if (!loginModalOpen) {
      setStep('phone'); setPhone(''); setCode(''); setError(''); setSubmitting(false); setResendIn(0)
    }
  }, [loginModalOpen])

  useEffect(() => {
    if (step === 'otp') otpInputRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  if (!loginModalOpen) return null

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) {
      setError('Enter a valid 10-digit phone number')
      return
    }
    setSubmitting(true)
    try {
      const e164 = await sendOtp(phone)
      setE164Phone(e164)
      setStep('otp')
      setResendIn(RESEND_SECONDS)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^\d{4,6}$/.test(code)) {
      setError('Enter the code we sent you')
      return
    }
    setSubmitting(true)
    try {
      await verifyOtp(e164Phone, code)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (resendIn > 0) return
    setError('')
    try {
      await sendOtp(phone)
      setResendIn(RESEND_SECONDS)
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  return (
    <div className="login-modal-overlay" onClick={closeLoginModal}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <button className="login-modal-close" onClick={closeLoginModal} aria-label="Close" type="button">×</button>

        {step === 'phone' && (
          <form onSubmit={handleSendOtp}>
            <h2 className="login-modal-title">Log in</h2>
            <button className="login-modal-google" onClick={loginWithGoogle} type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48a5.54 5.54 0 01-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.82z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.76-2.1-6.7-4.93H1.3v3.1A12 12 0 0012 24z"/>
                <path fill="#FBBC05" d="M5.3 14.31A7.2 7.2 0 014.9 12c0-.8.14-1.58.4-2.31v-3.1H1.3A12 12 0 000 12c0 1.94.46 3.77 1.3 5.41l4-3.1z"/>
                <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 001.3 6.59l4 3.1C6.24 6.86 8.88 4.75 12 4.75z"/>
              </svg>
              Continue with Google
            </button>
            <div className="login-modal-divider"><span>or</span></div>
            <p className="login-modal-subtitle">We'll text you a one-time code, no password needed.</p>
            <div className="login-modal-field">
              <label htmlFor="login-phone">Phone number</label>
              <div className="login-phone-input-wrap">
                <span className="login-phone-prefix">+91</span>
                <input
                  id="login-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  maxLength={10}
                  autoFocus
                />
              </div>
            </div>
            {error && <p className="login-modal-error">{error}</p>}
            <button className="login-modal-submit" type="submit" disabled={submitting}>
              {submitting ? 'Sending code...' : 'Send OTP'}
            </button>
            <button className="login-modal-guest" onClick={closeLoginModal} type="button">
              Continue as guest
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerify}>
            <h2 className="login-modal-title">Enter the code</h2>
            <p className="login-modal-subtitle">Sent to {e164Phone}</p>
            <div className="login-modal-field">
              <label htmlFor="login-otp">6-digit code</label>
              <input
                id="login-otp"
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                className="login-otp-input"
              />
            </div>
            {error && <p className="login-modal-error">{error}</p>}
            <button className="login-modal-submit" type="submit" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button
              className="login-modal-resend"
              type="button"
              onClick={handleResend}
              disabled={resendIn > 0}
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </button>
            <button className="login-modal-guest" onClick={() => setStep('phone')} type="button">
              ← Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
