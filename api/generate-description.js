export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { imageBase64, mimeType, imageUrl, extraDetails } = req.body

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured in Vercel environment variables.' })

    // Build the image content block
    let imageContent
    if (imageBase64 && mimeType) {
      imageContent = {
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'low' },
      }
    } else if (imageUrl) {
      const imgRes = await fetch(imageUrl)
      if (!imgRes.ok) return res.status(400).json({ error: 'Could not fetch the product image URL.' })
      const arrayBuffer = await imgRes.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const ct = imgRes.headers.get('content-type') || 'image/jpeg'
      imageContent = {
        type: 'image_url',
        image_url: { url: `data:${ct};base64,${base64}`, detail: 'low' },
      }
    } else {
      return res.status(400).json({ error: 'Provide either imageBase64+mimeType or imageUrl.' })
    }

    const prompt = `You are a product copywriter for Maqers — an Indian artisan e-commerce store selling handmade and handcrafted products.

Analyse this product image and generate compelling, specific copy for it.

${extraDetails ? `The seller has provided these additional details:\n${extraDetails}\n\nIncorporate these specifics into the description and keywords.\n` : ''}
Return ONLY a valid JSON object in exactly this format:
{
  "title": "A concise product name, 4–7 words, title case",
  "description": "2–3 sentences. Highlight craftsmanship, materials, and what makes it special. Warm artisan tone. No line breaks.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "keywords": ["keyword phrase 1", "keyword phrase 2", "keyword phrase 3", "keyword phrase 4", "keyword phrase 5", "keyword phrase 6"]
}

Rules:
- title: specific to THIS product, not generic
- tags: 6–8 lowercase words/short phrases (e.g. "handmade", "gifting")
- keywords: 6–8 lowercase search phrases (e.g. "handmade silver bracelet India")`

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [imageContent, { type: 'text', text: prompt }],
          },
        ],
        max_tokens: 600,
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

    return res.status(200).json({
      title: parsed.title || '',
      description: parsed.description || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
