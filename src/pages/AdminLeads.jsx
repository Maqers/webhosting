import { useState, useEffect, useMemo, useCallback } from "react";

// Checkout leads: everyone who left a phone number or email, at any step,
// most recent first. Data comes from /api/leads, which checks the same GitHub
// token used to sign in here (see api/leads.js).

const STAGES = {
  cart: "In cart",
  checkout_started: "Opened checkout",
  details_entered: "Entered details",
  payment_shown: "Saw payment",
  ordered: "Ordered",
};

// A lead counts as abandoned once it has been quiet for this long without
// reaching Ordered. Leaving the page is not used: on a phone the tab goes to
// the background when someone switches to a UPI app to pay, which looks the
// same as leaving. Each save refreshes updated_at, so the clock restarts
// whenever they do something.
const IDLE_MINUTES = {
  cart: 24 * 60,
  checkout_started: 120,
  details_entered: 120,
  payment_shown: 30,
};

function statusOf(lead) {
  if (lead.stage === "ordered") return "ordered";
  const idle = (Date.now() - new Date(lead.updated_at).getTime()) / 60000;
  return idle >= (IDLE_MINUTES[lead.stage] ?? 120) ? "abandoned" : "active";
}

const STATUS_STYLE = {
  ordered: { bg: "#e8f5ec", fg: "#1f7a3d", label: "Ordered" },
  active: { bg: "#eef3fb", fg: "#2a5db0", label: "Still active" },
  abandoned: { bg: "#fdeceb", fg: "#b3261e", label: "Abandoned" },
};

