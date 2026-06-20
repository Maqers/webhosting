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

    const prompt = `You are a senior product copywriter for Maqers, an Indian artisan marketplace where every item is handmade with craft and intention.

Study this product image carefully. Write rich, specific, emotionally engaging copy that makes a buyer truly feel the value and uniqueness of this handmade piece.
${extraSection}
Your description must cover ALL of the following points, woven together into flowing paragraphs:

1. HOOK — An emotionally compelling opening line or two with a fitting emoji that draws the reader in immediately.
2. WHAT IT IS — Describe the product visually: what the eye is drawn to, the colours, the form, what feeling or story it evokes.
3. MATERIAL & CRAFT — What it is made of and how it was crafted (e.g. hand-poured soy wax, hand-knotted macramé, resin-cast with dried flowers, hand-embroidered, kiln-fired clay). Be specific to what you observe.
4. WHERE IT CAN BE USED — Practical contexts: home decor, desk accessory, daily wear, festive styling, event gifting, travel companion, etc.
5. GIFTING OCCASIONS — List specific occasions this suits: birthday, anniversary, wedding, housewarming, Diwali, Rakhi, baby shower, graduation, self-gifting, corporate gifting, "just because" — whichever genuinely apply.
6. WHY IT IS UNIQUE — What a handmade piece offers that no mass-produced alternative can: the irregularities that make it one-of-a-kind, the human touch, the story behind it.
7. KEY HIGHLIGHTS — End with 4–6 bullet points of the most important product facts, each prefixed with ✨

Formatting rules:
- Use \\n\\n to separate paragraphs
- Minimum 180 words in the description
- Tone: warm, artisan, specific. Never generic. Avoid hollow phrases like "perfect gift" or "made with love" without concrete detail to back them up.
- NO em dashes (do not use the character —). Use a comma, colon, or rewrite the sentence instead.
- SEO: naturally weave in searchable keywords throughout the description (materials, occasion, product type, Indian handmade context). The description itself should read well on a product page and rank for long-tail searches.

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
        max_tokens: 1400,
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
