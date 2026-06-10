export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { imageBase64, mimeType, imageUrl, extraDetails } = req.body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment variables.' })

    // Build the image part — either inline base64 or fetched from a URL
    let imagePart
    if (imageBase64 && mimeType) {
      imagePart = { inline_data: { mime_type: mimeType, data: imageBase64 } }
    } else if (imageUrl) {
      const imgRes = await fetch(imageUrl)
      if (!imgRes.ok) return res.status(400).json({ error: 'Could not fetch the product image URL.' })
      const arrayBuffer = await imgRes.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const ct = imgRes.headers.get('content-type') || 'image/jpeg'
      imagePart = { inline_data: { mime_type: ct, data: base64 } }
    } else {
      return res.status(400).json({ error: 'Provide either imageBase64+mimeType or imageUrl.' })
    }

    const prompt = `You are a product copywriter for Maqers — an Indian artisan e-commerce store selling handmade and handcrafted products.

Analyse this product image and generate compelling, specific copy for it.

${extraDetails ? `The seller has provided these additional details:\n${extraDetails}\n\nMake sure to incorporate these specifics into the description and keywords.\n` : ''}
Return ONLY valid JSON (no markdown, no explanation) in exactly this format:
{
  "title": "A concise product name, 4–7 words, title case",
  "description": "2–3 sentences. Highlight craftsmanship, materials, and what makes it special. Suitable for an Indian gifting/artisan store. No line breaks.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "keywords": ["keyword phrase 1", "keyword phrase 2", "keyword phrase 3", "keyword phrase 4", "keyword phrase 5", "keyword phrase 6"]
}

Rules:
- title: specific to THIS product (not generic like "Handmade Product")
- description: warm, artisan tone; mention materials if visible or provided
- tags: 6–8 single words or short phrases, lowercase (e.g. "handmade", "gifting", category name)
- keywords: 6–8 lowercase search phrases people would type (e.g. "handmade silver bracelet India", "personalised gift for her")`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [imagePart, { text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
        }),
      }
    )

    if (!geminiRes.ok) {
      const err = await geminiRes.json()
      return res.status(502).json({ error: err.error?.message || 'Gemini API returned an error.' })
    }

    const data = await geminiRes.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
    const result = JSON.parse(cleaned)

    return res.status(200).json({
      title: result.title || '',
      description: result.description || '',
      tags: Array.isArray(result.tags) ? result.tags : [],
      keywords: Array.isArray(result.keywords) ? result.keywords : [],
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
