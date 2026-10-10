/**
 * The "offers" block of a product page's Product structured data, shared by
 * the live page (ProductDetail.jsx) and the prerender script
 * (scripts/prerender-products.js) so Google reads the same price, shipping and
 * return terms before and after JavaScript runs.
 */
import { getDeliveryFee, getDeliveryWindow } from './delivery.js'

const BASE_URL = 'https://www.maqers.in'

export function buildOfferSchema(product, url) {
  const { makingMin, makingMax } = getDeliveryWindow(product)
  return {
    '@type': 'Offer',
    url,
    priceCurrency: 'INR',
    price: product.price,
    priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    availability: product.inStock !== false
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: 'Maqers', url: BASE_URL },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      // Shipping for this item bought on its own, same rule as checkout
      shippingRate: { '@type': 'MonetaryAmount', value: getDeliveryFee(product.price), currency: 'INR' },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        // Same making time + 3-4 days transit as the timeline on the product page
        handlingTime: { '@type': 'QuantitativeValue', minValue: makingMin, maxValue: makingMax, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 4, unitCode: 'DAY' },
      },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
    },
    // Matches the product page and /policies: pieces are made to order, so no
    // returns or exchanges (damaged or wrong items are handled as a claim).
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'IN',
      returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
    },
  }
}
