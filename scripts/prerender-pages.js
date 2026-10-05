/**
 * prerender-pages.js
 * Runs after prerender-products.js. Does for the homepage, every category and
 * occasion page, and the static info pages what prerender-products.js does for
 * products: bakes the real <title>, description, canonical, Open Graph tags
 * and a plain-HTML fallback (heading, intro, links to every product in it)
 * into a static file, so a crawler's first, non-JS pass sees real content
 * instead of an empty <div id="root"></div> titled "Maqers.in".
 *
 * The homepage is the tricky one: dist/index.html is also the SPA shell that
 * vercel.json rewrites every unknown route to. So the untouched shell is
 * copied to dist/app.html first (the rewrite now points there), and only then
 * is dist/index.html overwritten with the prerendered homepage.
 *
 * Keep titles/descriptions in sync with each page's <SeoHead> so the tab
 * title doesn't change when React takes over.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { categories, getAllProducts, getProductsByCategory, getPopularProducts, occasionProductMap } from '../src/data/catalog.js'
import { occasionCategories } from '../src/data/occasionCatalog.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '..', 'dist')
const BASE_URL = 'https://www.maqers.in'
const SITE_NAME = 'Maqers'
const DEFAULT_IMAGE = `${BASE_URL}/images/logo.png`

// Hidden from the storefront's category list (see Categories.jsx SOURCE_CATS)
const HIDDEN_CATEGORY_IDS = new Set(['Oxidised-jewellery'])

const template = readFileSync(resolve(DIST, 'index.html'), 'utf8')
// Untouched SPA shell for every route without a static file of its own
writeFileSync(resolve(DIST, 'app.html'), template)

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const truncate = (s) => (s.length > 155 ? s.slice(0, 152).trimEnd() + '…' : s)

const allProducts = getAllProducts()
const productById = new Map(allProducts.map((p) => [p.id, p]))
const visibleCategories = categories
  .filter((c) => !HIDDEN_CATEGORY_IDS.has(c.id))
  .sort((a, b) => a.order - b.order)
const sortedOccasions = [...occasionCategories].sort((a, b) => a.order - b.order)

const productList = (products) =>
  products.length
    ? `<ul>${products
        .map((p) => `<li><a href="/product/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a> ₹${escapeHtml(p.price)}</li>`)
        .join('')}</ul>`
    : ''

const linkList = (items) =>
  `<ul>${items.map(({ href, label }) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`).join('')}</ul>`

const occasionLinks = () => linkList(sortedOccasions.map((o) => ({ href: `/category/${o.slug}`, label: o.name })))
const categoryLinks = () => linkList(visibleCategories.map((c) => ({ href: `/category/${c.slug}`, label: c.name })))

function writePage({ path, title, description, heading, body, jsonLd }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : 'Maqers: Curated Handcrafted Gifts from India'
  const desc = truncate(description)
  const canonicalUrl = `${BASE_URL}${path}`
  // data-rh marks these as react-helmet-async's own tags, so when React
  // mounts, <SeoHead> replaces them instead of adding a second canonical/
  // description/og set next to them. The homepage JSON-LD is left unmarked:
  // no <SeoHead> re-adds it, so it should survive React mounting.
  const head = `
  <title>${escapeHtml(fullTitle)}</title>
  <meta data-rh="true" name="description" content="${escapeHtml(desc)}">
  <link data-rh="true" rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta data-rh="true" property="og:site_name" content="${SITE_NAME}">
  <meta data-rh="true" property="og:title" content="${escapeHtml(fullTitle)}">
  <meta data-rh="true" property="og:description" content="${escapeHtml(desc)}">
  <meta data-rh="true" property="og:image" content="${DEFAULT_IMAGE}">
  <meta data-rh="true" property="og:type" content="website">
  <meta data-rh="true" property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta data-rh="true" name="twitter:card" content="summary_large_image">
  <meta data-rh="true" name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta data-rh="true" name="twitter:description" content="${escapeHtml(desc)}">
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>`
  const root = `<div id="root"><main data-prerender>
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(description)}</p>
    ${body || ''}
  </main></div>`

  const html = template
    .replace(/<title>[^<]*<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', head)
    .replace('<div id="root"></div>', root)

  const outDir = path === '/' ? DIST : resolve(DIST, path.slice(1))
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'index.html'), html)
}

const pages = []

// ── Category pages (product type) ────────────────────────────────────────────
for (const cat of visibleCategories) {
  const products = getProductsByCategory(cat.id).filter(Boolean)
  pages.push({
    path: `/category/${cat.slug}`,
    title: `${cat.name}: Handmade Gifts`,
    description: `Browse handpicked ${cat.name.toLowerCase()} gifts from India's finest independent artisans. Unique, handcrafted, and customisable.`,
    heading: cat.name,
    body: productList(products),
  })
}

// ── Occasion pages (Diwali, For Your Mom, …) ────────────────────────────────
for (const occ of sortedOccasions) {
  const products = (occasionProductMap[occ.slug] || []).map((id) => productById.get(id)).filter(Boolean)
  pages.push({
    path: `/category/${occ.slug}`,
    title: `${occ.name}: Handmade Gifts`,
    description: occ.description
      ? `${occ.name} gifts: ${occ.description}`
      : `Browse handpicked ${occ.name.toLowerCase()} gifts from India's finest independent artisans. Unique, handcrafted, and customisable.`,
    heading: occ.name,
    body: productList(products),
  })
}

// ── Static pages ─────────────────────────────────────────────────────────────
pages.push(
  {
    path: '/products',
    title: 'All Handcrafted Gifts',
    description: "Browse 190+ handpicked handmade gifts from India's best independent artisans: jewellery, candles, home decor, skincare, hampers and more.",
    heading: 'All Handcrafted Gifts',
    body: productList(allProducts),
  },
  {
    path: '/categories',
    title: 'Shop All Collections',
    description: "Browse curated handmade gift collections from India's best independent artisans, by occasion or by product type.",
    heading: 'All Collections',
    body: `<h2>By occasion</h2>${occasionLinks()}<h2>By product</h2>${categoryLinks()}`,
  },
  {
    path: '/by-occasion',
    title: 'Shop Gifts by Occasion',
    description: "Find the perfect handmade gift by occasion: birthdays, weddings, anniversaries, Diwali and more. Curated from India's finest artisans.",
    heading: 'Shop by Occasion',
    body: occasionLinks(),
  },
  {
    path: '/by-product',
    title: 'Shop Gifts by Category',
    description: 'Browse handcrafted gifts by category: jewellery, candles, home decor, soaps, hampers and more. All from independent Indian artisans.',
    heading: 'Shop by Category',
    body: categoryLinks(),
  },
  {
    path: '/about',
    title: "About Maqers: India's Curated Handmade Gifting Platform",
    description: "Maqers connects gift buyers with India's finest independent artisans. Discover the story behind India's most thoughtful gifting destination.",
    heading: 'About Maqers',
  },
  {
    path: '/faqs',
    title: 'FAQs: Orders, Shipping & Payments',
    description: 'Common questions about ordering on Maqers: how to pay, delivery timelines, customisation options, and returns.',
    heading: 'Frequently Asked Questions',
  },
  {
    path: '/shipping',
    title: 'Shipping Policy',
    description: 'Maqers shipping timelines and delivery information.',
    heading: 'Shipping Policy',
  },
  {
    path: '/policies',
    title: 'Returns & Refund Policy',
    description: 'Maqers returns, exchange, and damaged-product policy.',
    heading: 'Returns & Refund Policy',
  },
  {
    path: '/contact',
    title: 'Contact Us',
    description: 'Questions about an order, a product or selling with us? Reach Maqers on WhatsApp, phone or email, any day between 10am and 11pm.',
    heading: 'Get in Touch',
  },
)

for (const page of pages) writePage(page)

// ── Homepage: written last, it overwrites the shell at dist/index.html ──────
const popular = getPopularProducts ? getPopularProducts().filter(Boolean).slice(0, 30) : []
writePage({
  path: '/',
  title: 'Curated Handcrafted Gifts from India',
  description: "Discover unique handmade gifts from India's best independent artisans: jewellery, candles, home decor, skincare and more. Curated for every person, every occasion.",
  heading: 'Maqers: Curated Handcrafted Gifts from India',
  body: `<h2>Shop by occasion</h2>${occasionLinks()}<h2>Shop by category</h2>${categoryLinks()}${
    popular.length ? `<h2>Popular gifts</h2>${productList(popular)}` : ''
  }`,
  jsonLd: [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: BASE_URL },
    { '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, url: BASE_URL, logo: DEFAULT_IMAGE },
  ],
})

console.log(`✓ prerender-pages — ${pages.length + 1} static pages written (home, ${visibleCategories.length} categories, ${sortedOccasions.length} occasions, info pages); SPA shell at dist/app.html`)
