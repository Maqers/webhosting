/**
 * OCCASION CATALOG — Maqers
 * Product IDs are read from catalog.js occasionProductMap — single source of truth.
 * This file only stores display metadata: name, emoji, description, order.
 */

export const occasionCategories = [
  {
    id: "shaadi-fever",
    name: "Shaadi Fever",
    slug: "shaadi-fever",
    emoji: "💍",
    order: 0,
    description: "Because someone you know is getting married and you need to show up with something better than an envelope."
  },
  {
    id: "for-your-best-friend",
    name: "For Your Best Friend",
    slug: "for-your-best-friend",
    emoji: "🫂",
    order: 1,
    description: "The one who knows too much. Gift them well — they deserve it, and frankly, you owe them."
  },
  {
    id: "for-your-girlfriend",
    name: "For Your Girlfriend",
    slug: "for-your-girlfriend",
    emoji: "💕",
    order: 2,
    description: "She said 'don't get me anything' and meant the opposite. You know this. Act accordingly."
  },
  {
    id: "for-your-boyfriend",
    name: "For Your Boyfriend",
    slug: "for-your-boyfriend",
    emoji: "🫶",
    order: 3,
    description: "He's low-maintenance, but that doesn't mean you have to be. Surprise him. He'll remember it forever."
  },
  {
    id: "situationship",
    name: "For Your Situationship",
    slug: "situationship",
    emoji: "🫠",
    order: 4,
    description: "Not too much, not too little. The art of gifting someone you like but won't label. We get it."
  },
  {
    id: "self-love-kits",
    name: "Self-Love Kits",
    slug: "self-love-kits",
    emoji: "🌸",
    order: 5,
    description: "Treat yourself. You've been doing the most. You deserve something pretty and completely unnecessary."
  },
  {
    id: "breakup-hampers",
    name: "Breakup Hampers",
    slug: "breakup-hampers",
    emoji: "💔",
    order: 6,
    description: "For when it's over. Send your friend something that says 'I love you more than he did anyway.'"
  },
  {
    id: "birthday",
    name: "Birthday Gifts",
    slug: "birthday",
    emoji: "🎂",
    order: 7,
    description: "Because 'happy birthday' in a text is not a gift. Show up properly."
  },
  {
    id: "late-night-cravings",
    name: "Midnight Crisis Gifts",
    slug: "late-night-cravings",
    emoji: "🌙",
    order: 8,
    description: "It's 1am, you just remembered someone's birthday is tomorrow. We've got you. No judgment."
  },
  {
    id: "the-main-character",
    name: "Main Character Energy",
    slug: "the-main-character",
    emoji: "✨",
    order: 9,
    description: "For the friend who walks into a room like a movie protagonist. They deserve gifts that match the energy."
  },
  {
    id: "for-your-work-friend",
    name: "For Your Work Friend",
    slug: "for-your-work-friend",
    emoji: "☕",
    order: 10,
    description: "The colleague who makes Monday bearable. Not your bestie, not your boss. The in-between one."
  },
  {
    id: "for-your-mom",
    name: "For Your Mom",
    slug: "for-your-mom",
    emoji: "🌷",
    order: 11,
    description: "She's done everything. A gift won't make you even, but it's a good start."
  },
  {
    id: "for-your-dad",
    name: "For Your Dad",
    slug: "for-your-dad",
    emoji: "🫡",
    order: 12,
    description: "The man of few words and zero gift opinions. Just get him something — he'll be quietly pleased."
  },
  {
    id: "for-your-sister",
    name: "For Your Sister",
    slug: "for-your-sister",
    emoji: "👯",
    order: 13,
    description: "She's borrowed your stuff for years. Time to give her something that's actually hers."
  },
  {
    id: "for-your-brother",
    name: "For Your Brother",
    slug: "for-your-brother",
    emoji: "🤜",
    order: 14,
    description: "He'll say he doesn't want anything. Get him something anyway. Watch him pretend not to love it."
  },
  {
    id: "the-host-gift",
    name: "The Host Gift",
    slug: "the-host-gift",
    emoji: "🥂",
    order: 15,
    description: "You were fed, watered, and housed. The least you can do is show up with something nice."
  },
  {
    id: "housewarming",
    name: "Housewarming",
    slug: "housewarming",
    emoji: "🏡",
    order: 16,
    description: "New house, new chapter, new excuse to buy something beautiful for someone's home."
  },
  {
    id: "bachelor-party",
    name: "Bachelor Party",
    slug: "bachelor-party",
    emoji: "🎉",
    order: 17,
    description: "Last night of freedom. Make it memorable with gifts that are actually worth keeping."
  },
  {
    id: "godh-bharai",
    name: "Godh Bharai / Baby Shower",
    slug: "godh-bharai",
    emoji: "🍼",
    order: 18,
    description: "A new life is coming. Gift something that celebrates the mama, not just the baby."
  },
  {
    id: "occasion-gifts",
    name: "Occasion Gifts",
    slug: "occasion-gifts",
    emoji: "🎁",
    order: 19,
    description: "When you need a gift but the occasion is too specific to explain to a search bar."
  },
]

/**
 * Get products for an occasion slug.
 * Reads IDs from catalog.js occasionProductMap — single source of truth.
 * Pass getAllProducts and occasionProductMap from catalog.js.
 */
export const getOccasionProducts = (getAllProductsFn, occasionProductMap, slug) => {
  if (!slug || slug === 'all') return getAllProductsFn()
  const ids = occasionProductMap[slug]
  if (ids) {
    const all = getAllProductsFn()
    return ids.map(id => all.find(p => p.id === id)).filter(Boolean)
  }
  return []
}