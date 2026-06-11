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

    const prompt = `You are a gifting expert for Maqers — an Indian artisan store with a wide range of handmade products: charms, bags, candles, florals, resin art, soaps, cosmetics, home decor, art frames, accessories, hampers and more.

GIFT REQUEST:
- Recipient: ${recipient}
- Occasion: ${occasion}
- Budget: ${budget}

YOUR TASK:
Read every product in the catalog carefully. Then select exactly 5 products that feel genuinely right for THIS specific person on THIS specific occasion. Think like a thoughtful friend who knows the recipient — not an algorithm.

RULES:
1. Match the recipient's likely tastes and the occasion's emotional tone. A Birthday calls for something celebratory. An Anniversary calls for something romantic or sentimental. A Festival calls for something warm and giftable.
2. Pick from at least 3 different categories for variety.
3. Gender awareness:
   - Dad / Brother / male recipient: home decor, artisan drinkware, resin art, frames, unique statement pieces. Avoid: handbags, ladies jewellery, cosmetics, hair accessories.
   - Mom / Sister / Partner / female: any category can work — charms, bags, soaps, candles, florals, accessories, art. Pick what feels most appropriate for the occasion.
   - Friend / Colleague: fun, unique, memorable items.
   - Child: playful, bright, age-appropriate items.
4. Price must fit the stated budget range.
5. Scan the full catalog — do not just pick the first items you see. The best recommendation might be in any category.
6. Each "reason" must be specific to the product — mention what makes it handmade, unique, or particularly suited to this person and occasion.

PRODUCT CATALOG (format: [id] title | category | price | description | slug | img):
${catalog}

Return ONLY this JSON — no other text:
{
  "recommendations": [
    {
      "id": <exact number from catalog>,
      "title": "<exact title from catalog>",
      "slug": "<exact slug from catalog>",
      "price": <exact price from catalog>,
      "image": "<exact img path from catalog>",
      "reason": "<One specific sentence explaining why this product is right for ${recipient}'s ${occasion} — reference something concrete about the product.>"
    }
  ]
}

Exactly 5 items. All field values must be copied exactly from the catalog.`

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.5,
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
