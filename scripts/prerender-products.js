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

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')
const BASE_URL = 'https://maqers.in'

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

const products = getAllProducts()
let written = 0

for (const product of products) {
  const plainDescription = toPlainText(product.description)
  const metaDescription =
    plainDescription.length > 155 ? plainDescription.slice(0, 152).trimEnd() + '…' : plainDescription

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

  const headInjection = `
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:site_name" content="Maqers">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:image" content="${primaryImage}">
  <meta property="og:type" content="product">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="product:price:amount" content="${product.price}">
  <meta property="product:price:currency" content="INR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
  <meta name="twitter:image" content="${primaryImage}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>`

  const inStock = product.inStock !== false
  const fallbackContent = `<div id="root"><main>
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
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', headInjection)
    .replace('<div id="root"></div>', fallbackContent)

  const outDir = resolve(DIST, 'product', product.slug)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'index.html'), html)
  written++
}

console.log(`✓ prerender-products — ${written} static product pages written to dist/product/*/index.html`)