function ago(iso) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function waLink(lead) {
  const digits = (lead.phone || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const to = digits.length === 10 ? `91${digits}` : digits;
  const first = (lead.name || "").trim().split(/\s+/)[0];
  const items = (lead.cart || []).map(i => i.title).slice(0, 2).join(" and ");
  const text = `Hi${first ? " " + first : ""}! This is Maqers. You were looking at ${items || "a few pieces"} on our site and we noticed you didn't get to finish. Can we help with anything, like sizes, colours or personalisation? Happy to sort your order right here on WhatsApp.`;
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

export default function AdminLeads({ creds, ts, showToast }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("open"); // open | active | all | ordered
  const [saving, setSaving] = useState({});

  const call = useCallback(async body => {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }, [creds.token]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setLeads((await call({ action: "list" })).leads || []); }
    catch (e) { setError(e.message); }
    setLoading(false);
  }, [call]);

  useEffect(() => { load(); }, [load]);

  async function update(lead, patch) {
    setSaving(s => ({ ...s, [lead.lead_id]: true }));
    try {
      await call({ action: "update", leadId: lead.lead_id, ...patch });
      setLeads(ls => ls.map(l => l.lead_id === lead.lead_id ? { ...l, ...patch } : l));
    } catch (e) { showToast(e.message, "error"); }
    setSaving(s => ({ ...s, [lead.lead_id]: false }));
  }

  const reachable = l => !!(l.phone || l.email);
  const rows = useMemo(() => {
    const list = leads.filter(l => {
      const st = statusOf(l);
      if (view === "ordered") return st === "ordered";
      if (view === "active") return st === "active";
      if (view === "open") return st === "abandoned" && reachable(l);
      return true;
    });
    // Follow-up list: people who reached the payment screen go first, since
    // they may have paid and never confirmed.
    if (view === "open") {
      list.sort((a, b) => (b.stage === "payment_shown") - (a.stage === "payment_shown")
        || new Date(b.updated_at) - new Date(a.updated_at));
    }
    return list;
  }, [leads, view]);

  const openCount = leads.filter(l => statusOf(l) === "abandoned" && reachable(l) && !l.followed_up).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={ts.pageTitle}>Leads</h1>
          <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
            {openCount} to follow up · quiet for a while without ordering (cart 24h, checkout 2h, payment screen 30m). Internal only.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[["open", "To follow up"], ["active", "Still active"], ["all", "Everyone"], ["ordered", "Ordered"]].map(([k, label]) => (
            <button key={k} style={view === k ? ts.primaryBtn : ts.ghostBtn} onClick={() => setView(k)}>{label}</button>
          ))}
          <button style={ts.ghostBtn} onClick={load} disabled={loading}>{loading ? "Loading..." : "↺ Refresh"}</button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fff4f4", border: "1px solid #f0c8c8", borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 13, color: "#a33" }}>
          {error}
          {/SERVICE_ROLE/.test(error) && (
            <div style={{ marginTop: 6, color: "#555" }}>
              Add <b>SUPABASE_SERVICE_ROLE_KEY</b> in Vercel (Settings, Environment Variables), then redeploy.
            </div>
          )}
        </div>
      )}

      {!error && !loading && rows.length === 0 && (
        <p style={{ color: "#888", fontSize: 14 }}>Nothing here yet.</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {rows.map(l => {
          const link = waLink(l);
          const st = statusOf(l);
          const stStyle = STATUS_STYLE[st];
          const campaign = l.utm?.utm_campaign || l.utm?.utm_source || (l.referrer ? new URL(l.referrer, "https://x").hostname : "direct");
          return (
            <div key={l.lead_id} style={{ background: "#fff", border: "1px solid #eadfdf", borderRadius: 10, padding: 14, opacity: l.followed_up ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {l.name || "(no name yet)"}{" "}
                    <span style={{ fontWeight: 600, fontSize: 11, padding: "2px 8px", borderRadius: 999, background: stStyle.bg, color: stStyle.fg }}>{stStyle.label}</span>{" "}
                    <span style={{ fontWeight: 400, fontSize: 12, color: "#888" }}>· {STAGES[l.stage] || l.stage} · {ago(l.updated_at)}</span>
                  </div>
                  {l.stage === "payment_shown" && st === "abandoned" && (
                    <div style={{ fontSize: 12, color: "#9a5b00", marginTop: 3 }}>
                      Check your UPI for a payment first. They may have paid without tapping "I've paid".
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: "#444", marginTop: 3 }}>
                    {l.phone || "no phone"}{l.email ? ` · ${l.email}` : ""}{l.city ? ` · ${l.city}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {link && <a href={link} target="_blank" rel="noopener noreferrer" style={{ ...ts.primaryBtn, textDecoration: "none", padding: "8px 14px", fontSize: 12 }}>WhatsApp</a>}
                  {l.phone && <a href={`tel:${l.phone}`} style={{ ...ts.ghostBtn, textDecoration: "none", padding: "8px 14px", fontSize: 12 }}>Call</a>}
                </div>
              </div>

              <div style={{ fontSize: 13, color: "#555", marginTop: 8 }}>
                {(l.cart || []).map((i, n) => (
                  <div key={n}>• {i.title} x{i.qty}{i.color ? ` [${i.color}]` : ""}{i.size ? ` [${i.size}]` : ""} · ₹{(i.price * i.qty).toLocaleString("en-IN")}</div>
                ))}
                {l.cart_total ? <div style={{ marginTop: 2, fontWeight: 600 }}>Cart ₹{Number(l.cart_total).toLocaleString("en-IN")}</div> : null}
              </div>

              <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 10, flexWrap: "wrap", fontSize: 12, color: "#888" }}>
                <span>{l.device || "?"} · {campaign}</span>
                <label style={{ display: "flex", gap: 6, alignItems: "center", color: "#444", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!l.followed_up} disabled={saving[l.lead_id]} onChange={e => update(l, { followed_up: e.target.checked })} />
                  Followed up
                </label>
                <input
                  style={{ ...ts.input, margin: 0, flex: 1, minWidth: 160, padding: "6px 10px", fontSize: 12 }}
                  placeholder="Notes"
                  defaultValue={l.notes || ""}
                  onBlur={e => { if (e.target.value !== (l.notes || "")) update(l, { notes: e.target.value }); }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
