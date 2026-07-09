import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import './LoginModal.css'

const RESEND_SECONDS = 30

function friendlyError(err) {
  if (err?.message === 'Failed to fetch') return "Couldn't reach the login service. Please try again in a moment."
  return err?.message || 'Something went wrong. Please try again.'
}

export default function LoginModal() {
  const { loginModalOpen, closeLoginModal, sendOtp, verifyOtp } = useAuth()
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
            <h2 className="login-modal-title">Log in with your phone</h2>
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
