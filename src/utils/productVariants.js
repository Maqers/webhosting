/**
 * Expands products with multiple colours into one card per colour for grid/listing
 * display. Products with a single colour, no colours, or only size variants are
 * left untouched — colour is the only variant that gets its own card.
 *
 * A product only splits if EVERY colour is linked to its own distinct image
 * (a valid, unique imageIndex). Colours that don't point to a specific photo —
 * legacy string-format colours, or several colours sharing the same imageIndex
 * because no one bothered to shoot them separately — have nothing visually
 * different to show in a card, so the whole product falls back to a single
 * card instead of a confusing partial split.
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
    const allLinkedToOwnImage =
      Array.isArray(colors) &&
      colors.length > 1 &&
      p.images?.length > 0 &&
      colors.every(c => c && typeof c === 'object' && c.name && Number.isInteger(c.imageIndex)) &&
      new Set(colors.map(c => c.imageIndex)).size === colors.length

    if (allLinkedToOwnImage) {
      colors.forEach((c, idx) => {
        const mainImage = p.images[c.imageIndex] || p.images[0]
        const restImages = p.images.filter((_, i) => i !== c.imageIndex)
        expanded.push({
          ...p,
          title: `${p.title} — ${c.name}`,
          images: [mainImage, ...restImages],
          _variantColor: c.name,
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
