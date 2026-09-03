import { productsByCategory } from '../src/data/catalog.js'

// Returns { [productId]: sellerQuotedPrice } for every product that has one
// set in the admin portal. Consumed by the Order Summary Apps Script to
// decide whether it can auto-compute "Paid to seller" / "Maqers' commission"
// for an order (only when every product on it has a quoted price).
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const prices = {}
  for (const products of Object.values(productsByCategory)) {
    for (const p of products) {
      const quoted = p.meta?.sellerQuotedPrice
      if (quoted) prices[p.id] = quoted
    }
  }

  res.setHeader('Cache-Control', 'public, max-age=300')
  res.status(200).json(prices)
}
