// Saves a shopper's cart and contact details to Supabase at every step of the
// buying journey, so a lead isn't lost if they leave before paying.
//
// Writes go through the save_checkout_lead() database function (see
// supabase/checkout_leads.sql), keyed by a random id kept in localStorage. It
// fails silently: lead capture must never get in the way of checking out.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabaseConfig'

const ID_KEY = 'maqers_lead_id'
const UTM_KEY = 'maqers_lead_utm'

function newId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function getLeadId() {
  try {
    let id = localStorage.getItem(ID_KEY)
    if (!id) { id = newId(); localStorage.setItem(ID_KEY, id) }
    return id
  } catch { return null }
}

// First-touch attribution (which ad or post brought them), kept for the visit.
function getAttribution() {
  try {
    const saved = sessionStorage.getItem(UTM_KEY)
    if (saved) return JSON.parse(saved)
    const q = new URLSearchParams(window.location.search)
    const utm = {}
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      if (q.get(k)) utm[k] = q.get(k).slice(0, 120)
    }
    const attribution = {
      utm,
      referrer: document.referrer ? document.referrer.slice(0, 300) : '',
      device: window.innerWidth < 768 ? 'mobile' : 'desktop',
    }
    sessionStorage.setItem(UTM_KEY, JSON.stringify(attribution))
    return attribution
  } catch { return { utm: {}, referrer: '', device: '' } }
}

// Lean version of the cart lines: what someone needs to follow up on.
export function summariseCart(items) {
  return (items || []).map(i => ({
    id: i.id,
    title: i.title,
    qty: i.qty,
    price: i.price,
    ...(i.selectedColor && { color: i.selectedColor }),
    ...(i.selectedSize && { size: i.selectedSize }),
    ...(i.selectedPersonalisation?.length && { personalisation: i.selectedPersonalisation }),
    ...(i.orderNote?.trim() && { note: i.orderNote.trim().slice(0, 200) }),
  }))
}

// Everything captured so far this visit; merged so the page-leave flush can
// resend the latest details even if a debounced save hadn't fired yet.
let snapshot = {}
let timer = null
let dirty = false

function post(data, keepalive = false) {
  const id = getLeadId()
  if (!id) return
  dirty = false
  fetch(`${SUPABASE_URL}/rest/v1/rpc/save_checkout_lead`, {
    method: 'POST',
    keepalive,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ p_lead_id: id, p_data: { ...getAttribution(), ...data } }),
  }).catch(() => { /* never block the shopper */ })
}

// Save now (stage changes: checkout opened, payment shown, order placed).
export function saveLead(partial) {
  snapshot = { ...snapshot, ...partial }
  clearTimeout(timer)
  post(snapshot)
}

// Save shortly after the last change (typing in the form, cart edits).
export function saveLeadSoon(partial, delay = 700) {
  snapshot = { ...snapshot, ...partial }
  dirty = true
  clearTimeout(timer)
  timer = setTimeout(() => post(snapshot), delay)
}

// A finished order is no longer a lead to chase; start a fresh id next time.
export function endLead() {
  clearTimeout(timer)
  dirty = false
  snapshot = {}
  try { localStorage.removeItem(ID_KEY) } catch { /* ignore */ }
}

if (typeof window !== 'undefined') {
  const flush = () => { if (dirty) { clearTimeout(timer); post(snapshot, true) } }
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}
