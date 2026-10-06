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

// Price after the Diwali code, rounded exactly like checkout's discount
export const priceWithDiwaliCode = (price) =>
  price - Math.round((Number(price) * DIWALI_COUPON.percent) / 100)
