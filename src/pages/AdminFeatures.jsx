import { useState, useMemo, useRef } from "react";

// Weight & Material for every product in one table: the values shown under
// "Product Features" on the product page. Material can be suggested by the AI
// from each product's photo and listing text (never overwriting one that is
// already filled in); weight has to be typed. Edits are staged in the admin's
// shared pendingChanges, so they publish through the same "Publish All" button
// (one catalog commit) as every other bulk edit.

const FILTERS = [
  { id: "missing-material", label: "Missing material" },
  { id: "missing-weight", label: "Missing weight" },
  { id: "all", label: "All products" },
];

const blank = (v) => !String(v ?? "").trim();
const CONCURRENCY = 3;

export default function AdminFeatures({ products, pendingChanges, setPendingChanges, onPublish, publishing, creds, showToast, ts }) {
  const [filter, setFilter] = useState("missing-material");
  const [query, setQuery] = useState("");
  const [ai, setAi] = useState({ running: false, done: 0, total: 0, failed: [] });
  const [aiIds, setAiIds] = useState(() => new Set()); // rows the AI filled this session
  const stopRef = useRef(false);

  const rows = useMemo(
    () => products.map(p => (pendingChanges[p.id] ? { ...p, ...pendingChanges[p.id] } : p)),
    [products, pendingChanges]
  );
  const counts = useMemo(() => ({
    material: rows.filter(p => blank(p.material)).length,
    weight: rows.filter(p => blank(p.weight)).length,
  }), [rows]);

  // Filters look at the saved values, not staged edits, so a row doesn't vanish
  // from under the cursor the moment its field gets filled in.
  const saved = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(p => {
      const orig = saved.get(p.id) || p;
      const byFilter = filter === "all"
        || (filter === "missing-material" ? blank(orig.material) : blank(orig.weight));
      return byFilter && (!q || p.title.toLowerCase().includes(q) || String(p.id) === q);
    });
  }, [rows, saved, filter, query]);

  const pendingCount = Object.keys(pendingChanges).length;

  function setField(product, field, value) {
    setPendingChanges(prev => ({ ...prev, [product.id]: { ...(prev[product.id] || product), [field]: value } }));
    if (field === "material") setAiIds(prev => { if (!prev.has(product.id)) return prev; const n = new Set(prev); n.delete(product.id); return n; });
  }

  async function suggestOne(product) {
    const image = product.images?.[0];
    const res = await fetch("/api/generate-description", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.token}` },
      body: JSON.stringify({
        mode: "material",
        title: product.title,
        categoryId: product.categoryId,
        description: product.description,
        tags: product.tags,
        imageUrl: image ? new URL(image, window.location.origin).href : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return String(data.material || "").trim();
  }

  async function runAi() {
    // Everything still missing a material (not only what the filter shows)
    const todo = rows.filter(p => blank(p.material));
    if (!todo.length) return showToast("Every product already has a material.", "info");
    stopRef.current = false;
    setAi({ running: true, done: 0, total: todo.length, failed: [] });
    let next = 0, done = 0;
    const failed = [];
    const worker = async () => {
      while (!stopRef.current) {
        const product = todo[next++];
        if (!product) return;
        try {
          const material = await suggestOne(product);
          if (material) {
            // Fill only if still empty: never overwrite something typed meanwhile
            setPendingChanges(prev => {
              const current = prev[product.id] || product;
              return blank(current.material) ? { ...prev, [product.id]: { ...current, material } } : prev;
            });
            setAiIds(prev => new Set(prev).add(product.id));
          } else {
            failed.push({ id: product.id, title: product.title, why: "AI could not tell" });
          }
        } catch (err) {
          failed.push({ id: product.id, title: product.title, why: err.message });
          if (/Not authorised|OPENAI_API_KEY/.test(err.message)) { stopRef.current = true; }
        }
        done++;
        setAi({ running: true, done, total: todo.length, failed: [...failed] });
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setAi({ running: false, done, total: todo.length, failed: [...failed] });
    showToast(stopRef.current && done < todo.length
      ? `Stopped after ${done} of ${todo.length}. Review below, then Publish All.`
      : `AI filled ${done - failed.length} of ${todo.length}. Review below, then Publish All.`, failed.length ? "info" : "success");
  }

  const cell = { padding: "8px 10px", borderBottom: "1px solid #f0ece4", verticalAlign: "middle" };
  const input = { ...ts.input, marginTop: 0, padding: "7px 9px", fontSize: 13 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
        <div>
          <h1 style={{ ...ts.pageTitle, marginBottom: 4 }}>Weight &amp; Material</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#777" }}>
            Shown under Product Features on each product page. {counts.material} of {rows.length} are missing a material, {counts.weight} are missing a weight.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {pendingCount > 0 && <span style={{ fontSize: 12, color: "#a07840" }}>{pendingCount} unsaved</span>}
          {pendingCount > 0 && <button style={ts.ghostBtn} onClick={() => { setPendingChanges({}); setAiIds(new Set()); }}>Discard All</button>}
          <button style={{ ...ts.primaryBtn, opacity: pendingCount ? 1 : 0.45 }} onClick={onPublish} disabled={publishing || !pendingCount}>
            {publishing ? "Publishing..." : `Publish All (${pendingCount})`}
          </button>
        </div>
      </div>

      <div style={{ ...ts.card, padding: 16, marginTop: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {!ai.running
            ? <button style={ts.primaryBtn} onClick={runAi} disabled={publishing || !counts.material}>✦ Suggest missing materials with AI ({counts.material})</button>
            : <button style={{ ...ts.ghostBtn, color: "#c0392b", borderColor: "#e8b4ae" }} onClick={() => { stopRef.current = true; }}>Stop</button>}
          {ai.running && <span style={{ fontSize: 13, color: "#555" }}>Working… {ai.done} / {ai.total}</span>}
          {!ai.running && ai.total > 0 && <span style={{ fontSize: 13, color: "#555" }}>Last run: {ai.done - ai.failed.length} filled, {ai.failed.length} skipped</span>}
        </div>
        <p style={{ ...ts.fieldHint, marginTop: 8 }}>
          One small AI call per product, using its photo and listing. It only fills empty materials and never writes gold, silver, real stones or pearls unless the listing says so.
          Check the suggestions (highlighted) before publishing. Weight can't be worked out from a photo, so type it in.
        </p>
        {ai.failed.length > 0 && !ai.running && (
          <details style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
            <summary style={{ cursor: "pointer" }}>{ai.failed.length} skipped</summary>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {ai.failed.slice(0, 50).map(f => <li key={f.id}>{f.title} (ID {f.id}): {f.why}</li>)}
            </ul>
          </details>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "4px 0 14px", flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f.id} type="button" style={filter === f.id ? ts.chipActive : ts.chip} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
        <input style={{ ...ts.input, marginTop: 0, width: 240, marginLeft: "auto" }} placeholder="Search title or ID" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div style={{ ...ts.card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#faf8f3", textAlign: "left", color: "#777", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <th style={{ ...cell, width: "34%" }}>Product</th>
              <th style={cell}>Material</th>
              <th style={{ ...cell, width: 150 }}>Weight</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={3} style={{ ...cell, textAlign: "center", color: "#999", padding: 28 }}>Nothing to show for this filter.</td></tr>
            )}
            {visible.slice(0, 400).map(p => (
              <tr key={p.id} style={pendingChanges[p.id] ? { background: "#fffaf0" } : undefined}>
                <td style={cell}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>ID {p.id}</div>
                    </div>
                  </div>
                </td>
                <td style={cell}>
                  <input style={{ ...input, ...(aiIds.has(p.id) ? { background: "#f3f8ee", borderColor: "#b8d4a0" } : null) }}
                    placeholder="e.g. Crochet, Wax, Glass, Brass" value={p.material || ""}
                    onChange={e => setField(p, "material", e.target.value)} />
                  {aiIds.has(p.id) && <div style={{ fontSize: 10, color: "#6a9a4a", marginTop: 2 }}>✦ AI suggestion, check it</div>}
                </td>
                <td style={cell}>
                  <input style={input} placeholder="e.g. 250 g" value={p.weight || ""}
                    onChange={e => setField(p, "weight", e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length > 400 && <p style={{ ...ts.fieldHint, padding: 12, margin: 0 }}>Showing the first 400 of {visible.length}. Use the search or a filter to narrow it down.</p>}
      </div>
    </div>
  );
}
