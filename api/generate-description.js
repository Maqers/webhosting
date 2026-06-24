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
        image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'high' },
      }
    } else if (imageUrl) {
      const imgRes = await fetch(imageUrl)
      if (!imgRes.ok) return res.status(400).json({ error: 'Could not fetch the product image URL.' })
      const arrayBuffer = await imgRes.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const ct = imgRes.headers.get('content-type') || 'image/jpeg'
      imageContent = {
        type: 'image_url',
        image_url: { url: `data:${ct};base64,${base64}`, detail: 'high' },
      }
    } else {
      return res.status(400).json({ error: 'Provide either imageBase64+mimeType or imageUrl.' })
    }

    const extraSection = extraDetails
      ? `\nAdditional details from the seller — incorporate these precisely:\n${extraDetails}\n`
      : ''

    const prompt = `You are a product copywriter for Maqers, an Indian artisan marketplace.

Study this product image and write concise, specific, emotionally engaging copy for the product page.
${extraSection}
Write exactly 2–3 short paragraphs covering:
1. A hook with an emoji, what the product is, its colours, feel, and materials/craft.
2. Who it is for and what occasions it suits (birthday, Diwali, housewarming, self-gifting, etc.).
3. End with 4–6 bullet points of key product facts, each prefixed with ✨

Formatting rules:
- Use \\n\\n between paragraphs
- 180–220 words total (paragraphs + bullets combined)
- Tone: warm and specific. No hollow phrases.
- NO em dashes (use commas or colons instead).
- Weave in natural SEO keywords (material, occasion, product type).

Return ONLY a valid JSON object in exactly this format:
{
  "title": "Specific product name, 4–7 words, title case",
  "description": "Full rich description as described above",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "keywords": ["keyword phrase 1", "keyword phrase 2", "keyword phrase 3", "keyword phrase 4", "keyword phrase 5", "keyword phrase 6", "keyword phrase 7", "keyword phrase 8"]
}

Additional rules:
- title: must name THIS specific product, not a category (bad: "Handmade Candle", good: "Midnight Rose Hand-Poured Soy Candle")
- tags: 6–8 lowercase words or short phrases a buyer or social media post would use
- keywords: 6–8 lowercase search phrases a real buyer would type into Google or an Indian e-commerce search bar`

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
        max_tokens: 700,
        temperature: 0.75,
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
