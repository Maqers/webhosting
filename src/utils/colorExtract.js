// Curated colour list for the "shop by colour" filter. Multi-word entries
// are listed so exact-phrase keyword checks (e.g. "rose gold") can be tried
// before falling back to the plainer single-word ones, and each carries a
// CSS colour value for rendering a swatch.
export const COLOR_OPTIONS = [
  { name: 'Rose Gold', swatch: '#b76e79', keywords: ['rose gold'] },
  { name: 'Gold', swatch: '#d4af37', keywords: ['gold', 'golden'] },
  { name: 'Silver', swatch: '#c0c0c0', keywords: ['silver'] },
  { name: 'Rose Pink', swatch: '#ff66a3', keywords: ['rose pink'] },
  { name: 'Pink', swatch: '#ff8fb3', keywords: ['pink'] },
  { name: 'Red', swatch: '#d13a3a', keywords: ['red'] },
  { name: 'Maroon', swatch: '#7b2d3a', keywords: ['maroon'] },
  { name: 'Sky Blue', swatch: '#87ceeb', keywords: ['sky blue'] },
  { name: 'Navy Blue', swatch: '#1a2a4a', keywords: ['navy'] },
  { name: 'Blue', swatch: '#3a6bd1', keywords: ['blue'] },
  { name: 'Mint Green', swatch: '#98d8b0', keywords: ['mint green', 'mint'] },
  { name: 'Green', swatch: '#4caf50', keywords: ['green'] },
  { name: 'Yellow', swatch: '#f4d13d', keywords: ['yellow'] },
  { name: 'Orange', swatch: '#f2994a', keywords: ['orange'] },
  { name: 'Peach', swatch: '#ffcba4', keywords: ['peach'] },
  { name: 'Purple', swatch: '#9b59b6', keywords: ['purple', 'lavender', 'lilac'] },
  { name: 'Brown', swatch: '#8b5e3c', keywords: ['brown', 'tan'] },
  { name: 'Beige', swatch: '#e8dcc8', keywords: ['beige', 'cream', 'ivory'] },
  { name: 'Black', swatch: '#222222', keywords: ['black'] },
  { name: 'White', swatch: '#f5f5f5', keywords: ['white'] },
  { name: 'Grey', swatch: '#9e9e9e', keywords: ['grey', 'gray'] },
  { name: 'Multicolour', swatch: 'linear-gradient(135deg,#e74c3c,#3498db,#2ecc71)', keywords: ['multicolour', 'multicolor', 'multi-colour', 'multi-color', 'rainbow'] },
]

function normalizeColorName(raw) {
  const lower = (raw || '').trim().toLowerCase()
  const match = COLOR_OPTIONS.find(c => c.keywords.some(k => lower === k || lower.includes(k)))
  return match ? match.name : null
}

/**
 * Returns the colour name(s) for a product. Prefers the structured
 * meta.colors data (set via the Admin Portal colour-variant tool); only
 * falls back to scanning title/description/tags for known colour words
 * when a product has no structured colours at all, since that data is
 * far less reliable (a description mentioning "gold trim" doesn't always
 * mean the product itself is gold).
 */
export function getProductColors(product) {
  const structured = (product.meta?.colors || [])
    .map(c => (typeof c === 'object' ? c.name : c))
    .filter(Boolean)

  if (structured.length > 0) {
    const mapped = structured.map(n => normalizeColorName(n) || n)
    return [...new Set(mapped)]
  }

  const haystack = `${product.title || ''} ${product.description || ''} ${(product.tags || []).join(' ')}`.toLowerCase()
  const found = []
  for (const opt of COLOR_OPTIONS) {
    if (opt.keywords.some(k => haystack.includes(k))) found.push(opt.name)
  }
  return found
}

/** Colour options that at least one product in the given list actually has — keeps the filter chips from showing dead-end colours with zero matches. */
export function getAllUsedColors(products) {
  const used = new Set()
  products.forEach(p => getProductColors(p).forEach(c => used.add(c)))
  return COLOR_OPTIONS.filter(opt => used.has(opt.name))
}
