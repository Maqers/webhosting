/**
 * prerender-products.js
 * Runs after `vite build`. Reads dist/index.html (the real built shell, with
 * correct hashed asset tags) and, for every product, writes a static
 * dist/product/<slug>/index.html with that product's real title, description,
 * Open Graph tags, and JSON-LD Product schema already baked into the HTML —
 * plus a plain-text fallback block inside #root.
 *
 * Why this exists: the site is a pure client-rendered SPA (react-helmet-async
 * only injects <head> tags after JS runs), so a crawler's first, non-JS pass
 * over /product/<slug> sees none of the product's actual title/description/
 * price/structured data — just the generic site shell. Google Merchant
 * Center, Shopping, and Lens all lean on that first pass, not just the
 * (slower, less reliable) JS-rendering pass. This script gives that first
 * pass real content without a full SSR rewrite: Vercel serves a matching
 * static file in the output directory ahead of the SPA catch-all rewrite,
 * so /product/<slug> resolves to this file directly, and React still fully
 * takes over instantly for real visitors (createRoot replaces #root's
 * contents on mount, so there's no hydration mismatch to worry about).
 *
 * Usage: called by the "build" script in package.json:
 *   "build": "node scripts/generate-sitemap.js && vite build && node scripts/prerender-products.js"
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getAllProducts, getCategoryByIdOrSlug } from '../src/data/catalog.js'
import { buildReviewSchema } from '../src/utils/reviewSchema.js'
import { productMetaDescription } from '../src/utils/seoCopy.js'
import { SUPABASE_REVIEWS_URL, SUPABASE_PUBLIC_KEY } from './supabase-public.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')
const BASE_URL = 'https://www.maqers.in'

const template = readFileSync(resolve(DIST, 'index.html'), 'utf8')

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Strip the lightweight markup convention (**bold**, __underline__, ✨
// bullets, \n paragraph breaks) down to plain text for meta descriptions
// and the visible fallback block.
const toPlainText = (desc) =>
  String(desc ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/✨\s?/g, '')
    .split('\\n').join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

// Customer reviews live in Supabase (the product page fetches them in the
// browser). Pull them at build time too so the static JSON-LD includes them.
// Never fail the build over this: fall back to catalog reviews only.
async function fetchCustomerReviews() {
  try {
    const res = await fetch(SUPABASE_REVIEWS_URL, {
      headers: { apikey: SUPABASE_PUBLIC_KEY, Authorization: `Bearer ${SUPABASE_PUBLIC_KEY}` },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows = await res.json()
    const byProduct = {}
    for (const r of rows) (byProduct[r.product_id] ||= []).push(r)
    return byProduct
  } catch (err) {
    console.warn(`⚠ prerender-products — couldn't fetch customer reviews (${err.message}); using catalog reviews only`)
    return {}
  }
}
const customerReviewsByProduct = await fetchCustomerReviews()

const products = getAllProducts()
let written = 0

for (const product of products) {
  const plainDescription = toPlainText(product.description)
  // Search-result line (what it is, price, delivery) — same as the live page
  const searchLine = productMetaDescription(product)
  const metaDescription =
    searchLine.length > 155 ? searchLine.slice(0, 152).trimEnd() + '…' : searchLine

  const canonicalUrl = `${BASE_URL}/product/${product.slug}`
  const images = (product.images || []).map((img) => (img.startsWith('http') ? img : `${BASE_URL}${img}`))
  const primaryImage = images[0] || `${BASE_URL}/images/logo.png`
  const categoryName = getCategoryByIdOrSlug(product.categoryId)?.name || ''
  const fullTitle = `${product.title} | Maqers`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: plainDescription,
    image: images,
    sku: String(product.id),
    brand: { '@type': 'Brand', name: 'Maqers' },
    ...(categoryName && { category: categoryName }),
    ...(product.tags?.length > 0 && { keywords: product.tags.join(', ') }),
    ...buildReviewSchema(product.meta?.reviews, customerReviewsByProduct[product.id]),
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'INR',
      price: product.price,
      availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Maqers', url: BASE_URL },
    },
  }

  // data-rh marks these as react-helmet-async's own tags, so when React
  // mounts, <SeoHead> replaces them instead of adding a second canonical/
  // description/og set next to them.
  const headInjection = `
  <title>${escapeHtml(fullTitle)}</title>
  <meta data-rh="true" name="description" content="${escapeHtml(metaDescription)}">
  <link data-rh="true" rel="canonical" href="${canonicalUrl}">
  <meta data-rh="true" property="og:site_name" content="Maqers">
  <meta data-rh="true" property="og:title" content="${escapeHtml(fullTitle)}">
  <meta data-rh="true" property="og:description" content="${escapeHtml(metaDescription)}">
  <meta data-rh="true" property="og:image" content="${primaryImage}">
  <meta data-rh="true" property="og:type" content="product">
  <meta data-rh="true" property="og:url" content="${canonicalUrl}">
  <meta data-rh="true" property="product:price:amount" content="${product.price}">
  <meta data-rh="true" property="product:price:currency" content="INR">
  <meta data-rh="true" name="twitter:card" content="summary_large_image">
  <meta data-rh="true" name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta data-rh="true" name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta data-rh="true" name="twitter:image" content="${primaryImage}">
  <script data-rh="true" type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>`

  const inStock = product.inStock !== false
  const fallbackContent = `<div id="root"><main data-prerender>
    <h1>${escapeHtml(product.title)}</h1>
    <p>by Maqers</p>
    <img src="${primaryImage}" alt="${escapeHtml(product.title)}" width="600">
    <p>₹${escapeHtml(product.price)}</p>
    <p>${inStock ? 'In Stock' : 'Out of Stock'}</p>
    <p>${escapeHtml(plainDescription)}</p>
    ${categoryName ? `<p>Category: ${escapeHtml(categoryName)}</p>` : ''}
  </main></div>`

  let html = template
    .replace(/<title>[^<]*<\/title>\s*/, '')
    .replace(/<meta[^>]*name="description"[^>]*>\s*/, '')
    .replace('</head>', headInjection)
    .replace('<div id="root"></div>', fallbackContent)

  const outDir = resolve(DIST, 'product', product.slug)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'index.html'), html)
  written++
}

console.log(`✓ prerender-products — ${written} static product pages written to dist/product/*/index.html`)
