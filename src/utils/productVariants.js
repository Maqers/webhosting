/**
 * Expands products with multiple colours into one card per colour for grid/listing
 * display. Products with a single colour, no colours, or only size variants are
 * left untouched — colour is the only variant that gets its own card.
 *
 * Each expanded entry keeps the product's real id/slug (cart, wishlist, and the
 * product detail page all still operate on the one underlying product) but gets
 * a colour-specific title, a reordered images array (that colour's photo first),
 * and a `_variantColor` marker so callers can deep-link to `?color=` and give
 * each card a unique React key.
 */
export function expandProductsByColor(products) {
  const expanded = []
  for (const p of products) {
    const colors = p.meta?.colors
    if (Array.isArray(colors) && colors.length > 1 && p.images?.length > 0) {
      colors.forEach((c, idx) => {
        const colorName = c && typeof c === 'object' ? c.name : String(c)
        if (!colorName) return
        const imgIdx = c && typeof c === 'object' && Number.isInteger(c.imageIndex) ? c.imageIndex : 0
        const mainImage = p.images[imgIdx] || p.images[0]
        const restImages = p.images.filter((_, i) => i !== imgIdx)
        expanded.push({
          ...p,
          title: `${p.title} — ${colorName}`,
          images: [mainImage, ...restImages],
          _variantColor: colorName,
          _variantKey: `${p.id}-color-${idx}`,
        })
      })
    } else {
      expanded.push(p)
    }
  }
  return expanded
}

export function productLinkQuery(product) {
  return product._variantColor ? `?color=${encodeURIComponent(product._variantColor)}` : ''
}
