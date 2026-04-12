/**
 * OCCASION CATALOG — Maqers
 * Import this file alongside catalog.js.
 * Adds occasion categories + occasionProductMap WITHOUT touching the live catalog.
 * This preserves all original product descriptions.
 */

export const occasionCategories = [
  { id: "for-your-best-friend",  name: "For Your Best Friend",    slug: "for-your-best-friend",  emoji: "🫂", order: 1  },
  { id: "for-your-partner",      name: "For Your Partner",         slug: "for-your-partner",       emoji: "💕", order: 2  },
  { id: "situationship",         name: "For Your Situationship",   slug: "situationship",           emoji: "🫠", order: 3  },
  { id: "self-love-kits",        name: "Self-Love Kits",           slug: "self-love-kits",          emoji: "🌸", order: 4  },
  { id: "breakup-hampers",       name: "Breakup Hampers",          slug: "breakup-hampers",         emoji: "🫶", order: 5  },
  { id: "late-night-cravings",   name: "Midnight Crisis Gifts",    slug: "late-night-cravings",     emoji: "🌙", order: 6  },
  { id: "the-main-character",    name: "Main Character Energy",    slug: "the-main-character",      emoji: "✨", order: 7  },
  { id: "for-your-work-friend",  name: "For Your Work Friend",     slug: "for-your-work-friend",    emoji: "☕", order: 8  },
  { id: "for-your-mom",          name: "For Your Mom",             slug: "for-your-mom",            emoji: "🌷", order: 9  },
  { id: "for-your-dad",          name: "For Your Dad",             slug: "for-your-dad",            emoji: "🫡", order: 10 },
  { id: "for-your-sibling",      name: "For Your Sibling",         slug: "for-your-sibling",        emoji: "👀", order: 11 },
  { id: "the-host-gift",         name: "The Host Gift",            slug: "the-host-gift",           emoji: "🥂", order: 12 },
  { id: "occasion-gifts",        name: "Occasion Gifts",           slug: "occasion-gifts",          emoji: "🎉", order: 13 },
]

export const occasionProductMap = {
  "for-your-best-friend":  [4, 8, 10, 12, 56, 57, 62, 64, 65, 71, 9, 110],
  "for-your-partner":      [5, 9, 29, 27, 64, 65, 8, 57, 32, 33, 35, 36, 37],
  "situationship":         [10, 12, 1, 4, 39, 109, 110, 2, 63],
  "self-love-kits":        [109, 110, 111, 105, 107, 106, 108, 68, 69, 70, 71],
  "breakup-hampers":       [109, 65, 9, 5, 71, 64, 111, 68, 70, 110],
  "late-night-cravings":   [10, 12, 39, 63, 1, 4, 65, 71, 109, 110],
  "the-main-character":    [57, 56, 8, 4, 79, 83, 74, 75, 76, 109, 111, 3, 7, 67],
  "for-your-work-friend":  [38, 39, 40, 41, 59, 60, 10, 12],
  "for-your-mom":          [27, 28, 73, 77, 80, 81, 83, 29, 64, 65],
  "for-your-dad":          [38, 59, 41, 40, 60],
  "for-your-sibling":      [10, 12, 24, 25, 26, 42, 43, 44, 84, 94, 3, 7, 67],
  "the-host-gift":         [32, 33, 34, 35, 36, 37, 9, 5, 106, 107, 27, 28],
  "occasion-gifts":        [64, 65, 71, 27, 28, 29, 32, 33, 36, 37, 56, 57, 8],
}

/**
 * Get products for an occasion slug using the live catalog's getAllProducts.
 * Pass getAllProducts from catalog.js as the first argument.
 */
export const getOccasionProducts = (getAllProductsFn, slug) => {
  if (!slug || slug === 'all') return getAllProductsFn()
  const ids = occasionProductMap[slug]
  if (ids) {
    const all = getAllProductsFn()
    return ids.map(id => all.find(p => p.id === id)).filter(Boolean)
  }
  return []
}