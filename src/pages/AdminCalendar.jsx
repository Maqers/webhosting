/**
 * Gifting calendar tab for the admin portal.
 *
 * Built-in days come from src/data/festiveCalendar.js. Days the team adds
 * are stored in CAL_PATH in the repo (same GitHub creds as the catalog), so
 * everyone logged into /admin sees the same calendar.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  EVENT_TYPES, LUNAR_YEARS, getBuiltInEvents, getCustomEvents,
  dateToKey, keyToDate,
} from "../data/festiveCalendar";

const CAL_PATH = "admin-data/calendar-events.json";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const UPCOMING_DAYS = 60;
const EMPTY_FORM = { name: "", emoji: "", type: "custom", note: "", repeat: "yearly", lead: 14 };

const fmtShort = (key) => keyToDate(key).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtLong = (key) => keyToDate(key).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const daysBetween = (fromKey, toKey) => Math.round((keyToDate(toKey) - keyToDate(fromKey)) / 86400000);
const shiftKey = (key, days) => { const d = keyToDate(key); d.setDate(d.getDate() + days); return dateToKey(d); };

export default function AdminCalendar({ creds, ghGet, ghPut, showToast: showToastProp, ts }) {
  // The portal recreates showToast every render; keep it out of effect deps
  // so the GitHub load runs once, not on every parent render.
  const toastRef = useRef(showToastProp);
  toastRef.current = showToastProp;
  const showToast = useCallback((...args) => toastRef.current(...args), []);
  const todayKey = dateToKey(new Date());
  const [view, setView] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [custom, setCustom] = useState([]);
  const [sha, setSha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState(() => new Set());
  const [selectedKey, setSelectedKey] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const loadCustom = useCallback(async () => {
    setLoading(true);
    try {
      const file = await ghGet(CAL_PATH, creds);
      const json = JSON.parse(decodeURIComponent(escape(atob(file.content.replace(/\n/g, "")))));
      setCustom(Array.isArray(json.events) ? json.events : []);
      setSha(file.sha);
    } catch (err) {
      // First use: the file doesn't exist until the first custom day is saved.
      if (/\(404\)/.test(err.message)) { setCustom([]); setSha(null); }
      else showToast("Couldn't load saved calendar days: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [creds, ghGet, showToast]);

  useEffect(() => { loadCustom(); }, [loadCustom]);

  useEffect(() => {
    if (!selectedKey) return;
    const onKey = (e) => { if (e.key === "Escape") closeDay(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedKey]);

  const eventsForYear = useCallback((year) => [
    ...getBuiltInEvents(year),
    ...getCustomEvents(custom, year).map(e => ({ ...e, type: e.type || "custom" })),
  ].filter(e => !hiddenTypes.has(e.type)), [custom, hiddenTypes]);

  const byDate = useMemo(() => {
    const map = {};
    for (const e of eventsForYear(view.year)) (map[e.date] ||= []).push(e);
    return map;
  }, [eventsForYear, view.year]);

  const upcoming = useMemo(() => {
    const year = keyToDate(todayKey).getFullYear();
    const endKey = shiftKey(todayKey, UPCOMING_DAYS);
    return [...eventsForYear(year), ...eventsForYear(year + 1)]
      .filter(e => e.date >= todayKey && e.date <= endKey)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [eventsForYear, todayKey]);

  // Month grid: leading blanks, then each day of the month.
  const cells = useMemo(() => {
    const firstDow = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const out = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(dateToKey(new Date(view.year, view.month, d)));
    while (out.length % 7) out.push(null);
    return out;
  }, [view]);

  function shiftMonth(delta) {
    setView(v => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  function jumpTo(key) {
    const d = keyToDate(key);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }

  function openDay(key) { setSelectedKey(key); setForm(EMPTY_FORM); setEditingId(null); }
  function closeDay() { setSelectedKey(null); setForm(EMPTY_FORM); setEditingId(null); }

  function toggleType(type) {
    setHiddenTypes(prev => { const next = new Set(prev); next.has(type) ? next.delete(type) : next.add(type); return next; });
  }

  async function persist(nextEvents, message) {
    setSaving(true);
    try {
      const body = JSON.stringify({ events: nextEvents }, null, 2) + "\n";
      const encoded = btoa(unescape(encodeURIComponent(body)));
      const res = await ghPut(CAL_PATH, encoded, message, sha, creds);
      setSha(res.content.sha);
      setCustom(nextEvents);
      return true;
    } catch (err) {
      if (/\((409|422)\)/.test(err.message)) {
        showToast("Someone else updated the calendar. Reloaded, please try again.", "error");
        await loadCustom();
      } else {
        showToast("Save failed: " + err.message, "error");
      }
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const entry = {
      id: editingId || `cu-${Date.now().toString(36)}`,
      date: editingId ? custom.find(c => c.id === editingId).date : selectedKey,
      name,
      emoji: form.emoji.trim() || "📌",
      type: form.type,
      note: form.note.trim(),
      repeat: form.repeat,
      lead: Math.max(0, Number(form.lead) || 0),
    };
    const next = editingId ? custom.map(c => (c.id === editingId ? entry : c)) : [...custom, entry];
    const ok = await persist(next, `Calendar: ${editingId ? "update" : "add"} ${name}`);
    if (ok) {
      showToast(editingId ? `Updated ${name}` : `Added ${name} to the calendar`);
      setForm(EMPTY_FORM);
      setEditingId(null);
    }
  }

  function startEdit(ev) {
    const stored = custom.find(c => c.id === ev.id);
    setEditingId(stored.id);
    setForm({ name: stored.name, emoji: stored.emoji || "", type: stored.type || "custom", note: stored.note || "", repeat: stored.repeat || "once", lead: stored.lead ?? 14 });
  }

  async function handleDelete(ev) {
    if (!window.confirm(`Remove "${ev.name}" from the calendar${ev.repeat === "yearly" ? " (every year)" : ""}?`)) return;
    const ok = await persist(custom.filter(c => c.id !== ev.id), `Calendar: remove ${ev.name}`);
    if (ok) { showToast(`Removed ${ev.name}`); if (editingId === ev.id) { setEditingId(null); setForm(EMPTY_FORM); } }
  }

  const selectedEvents = selectedKey
    ? [...getBuiltInEvents(keyToDate(selectedKey).getFullYear()), ...getCustomEvents(custom, keyToDate(selectedKey).getFullYear())]
        .filter(e => e.date === selectedKey)
    : [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ ...ts.pageTitle, marginBottom: 4 }}>Gifting Calendar</h1>
          <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
            Festivals, relationship days and shopping moments. Click any date to add your own.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={cs.navArrow} onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
          <div style={cs.monthLabel}>{MONTHS[view.month]} {view.year}</div>
          <button style={cs.navArrow} onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
          <button style={{ ...ts.ghostBtn, padding: "7px 14px", fontSize: 12 }} onClick={() => jumpTo(todayKey)}>Today</button>
        </div>
      </div>

      <div style={{ ...ts.chipGrid, marginBottom: 16 }}>
        {Object.entries(EVENT_TYPES).map(([type, meta]) => {
          const on = !hiddenTypes.has(type);
          return (
            <button key={type} onClick={() => toggleType(type)}
              style={{ ...cs.typeChip, borderColor: on ? meta.color : "#e0dbd2", background: on ? meta.bg : "#fafaf9", color: on ? meta.color : "#aaa" }}>
              <span style={{ ...cs.dot, background: on ? meta.color : "#ccc" }} />{meta.label}
            </button>
          );
        })}
      </div>

      {!LUNAR_YEARS.includes(view.year) && (
        <div style={cs.notice}>
          Lunar festival dates (Diwali, Holi, Raksha Bandhan, Eid…) aren't loaded for {view.year} yet.
          Add them in <code>src/data/festiveCalendar.js</code>, or click a date to add them here.
        </div>
      )}

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ ...cs.calendar, flex: "1 1 640px", minWidth: 0 }}>
          <div style={cs.weekRow}>
            {WEEKDAYS.map(w => <div key={w} style={cs.weekday}>{w}</div>)}
          </div>
          <div style={cs.grid}>
            {cells.map((key, i) => {
              if (!key) return <div key={`b${i}`} style={cs.blank} />;
              const evs = byDate[key] || [];
              const isToday = key === todayKey;
              const isPast = key < todayKey;
              return (
                <button key={key} onClick={() => openDay(key)} style={{ ...cs.cell, ...(isPast ? cs.cellPast : {}) }} title="Click to view or add a day">
                  <span style={{ ...cs.dayNum, ...(isToday ? cs.today : {}) }}>{keyToDate(key).getDate()}</span>
                  {evs.slice(0, 3).map(ev => {
                    const meta = EVENT_TYPES[ev.type] || EVENT_TYPES.custom;
                    return (
                      <span key={ev.id} style={{ ...cs.pill, background: meta.bg, color: meta.color }}>
                        {ev.emoji} {ev.name}{ev.approx ? " ≈" : ""}
                      </span>
                    );
                  })}
                  {evs.length > 3 && <span style={cs.more}>+{evs.length - 3} more</span>}
                </button>
              );
            })}
          </div>
          <p style={{ ...ts.fieldHint, margin: "10px 2px 0" }}>≈ lunar date, confirm with a panchang closer to the day.</p>
        </div>

        <aside style={{ ...ts.card, flex: "1 1 280px", maxWidth: 380, padding: 20, marginBottom: 0 }}>
          <h3 style={{ ...ts.cardTitle, marginBottom: 4 }}>Coming up</h3>
          <p style={{ ...ts.fieldHint, fontStyle: "normal", margin: "0 0 14px" }}>Next {UPCOMING_DAYS} days</p>
          {loading && <p style={{ fontSize: 12, color: "#aaa" }}>Loading saved days…</p>}
          {!loading && upcoming.length === 0 && <p style={{ fontSize: 12, color: "#aaa" }}>Nothing in the next {UPCOMING_DAYS} days.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcoming.map(ev => {
              const meta = EVENT_TYPES[ev.type] || EVENT_TYPES.custom;
              const away = daysBetween(todayKey, ev.date);
              const promoteKey = shiftKey(ev.date, -(ev.lead ?? 14));
              const promoteNow = promoteKey <= todayKey;
              return (
                <button key={ev.id} onClick={() => { jumpTo(ev.date); openDay(ev.date); }} style={{ ...cs.upRow, borderLeftColor: meta.color }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{ev.emoji} {ev.name}</span>
                    <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>{away === 0 ? "Today" : away === 1 ? "Tomorrow" : `in ${away} days`}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
                    {fmtShort(ev.date)}{ev.approx ? " ≈" : ""} ·{" "}
                    {promoteNow
                      ? <span style={{ color: "#c2410c", fontWeight: 600 }}>Promote now</span>
                      : <>Promote from {fmtShort(promoteKey)}</>}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {selectedKey && (
        <div style={cs.overlay} onClick={closeDay}>
          <div style={cs.modal} onClick={e => e.stopPropagation()} role="dialog" aria-label={fmtLong(selectedKey)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <h2 style={{ ...ts.cardTitle, fontSize: 18, marginBottom: 14 }}>{fmtLong(selectedKey)}</h2>
              <button onClick={closeDay} style={{ ...ts.colorChipX, fontSize: 22 }} aria-label="Close">×</button>
            </div>

            {selectedEvents.length === 0 && <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 8px" }}>Nothing marked on this day yet.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedEvents.map(ev => {
                const meta = EVENT_TYPES[ev.type] || EVENT_TYPES.custom;
                return (
                  <div key={ev.id} style={{ ...cs.dayEvent, borderLeftColor: meta.color }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>{ev.emoji} {ev.name}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
                          <span style={{ ...ts.flag, background: meta.bg, color: meta.color }}>{meta.label}</span>
                          {ev.approx && <span style={ts.flag}>≈ lunar date</span>}
                          {!ev.builtIn && <span style={ts.flag}>{ev.repeat === "yearly" ? "Every year" : "One-off"}</span>}
                          <span style={ts.flag}>Promote from {fmtShort(shiftKey(ev.date, -(ev.lead ?? 14)))}</span>
                        </div>
                      </div>
                      {!ev.builtIn && (
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button style={ts.editBtn} onClick={() => startEdit(ev)} disabled={saving}>Edit</button>
                          <button style={{ ...ts.editBtn, color: "#c00", borderColor: "#e8b8b8" }} onClick={() => handleDelete(ev)} disabled={saving}>Delete</button>
                        </div>
                      )}
                    </div>
                    {ev.note && <p style={{ fontSize: 12, color: "#666", margin: "8px 0 0", lineHeight: 1.5 }}>{ev.note}</p>}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSave} style={{ marginTop: 18, borderTop: "1px solid #eee", paddingTop: 6 }}>
              <h3 style={{ ...ts.sectionTitle, margin: "10px 0 0" }}>{editingId ? "Edit day" : "Add a day"}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 10 }}>
                <div>
                  <label style={ts.label}>Emoji</label>
                  <input style={{ ...ts.input, textAlign: "center" }} value={form.emoji} placeholder="📌" maxLength={4}
                    onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} />
                </div>
                <div>
                  <label style={ts.label}>Name <span style={ts.req}>*</span></label>
                  <input style={ts.input} value={form.name} placeholder="e.g. Sale launch, Pre-Diwali drop" required autoFocus
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 110px", gap: 10 }}>
                <div>
                  <label style={ts.label}>Type</label>
                  <select style={ts.input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(EVENT_TYPES).map(([type, meta]) => <option key={type} value={type}>{meta.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={ts.label}>Repeats</label>
                  <select style={ts.input} value={form.repeat} onChange={e => setForm(f => ({ ...f, repeat: e.target.value }))}>
                    <option value="yearly">Every year</option>
                    <option value="once">Only this year</option>
                  </select>
                </div>
                <div>
                  <label style={ts.label}>Lead days</label>
                  <input style={ts.input} type="number" min="0" max="120" value={form.lead}
                    onChange={e => setForm(f => ({ ...f, lead: e.target.value }))} />
                </div>
              </div>
              <label style={ts.label}>Notes <span style={ts.labelHint}>(gifting angle, products to push)</span></label>
              <textarea style={{ ...ts.input, height: 64, resize: "vertical" }} value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
                {editingId && <button type="button" style={ts.ghostBtn} onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>Cancel edit</button>}
                <button type="submit" style={ts.primaryBtn} disabled={saving || !form.name.trim()}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add to calendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const cs = {
  navArrow: { background: "#fff", border: "1px solid #ddd", borderRadius: 8, width: 34, height: 34, fontSize: 18, cursor: "pointer", color: "#444", lineHeight: 1 },
  monthLabel: { minWidth: 150, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#1a1a18" },
  typeChip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", border: "1px solid", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "Georgia, serif", fontWeight: 600 },
  dot: { width: 7, height: 7, borderRadius: "50%", display: "inline-block" },
  notice: { background: "#fbf3df", border: "1px solid #ecd9a8", color: "#7a5b14", borderRadius: 8, padding: "10px 14px", fontSize: 12, marginBottom: 16, lineHeight: 1.5 },
  calendar: { background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: 12 },
  weekRow: { display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6, marginBottom: 6 },
  weekday: { fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center", padding: "4px 0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 },
  blank: { minHeight: 96 },
  cell: { minHeight: 96, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 3, padding: 6, background: "#fcfbf9", border: "1px solid #f0ede8", borderRadius: 8, cursor: "pointer", textAlign: "left", fontFamily: "Georgia, serif", minWidth: 0, overflow: "hidden" },
  cellPast: { opacity: 0.55 },
  dayNum: { fontSize: 12, fontWeight: 600, color: "#555", alignSelf: "flex-start", width: 22, height: 22, lineHeight: "22px", textAlign: "center", borderRadius: "50%", marginBottom: 1 },
  today: { background: "#1a1a18", color: "#c8a96e" },
  pill: { fontSize: 10, lineHeight: 1.3, padding: "2px 5px", borderRadius: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 },
  more: { fontSize: 10, color: "#999", paddingLeft: 2 },
  upRow: { textAlign: "left", background: "#fcfbf9", border: "1px solid #f0ede8", borderLeft: "3px solid", borderRadius: 6, padding: "8px 10px", cursor: "pointer", fontFamily: "Georgia, serif" },
  overlay: { position: "fixed", inset: 0, background: "rgba(17,17,16,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
  modal: { background: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.2)", fontFamily: "Georgia, serif" },
  dayEvent: { background: "#fcfbf9", border: "1px solid #f0ede8", borderLeft: "3px solid", borderRadius: 6, padding: "10px 12px" },
};
