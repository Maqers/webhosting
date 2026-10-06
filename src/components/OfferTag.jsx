import { DIWALI_COUPON, hasDiwaliOffer } from '../data/offers'
import './OfferTag.css'

// "5% off with MAQERSDIWALI5" on Diwali products while the offer runs.
// Renders nothing for other products or once the offer has ended.
export default function OfferTag({ product, variant = 'card' }) {
  if (!hasDiwaliOffer(product)) return null
  const { percent, code, endsLabel } = DIWALI_COUPON
  if (variant === 'detail') {
    return (
      <p className="offer-tag offer-tag--detail">
        <span aria-hidden="true">🪔</span> Diwali offer: <strong>{percent}% off</strong> with code{' '}
        <strong className="offer-tag-code">{code}</strong> at checkout. Till {endsLabel}.
      </p>
    )
  }
  return (
    <p className="offer-tag offer-tag--card">
      {percent}% off with <span className="offer-tag-code">{code}</span>
    </p>
  )
}
