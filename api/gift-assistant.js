export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { recipient, occasion, budget, products } = req.body
    if (!recipient || !occasion || !budget || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Missing required fields.' })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' })

    const catalog = products
      .map(p => `[${p.id}] ${p.title} | ${p.category} | ₹${p.price} | ${p.desc || ''} | slug:${p.slug} | img:${p.image}`)
      .join('\n')

    const prompt = `You are a senior gift consultant for Maqers, an Indian artisan e-commerce store selling handmade, handcrafted products.

GIFT REQUEST:
- Recipient: ${recipient}
- Occasion: ${occasion}
- Budget: ${budget}

YOUR APPROACH (follow these steps in order):
1. Think about who ${recipient} is and what ${occasion} calls for emotionally. What would genuinely delight them? What would feel thoughtful vs generic?
2. Consider what is culturally appropriate in India for this recipient:
   - Dad / Brother / male: practical items, home decor, unique artisan pieces, drinkware, resin art. Avoid handbags, ladies jewellery, cosmetics, hair accessories.
   - Mom / Sister / female: candles, florals, accessories, soaps, cosmetics, art, hampers, bags — almost anything works.
   - Partner: romantic, personalised, or elegant items.
   - Friend / Colleague: fun, unique, or shareable items.
   - Child: playful, colourful items. Avoid adult cosmetics or drinkware.
3. From the catalog below, select exactly 5 products that match your thinking. Do NOT just grab the most "obviously giftable" categories — look across the full catalog and pick what is genuinely appropriate for THIS person.
4. Ensure variety: pick from at least 3 different categories.
5. Prefer products that feel special and handmade over generic ones.

PRODUCT CATALOG (format: [id] title | category | price | description | slug | image):
${catalog}

Return ONLY this JSON object — no extra text:
{
  "recommendations": [
    {
      "id": <number>,
      "title": "exact title from catalog",
      "slug": "exact slug from catalog",
      "price": <exact number from catalog>,
      "image": "exact image from catalog",
      "reason": "One warm sentence explaining specifically why this is a great gift for ${recipient} on ${occasion} — mention something unique about the product."
    }
  ]
}

Return exactly 5 items. Use ONLY values from the catalog — never invent slugs, prices, or ids.`

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 900,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.json()
      return res.status(502).json({ error: err.error?.message || 'OpenAI API returned an error.' })
    }

    const data = await openaiRes.json()
    const raw = data.choices?.[0]?.message?.content || ''
    const parsed = JSON.parse(raw)
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : []

    return res.status(200).json({ recommendations: recommendations.slice(0, 5) })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
