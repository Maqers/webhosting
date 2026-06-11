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

    const prompt = `You are a gifting curator for Maqers — an Indian artisan brand known for unique, handmade products that feel personal and special. Your job is to recommend gifts that make someone say "wow, where did you find this?" — not "oh, a candle."

GIFT REQUEST:
- Recipient: ${recipient}
- Occasion: ${occasion}
- Budget: ${budget}

CRITICAL RULES — read carefully before picking anything:
1. DO NOT default to candles, plain flowers, or generic hampers. These are last resort, not first choice. Maqers has handpainted charms, resin art, artisan bags, custom keepsakes, handcrafted accessories — lead with what is UNIQUE and TRENDY.
2. Scan the ENTIRE catalog before deciding. The best pick might be in an unexpected category.
3. Pick from at least 3 different categories. Maximum 1 candle. Maximum 1 floral item.
4. Budget must fit the stated range.
5. Recipient rules:
   - Dad / Brother / male: resin art, home decor, artisan drinkware, frames, statement decor pieces. STRICTLY avoid: handbags, ladies jewellery, cosmetics, hair accessories, charm keychains.
   - Mom / Sister / female: handmade charms, artisan bags, personalised keepsakes, handpainted accessories, soaps, art — favour unique items over obvious ones.
   - Partner: personalised / custom items, romantic keepsakes, handmade jewellery, handpainted art, elegant accessories.
   - Friend / Colleague: trendy, quirky, fun items — standout charms, unique bags, conversation-starter pieces.
   - Child: bright, playful, colourful items.
6. The "reason" must mention something SPECIFIC about the product — its material, the handmade craft, or personalisation. Do not write generic reasons like "X is great for Y's occasion."

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
      "reason": "<Specific sentence: what makes this product special + why it suits ${recipient}'s ${occasion}.>"
    }
  ]
}

Exactly 5 items. Copy all field values exactly from the catalog — never invent or modify them.`

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
