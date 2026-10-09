// Admin-only access to checkout leads (the checkout_leads table in Supabase).
//
// The table has no public policies, so the browser can't read it. This
// function does, using the Supabase service-role key (server-side only), and
// only for someone who can prove they can push to the site's GitHub repo, i.e.
// the same GitHub token already used to sign in to the admin portal.
//
// Env vars (Vercel -> Settings -> Environment Variables):
//   SUPABASE_SERVICE_ROLE_KEY   required (Supabase -> Project Settings -> API -> service_role)
//   SUPABASE_URL                optional, defaults to the project below
//   LEADS_REPO                  optional, defaults to Maqers/webhosting

const DEFAULT_SUPABASE_URL = 'https://ipkyssauulddtthrebnw.supabase.co'

async function canPushToRepo(token, repo) {
  const r = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'maqers-leads' },
  })
  if (!r.ok) return false
  const data = await r.json()
  return !!data.permissions?.push
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
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

  const sb = (path, init = {}) => fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })

  try {
    const { action = 'list', leadId, followed_up, notes } = req.body || {}

    if (action === 'list') {
      const r = await sb('checkout_leads?select=*&order=updated_at.desc&limit=500')
      if (!r.ok) return res.status(502).json({ error: `Supabase error ${r.status}: ${(await r.text()).slice(0, 200)}` })
      return res.status(200).json({ leads: await r.json() })
    }

    if (action === 'update') {
      if (!/^[0-9a-f-]{36}$/i.test(leadId || '')) return res.status(400).json({ error: 'Bad lead id.' })
      const patch = {}
      if (typeof followed_up === 'boolean') patch.followed_up = followed_up
      if (typeof notes === 'string') patch.notes = notes.slice(0, 1000)
      const r = await sb(`checkout_leads?lead_id=eq.${leadId}`, { method: 'PATCH', body: JSON.stringify(patch) })
      if (!r.ok) return res.status(502).json({ error: `Supabase error ${r.status}` })
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'Unknown action.' })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
