/**
 * generate-merchant-feed.js
 * Runs before every Vite build (alongside generate-sitemap.js). Reads
 * catalog.js and writes public/merchant-feed.xml — a Google Merchant Center
 * product feed in the standard RSS 2.0 + g: namespace format Google expects.
 *
 * Once written, this file is publicly served at:
 *   https://www.maqers.in/merchant-feed.xml
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
import { getDeliveryWindow, getDeliveryFee } from '../src/utils/delivery.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const BASE_URL = 'https://www.maqers.in'

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

// Google product category per catalog category: exact paths from
// google.com/basepages/producttype/taxonomy.en-US.txt (anything not on that
// list is ignored by Google). Hampers mix decor, candles and treats, so they
// go under Gift Giving rather than Google's food-only gift baskets.
const GOOGLE_CATEGORY = {
  'Florals':              'Home & Garden > Decor > Artificial Flora',
  'Candles':              'Home & Garden > Decor > Home Fragrances > Candles',
  'Handbags':             'Apparel & Accessories > Handbags, Wallets & Cases > Handbags',
  'Frames&Paintings':     'Home & Garden > Decor > Artwork',
  'Home-decor':           'Home & Garden > Decor',
  'resin-products':       'Home & Garden > Decor',
  'Handmade-Accessories': 'Apparel & Accessories > Jewelry',
  'Customised-Hampers':   'Arts & Entertainment > Party & Celebration > Gift Giving',
  'Handmade-Soaps':       'Health & Beauty > Personal Care > Cosmetics > Bath & Body > Bar Soap',
  'Wedding-Gifts':        'Arts & Entertainment > Party & Celebration > Gift Giving',
  'Cosmetics':            'Health & Beauty > Personal Care > Cosmetics',
  'Kids-Accessories':     'Apparel & Accessories > Clothing Accessories',
  'Charm-accessories':    'Apparel & Accessories > Jewelry > Charms & Pendants',
  'Oxidised-jewellery':   'Apparel & Accessories > Jewelry',
}

// Shopping matches on plain words, and "handmade gift" is what people search.
// Feed-only: the website keeps its titles. Not a product-type noun, because
// categories mix item types (a watch under Charms) and a wrong noun misleads.
const shoppingTitle = (title) =>
  `${title} - Handmade${/\bgifts?\b/i.test(title) ? '' : ' Gift'}`.slice(0, 150)

const products = getAllProducts()

const items = products.map((product) => {
  const images = (product.images || []).map((img) => (img.startsWith('http') ? img : `${BASE_URL}${img}`))
  const [imageLink, ...additionalImages] = images
  const categoryName = getCategoryByIdOrSlug(product.categoryId)?.name || ''
  const link = `${BASE_URL}/product/${product.slug}`
  const availability = product.inStock !== false ? 'in stock' : 'out of stock'
  const googleCategory = GOOGLE_CATEGORY[product.categoryId]
  // Making time (handling) from the same helper as the product page timeline
  const { makingMin, makingMax } = getDeliveryWindow(product)
  // A higher original price (shown struck through on the product page) is
  // sent as price + sale_price, which gives the "% off" label in Shopping
  const originalPrice = Number(product.meta?.originalPrice) || 0
  const onSale = originalPrice > product.price

  return (
    `  <item>\n` +
    `    <g:id>${product.id}</g:id>\n` +
    `    <title>${escapeXml(shoppingTitle(product.title))}</title>\n` +
    `    <description>${escapeXml(toPlainText(product.description))}</description>\n` +
    `    <link>${link}</link>\n` +
    (imageLink ? `    <g:image_link>${escapeXml(imageLink)}</g:image_link>\n` : '') +
    additionalImages.slice(0, 10).map((img) => `    <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>\n`).join('') +
    `    <g:availability>${availability}</g:availability>\n` +
    `    <g:price>${onSale ? originalPrice : product.price} INR</g:price>\n` +
    (onSale ? `    <g:sale_price>${product.price} INR</g:sale_price>\n` : '') +
    `    <g:condition>new</g:condition>\n` +
    `    <g:brand>Maqers</g:brand>\n` +
    // Handmade pieces have no barcode; without this Google expects a GTIN
    `    <g:identifier_exists>no</g:identifier_exists>\n` +
    (googleCategory ? `    <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>\n` : '') +
    (categoryName ? `    <g:product_type>${escapeXml(categoryName)}</g:product_type>\n` : '') +
    // Google prices shipping for one unit bought alone, so this is the same
    // rule as checkout applied to the item's price: free from ₹499, else ₹49
    `    <g:shipping>\n` +
    `      <g:country>IN</g:country>\n` +
    `      <g:service>Standard</g:service>\n` +
    `      <g:price>${getDeliveryFee(product.price)} INR</g:price>\n` +
    `      <g:min_transit_time>3</g:min_transit_time>\n` +
    `      <g:max_transit_time>4</g:max_transit_time>\n` +
    `    </g:shipping>\n` +
    `    <g:min_handling_time>${makingMin}</g:min_handling_time>\n` +
    `    <g:max_handling_time>${makingMax}</g:max_handling_time>\n` +
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
