import { useEffect, useMemo, useRef } from 'react'
import './CouponCelebration.css'

const CONFETTI_COLORS = ['#f5b301', '#e8425a', '#2bb6a8', '#4a6cf7', '#8bc34a', '#ff8a3d', '#b04ad6']
const CONFETTI_COUNT = 42

// Shown once when a coupon is applied: a confirmation card over a burst of
// confetti. Pure CSS animation, no library.
export default function CouponCelebration({ code, amount, onClose }) {
  const btnRef = useRef(null)

  const pieces = useMemo(() => Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.8 + Math.random() * 1.4,
    drift: (Math.random() - 0.5) * 160,
    spin: 360 + Math.random() * 540,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    shape: i % 3,
  })), [])

  useEffect(() => {
    btnRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="coupon-celebration" role="dialog" aria-modal="true" aria-labelledby="coupon-celebration-title" onClick={onClose}>
      <div className="coupon-confetti" aria-hidden="true">
        {pieces.map(p => (
          <span
            key={p.id}
            className={`coupon-confetti-piece coupon-confetti-piece--${p.shape}`}
            style={{
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            }}
          />
        ))}
      </div>

      <div className="coupon-celebration-card" onClick={e => e.stopPropagation()}>
        <div className="coupon-celebration-icon" aria-hidden="true">
          <span className="coupon-celebration-rays" />
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 12.5 10 17 19 7.5" />
          </svg>
        </div>
        <p className="coupon-celebration-code" id="coupon-celebration-title">&lsquo;{code}&rsquo; applied</p>
        <p className="coupon-celebration-saved">You saved &#8377;{amount.toLocaleString('en-IN')}</p>
        <button ref={btnRef} type="button" className="coupon-celebration-btn" onClick={onClose}>
          Woohoo! Thanks
        </button>
      </div>
    </div>
  )
}
