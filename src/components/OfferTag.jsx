import { DIWALI_COUPON, hasDiwaliOffer } from '../data/offers'
import './OfferTag.css'

// Under the card price (which shows the code price): "with code MAQERSDIWALI5".
// On the product page: the full offer line.
// Renders nothing for other products or once the offer has ended.
export default function OfferTag({ product, variant = 'card' }) {
  if (!hasDiwaliOffer(product)) return null
  const { percent, code } = DIWALI_COUPON
  if (variant === 'detail') {
    return (
      <p className="offer-tag offer-tag--detail">
        <span aria-hidden="true">🪔</span>{' '}
        {/* Phones get the short line; desktop keeps the full sentence */}
        <span className="offer-tag-long">
          Diwali offer: <strong>{percent}% off</strong> with code{' '}
          <strong className="offer-tag-code">{code}</strong> at checkout. Limited period offer.
        </span>
        <span className="offer-tag-short">
          <strong>{percent}% off</strong> with <strong className="offer-tag-code">{code}</strong>
        </span>
      </p>
    )
  }
  return (
    <p className="offer-tag offer-tag--card">
      with code <span className="offer-tag-code">{code}</span>
    </p>
  )
}
