import { useState } from 'react'
import { copyToClipboard } from '../utils/clipboard'
import './PhoneCard.css'

/**
 * Reusable Phone Card Component
 * 
 * Displays a phone number with click-to-copy functionality
 * Supports primary and alternate phone numbers
 */
const PhoneCard = ({ phone, onCopy }) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const success = await copyToClipboard(phone.display)

    if (success) {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)

      if (onCopy) {
        onCopy(phone.display)
      }
    }
  }

  const handleCall = (e) => {
    // On mobile, tel: links will trigger call
    // On desktop, this will be handled by copy action
    // Zoom-safe: Use CSS media query instead of window.innerWidth
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    if (isMobile) {
      // Let the default tel: link behavior work on mobile
      return
    }
    // On desktop, prevent default and copy instead
    e.preventDefault()
    handleCopy(e)
  }

  return (
    <div className={`phone-card phone-card-${phone.type}`}>
      <a
        href={`tel:${phone.full}`}
        onClick={handleCall}
        className="phone-card-link"
        aria-label={`${phone.label}: ${phone.display}. Click to call or copy`}
      >
        <div className="phone-card-content">
          <div className="phone-card-header">
            <span className="phone-card-label">{phone.label}</span>
            {isCopied && (
              <span className="phone-card-copied" role="status" aria-live="polite">
                Copied!
              </span>
            )}
          </div>
          <div className="phone-card-number">{phone.display}</div>
          <span className="phone-card-hint">
            {/* Zoom-safe: Use CSS to show/hide instead of JS */}
            <span className="mobile-only">Tap to call</span>
            <span className="desktop-only">Click to copy</span>
          </span>
        </div>
      </a>
    </div>
  )
}

export default PhoneCard

