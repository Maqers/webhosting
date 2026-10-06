/**
 * Site-wide offers. Checkout reads the coupon from here, and the product
 * cards / product page show the matching label, so both switch off together
 * when the offer ends — no deploy needed.
 */
import { occasionProductMap } from './catalog'

export const DIWALI_COUPON = {
  code: 'MAQERSDIWALI5',
  percent: 5,
  // Last moment the code works: end of 9 November 2026, India time
  endsAt: new Date('2026-11-09T23:59:59+05:30').getTime(),
  // Whatever is on the Diwali page (admin's occasion list)
  productIds: new Set(occasionProductMap.diwali || []),
}

export const isOfferLive = (offer, now = Date.now()) => now <= offer.endsAt

export const hasDiwaliOffer = (product, now = Date.now()) =>
  !!product && isOfferLive(DIWALI_COUPON, now) && DIWALI_COUPON.productIds.has(product.id)

// Discount per unit, rounded per unit. The card, cart and checkout all use
// this, so a ₹950 item is ₹902 everywhere (and a cart total never drifts ₹1
// from the sum of its lines).
export const diwaliUnitDiscount = (price) => Math.round((Number(price) * DIWALI_COUPON.percent) / 100)
export const priceWithDiwaliCode = (price) => price - diwaliUnitDiscount(price)

// Total code discount for cart lines ({ id, price, qty }); 0 once it ends
export const diwaliCartDiscount = (items, now = Date.now()) =>
  items.reduce((sum, i) => sum + (hasDiwaliOffer(i, now) ? diwaliUnitDiscount(i.price) * i.qty : 0), 0)
