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
      .map(p => `${p.id}|${p.title}|${p.category}|₹${p.price}|${p.desc || ''}|${p.slug}|${p.image}`)
      .join('\n')

    const prompt = `You are a thoughtful gift recommendation assistant for Maqers — an Indian artisan e-commerce store selling handmade, handcrafted products.

A customer wants to buy a gift:
- Recipient: ${recipient}
- Occasion: ${occasion}
- Budget: ${budget}

Product catalog (format: id|title|category|price|description|slug|image):
${catalog}

Your job: choose exactly 3 products that are genuinely suitable for this specific recipient and occasion. Use the description to understand what the product actually is before recommending it.

Rules for selection:
- Pick products that make intuitive sense for the recipient (e.g. for "Dad", avoid handbags, ladies accessories, cosmetics, kids items)
- Price must fit within the stated budget range
- Variety matters — don't pick 3 products from the same category
- If no products perfectly match, pick the 3 most thoughtful options available

Return ONLY a valid JSON object:
{
  "recommendations": [
    { "id": <number>, "title": "...", "slug": "...", "price": <number>, "image": "...", "reason": "One warm, specific sentence explaining why this suits ${recipient} for ${occasion}." }
  ]
}

Use exact id, slug, price, and image values from the catalog. Never invent values.`

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
