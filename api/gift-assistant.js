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

    const prompt = `You are a gift curator for Maqers, an Indian artisan marketplace.

RECIPIENT PROFILE:
- Who: ${recipient}
- Occasion: ${occasion}
- Budget: ${budget}

STEP 1 — BUILD A RECIPIENT MENTAL MODEL (do this silently before picking):
Based on the recipient and occasion, define:
- What emotional tone does this gift need? (e.g. warm, celebratory, practical, luxurious)
- What product types naturally fit this person? Be specific — not "home decor" but "objects they'd display or use daily"
- What must you actively avoid for this person?

STEP 2 — SCAN AND SHORTLIST:
Read every product below. Tag each one mentally as: STRONG FIT / POSSIBLE / SKIP.
Criteria: emotional fit > category variety > price.

STEP 3 — FINAL 5:
From your STRONG FIT pile, pick exactly 5. If you don't have 5 strong fits, pull from POSSIBLE — but flag those.
Ensure at least 3 different categories are represented.

PRODUCT CATALOG (format: [id] title | category | price | description | slug | img):
${catalog}

Return ONLY this JSON — no preamble, no explanation outside the JSON:
{
  "recommendations": [
    {
      "id": <exact number from catalog>,
      "title": "<exact title from catalog>",
      "slug": "<exact slug from catalog>",
      "price": <exact price from catalog>,
      "image": "<exact img path from catalog>",
      "reason": "One sentence. Must name something specific about the product AND why it fits this person on this occasion."
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
