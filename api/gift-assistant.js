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
      .map(p => `${p.id}|${p.title}|${p.category}|₹${p.price}|${(p.tags || []).slice(0, 4).join(',')}|${p.slug}|${p.image}`)
      .join('\n')

    const prompt = `You are a thoughtful gift recommendation assistant for Maqers — an Indian artisan e-commerce store selling handmade, handcrafted products.

A customer wants to buy a gift:
- Recipient: ${recipient}
- Occasion: ${occasion}
- Budget: ${budget}

Product catalog (format: id|title|category|price|tags|slug|image):
${catalog}

Choose 3–4 products from this catalog that best match the recipient, occasion, and budget. Prefer products whose price fits the stated budget. If few products fit exactly, pick the closest options overall.

Return ONLY a valid JSON object with this exact shape:
{
  "recommendations": [
    { "id": <number>, "title": "...", "slug": "...", "price": <number>, "image": "...", "reason": "One warm sentence explaining why this is perfect for ${recipient} for ${occasion}." }
  ]
}

Rules:
- Use exact id, slug, price, and image values from the catalog — never invent values
- Reason should be specific and personal (mention the recipient and/or occasion)
- 3–4 recommendations only`

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

    return res.status(200).json({ recommendations: recommendations.slice(0, 4) })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
