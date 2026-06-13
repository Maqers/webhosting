export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { recipient, occasion, budget, products, occasionKey, recipientKey } = req.body

    if (!recipient || !occasion || !budget || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Missing required fields.' })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' })

    // Build catalog string with FULL descriptions (not truncated)
    // Also include category prominently so the model sees the actual product type
    const catalog = products
      .map(p => `[${p.id}] ${p.title} | CATEGORY: ${p.category} | ₹${p.price} | ${p.desc} | slug:${p.slug} | img:${p.image}`)
      .join('\n')

    const prompt = `You are a gift curator for Maqers, an Indian artisan marketplace. Your job is to pick gifts that feel genuinely right — not generically appropriate.

RECIPIENT PROFILE:
- Who: ${recipient}
- Occasion: ${occasion}
- Budget: ${budget}
${occasionKey ? `- Occasion key: ${occasionKey}` : ''}
${recipientKey ? `- Recipient key: ${recipientKey}` : ''}

STEP 1 — RECIPIENT MENTAL MODEL (reason through this before picking):
- What emotional tone does this gift need for ${occasion}? (celebratory? intimate? practical?)
- What does ${recipient} actually want to receive, not just what is safe to give?
- What categories are genuinely right for ${recipient}? Be specific.
- What must you actively avoid? (e.g. for Dad: skip jewellery, bags, cosmetics, hair accessories. For Mom: skip generic candles unless exceptional. For kids: skip adult accessories.)

STEP 2 — SCAN EVERY PRODUCT:
Read every product in the catalog below. The CATEGORY field tells you the product type — use it. The description tells you the material, technique, and emotional fit — read it carefully.
Tag each product: STRONG FIT / POSSIBLE / SKIP

Scoring criteria (in order of importance):
1. Emotional fit for this specific person on this specific occasion
2. Category appropriateness (would ${recipient} actually use/wear/display this?)
3. Price within budget
4. Category variety across final 5

STEP 3 — FINAL 5:
Pick exactly 5 from your STRONG FIT pile. Cover at least 3 different categories.
If fewer than 5 strong fits exist, pull from POSSIBLE — but only if genuinely suitable.

IMPORTANT RULES:
- Do NOT default to candles just because they are safe. Only pick a candle if it's genuinely the best fit.
- Do NOT pick products that feel generic. Every pick must have a clear, specific reason.
- For Dad/Brother/male recipient: favour home decor, resin art, drinkware, frames, statement pieces. Avoid: handbags, ladies jewellery, cosmetics, hair accessories.
- For Mom: favour jewellery she'd actually wear, art frames, meaningful decor, florals, personalised items.
- Read descriptions fully — handmade technique and material details matter for the reason.

PRODUCT CATALOG (format: [id] title | CATEGORY | price | description | slug | img):
${catalog}

Return ONLY this JSON — no preamble, no markdown, no explanation outside the JSON:
{
  "recommendations": [
    {
      "id": <exact number from catalog>,
      "title": "<exact title from catalog>",
      "slug": "<exact slug from catalog>",
      "price": <exact price from catalog>,
      "image": "<exact img path from catalog>",
      "reason": "One specific sentence: name what makes this product special (material, technique, design detail) AND exactly why it fits ${recipient} for ${occasion}."
    }
  ]
}

Exactly 5 items. All field values must match the catalog exactly.`

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

    let parsed
    try {
      // Strip any accidental markdown fences
      const clean = raw.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      return res.status(500).json({ error: 'Failed to parse recommendations. Please try again.' })
    }

    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : []
    return res.status(200).json({ recommendations: recommendations.slice(0, 5) })

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
