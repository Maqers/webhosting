/**
 * Site-wide offers. Checkout reads the coupon from here, and the product
 * cards / product page show the matching label, so both switch off together
 * when the offer ends — no deploy needed.
 */
import { occasionProductMap, getProductById } from './catalog'

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

// First-order coupon: 5% off the whole bag for a logged-in shopper with no
// past orders. The welcome popup advertises it; checkout checks eligibility.
export const NEW_USER_COUPON = {
  code: 'MAQERSNEW',
  percent: 5,
}
export const newUserDiscount = (total) => Math.round((Number(total) * NEW_USER_COUPON.percent) / 100)

// Same-seller delivery saving, shown as MAQERSPL. Some sellers build delivery
// into the price of every product (meta.deliveryIncluded + meta.deliveryAmount,
// set in the admin). Order two of their products and the customer pays that
// delivery twice for what ships once. So, per seller: when 2 or more different
// products with delivery included are in the cart, take the smallest of their
// delivery amounts off. Products flagged noDeliveryDiscount (hampers, which
// each ship separately) and products without delivery included don't count.
// Automatic: it is a correction to the price, not a promo code, so it applies
// with or without a coupon and without a login.
export const SELLER_DELIVERY_CODE = 'MAQERSPL'

export function sellerDeliveryDiscount(items) {
  const bySeller = new Map() // sellerCode -> Map(productId -> deliveryAmount)
  for (const line of items || []) {
    const meta = getProductById(line.id)?.meta
    const code = meta?.sellerCode
    const amount = Number(meta?.deliveryAmount)
    if (!code || !meta.deliveryIncluded || meta.noDeliveryDiscount || !(amount > 0)) continue
    if (!bySeller.has(code)) bySeller.set(code, new Map())
    bySeller.get(code).set(line.id, amount)
  }
  const groups = []
  for (const [sellerCode, products] of bySeller) {
    if (products.size < 2) continue
    groups.push({ sellerCode, count: products.size, amount: Math.min(...products.values()) })
  }
  return { total: groups.reduce((sum, g) => sum + g.amount, 0), groups }
}
