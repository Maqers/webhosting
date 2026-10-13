// Admin-only access to seller records (sellers_db) and KYC files (seller_docs).
//
// Both hold private data (phone, email, address, GST, KYC documents), so once
// supabase/sellers_lockdown.sql has run the public anon key can no longer read
// or write them. The admin portal comes through here instead: same check as
// api/leads.js (the caller's GitHub token must be able to push to the site
// repo), then the Supabase service-role key, server-side only.
//
// Env vars (Vercel -> Settings -> Environment Variables):
//   SUPABASE_SERVICE_ROLE_KEY   required
//   SUPABASE_URL                optional, defaults to the project below
//   LEADS_REPO                  optional, defaults to Maqers/webhosting

const DEFAULT_SUPABASE_URL = 'https://ipkyssauulddtthrebnw.supabase.co'
const BUCKET = 'seller_docs'

// Columns the admin may write. Anything else in a request is dropped.
const WRITABLE = new Set([
  'id', 'seller_code', 'business_name', 'owners', 'location', 'address', 'pincode',
  'phone', 'email', 'notes', 'product_ids', 'kyc_documents', 'gst_registered',
  'gst_number', 'hsn_codes', 'commission_pct', 'delivery_handled_by',
])
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/
const PATH_RE = /^[A-Za-z0-9_-]{1,40}\/[A-Za-z0-9._-]{1,120}$/

async function canPushToRepo(token, repo) {
  const r = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'maqers-sellers' },
  })
  if (!r.ok) return false
  const data = await r.json()
  return !!data.permissions?.push
}

const pick = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => WRITABLE.has(k)))

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set in Vercel environment variables.' })
  }
  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const repo = process.env.LEADS_REPO || 'Maqers/webhosting'

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token || !(await canPushToRepo(token, repo))) {
    return res.status(401).json({ error: 'Not authorised.' })
  }

  const sb = (path, init = {}) => fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const fail = async (r) => res.status(502).json({ error: `Supabase error ${r.status}: ${(await r.text()).slice(0, 300)}` })

  try {
    const { action, id, seller, updates, path, ext } = req.body || {}

    if (action === 'list') {
      const r = await sb('/rest/v1/sellers_db?select=*&order=business_name.asc')
      if (!r.ok) return fail(r)
      return res.status(200).json({ sellers: await r.json() })
    }

    if (action === 'create') {
      const row = pick(seller)
      if (!ID_RE.test(row.id || '')) return res.status(400).json({ error: 'Bad seller id.' })
      const r = await sb('/rest/v1/sellers_db', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) })
      if (!r.ok) return fail(r)
      return res.status(200).json({ sellers: await r.json() })
    }

    if (action === 'update') {
      if (!ID_RE.test(id || '')) return res.status(400).json({ error: 'Bad seller id.' })
      const patch = pick(updates)
      delete patch.id
      const r = await sb(`/rest/v1/sellers_db?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch) })
      if (!r.ok) return fail(r)
      return res.status(200).json({ sellers: await r.json() })
    }

    if (action === 'delete') {
      if (!ID_RE.test(id || '')) return res.status(400).json({ error: 'Bad seller id.' })
      const r = await sb(`/rest/v1/sellers_db?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!r.ok) return fail(r)
      return res.status(200).json({ ok: true })
    }

    // KYC upload: hand back a one-time signed upload URL so the file goes
    // straight from the browser to storage (Vercel caps request bodies ~4.5MB).
    if (action === 'kycUploadUrl') {
      if (!ID_RE.test(id || '')) return res.status(400).json({ error: 'Bad seller id.' })
      const safeExt = String(ext || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin'
      const objectPath = `${id}/${Date.now()}.${safeExt}`
      const r = await sb(`/storage/v1/object/upload/sign/${BUCKET}/${objectPath}`, { method: 'POST', body: '{}' })
      if (!r.ok) return fail(r)
      const data = await r.json()
      return res.status(200).json({ path: objectPath, uploadUrl: `${supabaseUrl}/storage/v1${data.url}` })
    }

    // KYC view: a signed read URL that expires in an hour.
    if (action === 'kycUrl') {
      if (!PATH_RE.test(path || '')) return res.status(400).json({ error: 'Bad path.' })
      const r = await sb(`/storage/v1/object/sign/${BUCKET}/${path}`, { method: 'POST', body: JSON.stringify({ expiresIn: 3600 }) })
      if (!r.ok) return fail(r)
      const data = await r.json()
      return res.status(200).json({ url: `${supabaseUrl}/storage/v1${data.signedURL}` })
    }

    return res.status(400).json({ error: 'Unknown action.' })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
