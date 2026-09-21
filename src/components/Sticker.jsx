import { getSticker } from '../data/stickers'
import './Sticker.css'

/**
 * A handwritten sticker. Renders nothing unless the product has earned one,
 * so callers can drop it in without guarding.
 *
 * Pass `sticker` to render a specific one (the About page uses this for its
 * fixed, non-product stickers); otherwise pass `product` and let the library
 * decide.
 */
const Sticker = ({ product, sticker, density, className = '', tilt = true }) => {
  const chosen = sticker || (product ? getSticker(product, density ? { density } : undefined) : null)
  if (!chosen) return null

  // Deterministic small rotation so a row of stickers doesn't look rubber-stamped.
  const lean = tilt ? (chosen.id.charCodeAt(0) % 2 === 0 ? -2.2 : 1.8) : 0

  return (
    <span className={`sticker ${className}`} style={{ '--sticker-tilt': `${lean}deg` }}>
      {chosen.emoji && (
        <span className="sticker-emoji" aria-hidden="true">
          {chosen.emoji}
        </span>
      )}
      {chosen.text}
    </span>
  )
}

export default Sticker
