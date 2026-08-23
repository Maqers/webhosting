import { useCallback, useMemo, useEffect, useState } from 'react'
import { copyToClipboard } from '../utils/clipboard'
import Toast from '../components/Toast'
import PhoneCard from '../components/PhoneCard'
import { getAllPhones, getEmail, getInstagramUsername } from '../data/contactInfo'
import { trackEvent } from '../utils/analytics'
import './Contact.css'
import '../styles/contact-hero-fix.css'

const Contact = () => {
  const contactPhones = useMemo(() => getAllPhones(), [])
  const contactEmail = useMemo(() => getEmail(), [])
  const contactInstagram = useMemo(() => getInstagramUsername(), [])
  const [toast, setToast] = useState(null)

  const handlePhoneCopy = useCallback(async (phoneNumber) => {
    const success = await copyToClipboard(phoneNumber)
    setToast({ message: success ? 'Phone number copied!' : 'Failed to copy.', type: success ? 'success' : 'error' })
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('animate-in') }) },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.scroll-animate').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <h1 className="contact-title scroll-animate">Get in Touch</h1>
          <p className="contact-subtitle scroll-animate">We'd love to hear from you</p>
        </div>
      </div>

      <div className="container">
        <div style={{ padding: '3rem 0', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-family-heading)', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', marginBottom: '0.5rem' }}>Reach Us</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Pick whichever works best for you</p>

          {/* 4 cards in one row on desktop, stacked on mobile */}
          <div className="contact-cards-row">

            {/* Phone card */}
            <div className="contact-card-block">
              <div className="contact-card-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <h3 className="contact-card-title">Phone</h3>
              <p className="contact-card-sub" style={{ margin: '0 0 0.4rem' }}>
                If you're a seller, call/WhatsApp at{' '}
                <a href={`tel:${contactPhones[0].full}`} style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>
                  {contactPhones[0].display}
                </a>
              </p>
              <p className="contact-card-sub">
                If you're a buyer, call/WhatsApp at{' '}
                <a href={`tel:${contactPhones[1].full}`} style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>
                  {contactPhones[1].display}
                </a>
              </p>
            </div>

            {/* Email */}
            <a href={`mailto:${contactEmail}`} className="contact-card-block contact-card-link" onClick={() => trackEvent('ContactChannelClicked', { channel: 'email' })}>
              <div className="contact-card-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3 className="contact-card-title">Email</h3>
              <p className="contact-card-sub">{contactEmail}</p>
            </a>

            {/* Instagram */}
            <a href={`https://www.instagram.com/${contactInstagram}/`} target="_blank" rel="noopener noreferrer" className="contact-card-block contact-card-link" onClick={() => trackEvent('ContactChannelClicked', { channel: 'instagram' })}>
              <div className="contact-card-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </div>
              <h3 className="contact-card-title">Instagram</h3>
              <p className="contact-card-sub">@{contactInstagram}</p>
            </a>

          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default Contact