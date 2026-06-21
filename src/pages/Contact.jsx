import { useCallback, useMemo, useEffect, useState } from 'react'
import { copyToClipboard } from '../utils/clipboard'
import Toast from '../components/Toast'
import PhoneCard from '../components/PhoneCard'
import { getAllPhones, getWhatsAppNumber, getEmail, getInstagramUsername } from '../data/contactInfo'
import './Contact.css'
import '../styles/contact-hero-fix.css'

const Contact = () => {
  const contactPhones = useMemo(() => getAllPhones(), [])
  const contactEmail = useMemo(() => getEmail(), [])
  const contactWhatsApp = useMemo(() => getWhatsAppNumber(), [])
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
              <p className="contact-card-sub">
                {contactPhones.map((phone, i) => (
                  <span key={phone.type}>
                    {i > 0 && <span style={{ margin: '0 0.35rem', opacity: 0.4 }}>·</span>}
                    <a href={`tel:${phone.full}`} style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {phone.display}
                    </a>
                  </span>
                ))}
              </p>
            </div>

            {/* WhatsApp */}
            <a href={`https://wa.me/${contactWhatsApp}`} target="_blank" rel="noopener noreferrer" className="contact-card-block contact-card-link">
              <div className="contact-card-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <h3 className="contact-card-title">WhatsApp</h3>
              <p className="contact-card-sub">Text us anytime</p>
            </a>

            {/* Email */}
            <a href={`mailto:${contactEmail}`} className="contact-card-block contact-card-link">
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
            <a href={`https://www.instagram.com/${contactInstagram}/`} target="_blank" rel="noopener noreferrer" className="contact-card-block contact-card-link">
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