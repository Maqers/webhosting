import './DiwaliSparkles.css'

const SPARKLES = ['✨', '🪔', '✨', '🪔', '✨', '✨', '🪔', '✨', '✨', '🪔', '✨', '✨']

// Sparkles and diyas that keep twinkling over the Diwali hero for as long as
// the visitor is on the page. Staggered delays mean a few are always lit
// while others fade, so it reads as a steady shimmer rather than a burst.
export default function DiwaliSparkles() {
  return (
    <div className="diwali-sparkles" aria-hidden="true">
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="diwali-sparkle"
          style={{
            left: `${(i * 8.3 + (i % 3) * 5) % 100}%`,
            top: `${15 + ((i * 37) % 65)}%`,
            animationDelay: `${(i * 0.37) % 3.6}s`,
            fontSize: `${14 + (i % 4) * 6}px`,
          }}
        >
          {s}
        </span>
      ))}
    </div>
  )
}
