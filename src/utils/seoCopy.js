/**
 * Search-result titles and descriptions for category/occasion pages and
 * product pages. Shared by the live pages (<SeoHead>) and the prerender
 * scripts, so Google sees the same text before and after JavaScript runs.
 *
 * Titles here exclude the " | Maqers" suffix (SeoHead / prerender add it).
 * Descriptions lead with what matters (price, delivery) because Google cuts
 * them at about 160 characters, so they are built from whole sentences.
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
    const description = fitMeta(`${name}: handmade gifts by Indian artisans${from}. ${delivery}`, occasionDescription || '')
    return { title, description }
  }
  return {
    title: `Handmade ${name}${from}`,
    description: trimMeta(`Handpicked handmade ${name.toLowerCase()} from India's independent artisans${from}. ${delivery}`),
  }
}

// Google shows roughly 155-160 characters of a meta description
export const META_MAX = 160

// Product copy as plain text for a search snippet: site markup stripped, and an
// emoji that sat between two sentences ("...charm ⏳This handcrafted...") turned
// into a full stop so the sentences split properly. Remaining emoji dropped.
function plainForMeta(desc) {
  return String(desc ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/✨\s?/g, '')
    .split('\\n').join(' ')
    .split('\n').join(' ')
    .replace(/([a-z0-9\u2019'")])\s*(?:\p{Extended_Pictographic}\uFE0F?\s*)+(?=[A-Z])/gu, '$1. ')
    .replace(/\p{Extended_Pictographic}\uFE0F?/gu, '')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const splitSentences = (text) =>
  (text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || []).map(t => t.trim()).filter(Boolean)

// Longest run of the sentence's clauses that fits in `room` characters,
// closed with a full stop. Used only when not even the first whole sentence fits.
function clauseThatFits(sentence, room) {
  const clauses = sentence.replace(/[.!?]+$/, '').match(/[^,;:]+[,;:]?/g) || []
  let best = ''
  let acc = ''
  for (const c of clauses) {
    acc += c
    const candidate = acc.trim().replace(/[,;:]$/, '') + '.'
    if (candidate.length > room) break
    best = candidate
  }
  return best.length >= 25 ? best : ''
}

// Last-resort trim for text that is over the limit: end at a full sentence if
// one fits, otherwise at a word boundary with an ellipsis.
export function trimMeta(text, max = META_MAX) {
  const t = String(text ?? '').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  if (stop > max * 0.5) return cut.slice(0, stop + 1)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\s]+$/, '') + '\u2026'
}

// head + as many whole sentences of `extra` as fit. Nothing is cut mid-sentence.
export function fitMeta(head, extra = '', max = META_MAX) {
  let out = String(head).trim()
  const sentences = splitSentences(String(extra).trim())
  let added = 0
  for (const raw of sentences) {
    const sentence = /[.!?]$/.test(raw) ? raw : `${raw}.`
    const next = `${out} ${sentence}`
    if (next.length > max) break
    out = next
    added++
  }
  if (added === 0 && sentences.length) {
    const clause = clauseThatFits(sentences[0], max - out.length - 1)
    if (clause) out = `${out} ${clause}`
  }
  return trimMeta(out, max)
}

export function productMetaDescription(product) {
  const price = Number(product.price)
  const hasSizes = product.meta?.sizePrices && Object.keys(product.meta.sizePrices).length > 0
  const free = price >= FREE_DELIVERY_MIN ? 'free delivery' : `free delivery on orders of ${rupees(FREE_DELIVERY_MIN)}+`
  const priceText = `${rupees(price)}${hasSizes ? ' onwards' : ''}`
  const plain = plainForMeta(product.description)

  // Full lead first; if that leaves no room for a sentence about the product
  // itself, use a tighter lead so the snippet says what the piece is.
  const full = fitMeta(`${product.title}, handmade in India. ${priceText} with ${free}.`, plain)
  const lead = `${product.title}, handmade in India. ${priceText} with ${free}.`
  if (full.length > lead.length) return full
  const compact = fitMeta(`${product.title}. ${priceText}, ${price >= FREE_DELIVERY_MIN ? 'free delivery' : 'free delivery over ' + rupees(FREE_DELIVERY_MIN)}.`, plain)
  return compact.length > `${product.title}. ${priceText}, free delivery.`.length + 8 ? compact : full
}
