/**
 * generate-sitemap.js
 * Runs before every Vite build. Reads catalog.js and writes public/sitemap.xml.
 * Any new product added via the admin portal will appear in the sitemap
 * automatically on the next deploy.
 *
 * Usage: called by the "build" script in package.json:
 *   "build": "node scripts/generate-sitemap.js && vite build"
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const BASE_URL = 'https://maqers.in'
const today = new Date().toISOString().split('T')[0]

// ── Parse catalog.js without importing it (avoids ESM/CJS issues at build time)
const catalogSrc = readFileSync(resolve(ROOT, 'src/data/catalog.js'), 'utf8')

// Extract all product slugs and categoryIds
const productRe = /id:\s*(\d+),\s*categoryId:\s*"([^"]+)"[\s\S]*?slug:\s*"([^"]+)"/g
const seen = new Set()
const products = []
let m
while ((m = productRe.exec(catalogSrc)) !== null) {
  if (!seen.has(m[1])) {
    seen.add(m[1])
    products.push({ id: m[1], categoryId: m[2], slug: m[3] })
  }
}

// Unique categories
const categoryIds = [...new Set(products.map(p => p.categoryId))]

// ── Build URL list ─────────────────────────────────────────────────────────────
const staticPages = [
  { url: '/',            priority: '1.0', changefreq: 'weekly'  },
  { url: '/products',    priority: '0.9', changefreq: 'weekly'  },
  { url: '/categories',  priority: '0.8', changefreq: 'weekly'  },
  { url: '/by-occasion', priority: '0.8', changefreq: 'monthly' },
  { url: '/by-product',  priority: '0.8', changefreq: 'monthly' },
  { url: '/about',       priority: '0.5', changefreq: 'monthly' },
  { url: '/contact',     priority: '0.5', changefreq: 'monthly' },
  { url: '/faqs',        priority: '0.5', changefreq: 'monthly' },
]

const categoryPages = categoryIds.map(id => ({
  url: `/category/${id}`,
  priority: '0.7',
  changefreq: 'weekly',
}))

const productPages = products.map(p => ({
  url: `/product/${p.slug}`,
  priority: '0.8',
  changefreq: 'monthly',
}))

const allPages = [...staticPages, ...categoryPages, ...productPages]

// ── Write XML ──────────────────────────────────────────────────────────────────
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  allPages.map(p =>
    `  <url>\n` +
    `    <loc>${BASE_URL}${p.url}</loc>\n` +
    `    <lastmod>${today}</lastmod>\n` +
    `    <changefreq>${p.changefreq}</changefreq>\n` +
    `    <priority>${p.priority}</priority>\n` +
    `  </url>`
  ).join('\n') +
  '\n</urlset>\n'

writeFileSync(resolve(ROOT, 'public/sitemap.xml'), xml)
console.log(`✓ sitemap.xml — ${allPages.length} URLs (${products.length} products, ${categoryIds.length} categories)`)