/**
 * STICKER LIBRARY
 *
 * The handwritten stickers are Maqers' one piece of deliberate noise, so they
 * carry the brand voice and nothing else on the page competes with them.
 *
 * Two rules keep them charming rather than wallpaper:
 *
 *   1. Stickers are EARNED, not decorative. Every sticker declares what has to
 *      be true of a product before it can appear, so "tends to sell out" only
 *      ever lands on something popular and "yours, with your name on it" only
 *      on something personalisable. This replaces the old behaviour, where a
 *      "Popular" flag sat on essentially every card and therefore meant
 *      nothing.
 *
 *   2. Stickers are RARE. Roughly one card in three carries one, chosen
 *      deterministically from the product id, so a given product always shows
 *      the same sticker and the grid does not reshuffle between renders.
 *
 * Conditions available to `requires`:
 *   popular | personalisable | hasColours | hasSizes | premium | budget
 *   madeToOrder | bulk | null (any in-stock product)
 */

export const STICKERS = [
  // ── Social proof ────────────────────────────────────────────────────────
  { id: 'fan-favourite',    emoji: '👀', text: 'a fan favourite',              requires: 'popular' },
  { id: 'sells-out',        emoji: '🏃', text: 'tends to sell out',            requires: 'popular' },
  { id: 'reordered',        emoji: '🫶', text: 'keeps getting reordered',      requires: 'popular' },
  { id: 'cart-survivor',    emoji: '🛒', text: 'survives the cart',            requires: 'popular' },
  { id: 'group-chat',       emoji: '💬', text: 'gets sent to the group chat',  requires: 'popular' },
  { id: 'restocked',        emoji: '📦', text: 'restocked more than once',     requires: 'popular' },
  { id: 'screenshot',       emoji: '📸', text: 'people screenshot this one',   requires: 'popular' },
  { id: 'we-own-this',      emoji: '🙋', text: 'we own this ourselves',        requires: 'popular' },

  // ── Craft and process ───────────────────────────────────────────────────
  { id: 'made-by-hand',     emoji: '🤲', text: 'made entirely by hand',        requires: null },
  { id: 'no-two-same',      emoji: '🌀', text: 'no two come out the same',     requires: null },
  { id: 'slow-made',        emoji: '🐌', text: 'slow to make, worth it',       requires: 'madeToOrder' },
  { id: 'small-batch',      emoji: '🧺', text: 'made in very small batches',   requires: null },
  { id: 'started-later',    emoji: '🌱', text: 'started after your order does', requires: 'madeToOrder' },
  { id: 'kitchen-table',    emoji: '🪑', text: 'made at a kitchen table',      requires: null },
  { id: 'hands-not-machine', emoji: '✋', text: 'hands, not a machine',        requires: null },
  { id: 'takes-days',       emoji: '⏳', text: 'takes days, not minutes',      requires: 'madeToOrder' },
  { id: 'imperfect',        emoji: '〰️', text: 'perfectly imperfect',          requires: null },
  { id: 'learned-once',     emoji: '🧵', text: 'a skill someone taught herself', requires: null },

  // ── Personalisation ─────────────────────────────────────────────────────
  { id: 'your-name',        emoji: '✍️', text: 'yours, with your name on it',  requires: 'personalisable' },
  { id: 'say-the-word',     emoji: '💌', text: 'add a note, they will write it', requires: 'personalisable' },
  { id: 'one-of-one',       emoji: '🔖', text: 'made into a one of one',       requires: 'personalisable' },
  { id: 'customise-it',     emoji: '🎨', text: 'customisable, genuinely',      requires: 'personalisable' },

  // ── Choice ──────────────────────────────────────────────────────────────
  { id: 'pick-colour',      emoji: '🎨', text: 'comes in more than one colour', requires: 'hasColours' },
  { id: 'hard-to-pick',     emoji: '😵', text: 'the colours are the hard part', requires: 'hasColours' },
  { id: 'pick-size',        emoji: '📏', text: 'pick your size',               requires: 'hasSizes' },

  // ── Price and value ─────────────────────────────────────────────────────
  { id: 'punches-up',       emoji: '💥', text: 'punches above its price',      requires: 'budget' },
  { id: 'small-surprise',   emoji: '🎈', text: 'a small, good surprise',       requires: 'budget' },
  { id: 'cheaper-flowers',  emoji: '🌷', text: 'cheaper than flowers, lasts longer', requires: 'budget' },
  { id: 'worth-it',         emoji: '💎', text: 'the splurge one',              requires: 'premium' },
  { id: 'main-gift',        emoji: '🎁', text: 'this is the main gift',        requires: 'premium' },
  { id: 'keeps-forever',    emoji: '🗝️', text: 'the kind that gets kept',      requires: 'premium' },

  // ── Gifting ─────────────────────────────────────────────────────────────
  { id: 'safe-bet',         emoji: '✅', text: 'a genuinely safe bet',         requires: null },
  { id: 'forgot-birthday',  emoji: '😬', text: 'for the birthday you forgot',  requires: null },
  { id: 'hard-to-buy-for',  emoji: '🤔', text: 'for the hard to buy for',      requires: null },
  { id: 'no-gift-receipt',  emoji: '🙂', text: 'nobody returns this one',      requires: null },
  { id: 'looks-expensive',  emoji: '👛', text: 'looks more expensive than it is', requires: 'budget' },
  { id: 'wrap-it',          emoji: '🎀', text: 'arrives ready to give',        requires: null },
  { id: 'last-minute',      emoji: '⚡', text: 'good for a last minute save',  requires: null },

  // ── The seller ──────────────────────────────────────────────────────────
  { id: 'one-person',       emoji: '👩', text: 'one person makes all of these', requires: null },
  { id: 'we-met-her',       emoji: '🤝', text: 'we have actually met her',     requires: null },
  { id: 'she-replies',      emoji: '📱', text: 'she replies faster than we do', requires: null },
  { id: 'home-business',    emoji: '🏠', text: 'made in someone’s home',  requires: null },
  { id: 'side-hustle',      emoji: '🌙', text: 'built after work hours',       requires: null },
  { id: 'first-orders',     emoji: '🌟', text: 'among her first orders here',  requires: null },

  // ── Bulk ────────────────────────────────────────────────────────────────
  { id: 'wedding-favours',  emoji: '💐', text: 'people order these by the dozen', requires: 'bulk' },
  { id: 'order-ahead',      emoji: '📆', text: 'order this one early',         requires: 'bulk' },
]

