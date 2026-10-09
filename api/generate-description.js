// Generic words that made every title read the same. Matches whole words only.
const BANNED_TITLE_WORDS = /\b(festive|festival|diwali|celebrations?|delight(ful)?|utsav|shubh|artisan(al)?|handcrafted|handmade|vibrant|elegant|beautiful|exquisite|unique|premium|luxury|gifts?)\b/i

// Ignored when counting which title words are overused
const TITLE_STOPWORDS = new Set(['and', 'the', 'with', 'for', 'set', 'of', 'pcs', 'piece', 'pieces'])

const MAX_DESC_WORDS = 100

function capWords(text, max) {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length <= max) return text
  const clipped = words.slice(0, max).join(' ')
  const lastStop = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('! '), clipped.lastIndexOf('? '), clipped.lastIndexOf('.\\n'))
  // Only cut at a sentence end if that keeps most of the copy; else hard clip.
  if (lastStop > clipped.length * 0.5) return clipped.slice(0, lastStop + 1)
  const trimmed = clipped.replace(/[,;:\s]+$/, '')
  return /[.!?]$/.test(trimmed) ? trimmed : trimmed + '.'
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { imageBase64, mimeType, imageUrl, extraDetails, existingTitles } = req.body

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

    // Titles already in the catalog, so the model can see what's been used
    // and steer away from it. Words in 4+ titles are called out explicitly.
    const catalogTitles = (Array.isArray(existingTitles) ? existingTitles : [])
      .filter(t => typeof t === 'string')
      .slice(0, 600)
      .map(t => t.slice(0, 80))
    const wordCounts = {}
    for (const t of catalogTitles) {
      for (const w of new Set(t.toLowerCase().match(/[a-z]+/g) || [])) {
        if (w.length > 2 && !TITLE_STOPWORDS.has(w)) wordCounts[w] = (wordCounts[w] || 0) + 1
      }
    }
    const overusedWords = Object.entries(wordCounts).filter(([, n]) => n >= 4).map(([w]) => w)
    const catalogSection = catalogTitles.length
      ? `\nTitles already in the catalog (do not reuse any of these names or their distinctive words):\n${catalogTitles.join(' | ')}\n\nWords already overused in titles: ${overusedWords.join(', ')}. Only use one of these if it is the literal product type (e.g. mug, bag, candle) and nothing else fits.\n`
      : ''

    const prompt = `You are the in-house copywriter for Maqers, an Indian artisan marketplace with a specific voice: witty, warm, a little cheeky, talks to the shopper like a sharp friend giving gift advice — never like a corporate listing. Here's the actual voice used elsewhere on the site, for calibration (the surrounding quotation marks below are just how these examples are punctuated on the site, not a format to copy — do not start your own description with a quotation mark):
The one who knows too much. Gift them well, they deserve it, and frankly, you owe them.
She said 'don't get me anything' and meant the opposite. You know this. Act accordingly.
Not too much, not too little. The art of gifting someone you like but won't label. We get it.
Because tiny humans deserve the most thoughtful gifts. And because you want to be the favourite aunt/uncle.

Match THAT energy: specific, funny where it earns it, never generic-nice. If a line could be printed on any product in any category by swapping one noun, it has failed.

Study this product image and write copy for the product page.
${extraSection}
Write the description as ONE paragraph, or one paragraph plus a short half-paragraph of one or two sentences. Keep it tight.
- Paragraph: open with the hook (with an emoji), then what the product is, its colours, feel and materials/craft, with one small, specific observation. Fold the key facts (material, size, use) into the sentences themselves.
- Optional half-paragraph: who it is for or when it earns its place, specific and a little funny, not a bland occasion list.
- NO bullet points, NO ✨ lines, NO headers.

Formatting rules:
- If you write the half-paragraph, separate it from the first with \\n\\n. Otherwise there is just one paragraph.
- 60 to 90 words total. Never more than 100.
- Wrap at most 2 short phrases in **double asterisks** for emphasis on the single most compelling detail (a standout material, a specific use-case). It should read like emphasis, not decoration.
- Use straight, single, plain quote marks only if quoting something, never double them up ("" is always wrong, use ").
- NO em dashes, anywhere, ever (use a comma, colon, or period instead). This rule gets broken more than any other, check your output for the — character before finishing and remove every instance.
- Weave in natural SEO keywords (material, occasion, product type).

Avoid sounding like every other listing (this is the main failure mode — read this twice):
- Don't default to the same paragraph shape every time (hook → who it's for → bullets said the exact same way). Vary sentence length and rhythm. Short punchy sentence, then a longer one. Break the pattern.
- Banned as a set, don't use this exact occasion combo or close paraphrases of it: "birthdays, Diwali celebrations, housewarmings, or self-gifting." That exact list has been used on nearly every product so far and instantly reads as templated. Pick ONE or TWO occasions that genuinely fit this specific item and commit to those, or invent a more specific scenario instead of listing occasions at all.
- Don't reach for the same safe adjectives every product gets ("beautiful," "perfect," "elegant," "stunning," "timeless"). If you catch yourself writing one, replace it with something that only applies to THIS object.
- Have an actual opinion or a specific, small observation about the item — not just praise. Notice something a real person would notice.
- No hollow phrases, no filler sentences that exist just to hit the word count.

Opening line rules (this is where generic AI copy fails hardest, so follow closely):
- NEVER start with "Elevate", "Indulge", "Unleash", "Discover", "Introducing", "Step into", "Immerse yourself", or any other stock marketing verb aimed at the shopper. These are banned as the first word.
- Do not open with "Whether you're..." or "Perfect for..." either — save occasion-fit for later in the copy.
- Never start the description with a quotation mark (' or ") as the very first character.
- Instead, open with something concrete and specific to THIS image: a visual detail (a colour, a texture, a shape, a technique), a sensory detail, or a small, vivid scene the product belongs in. Ground it in what you actually see in the photo, not a generic category description.
- Read your opening line back and ask: could this exact sentence be reused for a completely different product just by swapping the noun? If yes, rewrite it.

Return ONLY a valid JSON object in exactly this format:
{
  "title_options": ["Best name", "Alternative name", "Alternative name"],
  "description": "The short description as described above",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "keywords": ["keyword phrase 1", "keyword phrase 2", "keyword phrase 3", "keyword phrase 4", "keyword phrase 5", "keyword phrase 6", "keyword phrase 7", "keyword phrase 8"]
}

Additional rules:
- title_options: exactly 3 different names for THIS product, best first. See the naming rules below.
- tags: 6–8 lowercase words or short phrases a buyer or social media post would use
- keywords: 6–8 lowercase search phrases a real buyer would type into Google or an Indian e-commerce search bar

Naming rules for title_options (the catalog is full of names like "Festive Diwali Delight Gift Box" and they all blur together, so this matters):
- Shape: one evocative word or pair that captures THIS piece, then the plain product type so shoppers know what it is. 2 to 5 words, title case.
- Draw the evocative part from what is actually in the photo, using Indian names for colours, motifs, flowers and crafts where they fit. A palette to pick from, not a checklist:
  colours: Rani Pink, Gulabi, Haldi, Kesari, Sindoori, Mehendi Green, Neel, Firozi, Motia, Kattha, Ambar, Moongia, Badami
  motifs and nature: Kamal (lotus), Mor (peacock), Genda (marigold), Mogra, Gulmohar, Raat Rani, Ambi (paisley), Chand, Tara, Bel, Patta, Jugnu, Titli
  crafts and objects: Lippan, Meenakari, Zari, Gota, Kantha, Bandhani, Dokra, Jharokha, Toran, Urli, Thali, Potli, Kalash
  moods and moments: Chandni, Roshni, Noor, Saanjh, Aangan, Mehfil, Rangoli, Jhilmil, Barsaat, Sukoon
  English works too when it is specific and vivid (Lotus, Peacock, Marigold, Moonlit, Mirrorwork).
- Only use a colour word if that colour clearly dominates the piece, and a motif only if it is visibly there. Accuracy beats flourish.
- Never use these words in a title: Festive, Festival, Diwali, Celebration, Delight, Delightful, Utsav, Shubh, Artisan, Artisanal, Handcrafted, Handmade, Vibrant, Elegant, Beautiful, Exquisite, Unique, Premium, Luxury, Gift (Hamper, Box, Basket are fine as the product type). Occasion words belong in tags and keywords, not the name.
- Make the 3 options genuinely different from each other: lead with a different evocative word in each.
- Good: "Rani Pink Lotus Diya Thali", "Neel Kamal Lippan Plate", "Gulabi Genda Tealight Urli", "Haldi Mor Coaster Set", "Chandni Zari Potli", "Mogra Soy Candle Jar"
- Bad: "Festive Diwali Delight Gift Box", "Vibrant Handcrafted Diya Plate", "Shubh Utsav Festive Basket", "Elegant Artisan Decor Piece"
${catalogSection}`

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
        // The JSON response has to hold title + a 60-90 word description +
        // up to 8 tags + up to 8 keywords, all within this budget. 700 was
        // tight enough that a longer description could squeeze out (or
        // truncate) the tags/keywords arrays that come after it in the JSON.
        // Raised further since the model sometimes writes past the
        // requested word count, still eating into the tags/keywords budget.
        max_tokens: 1600,
        temperature: 0.9,
        frequency_penalty: 0.4,
        presence_penalty: 0.3,
        // Strict JSON schema mode (not just json_object) makes OpenAI
        // enforce these exact required fields at decode time, so the model
        // can no longer silently omit tags/keywords the way it could
        // under plain json_object mode. tags/keywords are listed before
        // title/description so they're generated first, ahead of the
        // longer, more variable-length description text.
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'product_copy',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                tags: { type: 'array', items: { type: 'string' } },
                keywords: { type: 'array', items: { type: 'string' } },
                title_options: { type: 'array', items: { type: 'string' } },
                description: { type: 'string' },
              },
              required: ['tags', 'keywords', 'title_options', 'description'],
              additionalProperties: false,
            },
          },
        },
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.json()
      return res.status(502).json({ error: err.error?.message || 'OpenAI API returned an error.' })
    }

    const data = await openaiRes.json()
    const finishReason = data.choices?.[0]?.finish_reason
    const raw = data.choices?.[0]?.message?.content || ''
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (parseErr) {
      if (finishReason === 'length') {
        return res.status(502).json({ error: 'The AI response got cut off before finishing (ran out of room) — try again, or shorten "Additional details" if you filled that in.' })
      }
      throw parseErr
    }

    // Hard backstop, not just a prompt request — the model doesn't reliably
    // follow the em-dash and doubled-quote rules on its own (both showed up
    // in production output despite the prompt explicitly banning them), so
    // enforce them here instead of trusting compliance.
    const cleanDescription = (parsed.description || '')
      .replace(/^['"]+/, '')
      .replace(/[—–]/g, ', ')
      .replace(/,\s*,/g, ',')
      .replace(/""+/g, '"')
      .replace(/✨(?=\S)/g, '✨ ')

    // Backstop for the length limit: the model drifts long. Cut at the last
    // full sentence at or under MAX_DESC_WORDS rather than mid-sentence.
    const cappedDescription = capWords(cleanDescription, MAX_DESC_WORDS)

    const tags = Array.isArray(parsed.tags) ? parsed.tags : []
    const keywords = Array.isArray(parsed.keywords) ? parsed.keywords : []

    // The model occasionally omits tags/keywords (or returns them empty)
    // while still producing valid JSON, so JSON.parse succeeds and this
    // silently looked like a success with nothing to show for it. Treat
    // that as a real, retryable failure instead of masking it.
    if (tags.length === 0 || keywords.length === 0) {
      return res.status(502).json({ error: 'The AI left out tags or keywords this time. Please click Generate again.' })
    }

    // Backstop for the naming rules: drop options that use a banned word or
    // duplicate an existing title. If every option fails, keep them rather
    // than return no title at all.
    const existingLower = new Set(catalogTitles.map(t => t.trim().toLowerCase()))
    const cleanedOptions = (Array.isArray(parsed.title_options) ? parsed.title_options : [])
      .map(t => String(t).replace(/[—–]/g, ' ').replace(/""+/g, '"').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    const goodOptions = cleanedOptions.filter(t =>
      !BANNED_TITLE_WORDS.test(t) && !existingLower.has(t.toLowerCase())
    )
    const titleOptions = [...new Set(goodOptions.length ? goodOptions : cleanedOptions)]

    return res.status(200).json({
      title: titleOptions[0] || '',
      titleOptions,
      description: cappedDescription,
      tags,
      keywords,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
