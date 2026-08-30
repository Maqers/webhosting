/**
 * generate-merchant-feed.js
 * Runs before every Vite build (alongside generate-sitemap.js). Reads
 * catalog.js and writes public/merchant-feed.xml — a Google Merchant Center
 * product feed in the standard RSS 2.0 + g: namespace format Google expects.
 *
 * Once written, this file is publicly served at:
 *   https://maqers.in/merchant-feed.xml
 *
 * One-time manual step (not something a script can do): in Google Merchant
 * Center, add this URL as a scheduled feed (Products > Feeds > Add feed >
 * Google Sheets/Scheduled fetch > enter the URL above). Merchant Center then
 * re-fetches it automatically, so every new/edited/deleted product from the
 * Admin Portal flows through on the next scheduled fetch with no manual
 * re-export ever needed.
 *
 * Field reference: https://support.google.com/merchants/answer/7052112
 *
 * Usage: called by the "build" script in package.json.
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getAllProducts, getCategoryByIdOrSlug } from '../src/data/catalog.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const BASE_URL = 'https://maqers.in'

const escapeXml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

// Same markup-stripping convention used elsewhere for descriptions
// (**bold**, __underline__, ✨ bullets, \n paragraph breaks) → plain text.
const toPlainText = (desc) =>
  String(desc ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/✨\s?/g, '')
    .split('\\n').join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

const products = getAllProducts()

const items = products.map((product) => {
  const images = (product.images || []).map((img) => (img.startsWith('http') ? img : `${BASE_URL}${img}`))
  const [imageLink, ...additionalImages] = images
  const categoryName = getCategoryByIdOrSlug(product.categoryId)?.name || ''
  const link = `${BASE_URL}/product/${product.slug}`
  const availability = product.inStock !== false ? 'in stock' : 'out of stock'

  return (
    `  <item>\n` +
    `    <g:id>${product.id}</g:id>\n` +
    `    <title>${escapeXml(product.title)}</title>\n` +
    `    <description>${escapeXml(toPlainText(product.description))}</description>\n` +
    `    <link>${link}</link>\n` +
    (imageLink ? `    <g:image_link>${escapeXml(imageLink)}</g:image_link>\n` : '') +
    additionalImages.slice(0, 10).map((img) => `    <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>\n`).join('') +
    `    <g:availability>${availability}</g:availability>\n` +
    `    <g:price>${product.price} INR</g:price>\n` +
    `    <g:condition>new</g:condition>\n` +
    `    <g:brand>Maqers</g:brand>\n` +
    (categoryName ? `    <g:product_type>${escapeXml(categoryName)}</g:product_type>\n` : '') +
    `  </item>`
  )
})

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n' +
  '<channel>\n' +
  '  <title>Maqers Product Feed</title>\n' +
  `  <link>${BASE_URL}</link>\n` +
  '  <description>Handcrafted gifts from independent Indian artisans, curated by Maqers</description>\n' +
  items.join('\n') + '\n' +
  '</channel>\n' +
  '</rss>\n'

writeFileSync(resolve(ROOT, 'public/merchant-feed.xml'), xml)
console.log(`✓ merchant-feed.xml — ${products.length} products`)
