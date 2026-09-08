import { useEffect, useState } from 'react'
import './DiwaliSparkles.css'

const SESSION_KEY = 'maqers_diwali_sparkles_seen'
const SPARKLES = ['✨', '🪔', '✨', '🪔', '✨', '✨', '🪔', '✨', '✨', '🪔', '✨', '✨']

// Small one-time sparkle burst over the Diwali hero, played once per browser
// session (not on every Home visit/navigation) so it doesn't get grating.
export default function DiwaliSparkles() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let alreadySeen = false
    try { alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1' } catch { /* ignore */ }
    if (alreadySeen) return

    setShow(true)
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* ignore */ }

    const timer = setTimeout(() => setShow(false), 3200)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div className="diwali-sparkles" aria-hidden="true">
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="diwali-sparkle"
          style={{
            left: `${(i * 8.3 + (i % 3) * 5) % 100}%`,
            top: `${15 + ((i * 37) % 65)}%`,
            animationDelay: `${(i % 6) * 0.18}s`,
            fontSize: `${14 + (i % 4) * 6}px`,
          }}
        >
          {s}
        </span>
      ))}
    </div>
  )
}