/** Stable, cheap string hash so a product keeps its sticker across renders. */
const hash = (value) => {
  const str = String(value)
  let h = 0
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h
}

const CONDITIONS = {
  popular: (p) => Boolean(p.popular),
  personalisable: (p) => (p.meta?.personalisation_options || []).some((o) => o && o.trim()),
  hasColours: (p) => (p.meta?.colors?.length || 0) > 1,
  hasSizes: (p) => (p.meta?.sizes?.length || 0) > 1,
  premium: (p) => Number(p.price) >= 1500,
  budget: (p) => Number(p.price) > 0 && Number(p.price) <= 450,
  madeToOrder: (p) => {
    const d = String(p.meta?.delivery_time || '')
    const days = parseInt(d.replace(/\D+/g, ''), 10)
    return Number.isFinite(days) && days >= 5
  },
  bulk: (p) => Number(p.meta?.moq) > 1,
}

/** Every sticker whose condition this product satisfies. */
export const eligibleStickers = (product) => {
  if (!product || product.inStock === false) return []
  return STICKERS.filter((s) => !s.requires || CONDITIONS[s.requires]?.(product))
}

/**
 * The sticker for a product, or null.
 *
 * `density` is how many products in N carry one. The default of 3 keeps the
 * grid calm; the product page passes 1 because there is only one product to
 * look at and the sticker is not competing with a wall of neighbours.
 */
export const getSticker = (product, { density = 3 } = {}) => {
  if (!product || product.inStock === false) return null

  const seed = hash(product.id)
  if (density > 1 && seed % density !== 0) return null

  const pool = eligibleStickers(product)
  if (!pool.length) return null

  // Second, independent hash so which sticker is picked is not correlated with
  // whether one is shown at all.
  return pool[hash(`${product.id}:sticker`) % pool.length]
}
