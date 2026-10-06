/**
 * Search-result titles and descriptions for category/occasion pages and
 * product pages. Shared by the live pages (<SeoHead>) and the prerender
 * scripts, so Google sees the same text before and after JavaScript runs.
 *
 * Titles here exclude the " | Maqers" suffix (SeoHead / prerender add it).
 * Descriptions lead with what matters (price, delivery) because Google cuts
 * them at about 155 characters.
 */
import { FREE_DELIVERY_MIN } from './delivery.js'

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`

// Cheapest in-stock price, falling back to any price
export function lowestPrice(products) {
  const priced = products.filter(p => Number(p?.price) > 0)
  const inStock = priced.filter(p => p.inStock !== false)
  const pool = inStock.length ? inStock : priced
  return pool.length ? Math.min(...pool.map(p => Number(p.price))) : null
}

// Hand-written title leads for the highest-traffic occasions
const OCCASION_TITLE = {
  diwali: (from) => `Handmade Diwali Gifts: Diyas, Hampers & Decor${from}`,
}

export function categorySeo({ name, slug, isOccasion, occasionDescription, minPrice }) {
  const from = minPrice ? ` from ${rupees(minPrice)}` : ''
  const delivery = `Free delivery on orders of ${rupees(FREE_DELIVERY_MIN)} and above.`

  if (isOccasion) {
    const title = OCCASION_TITLE[slug]?.(from) ?? `${name}: Handmade Gifts${from}`
    const description = `${name}: handmade gifts by Indian artisans${from}. ${delivery}${occasionDescription ? ` ${occasionDescription}` : ''}`
    return { title, description }
  }
  return {
    title: `Handmade ${name}${from}`,
    description: `Handpicked handmade ${name.toLowerCase()} from India's independent artisans${from}. ${delivery}`,
  }
}

// First sentence of the product copy, stripped of the site's markup
function firstSentence(desc) {
  const plain = String(desc ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/✨\s?/g, '')
    .split('\\n').join(' ')
    .split('\n').join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  const m = plain.match(/^.*?[.!?](\s|$)/)
  return (m ? m[0] : plain).trim()
}

export function productMetaDescription(product) {
  const price = Number(product.price)
  const hasSizes = product.meta?.sizePrices && Object.keys(product.meta.sizePrices).length > 0
  const delivery = price >= FREE_DELIVERY_MIN
    ? 'free delivery'
    : `free delivery on orders of ${rupees(FREE_DELIVERY_MIN)}+`
  return `${product.title}, handmade in India. ${rupees(price)}${hasSizes ? ' onwards' : ''} with ${delivery}. ${firstSentence(product.description)}`
}
