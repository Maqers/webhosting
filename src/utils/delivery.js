/**
 * Delivery window for a product, shared by the product page timeline and the
 * "Delivery time" filter so the filter never disagrees with the dates a
 * shopper sees on the product page.
 *
 * meta.delivery_time is the making/dispatch time ("2-3 days", "3-5 days").
 * Empty means the default of 3-4 days. Shipping adds 3-4 days on top.
 */
export function getDeliveryWindow(product) {
  const nums = (product?.meta?.delivery_time || '').match(/\d+/g)?.map(Number) || []
  const makingMin = nums[0] || 3
  const makingMax = nums[1] || makingMin + 1
  return {
    makingMin,
    makingMax,
    deliveryMinDays: makingMin + 3,
    deliveryMaxDays: makingMax + 4,
  }
}

// Bands for the filter, by the latest day the product page promises delivery
export const DELIVERY_BANDS = [
  { id: 'within-week', label: 'Within a week', min: 0, max: 7 },
  { id: '8-9-days', label: 'In 8 to 9 days', min: 8, max: 9 },
  { id: '10-plus-days', label: '10 days or more', min: 10, max: Infinity },
]

export const inDeliveryBand = (product, band) => {
  const { deliveryMaxDays } = getDeliveryWindow(product)
  return deliveryMaxDays >= band.min && deliveryMaxDays <= band.max
}

// ── Delivery charge ──────────────────────────────────────────────────────────
// Single source of truth for the delivery fee, used by the cart drawer,
// checkout, the product page's structured data and the Google Merchant feed.
// Change the numbers here and everything (including Google) follows.
export const FREE_DELIVERY_MIN = 499 // carts of ₹499 and above deliver free
export const DELIVERY_FEE = 49 // flat fee below that

export const getDeliveryFee = (subtotal) => (subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE)
