/**
 * MAQERS ADMIN PORTAL v2.1
 * Key changes from v2:
 *   1. sanitizeForJS() — strips newlines/tabs before writing to catalog.js
 *      This prevents "Unterminated string constant" Vercel build errors
 *   2. Keywords field added to Add Product + Edit Product forms
 * Drop into src/pages/AdminPortal.jsx
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import "./AdminPortal.css";

// Occasion categories are parsed dynamically from catalog.js occasionProductMap
// — no hardcoded list needed anymore

const ICON_OPTIONS = ["home","gift","fashion","jewelry","kitchen","art","wedding","hampers","soaps","decor"];

// ─── GitHub API ───────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// GitHub's Contents API secondary-rate-limits rapid sequential writes to the
// same repo (their docs explicitly warn about this for Contents API usage).
// Publishing several products/images back-to-back easily trips it — this
// used to surface as a raw 403 that just failed the whole operation, forcing
// a manual retry that immediately re-triggered the same rapid-fire pattern.
// Now it backs off and retries automatically instead of failing outright.
async function githubFetchWithRetry(url, options, attempt = 0) {
  const res = await fetch(url, options);
  if ((res.status === 403 || res.status === 429) && attempt < 4) {
    const bodyText = await res.text();
    const retryAfter = res.headers.get("Retry-After");
    const isRateLimit = retryAfter || /rate limit|abuse/i.test(bodyText);
    if (isRateLimit) {
      const waitMs = retryAfter ? Number(retryAfter) * 1000 : Math.min(1500 * 2 ** attempt, 15000);
      await sleep(waitMs);
      return githubFetchWithRetry(url, options, attempt + 1);
    }
    throw new Error(`GitHub request failed (${res.status}): ${bodyText}`);
  }
  return res;
}

async function ghGet(path, creds) {
  const res = await githubFetchWithRetry(
    `https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/${path}?ref=${creds.branch}&t=${Date.now()}`,
    { headers: { Authorization: `Bearer ${creds.token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`GitHub GET failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function ghPut(path, content, message, sha, creds) {
  const res = await githubFetchWithRetry(
    `https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/${path}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${creds.token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({ message, content, branch: creds.branch, ...(sha ? { sha } : {}) }),
    }
  );
  if (!res.ok) throw new Error(`GitHub PUT failed (${res.status}): ${await res.text()}`);
  return res.json();
}

// ─── Supabase API ─────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://ipkyssauulddtthrebnw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwa3lzc2F1dWxkZHR0aHJlYm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDAyMTEsImV4cCI6MjA4MTYxNjIxMX0.TIZuwR0Vu2cyhhpGuCoB38fC6K8ZtnW17NeVzHWc-n0";

const sbHeaders = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

async function sbGetSellers() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sellers_db?select=*&order=business_name.asc`, {
    headers: { ...sbHeaders, "Cache-Control": "no-cache", "Pragma": "no-cache" }
  });
  if (!res.ok) throw new Error(`Supabase GET failed: ${await res.text()}`);
  return res.json();
}

async function sbCreateSeller(seller) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sellers_db`, {
    method: "POST",
    headers: { ...sbHeaders, "Prefer": "return=representation" },
    body: JSON.stringify(seller),
  });
  if (!res.ok) throw new Error(`Supabase CREATE failed: ${await res.text()}`);
  return res.json();
}

async function sbUpdateSeller(id, updates) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sellers_db?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...sbHeaders, "Prefer": "return=representation" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Supabase UPDATE failed: ${await res.text()}`);
  return res.json();
}

async function sbDeleteSeller(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sellers_db?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: sbHeaders,
  });
  if (!res.ok) throw new Error(`Supabase DELETE failed: ${await res.text()}`);
}

async function sbUploadKYC(file, sellerId) {
  const ext = file.name.split(".").pop();
  const path = `${sellerId}/${Date.now()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/seller_docs/${path}`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`KYC upload failed: ${await res.text()}`);
  return path;
}

async function sbGetKYCUrl(path) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/seller_docs/${path}`, {
    method: "POST",
    headers: { ...sbHeaders },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
}

function generateSellerId(businessName, ownerName) {
  const b = (businessName || "X").trim()[0].toUpperCase();
  const o = (ownerName || "X").trim()[0].toUpperCase();
  // Sequential number handled by caller passing in current count
  return `${b}${o}`;
}

async function fetchCatalog(creds) {
  const file = await ghGet("src/data/catalog.js", creds);
  const source = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
  return { source, sha: file.sha };
}

async function commitCatalog(source, sha, message, creds) {
  const encoded = btoa(unescape(encodeURIComponent(source)));
  return ghPut("src/data/catalog.js", encoded, message, sha, creds);
}

async function fetchCatalog2(creds) {
  const file = await ghGet("src/data/catalog.js", creds);
  const source = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
  return { source, sha: file.sha };
}

async function commitCatalog2(source, sha, message, creds) {
  const encoded = btoa(unescape(encodeURIComponent(source)));
  return ghPut("src/data/catalog.js", encoded, message, sha, creds);
}

async function fetchOccasionCatalog(creds) {
  const file = await ghGet("src/data/occasionCatalog.js", creds);
  const source = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
  return { source, sha: file.sha };
}

async function commitOccasionCatalog(source, sha, message, creds) {
  const encoded = btoa(unescape(encodeURIComponent(source)));
  return ghPut("src/data/occasionCatalog.js", encoded, message, sha, creds);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Description formatting toolbar helpers ────────────────────────────────────
// Descriptions are stored as plain strings (see sanitizeForJS below), so
// formatting is a lightweight markup convention — **bold**, __underline__, and
// ✨-prefixed bullet lines — that ProductDetail.jsx parses back into real HTML
// at render time. Works directly on the textarea's own selection, since these
// forms are controlled inputs (state, not the DOM, is the source of truth).
function wrapDescSelection(ref, value, setValue, marker) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart, end = el.selectionEnd;
  const selected = value.slice(start, end);
  const newText = value.slice(0, start) + marker + selected + marker + value.slice(end);
  setValue(newText);
  requestAnimationFrame(() => {
    el.focus();
    const pos = selected ? end + marker.length * 2 : start + marker.length;
    el.setSelectionRange(pos, pos);
  });
}

function insertDescBullet(ref, value, setValue) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart;
  const before = value.slice(0, start);
  const insertion = (before.length > 0 && !before.endsWith("\n") ? "\n" : "") + "✨ ";
  const newText = before + insertion + value.slice(start);
  setValue(newText);
  requestAnimationFrame(() => {
    el.focus();
    const pos = start + insertion.length;
    el.setSelectionRange(pos, pos);
  });
}

/**
 * sanitizeForJS — THE KEY FIX
 * Strips newlines, tabs, and escapes quotes/backslashes before writing
 * any user-entered text into a JS single-line string literal in catalog.js.
 * Without this, pasted multi-line descriptions break the JS syntax
 * and cause Vercel build to fail with "Unterminated string constant".
 */
function sanitizeForJS(str) {
  if (str === null || str === undefined) return ""
  if (Array.isArray(str)) return str.map(s => sanitizeForJS(s)).join(", ")
  if (typeof str !== "string") str = String(str)
  return str
    .replace(/\\/g, "\\\\")        // escape backslashes FIRST
    .replace(/"/g, '\\"')           // escape double quotes
    .replace(/\r?\n|\r/g, "\\\\n") // actual newlines -> \\n (two backslashes+n at runtime -> writes \\n to file)
    .replace(/\t/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Normalize raw captured description from catalog source text
// parseProducts regex captures raw escape sequences; we unescape them to real chars
function normalizeDescription(raw) {
  return raw
    .replace(/\\"/g, '"')       // \" -> "
    .replace(/\\\\n/g, '\n')    // \\n (two backslashes+n in source) -> actual newline
    .replace(/\\\\/g, '\\');    // \\\\ -> single backslash
}

function getNextId(source) {
  const ids = [...source.matchAll(/\bid:\s*(\d+)/g)].map(m => parseInt(m[1]));
  return ids.length ? Math.max(...ids) + 1 : 1;
}

// ─── Catalog Parsers ──────────────────────────────────────────────────────────

function parseProducts(source) {
  const products = [];
  const regex = /\{\s*id:\s*(\d+),\s*categoryId:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*slug:\s*"([^"]*)",\s*description:\s*"((?:[^"\\]|\\.)*)",\s*price:\s*(\d+),\s*images:\s*\[([^\]]*)\],\s*popular:\s*(true|false),\s*featured:\s*(true|false),\s*inStock:\s*(true|false),\s*tags:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = regex.exec(source)) !== null) {
    products.push({
      id: parseInt(m[1]), categoryId: m[2], title: m[3], slug: m[4],
      description: normalizeDescription(m[5]),
      price: parseInt(m[6]),
      images: m[7].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean),
      popular: m[8] === "true", featured: m[9] === "true", inStock: m[10] === "true",
      tags: m[11].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean),
      keywords: [], colors: [], sizes: [],
    });
  }
  // Every secondary meta field below is parsed from each product's own
  // brace-bounded entry text (via getEntryRange), never scanned across the
  // whole file. The previous approach used a `[^}]*` guard from "meta: {" to
  // each field name — which silently stops at the FIRST `}` it sees. Any
  // product with object-format colors or a sizePrices object (both contain a
  // `}` before reaching later fields like sizes, moq, delivery_time,
  // secondaryCategories, sellerId, or sellerCode) would have all of those
  // later fields quietly parsed as empty, even though the file had the real
  // value — and re-saving from that stale-empty state wiped the real data.
  for (const p of products) {
    const range = getEntryRange(source, p.id);
    if (!range) continue;
    const entry = source.slice(range.start, range.end);

    const kw = entry.match(/keywords:\s*\[([^\]]*)\]/);
    if (kw) p.keywords = kw[1].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);

    const col = entry.match(/colors:\s*\[([^\]]*)\]/);
    if (col) {
      const raw = col[1].trim();
      if (!raw) {
        p.colors = [];
      } else if (raw.includes("name:")) {
        // Object format: { name: "Red", imageIndex: 0 }
        const objRegex = /\{\s*name:\s*"([^"]+)",\s*imageIndex:\s*(\d+)\s*\}/g;
        const cols = [];
        let om;
        while ((om = objRegex.exec(raw)) !== null) cols.push({ name: om[1], imageIndex: parseInt(om[2]) });
        p.colors = cols;
      } else {
        // Legacy string format
        p.colors = raw.split(",").map(s => ({ name: s.trim().replace(/^"|"$/g, ""), imageIndex: 0 })).filter(c => c.name);
      }
    }

    const sz = entry.match(/sizes:\s*\[([^\]]*)\]/);
    if (sz) p.sizes = sz[1].split(",").map(s => s.trim().replace(/^"|"$/g, "").replace(/\\"/g, '"').replace(/\\\\/g, "\\")).filter(Boolean);

    const sp = entry.match(/sizePrices:\s*(\{[^}]*\})/);
    if (sp) {
      try { p.sizePrices = JSON.parse(sp[1].replace(/(['"])?([a-zA-Z0-9_ ]+)(['"])?:/g, '"$2":')); }
      catch { /* malformed — skip */ }
    }

    const rv = entry.match(/reviews:\s*\[([^\]]*)\]/);
    if (rv && rv[1].trim()) {
      try { p.reviews = JSON.parse(`[${rv[1].replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')}]`); }
      catch { /* malformed — skip */ }
    }

    const mq = entry.match(/moq:\s*(\d+)/);
    if (mq) p.moq = parseInt(mq[1]) || 0;

    const op = entry.match(/originalPrice:\s*(\d+(?:\.\d+)?)/);
    if (op) p.originalPrice = Number(op[1]);

    // Without these two, editingProduct.personalisation_options was always
    // empty (the meta.* fallback in the edit form never had anything real to
    // fall back to either, since this parser never nests a real `meta`
    // object) — so opening Edit showed no personalisation options even when
    // the product had some, and saving any other change silently wiped them.
    const po = entry.match(/personalisation_options:\s*\[([^\]]*)\]/);
    if (po) p.personalisation_options = po[1].split(",").map(s => s.trim().replace(/^"|"$/g, "").replace(/\\"/g, '"').replace(/\\\\/g, "\\")).filter(Boolean);

    const pp = entry.match(/personalisation_prices:\s*\[([^\]]*)\]/);
    if (pp) p.personalisation_prices = pp[1].split(",").map(s => Number(s.trim())).filter(n => !isNaN(n));

    const dt = entry.match(/delivery_time:\s*"([^"]*)"/);
    if (dt) p.delivery_time = dt[1];

    const sc = entry.match(/secondaryCategories:\s*\[([^\]]*)\]/);
    if (sc) p.secondaryCategories = sc[1].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);

    const si = entry.match(/sellerId:\s*"([^"]*)"/);
    if (si) p.sellerId = si[1];

    const sco = entry.match(/sellerCode:\s*"([^"]*)"/);
    if (sco) p.sellerCode = sco[1];
  }
  return products;
}

function parseCategories(source) {
  const cats = [];
  const regex = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*slug:\s*"([^"]+)",\s*description:\s*"([^"]*)",\s*icon:\s*"([^"]*)",\s*order:\s*(\d+),\s*featured:\s*(true|false)/g;
  let m;
  while ((m = regex.exec(source)) !== null) {
    cats.push({ id: m[1], name: m[2], slug: m[3], description: m[4], icon: m[5], order: parseInt(m[6]), featured: m[7] === "true" });
  }
  return cats.sort((a, b) => a.order - b.order);
}

function parseOccasionMap(source) {
  const map = {};
  // Find the occasionProductMap block
  const blockMatch = source.match(/export const occasionProductMap\s*=\s*\{([\s\S]*?)\};/m);
  if (!blockMatch) return map;
  const block = blockMatch[1];
  const regex = /'([^']+)':\s*\[([^\]]*)\]/g;
  let m;
  while ((m = regex.exec(block)) !== null) {
    map[m[1]] = m[2].split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }
  return map;
}

// Derive occasion categories list from parsed map keys
function parseOccasionCategories(source) {
  const blockMatch = source.match(/export const occasionProductMap\s*=\s*\{([\s\S]*?)\};/m);
  if (!blockMatch) return [];
  const block = blockMatch[1];
  const regex = /'([^']+)':/g;
  const results = [];
  let m;
  while ((m = regex.exec(block)) !== null) {
    const id = m[1];
    // Convert slug to display name: "for-your-best-friend" -> "For Your Best Friend"
    const name = id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    results.push({ id, name });
  }
  return results;
}


// ─── Catalog Writers ──────────────────────────────────────────────────────────

function updateProductInSource(source, product) {
  const range = getEntryRange(source, product.id);
  if (!range) throw new Error(`Product ID ${product.id} not found in catalog`);

  // getProductsByCategory() on the live site reads productsByCategory[id]
  // positionally — it does NOT filter by each product's own categoryId
  // field. So if categoryId changed but we only rewrite the field text in
  // place, the product stays physically nested under its OLD category's
  // array: /category/old-slug keeps showing it, /category/new-slug never
  // does, no matter what the edit form said. Only physically move the
  // entry when the category actually changed — moving on every edit would
  // instead silently reshuffle it to the end of the array, breaking any
  // manual ordering set via the By Category reorder tab.
  const oldEntryText = source.slice(range.start, range.end);
  const oldCategoryId = oldEntryText.match(/categoryId:\s*"([^"]+)"/)?.[1];

  if (oldCategoryId && oldCategoryId !== product.categoryId) {
    const withoutOld = source.slice(0, range.start) + source.slice(range.end);
    return insertProductIntoSource(withoutOld, product, product.id);
  }

  const newEntry = buildEntry(product.id, product);
  return source.slice(0, range.start) + newEntry + source.slice(range.end);
}

// Find the exact character range of a product entry using brace-counting
// This is safe against regex cross-matching between products
function getEntryRange(source, id) {
  const pattern = new RegExp(`    \\{ id: ${id},`);
  const m = source.match(pattern);
  if (!m) return null;
  let depth = 0;
  let i = m.index;
  while (i < source.length) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) {
        let end = i + 1;
        if (source[end] === ',') end++;
        return { start: m.index, end };
      }
    }
    i++;
  }
  return null;
}

function serializeColors(colors) {
  if (!colors || !Array.isArray(colors) || colors.length === 0) return "";
  return colors
    .filter(c => c && (typeof c === "object" ? c.name && c.name !== "[object Object]" : typeof c === "string" && c !== "[object Object]"))
    .map(c => {
      if (typeof c === "object" && c.name) {
        return `{ name: "${sanitizeForJS(c.name)}", imageIndex: ${Number(c.imageIndex) || 0} }`;
      }
      return `{ name: "${sanitizeForJS(String(c))}", imageIndex: 0 }`;
    })
    .join(", ");
}

function serializeSizes(sizes) {
  if (!sizes || !Array.isArray(sizes) || sizes.length === 0) return "";
  return sizes.map(s => `"${sanitizeForJS(String(s))}"`).join(", ");
}

function serializeSizePrices(sizePrices) {
  if (!sizePrices || typeof sizePrices !== "object" || Object.keys(sizePrices).length === 0) return null;
  const entries = Object.entries(sizePrices)
    .filter(([, v]) => v !== "" && v !== null && !isNaN(Number(v)))
    .map(([k, v]) => `"${sanitizeForJS(k)}": ${Number(v)}`);
  return entries.length > 0 ? `{ ${entries.join(", ")} }` : null;
}

function buildEntry(id, product) {
  const slug = slugify(product.title);
  const desc = sanitizeForJS(product.description);
  const title = sanitizeForJS(product.title);
  const images = (product.images || []).map(img => `"${img}"`).join(", ");
  const tags = Array.isArray(product.tags)
    ? product.tags.map(t => `"${sanitizeForJS(t)}"`).join(", ")
    : (product.tags || "").split(",").map(t => `"${sanitizeForJS(t.trim())}"`).filter(t => t !== '""').join(", ");
  const keywords = Array.isArray(product.keywords)
    ? product.keywords.map(k => `"${sanitizeForJS(k)}"`).join(", ")
    : (product.keywords || "").split(",").map(k => `"${sanitizeForJS(k.trim())}"`).filter(k => k !== '""').join(", ");
  const colors = serializeColors(product.colors);
  const sizes = serializeSizes(product.sizes);
  const sizePricesStr = serializeSizePrices(product.sizePrices);
  const moq = Number(product.moq) || 0;
  const deliveryTime = sanitizeForJS(product.delivery_time || product.meta?.delivery_time || "");
  const rawPersonalisationOpts = (product.personalisation_options || product.meta?.personalisation_options || []);
  const rawPersonalisationPrices = (product.personalisation_prices || product.meta?.personalisation_prices || []);
  const personalisationPairs = rawPersonalisationOpts
    .map((o, i) => ({ opt: o?.trim(), price: Number(rawPersonalisationPrices[i]) || 0 }))
    .filter(pair => pair.opt);
  const personalisationOpts = personalisationPairs.map(pair => sanitizeForJS(pair.opt));
  const personalisationPriceNums = personalisationPairs.map(pair => pair.price);
  const personalisationPart = personalisationOpts.length > 0
    ? `, personalisation_options: [${personalisationOpts.map(o => `"${o}"`).join(', ')}]`
    : '';
  const personalisationPricesPart = (personalisationPriceNums.length > 0 && personalisationPriceNums.some(p => p > 0))
    ? `, personalisation_prices: [${personalisationPriceNums.join(', ')}]`
    : '';
  const secCats = (product.secondaryCategories || []).map(c => `"${sanitizeForJS(c)}"`).join(", ");
  const sellerId = product.sellerId ? `"${sanitizeForJS(product.sellerId)}"` : '""';
  const sellerCode = product.sellerCode ? `"${sanitizeForJS(product.sellerCode)}"` : '""';

  // If size-based pricing, auto-set product.price to the minimum size price
  let basePrice = Number(product.price);
  if (sizePricesStr && product.sizePrices) {
    const vals = Object.values(product.sizePrices).map(Number).filter(v => !isNaN(v) && v > 0);
    if (vals.length > 0) basePrice = Math.min(...vals);
  }

  const sizePricesPart = sizePricesStr ? `, sizePrices: ${sizePricesStr}` : "";
  const originalPriceNum = Number(product.originalPrice) || 0;
  const originalPricePart = originalPriceNum > basePrice ? `, originalPrice: ${originalPriceNum}` : "";
  const reviewsPart = (product.reviews && product.reviews.length > 0)
    ? `, reviews: [${product.reviews.map(r => `{ name: "${sanitizeForJS(r.name)}", rating: ${Number(r.rating)}, text: "${sanitizeForJS(r.text||"")}", date: "${sanitizeForJS(r.date||"")}"${r.image ? `, image: "${sanitizeForJS(r.image)}"` : ""} }`).join(", ")}]`
    : "";
  return `    { id: ${id}, categoryId: "${product.categoryId}", title: "${title}", slug: "${slug}", description: "${desc}", price: ${basePrice}, images: [${images}], popular: ${!!product.popular}, featured: ${!!product.featured}, inStock: ${!!product.inStock}, tags: [${tags}], meta: { keywords: [${keywords}], colors: [${colors}], sizes: [${sizes}]${sizePricesPart}${originalPricePart}, moq: ${moq}, delivery_time: "${deliveryTime}", secondaryCategories: [${secCats}], sellerId: ${sellerId}, sellerCode: ${sellerCode}${personalisationPart}${personalisationPricesPart}${reviewsPart} } },`;
}

function insertProductIntoSource(source, product, id) {
  const entry = buildEntry(id, product);
  const catId = product.categoryId;
  const catEscaped = catId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const catKeyPattern = `(?:"${catEscaped}"|${catEscaped})`;

  // Find the category key position first
  const catKeyRe = new RegExp(`${catKeyPattern}\\s*:\\s*\\[`);
  const catMatch = source.match(catKeyRe);
  if (!catMatch) throw new Error(`Category block "${catId}" not found in catalog`);

  const blockStart = catMatch.index + catMatch[0].length;

  // Find the closing ], of this category block using brace/bracket counting
  let depth = 1; // we're already inside the [
  let i = blockStart;
  let closingIdx = -1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '[' || ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === ']') {
      depth--;
      if (depth === 0) { closingIdx = i; break; }
    }
    i++;
  }
  if (closingIdx === -1) throw new Error(`Could not find closing ] for category "${catId}"`);

  // Check if block is empty
  const blockContent = source.slice(blockStart, closingIdx).trim();
  if (!blockContent) {
    return source.slice(0, blockStart) + "\n" + entry + "\n  " + source.slice(closingIdx);
  }

  // Insert new entry before the closing ]
  // `entry` already ends with its own trailing comma (see buildEntry), so no
  // extra separator comma is added here — doing so previously created a
  // double-comma / array-elision bug ("},," ) whenever a product was inserted.
  return source.slice(0, closingIdx) + "\n" + entry + "\n  " + source.slice(closingIdx);
}

function insertCategoryIntoSource(source, cat, order) {
  const entry = `  { id: "${cat.id}", name: "${sanitizeForJS(cat.name)}", slug: "${cat.slug || slugify(cat.name)}", description: "${sanitizeForJS(cat.description)}", icon: "${cat.icon}", order: ${order}, featured: false, meta: { keywords: [] } },`;
  return source.replace(/(export const categories = \[)([\s\S]*?)(\n\];)/m, (_, open, content, close) => `${open}${content}\n${entry}${close}`);
}

function addCategoryProductBlock(source, categoryId) {
  return source.replace(/(export const productsByCategory = \{)/, `$1\n  "${categoryId}": [\n  ],`);
}

function updateCategoryInSource(source, original, updated) {
  const id = original.id;
  let r = source;
  r = r.replace(new RegExp(`(id:\\s*"${id}",[\\s\\S]*?name:\\s*)"[^"]*"`), `$1"${sanitizeForJS(updated.name)}"`);
  r = r.replace(new RegExp(`(id:\\s*"${id}",[\\s\\S]*?description:\\s*)"[^"]*"`), `$1"${sanitizeForJS(updated.description)}"`);
  r = r.replace(new RegExp(`(id:\\s*"${id}",[\\s\\S]*?icon:\\s*)"[^"]*"`), `$1"${updated.icon}"`);
  r = r.replace(new RegExp(`(id:\\s*"${id}",[\\s\\S]*?order:\\s*)\\d+`), `$1${updated.order}`);
  return r;
}

function updateOccasionMapInSource(source, occasionMap) {
  let updated = source;
  for (const [key, ids] of Object.entries(occasionMap)) {
    updated = updated.replace(new RegExp(`('${key}'\\s*:\\s*\\[)[^\\]]*(\\])`, "m"), `$1${ids.join(", ")}$2`);
  }
  return updated;
}

// Adds an empty product-id array for a brand new occasion key in catalog.js's
// occasionProductMap — mirrors addCategoryProductBlock's role for categories.
function addOccasionMapKey(source, occasionId) {
  return source.replace(
    /(export const occasionProductMap = \{)/,
    `$1\n  '${occasionId}': [],`
  );
}

// ─── occasionCatalog.js parsers/serializers ────────────────────────────────────
// occasionCatalog.js is a SEPARATE file from catalog.js: it holds the display
// metadata (name, emoji, description, order) for each occasion. catalog.js's
// occasionProductMap only holds which product IDs belong to each occasion —
// the /by-occasion page renders strictly off occasionCatalog.js's list, so an
// occasion only shows on the site once it exists in BOTH files.

function parseOccasionCatalogEntries(source) {
  const regex = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*slug:\s*"([^"]+)",\s*emoji:\s*"([^"]*)",\s*order:\s*(\d+),\s*description:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
  const results = [];
  let m;
  while ((m = regex.exec(source)) !== null) {
    results.push({ id: m[1], name: m[2], slug: m[3], emoji: m[4], order: parseInt(m[5]), description: m[6].replace(/\\"/g, '"') });
  }
  return results.sort((a, b) => a.order - b.order);
}

function insertOccasionCatalogEntry(source, occ, order) {
  const entry = `  {
    id: "${occ.id}",
    name: "${sanitizeForJS(occ.name)}",
    slug: "${occ.id}",
    emoji: "${occ.emoji || ""}",
    order: ${order},
    description: "${sanitizeForJS(occ.description || "")}"
  },`;
  return source.replace(/(export const occasionCategories = \[)([\s\S]*?)(\n\])/m, (_, open, content, close) => `${open}${content}\n${entry}${close}`);
}

function updateOccasionCatalogEntry(source, id, updated) {
  let r = source;
  r = r.replace(new RegExp(`(id:\\s*"${id}",[\\s\\S]*?name:\\s*)"[^"]*"`), `$1"${sanitizeForJS(updated.name)}"`);
  r = r.replace(new RegExp(`(id:\\s*"${id}",[\\s\\S]*?emoji:\\s*)"[^"]*"`), `$1"${updated.emoji || ""}"`);
  r = r.replace(new RegExp(`(id:\\s*"${id}",[\\s\\S]*?description:\\s*)"[^"]*"`), `$1"${sanitizeForJS(updated.description || "")}"`);
  return r;
}

// Rewrites each occasion's `order:` field to match its position in
// `orderedIds` — the nav bar, /by-occasion, and the Categories page all sort
// by this field at render time, so this is the one write that actually
// changes what order occasions show up in on the site.
function updateOccasionOrderInSource(source, orderedIds) {
  let r = source;
  orderedIds.forEach((id, idx) => {
    r = r.replace(new RegExp(`(id:\\s*"${id}",[\\s\\S]*?order:\\s*)\\d+`), `$1${idx}`);
  });
  return r;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const bg = type === "error" ? "#b00020" : type === "info" ? "#1a3a5c" : "#1a5c2a";
  return <div style={{ ...ts.toast, background: bg }}>{message}</div>;
}

function ProductCard({ product, categories }) {
  const cat = categories.find(c => c.id === product.categoryId);
  return (
    <div style={ts.productCard}>
      <div style={ts.productCardImg}>
        {product.images[0]
          ? <img src={product.images[0]} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
          : <div style={{ color: "#ccc", fontSize: 10, textAlign: "center", paddingTop: 30 }}>No image</div>}
      </div>
      <div style={ts.productCardBody}>
        <p style={ts.productCardCat}>{cat?.name || product.categoryId}</p>
        <p style={ts.productCardTitle}>{product.title}</p>
        {Number(product.originalPrice) > Number(product.price) ? (
          <p style={ts.productCardPrice}>
            <span style={{ textDecoration: "line-through", color: "#aaa", fontWeight: 400, marginRight: 6 }}>&#8377;{product.originalPrice}</span>
            &#8377;{product.price}
          </p>
        ) : (
          <p style={ts.productCardPrice}>&#8377;{product.price}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPortal() {
  const [step, setStep] = useState("login");
  const [creds, setCreds] = useState(() => { try { return JSON.parse(sessionStorage.getItem("maqers_admin_creds") || "null") || {}; } catch { return {}; } });
  const [loginForm, setLoginForm] = useState({ token: "", owner: "Maqers", repo: "webhosting", branch: "main" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [occasionMap, setOccasionMap] = useState({});
  const [occasionCategories, setOccasionCategories] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishLog, setPublishLog] = useState([]);
  const [newProduct, setNewProduct] = useState({ title: "", categoryId: "", description: "", price: "", originalPrice: "", tags: "", keywords: "", occasions: [], colors: [], sizes: [], sizePrices: {}, moq: "", delivery_time: "", inStock: true, popular: false, featured: false, secondaryCategories: [], sellerId: "", sellerCode: "", personalisation_options: [], personalisation_prices: [] });
  const [newColorInput, setNewColorInput] = useState("");
  const [newColorImageIdx, setNewColorImageIdx] = useState(0);
  const [newSizeInput, setNewSizeInput] = useState("");
  const [editColorInput, setEditColorInput] = useState("");
  const [editColorImageIdx, setEditColorImageIdx] = useState(0);
  const [editSizeInput, setEditSizeInput] = useState("");
  const [newReviewInput, setNewReviewInput] = useState({ name: "", rating: 5, text: "", date: "", photoFile: null });
  const [editReviewInput, setEditReviewInput] = useState({ name: "", rating: 5, text: "", date: "", photoFile: null });
  const [editReviewUploading, setEditReviewUploading] = useState(false);
  const [linkAudit, setLinkAudit] = useState(null);
  const [viewingSeller, setViewingSeller] = useState(null);
  const [productQueue, setProductQueue] = useState([]); // batch add queue
  const [queueImageFiles, setQueueImageFiles] = useState({}); // { queueIndex: imageFiles[] }
  const [imageFiles, setImageFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [formError, setFormError] = useState("");
  const [aiExtraDetails, setAiExtraDetails] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiEditExtraDetails, setAiEditExtraDetails] = useState('');
  const [aiEditGenerating, setAiEditGenerating] = useState(false);
  const [aiEditError, setAiEditError] = useState('');
  const [productStep, setProductStep] = useState("form");
  const fileInputRef = useRef();
  const editFileInputRef = useRef();
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFilter, setProductFilter] = useState("");
  const [productFilterCat, setProductFilterCat] = useState("all");
  const [pendingChanges, setPendingChanges] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "", icon: "gift" });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [occasionEdits, setOccasionEdits] = useState({});
  const [occasionCatalogEntries, setOccasionCatalogEntries] = useState([]);
  const [showAddOccasion, setShowAddOccasion] = useState(false);
  const [newOccasion, setNewOccasion] = useState({ name: "", emoji: "", description: "" });
  const [editingOccasion, setEditingOccasion] = useState(null);
  const [occasionOrderDirty, setOccasionOrderDirty] = useState(false);

  // ── Drag-and-drop reorder state ──────────────────────────────────────────────
  const [draggingId, setDraggingId] = useState(null);
  const [draggingOcc, setDraggingOcc] = useState(null); // { occId, productId }
  const [byCatDragging, setByCatDragging] = useState(null); // { catId, productId }
  const [byCatOrder, setByCatOrder] = useState({}); // { catId: [id,...] }
  const [byCatPublishing, setByCatPublishing] = useState(false);
  const [openCats, setOpenCats] = useState({});
  const [localOrderByCat, setLocalOrderByCat] = useState({}); // { catId: [productId, ...] }
  const editFormRef = useRef(null);
  const newDescRef = useRef(null);
  const editDescRef = useRef(null);
  // Synchronous guard against double-submit — `disabled={publishing}` only
  // takes effect after a re-render, leaving a brief window where a fast
  // double-click fires the handler twice before React disables the button.
  // A ref updates immediately, closing that window.
  const publishInFlightRef = useRef(false);
  const sellerPanelRef = useRef(null);

  // ── Inline seller creation (used inside add-product & edit forms) ────────────
  const [showInlineAddSeller, setShowInlineAddSeller] = useState(false);
  const [inlineNewSeller, setInlineNewSeller] = useState({ business_name: "", owners: [], location: "", address: "", pincode: "", notes: "", phone: "", email: "" });
  const [inlineOwnerInput, setInlineOwnerInput] = useState("");

  // ── Seller state ────────────────────────────────────────────────────────────
  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  useEffect(() => {
    if (viewingSeller || editingSeller) {
      sellerPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [viewingSeller, editingSeller]);
  const [showAddSeller, setShowAddSeller] = useState(false);
  const [newSeller, setNewSeller] = useState({ business_name: "", owners: [], location: "", address: "", pincode: "", notes: "", phone: "", email: "", gst_registered: false, gst_number: "", hsn_codes: [], delivery_handled_by: "seller", commission_pct: 10 });
  const [newOwnerInput, setNewOwnerInput] = useState("");
  const [kycFiles, setKycFiles] = useState([]);
  const [kycUploading, setKycUploading] = useState(false);
  const kycInputRef = useRef();

  const showToast = (message, type = "success") => setToast({ message, type });

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError(""); setLoginLoading(true);
    try {
      const c = { token: loginForm.token, owner: loginForm.owner, repo: loginForm.repo, branch: loginForm.branch };
      const { source, sha } = await fetchCatalog(c);
      sessionStorage.setItem("maqers_admin_creds", JSON.stringify(c));
      setCreds(c); loadCatalogData(source, sha, c); setStep("app");
    } catch { setLoginError("Could not connect. Check your token, owner, repo, and branch."); }
    finally { setLoginLoading(false); }
  }

  async function loadOccasionCatalogData(credsOverride) {
    try {
      const { source } = await fetchOccasionCatalog(credsOverride || creds);
      setOccasionCatalogEntries(parseOccasionCatalogEntries(source));
    } catch (err) { console.error("Failed to load occasionCatalog.js:", err); }
  }

  function loadCatalogData(source, sha, credsOverride) {
    setProducts(parseProducts(source));
    setCategories(parseCategories(source));
    const oMap = parseOccasionMap(source);
    setOccasionMap(oMap);
    setOccasionCategories(parseOccasionCategories(source));
    setOccasionEdits(JSON.parse(JSON.stringify(oMap)));
    loadOccasionCatalogData(credsOverride);
    // Load sellers so they're available everywhere
    loadSellers();
  }

  async function refreshCatalog() {
    setCatalogLoading(true);
    try { const { source, sha } = await fetchCatalog(creds); loadCatalogData(source, sha); showToast("Catalog refreshed"); }
    catch (err) { showToast("Refresh failed: " + err.message, "error"); }
    finally { setCatalogLoading(false); }
  }

  function handleLogout() { sessionStorage.removeItem("maqers_admin_creds"); setCreds({}); setStep("login"); }

  function extFromMime(mime) {
    return (mime || "image/jpeg").split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  }

  function readReviewPhoto(file, setInput) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const rawBase64 = ev.target.result.split(",")[1];
      const { base64, mimeType } = await compressProductImage(rawBase64, file.type).catch(() => ({ base64: rawBase64, mimeType: file.type }));
      setInput(r => ({ ...r, photoFile: { preview: ev.target.result, base64, mime: mimeType } }));
    };
    reader.readAsDataURL(file);
  }

  // Prefixes a short unique id onto the filename so it can never collide with
  // an existing (or later-uploaded) file — including across extensions, since
  // the site's WebP <picture> lookup derives its path by stripping the
  // extension (e.g. "28.png" and "28.jpeg" both resolve to "28.webp").
  function uniqueImageName(originalName) {
    const clean = originalName.toLowerCase().replace(/\s+/g, "-");
    const dot = clean.lastIndexOf(".");
    const base = dot > 0 ? clean.slice(0, dot) : clean;
    const ext = dot > 0 ? clean.slice(dot) : "";
    const uniqueId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    return `${uniqueId}-${base}${ext}`;
  }

  // Resizes to the site's standard product-photo ceiling (matches
  // npm run compress-images: 1400px max side, quality 82) so raw camera
  // photos (often 4-8MB) never get committed to the repo uncompressed.
  // PNGs stay PNG (need alpha-transparency support); everything else
  // becomes JPEG, matching what compress-images does server-side.
  //
  // Also renders a .webp variant from the same canvas — ImageWithFallback
  // always requests "<name>.webp" first, and without one every upload
  // pays a wasted request before falling back to the real image on
  // first load (webpBase64 is null if the browser can't encode webp,
  // e.g. old Safari; the caller just skips uploading the sidecar then).
  function compressProductImage(base64, mimeType, maxDim = 1400, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const outMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outMime, quality);
        const webpDataUrl = canvas.toDataURL('image/webp', quality);
        const webpBase64 = webpDataUrl.startsWith('data:image/webp') ? webpDataUrl.split(',')[1] : null;
        resolve({ base64: dataUrl.split(',')[1], mimeType: outMime, webpBase64 });
      };
      img.onerror = reject;
      img.src = `data:${mimeType};base64,${base64}`;
    });
  }

  function toWebpName(name) {
    return name.replace(/\.[^.]+$/, '.webp');
  }

  function processFiles(files) {
    Array.from(files).filter(f => f.type.startsWith("image/")).forEach(file => {
      const reader = new FileReader();
      reader.onload = async ev => {
        const rawBase64 = ev.target.result.split(",")[1];
        const { base64, mimeType, webpBase64 } = await compressProductImage(rawBase64, file.type).catch(() => ({ base64: rawBase64, mimeType: file.type, webpBase64: null }));
        const name = uniqueImageName(file.name);
        setImageFiles(prev => [...prev, { file, preview: ev.target.result, name, base64, mime: mimeType, webpBase64, webpName: toWebpName(name) }]);
      };
      reader.readAsDataURL(file);
    });
  }

  const onDrop = useCallback(e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }, []);

  function resizeImageForAI(base64, mimeType, maxDim = 1600, quality = 0.82) {
    return compressProductImage(base64, mimeType, maxDim, quality).then(r => ({ base64: r.base64, mimeType: r.mimeType === 'image/png' ? 'image/png' : 'image/jpeg' }));
  }

  async function runAiGenerate({ imageBase64, mimeType, imageUrl, extraDetails, onResult, onError, setGenerating }) {
    setGenerating(true);
    onError('');
    try {
      let body;
      if (imageBase64) {
        const resized = await resizeImageForAI(imageBase64, mimeType).catch(() => ({ base64: imageBase64, mimeType }));
        body = { imageBase64: resized.base64, mimeType: resized.mimeType, extraDetails };
      } else {
        body = { imageUrl, extraDetails };
      }
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let result;
      try { result = JSON.parse(text); } catch { throw new Error(res.ok ? 'Unexpected response from server.' : `Server error (${res.status}). Try a smaller image.`); }
      if (!res.ok) throw new Error(result.error || 'Generation failed');
      onResult(result);
    } catch (err) {
      onError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function handleGenerateAI() {
    const imgObj = imageFiles[0];
    if (!imgObj) { setAiError('Upload an image first.'); return; }
    runAiGenerate({
      imageBase64: imgObj.base64,
      mimeType: imgObj.mime || 'image/jpeg',
      extraDetails: aiExtraDetails.trim(),
      setGenerating: setAiGenerating,
      onError: setAiError,
      onResult: r => setNewProduct(p => ({
        ...p,
        title: r.title || p.title,
        description: r.description || p.description,
        tags: r.tags?.join(', ') || p.tags,
        keywords: r.keywords?.join(', ') || p.keywords,
      })),
    });
  }

  function handleGenerateAIEdit() {
    const imgObj = editImageFiles[0] || null;
    const imageUrl = !imgObj ? (editingProduct?.images?.[0] || '') : '';
    if (!imgObj && !imageUrl) { setAiEditError('No image available for this product.'); return; }
    runAiGenerate({
      imageBase64: imgObj ? imgObj.base64 : undefined,
      mimeType: imgObj ? (imgObj.mime || 'image/jpeg') : undefined,
      imageUrl: imgObj ? undefined : imageUrl,
      extraDetails: aiEditExtraDetails.trim(),
      setGenerating: setAiEditGenerating,
      onError: setAiEditError,
      onResult: r => setEditingProduct(p => ({
        ...p,
        title: r.title || p.title,
        description: r.description || p.description,
        tags: r.tags?.length ? r.tags : p.tags,
        keywords: r.keywords?.length ? r.keywords : p.keywords,
      })),
    });
  }

  function handleProductPreview(e) {
    e.preventDefault(); setFormError("");
    if (!newProduct.title.trim()) return setFormError("Title required.");
    if (!newProduct.categoryId) return setFormError("Select a category.");
    if (!newProduct.description.trim()) return setFormError("Description required.");
    if (!newProduct.price || isNaN(Number(newProduct.price)) || Number(newProduct.price) <= 0) return setFormError("Valid price required.");
    if (imageFiles.length === 0) return setFormError("Upload at least one image.");
    if (!newProduct.sellerId) return setFormError("Select a seller before adding this product.");
    setProductStep("preview");
  }

  async function handlePublishProduct() {
    if (publishInFlightRef.current) return;
    publishInFlightRef.current = true;
    setPublishing(true); setPublishLog([]);
    const log = msg => setPublishLog(prev => [...prev, msg]);
    try {
      log("Uploading images...");
      const imagePaths = [];
      for (const img of imageFiles) {
        let sha; try { const ex = await ghGet(`public/images/${img.name}`, creds); sha = ex.sha; } catch {}
        await ghPut(`public/images/${img.name}`, img.base64, `Add image: ${img.name}`, sha, creds);
        imagePaths.push(`/images/${img.name}`);
        if (img.webpBase64) {
          await sleep(350);
          let webpSha; try { const ex = await ghGet(`public/images/${img.webpName}`, creds); webpSha = ex.sha; } catch {}
          await ghPut(`public/images/${img.webpName}`, img.webpBase64, `Add image: ${img.webpName}`, webpSha, creds);
        }
        await sleep(350);
      }
      log("Updating catalog.js...");
      const { source, sha } = await fetchCatalog(creds);
      const newId = getNextId(source);
      const reviews = [];
      for (const rv of (newProduct.reviews || [])) {
        const review = { name: rv.name, rating: rv.rating, text: rv.text, date: rv.date };
        if (rv._photoFile) {
          log("Uploading review photo...");
          const fname = `review-${newId}-${Date.now()}.${extFromMime(rv._photoFile.mime)}`;
          let rvSha; try { const ex = await ghGet(`public/images/${fname}`, creds); rvSha = ex.sha; } catch {}
          await ghPut(`public/images/${fname}`, rv._photoFile.base64, `Add review photo: ${fname}`, rvSha, creds);
          review.image = `/images/${fname}`;
        } else if (rv.image) {
          review.image = rv.image;
        }
        reviews.push(review);
      }
      const fullProduct = { ...newProduct, price: Number(newProduct.price), images: imagePaths, reviews };
      let updated = insertProductIntoSource(source, fullProduct, newId);
      for (const occ of (newProduct.occasions || [])) {
        updated = updated.replace(
          new RegExp(`('${occ}'\\s*:\\s*\\[)([^\\]]*)(\\])`, "m"),
          (_, open, content, close) => { const t = content.trimEnd(); return `${open}${t}${t.endsWith(",") ? " " : ", "}${newId}${close}`; }
        );
      }
      await commitCatalog(updated, sha, `Add product: ${sanitizeForJS(newProduct.title)} (ID ${newId})`, creds);
      log(`Done! Product ID ${newId} live after Vercel redeploys (~45s).`);
      // Link product to seller in Supabase and store seller_code
      if (newProduct.sellerId) {
        try {
          await handleLinkProductToSeller(newProduct.sellerId, newId, { syncCatalog: false });
        } catch {}
      }
      loadCatalogData(updated, sha);
      setNewProduct({ title: "", categoryId: "", description: "", price: "", originalPrice: "", tags: "", keywords: "", occasions: [], colors: [], sizes: [], sizePrices: {}, moq: "", delivery_time: "", inStock: true, popular: false, featured: false, secondaryCategories: [], sellerId: "", sellerCode: "", personalisation_options: [], personalisation_prices: [] });
      setNewColorInput(""); setNewColorImageIdx(0); setNewSizeInput("");
      setImageFiles([]); setProductStep("form");
      showToast(`"${newProduct.title}" published!`); setActiveTab("products");
    } catch (err) { log("Error: " + err.message); showToast(err.message, "error"); }
    finally { setPublishing(false); publishInFlightRef.current = false; }
  }

  async function handlePublishQueue() {
    if (!productQueue.length || publishInFlightRef.current) return;
    publishInFlightRef.current = true;
    setPublishing(true); setPublishLog([]);
    const log = msg => setPublishLog(prev => [...prev, msg]);
    try {
      let { source, sha } = await fetchCatalog(creds);
      let currentId = getNextId(source);
      for (const qp of productQueue) {
        log(`Uploading images for "${qp.title}"...`);
        const imagePaths = [];
        for (const img of qp._imageFiles) {
          let imgSha; try { const ex = await ghGet(`public/images/${img.name}`, creds); imgSha = ex.sha; } catch {}
          await ghPut(`public/images/${img.name}`, img.base64, `Add image: ${img.name}`, imgSha, creds);
          imagePaths.push(`/images/${img.name}`);
          if (img.webpBase64) {
            await sleep(350);
            let webpSha; try { const ex = await ghGet(`public/images/${img.webpName}`, creds); webpSha = ex.sha; } catch {}
            await ghPut(`public/images/${img.webpName}`, img.webpBase64, `Add image: ${img.webpName}`, webpSha, creds);
          }
          await sleep(350);
        }
        const fullProduct = { ...qp, price: Number(qp.price), images: imagePaths };
        source = insertProductIntoSource(source, fullProduct, currentId);
        for (const occ of (qp.occasions || [])) {
          source = source.replace(
            new RegExp(`('${occ}'\\s*:\\s*\\[)([^\\]]*)(\\])`, "m"),
            (_, open, content, close) => { const t = content.trimEnd(); return `${open}${t}${t.endsWith(",") ? " " : ", "}${currentId}${close}`; }
          );
        }
        if (qp.sellerId) { try { await handleLinkProductToSeller(qp.sellerId, currentId, { syncCatalog: false }); } catch {} }
        log(`Queued "${qp.title}" as ID ${currentId}`);
        currentId++;
      }
      log("Committing all products...");
      const result = await commitCatalog(source, sha, `Batch add ${productQueue.length} products`, creds);
      sha = result.content?.sha || sha;
      log(`Done! ${productQueue.length} products published in one deploy.`);
      loadCatalogData(source, sha);
      setProductQueue([]);
      showToast(`${productQueue.length} products published!`);
      setActiveTab("products");
    } catch (err) { log("Error: " + err.message); showToast(err.message, "error"); }
    finally { setPublishing(false); publishInFlightRef.current = false; }
  }

  async function handleDeleteProduct(product) {
    if (!window.confirm(`Delete "${product.title}" (ID ${product.id})? This cannot be undone.`)) return;
    setPublishing(true);
    try {
      let { source, sha } = await fetchCatalog(creds);
      // Use brace-counting range finder — works correctly with nested meta objects
      const range = getEntryRange(source, product.id);
      if (!range) {
        showToast(`Product ID ${product.id} not found in catalog.js`, "error");
        return;
      }
      let before = source.slice(0, range.start);
      let after = source.slice(range.end);
      // Clean up extra blank line left behind
      if (before.endsWith("\n") && after.startsWith("\n")) after = after.slice(1);
      source = before + after;
      // Remove product id from occasionProductMap ONLY — scoped to avoid corrupting
      // order numbers in the categories array or IDs elsewhere in the file.
      const pid = String(product.id);
      const mapKey = 'export const occasionProductMap';
      const mapIdx = source.indexOf(mapKey);
      if (mapIdx !== -1) {
        const beforeMap = source.slice(0, mapIdx);
        let mapSection = source.slice(mapIdx);
        mapSection = mapSection.replace(new RegExp(`,\\s*\\b${pid}\\b`, "g"), "");
        mapSection = mapSection.replace(new RegExp(`\\b${pid}\\b\\s*,\\s*`, "g"), "");
        mapSection = mapSection.replace(new RegExp(`\\b${pid}\\b`, "g"), "");
        mapSection = mapSection.replace(/,\s*,/g, ",").replace(/\[\s*,/g, "[").replace(/,\s*\]/g, "]");
        source = beforeMap + mapSection;
      }
      await commitCatalog(source, sha, `Delete product: ${product.title} (ID ${product.id})`, creds);
      // Also drop this product from whichever seller has it in their Supabase
      // product_ids — otherwise that array keeps a dangling reference to an
      // id that no longer exists in the catalog at all.
      if (product.sellerCode) {
        const seller = sellers.find(s => s.seller_code === product.sellerCode);
        if (seller && (seller.product_ids || []).includes(product.id)) {
          try { await sbUpdateSeller(seller.id, { product_ids: seller.product_ids.filter(pid => pid !== product.id) }); }
          catch { /* non-fatal — the catalog deletion already succeeded */ }
        }
      }
      loadCatalogData(source, sha);
      showToast(`"${product.title}" deleted.`);
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  function handleDragStart(e, productId) {
    if (productFilterCat === "all") return;
    setDraggingId(productId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(productId));
  }

  function handleDragOver(e, targetId) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId || productFilterCat === "all") return;
    const catId = productFilterCat;
    const base = products.filter(p => p.categoryId === catId).map(p => p.id);
    const currentOrder = localOrderByCat[catId] || base;
    const fromIdx = currentOrder.indexOf(draggingId);
    const toIdx = currentOrder.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const newOrder = [...currentOrder];
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggingId);
    setLocalOrderByCat(prev => ({ ...prev, [catId]: newOrder }));
  }

  function handleDragEnd() { setDraggingId(null); }

  async function handlePublishOrder() {
    const changedCats = Object.keys(localOrderByCat);
    if (!changedCats.length) return;
    setPublishing(true);
    try {
      let { source, sha } = await fetchCatalog(creds);
      for (const catId of changedCats) {
        const newOrder = localOrderByCat[catId];
        const catProds = products.filter(p => p.categoryId === catId);
        // Get entry ranges sorted by position in source
        const entries = catProds
          .map(p => { const r = getEntryRange(source, p.id); return r ? { id: p.id, range: r } : null; })
          .filter(Boolean)
          .sort((a, b) => a.range.start - b.range.start);
        if (!entries.length) continue;
        const entryTexts = {};
        for (const e of entries) entryTexts[e.id] = source.slice(e.range.start, e.range.end);
        const blockStart = entries[0].range.start;
        const blockEnd = entries[entries.length - 1].range.end;
        const orderedTexts = newOrder.map(id => entryTexts[id]).filter(Boolean).join("\n");
        source = source.slice(0, blockStart) + orderedTexts + source.slice(blockEnd);
      }
      await commitCatalog(source, sha, `Reorder products (${changedCats.join(", ")})`, creds);
      loadCatalogData(source, sha);
      setLocalOrderByCat({});
      showToast("Order published!");
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  function handleToggleFlag(product, flag) {
    const current = pendingChanges[product.id] || product;
    setPendingChanges(prev => ({ ...prev, [product.id]: { ...current, [flag]: !current[flag] } }));
  }

  function handleStageProductEdit(edited) {
    setPendingChanges(prev => ({ ...prev, [edited.id]: edited }));
    setEditingProduct(null); setEditImageFiles([]);
    if (viewingSeller) { setProductFilter(""); setActiveTab("sellers"); }
    showToast("Staged — hit Publish All to save.", "info");
  }

  function processEditFiles(files) {
    Array.from(files).filter(f => f.type.startsWith("image/")).forEach(file => {
      const reader = new FileReader();
      reader.onload = async ev => {
        const rawBase64 = ev.target.result.split(",")[1];
        const { base64, mimeType, webpBase64 } = await compressProductImage(rawBase64, file.type).catch(() => ({ base64: rawBase64, mimeType: file.type, webpBase64: null }));
        const name = uniqueImageName(file.name);
        setEditImageFiles(prev => [...prev, {
          preview: ev.target.result,
          name,
          base64,
          mime: mimeType,
          webpBase64,
          webpName: toWebpName(name),
        }]);
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleAddEditReview() {
    if (!editReviewInput.name.trim()) return;
    const review = { name: editReviewInput.name, rating: editReviewInput.rating, text: editReviewInput.text, date: editReviewInput.date };
    if (editReviewInput.photoFile) {
      setEditReviewUploading(true);
      try {
        const fname = `review-${editingProduct.id}-${Date.now()}.${extFromMime(editReviewInput.photoFile.mime)}`;
        let rvSha; try { const ex = await ghGet(`public/images/${fname}`, creds); rvSha = ex.sha; } catch {}
        await ghPut(`public/images/${fname}`, editReviewInput.photoFile.base64, `Add review photo: ${fname}`, rvSha, creds);
        review.image = `/images/${fname}`;
      } catch (err) {
        showToast("Photo upload failed: " + err.message, "error");
        setEditReviewUploading(false);
        return;
      }
      setEditReviewUploading(false);
    }
    setEditingProduct(p => ({ ...p, reviews: [...(p.reviews||[]), review] }));
    setEditReviewInput({ name: "", rating: 5, text: "", date: "", photoFile: null });
  }

  async function uploadEditImages() {
    if (!editImageFiles.length || publishInFlightRef.current) return;
    publishInFlightRef.current = true;
    setPublishing(true);
    try {
      const newPaths = [];
      for (const img of editImageFiles) {
        let sha; try { const ex = await ghGet(`public/images/${img.name}`, creds); sha = ex.sha; } catch {}
        await ghPut(`public/images/${img.name}`, img.base64, `Add image: ${img.name}`, sha, creds);
        newPaths.push(`/images/${img.name}`);
        if (img.webpBase64) {
          await sleep(350);
          let webpSha; try { const ex = await ghGet(`public/images/${img.webpName}`, creds); webpSha = ex.sha; } catch {}
          await ghPut(`public/images/${img.webpName}`, img.webpBase64, `Add image: ${img.webpName}`, webpSha, creds);
        }
        await sleep(350);
      }
      setEditingProduct(p => ({ ...p, images: [...p.images, ...newPaths] }));
      setEditImageFiles([]);
      showToast(`${newPaths.length} image(s) uploaded and added.`);
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); publishInFlightRef.current = false; }
  }

  async function handlePublishAllChanges() {
    const changedIds = Object.keys(pendingChanges);
    if (!changedIds.length) return showToast("No pending changes.", "info");
    setPublishing(true);
    try {
      const { source, sha } = await fetchCatalog(creds);
      let updated = source;
      for (const id of changedIds) updated = updateProductInSource(updated, pendingChanges[id]);
      await commitCatalog(updated, sha, `Bulk update ${changedIds.length} product(s)`, creds);
      // Update local products state directly first — guarantees UI reflects changes
      setProducts(prev => {
        const updated_state = prev.map(p => pendingChanges[p.id] ? { ...p, ...pendingChanges[p.id] } : p);
        // Also try re-parse — only use it if it returns the same or more products
        const freshParsed = parseProducts(updated);
        return freshParsed.length >= updated_state.length ? freshParsed : updated_state;
      });
      setCategories(parseCategories(updated));
      const oMap = parseOccasionMap(updated);
      setOccasionMap(oMap); setOccasionCategories(parseOccasionCategories(updated));
      setOccasionEdits(JSON.parse(JSON.stringify(oMap)));
      setPendingChanges({});
      showToast(`${changedIds.length} product(s) published!`);
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  async function handleAddCategory() {
    if (!newCategory.name.trim()) return showToast("Category name required.", "error");
    setPublishing(true);
    try {
      const { source, sha } = await fetchCatalog(creds);
      const maxOrder = Math.max(...parseCategories(source).map(c => c.order), 0);
      const id = slugify(newCategory.name);
      let updated = insertCategoryIntoSource(source, { ...newCategory, id }, maxOrder + 1);
      updated = addCategoryProductBlock(updated, id);
      await commitCatalog(updated, sha, `Add category: ${newCategory.name}`, creds);
      loadCatalogData(updated, sha); setNewCategory({ name: "", description: "", icon: "gift" }); setShowAddCategory(false);
      showToast(`Category "${newCategory.name}" added!`);
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  async function handleSaveCategory() {
    setPublishing(true);
    try {
      const { source, sha } = await fetchCatalog(creds);
      const original = categories.find(c => c.id === editingCategory.id);
      const updated = updateCategoryInSource(source, original, editingCategory);
      await commitCatalog(updated, sha, `Edit category: ${editingCategory.name}`, creds);
      loadCatalogData(updated, sha); setEditingCategory(null); showToast("Category saved!");
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  function toggleOccasionProduct(occasionId, productId) {
    setOccasionEdits(prev => {
      const current = prev[occasionId] || [];
      return { ...prev, [occasionId]: current.includes(productId) ? current.filter(id => id !== productId) : [...current, productId] };
    });
  }

  async function handleSaveOccasions() {
    setPublishing(true);
    try {
      const { source, sha } = await fetchCatalog(creds);
      const updated = updateOccasionMapInSource(source, occasionEdits);
      await commitCatalog(updated, sha, "Update occasion product map", creds);
      loadCatalogData(updated, sha); showToast("Occasion map saved!");
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  // Creating an occasion touches two separate files — occasionCatalog.js
  // (display metadata the /by-occasion page actually renders off) and
  // catalog.js's occasionProductMap (which product IDs belong to it) — since
  // the GitHub Contents API can't commit to both atomically, this does two
  // sequential commits. If the second one fails, the occasion will exist in
  // occasionCatalog.js but not yet have a product-id bucket; re-running Save
  // (or just adding a product to it from the Occasions tab) fixes it.
  async function handleAddOccasion() {
    if (!newOccasion.name.trim()) return showToast("Occasion name required.", "error");
    const id = slugify(newOccasion.name);
    if (occasionCatalogEntries.some(o => o.id === id)) return showToast("An occasion with this name already exists.", "error");
    setPublishing(true);
    try {
      const { source: occSource, sha: occSha } = await fetchOccasionCatalog(creds);
      const maxOrder = Math.max(...parseOccasionCatalogEntries(occSource).map(o => o.order), -1);
      const updatedOccSource = insertOccasionCatalogEntry(occSource, { ...newOccasion, id }, maxOrder + 1);
      await commitOccasionCatalog(updatedOccSource, occSha, `Add occasion: ${newOccasion.name}`, creds);

      const { source, sha } = await fetchCatalog(creds);
      const updated = addOccasionMapKey(source, id);
      await commitCatalog(updated, sha, `Add occasion product bucket: ${id}`, creds);

      loadCatalogData(updated, sha);
      setNewOccasion({ name: "", emoji: "", description: "" });
      setShowAddOccasion(false);
      showToast(`Occasion "${newOccasion.name}" added!`);
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  async function handleSaveOccasionMeta() {
    setPublishing(true);
    try {
      const { source, sha } = await fetchOccasionCatalog(creds);
      const updated = updateOccasionCatalogEntry(source, editingOccasion.id, editingOccasion);
      await commitOccasionCatalog(updated, sha, `Edit occasion: ${editingOccasion.name}`, creds);
      setOccasionCatalogEntries(parseOccasionCatalogEntries(updated));
      setEditingOccasion(null);
      showToast("Occasion saved!");
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  function moveOccasion(id, direction) {
    setOccasionCatalogEntries(prev => {
      const idx = prev.findIndex(o => o.id === id);
      const swapIdx = idx + direction;
      if (idx === -1 || swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
    setOccasionOrderDirty(true);
  }

  async function handleSaveOccasionOrder() {
    setPublishing(true);
    try {
      const { source, sha } = await fetchOccasionCatalog(creds);
      const updated = updateOccasionOrderInSource(source, occasionCatalogEntries.map(o => o.id));
      await commitOccasionCatalog(updated, sha, "Reorder occasions", creds);
      setOccasionCatalogEntries(parseOccasionCatalogEntries(updated));
      setOccasionOrderDirty(false);
      showToast("Occasion order saved — live in ~45s");
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  const filteredProducts = products.filter(p => {
    const idQuery = productFilter.trim().match(/^#?\s*(?:id\s*:?\s*)?(\d+)$/i);
    const matchId = idQuery && Number(idQuery[1]) === p.id;
    const matchText = !productFilter || matchId || p.title.toLowerCase().includes(productFilter.toLowerCase()) || p.description.toLowerCase().includes(productFilter.toLowerCase());
    return matchText && (productFilterCat === "all" || p.categoryId === productFilterCat);
  });

  function getDisplayedProducts() {
    if (productFilterCat === "all" || !localOrderByCat[productFilterCat]) return filteredProducts;
    const orderMap = Object.fromEntries((localOrderByCat[productFilterCat] || []).map((id, i) => [id, i]));
    return [...filteredProducts].sort((a, b) => (orderMap[a.id] ?? 999) - (orderMap[b.id] ?? 999));
  }

  // ── Seller functions ─────────────────────────────────────────────────────────

  async function loadSellers() {
    setSellersLoading(true);
    try { setSellers(await sbGetSellers()); }
    catch (err) { showToast("Could not load sellers: " + err.message, "error"); }
    finally { setSellersLoading(false); }
  }

  async function handleInlineCreateSeller(onCreated) {
    if (!inlineNewSeller.business_name.trim()) return showToast("Business name required.", "error");
    setPublishing(true);
    try {
      const b = inlineNewSeller.business_name.trim()[0].toUpperCase();
      const ownerName = inlineNewSeller.owners[0] || inlineOwnerInput || "X";
      const o = ownerName.trim()[0].toUpperCase();
      const prefix = `${b}${o}`;
      const latestSellers = await sbGetSellers();
      const samePrefix = latestSellers.filter(s => s.seller_code && s.seller_code.startsWith(prefix));
      const nextNum = 1001 + samePrefix.length;
      const sellerCode = `${prefix}${nextNum}`;
      const id = sellerCode.toLowerCase();
      const seller = { id, seller_code: sellerCode, business_name: inlineNewSeller.business_name, owners: inlineNewSeller.owners.length > 0 ? inlineNewSeller.owners : (inlineOwnerInput ? [inlineOwnerInput] : []), location: inlineNewSeller.location, address: inlineNewSeller.address || "", pincode: inlineNewSeller.pincode || "", notes: inlineNewSeller.notes || "", phone: inlineNewSeller.phone || "", email: inlineNewSeller.email || "", gst_registered: false, gst_number: "", hsn_codes: [], product_ids: [], kyc_documents: [] };
      await sbCreateSeller(seller);
      const updated = await sbGetSellers();
      setSellers(updated);
      setInlineNewSeller({ business_name: "", owners: [], location: "", address: "", pincode: "", notes: "", phone: "", email: "" });
      setInlineOwnerInput(""); setShowInlineAddSeller(false);
      showToast(`Seller "${inlineNewSeller.business_name}" created!`);
      if (onCreated) onCreated(id, sellerCode);
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  async function handleCreateSeller() {
    if (!newSeller.business_name.trim()) return showToast("Business name required.", "error");
    setPublishing(true);
    try {
      const b = newSeller.business_name.trim()[0].toUpperCase();
      // Use first owner from list, or from the input field if not yet added
      const ownerName = newSeller.owners[0] || newOwnerInput || "X";
      const o = ownerName.trim()[0].toUpperCase();
      const prefix = `${b}${o}`;

      // Load latest sellers to get correct count
      const latestSellers = await sbGetSellers();
      const samePrefix = latestSellers.filter(s => s.seller_code && s.seller_code.startsWith(prefix));
      const nextNum = 1001 + samePrefix.length;
      const sellerCode = `${prefix}${nextNum}`;
      const id = sellerCode.toLowerCase();

      let kycPaths = [];
      if (kycFiles.length > 0) {
        setKycUploading(true);
        for (const file of kycFiles) {
          const path = await sbUploadKYC(file, id);
          kycPaths.push(path);
        }
        setKycUploading(false);
      }
      const seller = { id, seller_code: sellerCode, business_name: newSeller.business_name, owners: newSeller.owners.length > 0 ? newSeller.owners : (newOwnerInput ? [newOwnerInput] : []), location: newSeller.location, address: newSeller.address || "", pincode: newSeller.pincode, notes: newSeller.notes, phone: newSeller.phone || "", email: newSeller.email || "", gst_registered: newSeller.gst_registered || false, gst_number: newSeller.gst_number || "", hsn_codes: newSeller.hsn_codes || [], delivery_handled_by: newSeller.delivery_handled_by || "seller", commission_pct: Number(newSeller.commission_pct) || 10, product_ids: [], kyc_documents: kycPaths };
      await sbCreateSeller(seller);
      await loadSellers();
      setNewSeller({ business_name: "", owners: [], location: "", address: "", pincode: "", notes: "", phone: "", email: "", gst_registered: false, gst_number: "", hsn_codes: [] });
      setKycFiles([]); setNewOwnerInput(""); setShowAddSeller(false);
      showToast(`Seller "${newSeller.business_name}" created! ID: ${sellerCode}`);
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); setKycUploading(false); }
  }

  async function handleUpdateSeller() {
    setPublishing(true);
    try {
      let kycPaths = [...(editingSeller.kyc_documents || [])];
      if (kycFiles.length > 0) {
        setKycUploading(true);
        for (const file of kycFiles) {
          const path = await sbUploadKYC(file, editingSeller.id);
          kycPaths.push(path);
        }
        setKycUploading(false);
      }
      await sbUpdateSeller(editingSeller.id, { business_name: editingSeller.business_name, owners: editingSeller.owners, location: editingSeller.location, address: editingSeller.address || "", pincode: editingSeller.pincode || "", notes: editingSeller.notes, phone: editingSeller.phone || "", email: editingSeller.email || "", gst_registered: editingSeller.gst_registered || false, gst_number: editingSeller.gst_number || "", hsn_codes: editingSeller.hsn_codes || [], delivery_handled_by: editingSeller.delivery_handled_by || "seller", commission_pct: Number(editingSeller.commission_pct) || 10, kyc_documents: kycPaths });
      await loadSellers();
      setEditingSeller(null); setKycFiles([]);
      showToast("Seller updated!");
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); setKycUploading(false); }
  }

  // Deleting a seller also unlinks their products in catalog.js (clears
  // sellerId/sellerCode) rather than leaving those products pointing at a
  // seller_code that no longer exists in Supabase — the same class of
  // Supabase/catalog.js drift the Link Audit tool above exists to catch.
  async function handleDeleteSeller(seller) {
    const linked = products.filter(p => p.sellerCode === seller.seller_code);
    const confirmMsg = linked.length > 0
      ? `"${seller.business_name}" has ${linked.length} product(s) linked in the catalog. Deleting this seller will remove them from the seller list AND unlink those products (they'll show with no seller assigned). This cannot be undone. Continue?`
      : `Delete seller "${seller.business_name}"? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;
    setPublishing(true);
    try {
      if (linked.length > 0) {
        const { source, sha } = await fetchCatalog(creds);
        let updated = source;
        for (const p of linked) {
          updated = updateProductInSource(updated, { ...p, sellerId: "", sellerCode: "" });
        }
        await commitCatalog(updated, sha, `Unlink ${linked.length} product(s) from deleted seller ${seller.seller_code}`, creds);
        loadCatalogData(updated, sha);
      }
      await sbDeleteSeller(seller.id);
      await loadSellers();
      if (viewingSeller?.id === seller.id) setViewingSeller(null);
      if (editingSeller?.id === seller.id) setEditingSeller(null);
      showToast(`Seller "${seller.business_name}" deleted.`);
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  // `syncCatalog: false` is only for the two call sites right after a brand
  // new product is committed (its sellerId/sellerCode are already written
  // into catalog.js as part of that same commit) — everywhere else this must
  // stay true. Without it, this only ever updated Supabase's product_ids,
  // which the live site (storefront page, "more from this maker") never
  // reads — the product page reads meta.sellerCode from catalog.js, so a
  // product linked here would show as linked in admin but nowhere on the
  // actual site. That drift is what was reported as "keeps breaking".
  async function handleLinkProductToSeller(sellerId, productId, { syncCatalog = true } = {}) {
    const seller = sellers.find(s => s.id === sellerId);
    if (!seller) return;
    const current = seller.product_ids || [];
    const isLinking = !current.includes(productId);
    const updated = isLinking ? [...current, productId] : current.filter(id => id !== productId);
    try {
      if (syncCatalog) {
        const product = products.find(p => p.id === productId);
        if (product) {
          if (isLinking && product.sellerCode && product.sellerCode !== seller.seller_code) {
            const proceed = window.confirm(
              `"${product.title}" is currently linked to seller code "${product.sellerCode}" in the catalog. Reassign it to "${seller.seller_code}"?`
            );
            if (!proceed) return;
          }
          const { source, sha } = await fetchCatalog(creds);
          const patched = { ...product, sellerId: isLinking ? seller.id : "", sellerCode: isLinking ? (seller.seller_code || "") : "" };
          const newSource = updateProductInSource(source, patched);
          await commitCatalog(newSource, sha, `${isLinking ? "Link" : "Unlink"} product ${productId} ${isLinking ? "to" : "from"} seller ${seller.seller_code || sellerId} in catalog`, creds);
          setProducts(prev => prev.map(p => p.id === productId ? patched : p));
        }
      }
      await sbUpdateSeller(sellerId, { product_ids: updated });
      await loadSellers();
      showToast(syncCatalog ? "Linked and catalog updated — live in ~45s" : "Seller products updated!");
    } catch (err) { showToast(err.message, "error"); }
  }

  // Supabase's sellers_db.product_ids has always been the real record of what
  // was actually clicked "link" on, even during the period handleLinkProductToSeller
  // only wrote there and never touched catalog.js — so it's the source to
  // recover from. Finds every (seller, product) pair where Supabase says
  // they're linked but catalog.js's meta.sellerCode disagrees.
  function runLinkAudit() {
    const mismatches = [];
    for (const seller of sellers) {
      for (const pid of (seller.product_ids || [])) {
        const product = products.find(p => p.id === pid);
        if (!product) continue; // product_ids references an id no longer in catalog
        if (product.sellerCode !== (seller.seller_code || "")) {
          mismatches.push({
            key: `${seller.id}-${pid}`,
            sellerId: seller.id,
            sellerCode: seller.seller_code,
            sellerName: seller.business_name,
            productId: pid,
            productTitle: product.title,
            currentSellerCode: product.sellerCode || "(none)",
            checked: true,
          });
        }
      }
    }
    setLinkAudit(mismatches);
  }

  async function applyLinkAudit() {
    const toApply = (linkAudit || []).filter(m => m.checked);
    if (!toApply.length) return;
    setPublishing(true); setPublishLog([]);
    const log = msg => setPublishLog(prev => [...prev, msg]);
    try {
      const { source, sha } = await fetchCatalog(creds);
      let updated = source;
      for (const m of toApply) {
        const product = products.find(p => p.id === m.productId);
        const seller = sellers.find(s => s.id === m.sellerId);
        if (!product || !seller) continue;
        const patched = { ...product, sellerId: seller.id, sellerCode: seller.seller_code || "" };
        updated = updateProductInSource(updated, patched);
        log(`Linked "${product.title}" (ID ${product.id}) -> ${seller.seller_code}`);
      }
      await commitCatalog(updated, sha, `Reconcile ${toApply.length} seller-product link(s) from Supabase into catalog`, creds);
      log(`Done. ${toApply.length} product(s) updated — live in ~45s.`);
      await refreshCatalog();
      setLinkAudit(null);
      showToast(`${toApply.length} link(s) synced to catalog!`);
    } catch (err) { log("Error: " + err.message); showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  async function handleDeleteKYC(seller, path) {
    try {
      const updated = seller.kyc_documents.filter(p => p !== path);
      await sbUpdateSeller(seller.id, { kyc_documents: updated });
      setEditingSeller(s => ({ ...s, kyc_documents: updated }));
      await loadSellers();
      showToast("Document removed.");
    } catch (err) { showToast(err.message, "error"); }
  }

  async function openKYCDoc(path) {
    try {
      const url = await sbGetKYCUrl(path);
      if (url) window.open(url, "_blank");
      else showToast("Could not generate link.", "error");
    } catch (err) { showToast(err.message, "error"); }
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────────

  if (step === "login") return (
    <div style={ts.loginShell}>
      <div style={ts.loginCard}>
        <div style={ts.loginLogo}>
          <span style={ts.loginLogoM}>M</span>
          <div><div style={ts.loginLogoText}>Maqers Admin</div><div style={ts.loginLogoSub}>Catalog Management</div></div>
        </div>
        <form onSubmit={handleLogin}>
          <label style={ts.label}>GitHub Personal Access Token</label>
          <input style={ts.input} type="password" placeholder="ghp_xxxxxxxxxxxx" value={loginForm.token} onChange={e => setLoginForm(f => ({ ...f, token: e.target.value }))} required />
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {[["owner","Owner"],["repo","Repo"],["branch","Branch"]].map(([k, label]) => (
              <div key={k} style={{ flex: 1 }}>
                <label style={ts.label}>{label}</label>
                <input style={ts.input} value={loginForm[k]} onChange={e => setLoginForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
          {loginError && <p style={ts.errorText}>{loginError}</p>}
          <button style={{ ...ts.primaryBtn, width: "100%", marginTop: 16 }} disabled={loginLoading}>
            {loginLoading ? "Connecting..." : "Connect to GitHub"}
          </button>
        </form>
        <p style={ts.hint}>PAT needs <strong>Contents: Read &amp; Write</strong>. Stored in this tab only.</p>
      </div>
    </div>
  );

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "◈" },
    { id: "add-product", label: "Add Product", icon: "+" },
    { id: "products", label: "Products", icon: "▤" },
    { id: "by-category", label: "By Category", icon: "⊟" },
    { id: "categories", label: "Categories", icon: "⊞" },
    { id: "occasions", label: "Occasions", icon: "♡" },
    { id: "sellers", label: "Sellers", icon: "◎" },
  ];

  function handleTabSwitch(tabId) {
    setActiveTab(tabId);
    if (tabId === "sellers" && sellers.length === 0) loadSellers();
  }

  // ─── APP ──────────────────────────────────────────────────────────────────────

  return (
    <div className="admin-portal" style={ts.shell}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={ts.sidebar}>
        <div style={ts.sidebarLogo}>
          <span style={ts.logoM}>M</span>
          <div><div style={ts.logoText}>Maqers</div><div style={ts.logoSub}>Admin Portal</div></div>
        </div>
        <nav style={ts.nav}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => handleTabSwitch(tab.id)}
              style={{ ...ts.navBtn, ...(activeTab === tab.id ? ts.navBtnActive : {}) }}>
              <span style={ts.navIcon}>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </nav>
        <div style={ts.sidebarBottom}>
          <button onClick={refreshCatalog} style={ts.refreshBtn} disabled={catalogLoading}>
            {catalogLoading ? "Refreshing..." : "↺ Refresh Catalog"}
          </button>
          <div style={ts.repoBadge}>{creds.owner}/{creds.repo}:{creds.branch}</div>
          <button onClick={handleLogout} style={ts.logoutBtn}>Sign out</button>
        </div>
      </div>

      <main style={ts.main}>

        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div>
            <h1 style={ts.pageTitle}>Dashboard</h1>
            <div style={ts.statsGrid}>
              {[
                { label: "Total Products", value: products.length, color: "#c8a96e" },
                { label: "In Stock", value: products.filter(p => p.inStock).length, color: "#4caf50" },
                { label: "Out of Stock", value: products.filter(p => !p.inStock).length, color: "#f44336" },
                { label: "Featured", value: products.filter(p => p.featured).length, color: "#9c27b0" },
                { label: "Popular", value: products.filter(p => p.popular).length, color: "#ff9800" },
                { label: "Categories", value: categories.length, color: "#2196f3" },
              ].map(stat => (
                <div key={stat.label} style={ts.statCard}>
                  <div style={{ ...ts.statValue, color: stat.color }}>{stat.value}</div>
                  <div style={ts.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
            <h2 style={ts.sectionTitle}>Products by Category</h2>
            <div style={ts.catBreakdown}>
              {categories.map(cat => {
                const count = products.filter(p => p.categoryId === cat.id).length;
                return (
                  <div key={cat.id} style={ts.catBreakdownRow}>
                    <span style={ts.catBreakdownName}>{cat.name}</span>
                    <div style={ts.catBreakdownBar}>
                      <div style={{ ...ts.catBreakdownFill, width: `${Math.min(100, (count / Math.max(1, products.length)) * 300)}%` }} />
                    </div>
                    <span style={ts.catBreakdownCount}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ADD PRODUCT ── */}
        {activeTab === "add-product" && (
          <div>
            <h1 style={ts.pageTitle}>Add New Product</h1>
            {productStep === "form" && (
              <form onSubmit={handleProductPreview}>
                <div style={ts.grid2}>
                  <div>
                    <div style={ts.card}>
                      <h2 style={ts.cardTitle}>Product Details</h2>

                      {/* ── AI Generation Panel ── */}
                      <div style={{ background: "linear-gradient(135deg,#fdf6ee 0%,#faf0f0 100%)", border: "1.5px solid #e8d4b8", borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 15, color: "#c8a96e" }}>✦</span>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "#7a4f1a", fontFamily: "Georgia,serif" }}>Generate with AI</span>
                          <span style={{ fontSize: 10, color: "#bbb", marginLeft: 2 }}>Gemini</span>
                        </div>
                        <label style={ts.label}>Extra details <span style={ts.labelHint}>(optional — material, dimensions, occasion, etc.)</span></label>
                        <textarea
                          style={{ ...ts.input, height: 58, resize: "vertical", fontFamily: "inherit", marginBottom: 10 }}
                          placeholder="e.g. Made with 925 sterling silver, 18cm length, perfect for gifting"
                          value={aiExtraDetails}
                          onChange={e => setAiExtraDetails(e.target.value)}
                        />
                        <button
                          type="button"
                          disabled={aiGenerating || imageFiles.length === 0}
                          onClick={handleGenerateAI}
                          style={{ ...ts.primaryBtn, opacity: aiGenerating || imageFiles.length === 0 ? 0.55 : 1, display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", fontSize: 12 }}
                        >
                          {aiGenerating
                            ? <><span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #c8a96e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Generating…</>
                            : <><span>✦</span>Generate title, description &amp; tags</>}
                        </button>
                        {imageFiles.length === 0 && !aiGenerating && (
                          <p style={{ ...ts.fieldHint, color: "#b07820", marginTop: 6 }}>Upload an image on the right first to enable AI generation.</p>
                        )}
                        {aiError && <p style={{ ...ts.fieldHint, color: "#c00", marginTop: 6 }}>{aiError}</p>}
                      </div>

                      <label style={ts.label}>Title *</label>
                      <input style={ts.input} placeholder="e.g. Lavender Soy Candle" value={newProduct.title}
                        onChange={e => setNewProduct(p => ({ ...p, title: e.target.value }))} />
                      <label style={ts.label}>Category *</label>
                      <select style={ts.input} value={newProduct.categoryId}
                        onChange={e => setNewProduct(p => ({ ...p, categoryId: e.target.value }))}>
                        <option value="">— Select —</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <label style={ts.label}>Also appears in <span style={ts.labelHint}>(optional — for Shop by Product)</span></label>
                      <div style={ts.chipGrid}>
                        {categories.filter(c => c.id !== newProduct.categoryId).map(c => {
                          const active = (newProduct.secondaryCategories||[]).includes(c.id);
                          return (
                            <button type="button" key={c.id}
                              onClick={() => setNewProduct(p => ({
                                ...p,
                                secondaryCategories: active
                                  ? (p.secondaryCategories||[]).filter(x => x !== c.id)
                                  : [...(p.secondaryCategories||[]), c.id]
                              }))}
                              style={active ? ts.chipActive : ts.chip}>{c.name}</button>
                          );
                        })}
                      </div>
                      <label style={ts.label}>Price (Rs.) *</label>
                      <input style={ts.input} type="number" placeholder="499" value={newProduct.price}
                        onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} />
                      <label style={ts.label}>Original Price (Rs.) <span style={ts.labelHint}>(optional — shown crossed out if higher than price)</span></label>
                      <input style={ts.input} type="number" placeholder="e.g. 999" value={newProduct.originalPrice}
                        onChange={e => setNewProduct(p => ({ ...p, originalPrice: e.target.value }))} />
                      <label style={ts.label}>Description *</label>
                      <div style={ts.descToolbar}>
                        <button type="button" style={ts.descToolbarBtn} title="Bold"
                          onClick={() => wrapDescSelection(newDescRef, newProduct.description, v => setNewProduct(p => ({ ...p, description: v })), "**")}>
                          <strong>B</strong>
                        </button>
                        <button type="button" style={ts.descToolbarBtn} title="Underline"
                          onClick={() => wrapDescSelection(newDescRef, newProduct.description, v => setNewProduct(p => ({ ...p, description: v })), "__")}>
                          <u>U</u>
                        </button>
                        <button type="button" style={ts.descToolbarBtn} title="Add bullet point"
                          onClick={() => insertDescBullet(newDescRef, newProduct.description, v => setNewProduct(p => ({ ...p, description: v })))}>
                          ✨ Bullet
                        </button>
                      </div>
                      <textarea ref={newDescRef} style={{ ...ts.input, height: 100, resize: "vertical", borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}
                        placeholder="Keep it punchy. Select text and hit Bold/Underline, or use Bullet to add a line."
                        value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} />
                      <p style={ts.fieldHint}>Line breaks become paragraph breaks. **bold** and __underline__ render as real formatting on the product page.</p>
                      <label style={ts.label}>Tags (comma-separated)</label>
                      <input style={ts.input} placeholder="candle, soy, gift" value={newProduct.tags}
                        onChange={e => setNewProduct(p => ({ ...p, tags: e.target.value }))} />
                      <label style={ts.label}>Keywords (comma-separated, for SEO)</label>
                      <input style={ts.input} placeholder="soy candle India, scented candle gift" value={newProduct.keywords}
                        onChange={e => setNewProduct(p => ({ ...p, keywords: e.target.value }))} />
                      <label style={ts.label}>Colour Options <span style={ts.labelHint}>(optional — links to product image)</span></label>
                      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        <input style={{ ...ts.input, flex: 1, marginTop: 0 }} placeholder="e.g. Red"
                          value={newColorInput} onChange={e => setNewColorInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = newColorInput.trim(); if (v) { setNewProduct(p => ({ ...p, colors: [...(p.colors||[]), { name: v, imageIndex: newColorImageIdx }] })); setNewColorInput(""); setNewColorImageIdx(0); } } }} />
                        <select style={{ ...ts.input, width: 100, marginTop: 0 }} value={newColorImageIdx}
                          onChange={e => setNewColorImageIdx(Number(e.target.value))}>
                          {imageFiles.length === 0
                            ? <option value={0}>Image 1</option>
                            : imageFiles.map((_, i) => <option key={i} value={i}>Image {i + 1}</option>)}
                        </select>
                        <button type="button" style={{ ...ts.primaryBtn, padding: "9px 14px", flexShrink: 0 }}
                          onClick={() => { const v = newColorInput.trim(); if (v) { setNewProduct(p => ({ ...p, colors: [...(p.colors||[]), { name: v, imageIndex: newColorImageIdx }] })); setNewColorInput(""); setNewColorImageIdx(0); } }}>+</button>
                      </div>
                      <p style={ts.fieldHint}>Select which image number this colour corresponds to.</p>
                      {(newProduct.colors||[]).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                          {newProduct.colors.map((c, i) => (
                            <span key={i} style={ts.colorChip}>
                              {c.name} → Img {(c.imageIndex ?? 0) + 1}
                              <button type="button" onClick={() => setNewProduct(p => ({ ...p, colors: p.colors.filter((_,j)=>j!==i) }))} style={ts.colorChipX}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <label style={ts.label}>Size Options <span style={ts.labelHint}>(optional)</span></label>
                      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        <input style={{ ...ts.input, flex: 2, marginTop: 0 }} placeholder="Size name e.g. Small, 6 inch"
                          value={newSizeInput} onChange={e => setNewSizeInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = newSizeInput.trim(); if (v) { setNewProduct(p => ({ ...p, sizes: [...(p.sizes||[]), v] })); setNewSizeInput(""); } } }} />
                        <button type="button" style={{ ...ts.primaryBtn, padding: "9px 14px", flexShrink: 0 }}
                          onClick={() => { const v = newSizeInput.trim(); if (v) { setNewProduct(p => ({ ...p, sizes: [...(p.sizes||[]), v] })); setNewSizeInput(""); } }}>+</button>
                      </div>
                      {(newProduct.sizes||[]).length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: "#888" }}>Set a price per size? If yes, product will show "₹X onwards" on listings.</span>
                          </div>
                          {newProduct.sizes.map((s, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <span style={{ ...ts.colorChip, margin: 0, minWidth: 90 }}>{s}</span>
                              <input
                                style={{ ...ts.input, width: 110, marginTop: 0 }}
                                type="number" min="0" placeholder="Price (₹)"
                                value={(newProduct.sizePrices||{})[s] || ""}
                                onChange={e => setNewProduct(p => ({
                                  ...p,
                                  sizePrices: { ...(p.sizePrices||{}), [s]: e.target.value }
                                }))} />
                              <button type="button" onClick={() => setNewProduct(p => {
                                const sizes = p.sizes.filter((_,j)=>j!==i);
                                const sp = { ...(p.sizePrices||{}) };
                                delete sp[s];
                                return { ...p, sizes, sizePrices: sp };
                              })} style={{ ...ts.colorChipX, fontSize: 16, padding: "0 6px", lineHeight: 1 }}>×</button>
                            </div>
                          ))}
                          {Object.values(newProduct.sizePrices||{}).some(v => v !== "") && (
                            <p style={ts.fieldHint}>Min price: ₹{Math.min(...Object.values(newProduct.sizePrices||{}).filter(v=>v!=="").map(Number))} — this will be auto-set as the product price.</p>
                          )}
                        </div>
                      )}
                      <label style={ts.label}>Minimum Order Quantity <span style={ts.labelHint}>(optional)</span></label>
                      <input style={ts.input} type="number" placeholder="e.g. 15" value={newProduct.moq}
                        onChange={e => setNewProduct(p => ({ ...p, moq: e.target.value }))} />
                      <label style={ts.label}>Delivery Time <span style={ts.labelHint}>(shown on product page)</span></label>
                      <input style={ts.input} placeholder="e.g. 3–5 business days" value={newProduct.delivery_time || ""}
                        onChange={e => setNewProduct(p => ({ ...p, delivery_time: e.target.value }))} />
                      <label style={ts.label}>Personalisation Options <span style={ts.labelHint}>(each shown as a checkbox on product page)</span></label>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {(newProduct.personalisation_options || []).map((opt, i) => (
                          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input
                              style={{ ...ts.input, flex: 1, marginTop: 0 }}
                              placeholder="e.g. Add name on product"
                              value={opt}
                              onChange={e => setNewProduct(p => {
                                const options = [...(p.personalisation_options || [])];
                                options[i] = e.target.value;
                                return { ...p, personalisation_options: options };
                              })}
                            />
                            <span style={{ color: "#888", fontSize: 13, flexShrink: 0 }}>₹</span>
                            <input
                              style={{ ...ts.input, width: 80, marginTop: 0 }}
                              type="number"
                              min="0"
                              placeholder="0"
                              value={(newProduct.personalisation_prices || [])[i] ?? ""}
                              onChange={e => setNewProduct(p => {
                                const prices = [...(p.personalisation_prices || [])];
                                prices[i] = e.target.value;
                                return { ...p, personalisation_prices: prices };
                              })}
                            />
                            <button type="button"
                              onClick={() => setNewProduct(p => ({
                                ...p,
                                personalisation_options: (p.personalisation_options || []).filter((_, j) => j !== i),
                                personalisation_prices: (p.personalisation_prices || []).filter((_, j) => j !== i),
                              }))}
                              style={{ ...ts.colorChipX, fontSize: 16, padding: "0 6px", lineHeight: 1 }}>×</button>
                          </div>
                        ))}
                        <button type="button"
                          onClick={() => setNewProduct(p => ({
                            ...p,
                            personalisation_options: [...(p.personalisation_options || []), ""],
                            personalisation_prices: [...(p.personalisation_prices || []), ""],
                          }))}
                          style={{ ...ts.ghostBtn, alignSelf: "flex-start", fontSize: 13, padding: "5px 12px" }}>
                          + Add option
                        </button>
                      </div>
                      <label style={ts.label}>Customer Reviews <span style={ts.labelHint}>(optional — add manually)</span></label>
                      <div style={{ background: "#faf7f5", border: "1px solid #ede0e0", borderRadius: 8, padding: "10px 12px", marginTop: 2 }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <input style={{ ...ts.input, flex: 2, marginTop: 0 }} placeholder="Customer name" value={newReviewInput.name} onChange={e => setNewReviewInput(r => ({ ...r, name: e.target.value }))} />
                          <select style={{ ...ts.input, width: 80, marginTop: 0 }} value={newReviewInput.rating} onChange={e => setNewReviewInput(r => ({ ...r, rating: Number(e.target.value) }))}>
                            {[5,4,3,2,1].map(n => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                          </select>
                          <input style={{ ...ts.input, width: 110, marginTop: 0 }} placeholder="Date" value={newReviewInput.date} onChange={e => setNewReviewInput(r => ({ ...r, date: e.target.value }))} />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input type="file" accept="image/*" id="new-review-photo-input" style={{ display: "none" }}
                            onChange={e => { readReviewPhoto(e.target.files[0], setNewReviewInput); e.target.value = ""; }} />
                          <label htmlFor="new-review-photo-input" title="Attach customer photo (optional)"
                            style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 8, border: "1px dashed #d8c9c9", background: newReviewInput.photoFile ? `url(${newReviewInput.photoFile.preview}) center/cover` : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                            {!newReviewInput.photoFile && <span style={{ fontSize: 16, color: "#c9b8b8" }}>📷</span>}
                            {newReviewInput.photoFile && (
                              <span onClick={e => { e.preventDefault(); setNewReviewInput(r => ({ ...r, photoFile: null })); }}
                                style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%", background: "#1a1714", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>×</span>
                            )}
                          </label>
                          <input style={{ ...ts.input, flex: 1, marginTop: 0 }} placeholder="Review text (optional)" value={newReviewInput.text} onChange={e => setNewReviewInput(r => ({ ...r, text: e.target.value }))} />
                          <button type="button" style={{ ...ts.primaryBtn, padding: "9px 14px", flexShrink: 0 }}
                            onClick={() => { if (newReviewInput.name.trim()) { setNewProduct(p => ({ ...p, reviews: [...(p.reviews||[]), { name: newReviewInput.name, rating: newReviewInput.rating, text: newReviewInput.text, date: newReviewInput.date, _photoFile: newReviewInput.photoFile, image: newReviewInput.photoFile?.preview || "" }] })); setNewReviewInput({ name: "", rating: 5, text: "", date: "", photoFile: null }); } }}>+</button>
                        </div>
                        {(newProduct.reviews||[]).length > 0 && (
                          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                            {newProduct.reviews.map((r, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                                {r.image ? <img src={r.image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} /> : null}
                                <span>{"★".repeat(r.rating)}</span>
                                <span style={{ fontWeight: 600 }}>{r.name}</span>
                                {r.text && <span style={{ color: "#888", flex: 1 }}>{r.text}</span>}
                                <button type="button" onClick={() => setNewProduct(p => ({ ...p, reviews: p.reviews.filter((_,j)=>j!==i) }))} style={{ ...ts.colorChipX, fontSize: 16, padding: "0 6px" }}>×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <label style={ts.label}>Seller / Maker <span style={ts.labelHint}>(required)</span></label>
                      <select style={ts.input} required value={newProduct.sellerId || ""}
                        onChange={e => {
                          const sel = sellers.find(s => s.id === e.target.value);
                          setNewProduct(p => ({ ...p, sellerId: e.target.value, sellerCode: sel?.seller_code || "" }));
                        }}>
                        <option value="">— Select seller —</option>
                        {sellers.map(s => <option key={s.id} value={s.id}>{s.seller_code ? `${s.seller_code} — ` : ""}{s.business_name}</option>)}
                      </select>
                      <button type="button" style={{ ...ts.ghostBtn, padding: "6px 12px", fontSize: 11, marginTop: 4 }}
                        onClick={() => setShowInlineAddSeller(s => !s)}>
                        {showInlineAddSeller ? "Cancel" : "+ Create new seller"}
                      </button>
                      {showInlineAddSeller && (
                        <div style={{ background: "#fffbf3", border: "1px solid #e8d9b8", borderRadius: 8, padding: 14, marginTop: 8 }}>
                          <p style={{ ...ts.label, marginTop: 0 }}>New Seller (quick add)</p>
                          <input style={ts.input} placeholder="Business name *" value={inlineNewSeller.business_name}
                            onChange={e => setInlineNewSeller(s => ({ ...s, business_name: e.target.value }))} />
                          <input style={{ ...ts.input, marginTop: 6 }} placeholder="Owner name" value={inlineOwnerInput}
                            onChange={e => setInlineOwnerInput(e.target.value)} />
                          <input style={{ ...ts.input, marginTop: 6 }} placeholder="Location (city)" value={inlineNewSeller.location}
                            onChange={e => setInlineNewSeller(s => ({ ...s, location: e.target.value }))} />
                          <input style={{ ...ts.input, marginTop: 6 }} placeholder="Mobile number" value={inlineNewSeller.phone}
                            onChange={e => setInlineNewSeller(s => ({ ...s, phone: e.target.value }))} />
                          <input style={{ ...ts.input, marginTop: 6 }} placeholder="Email ID" type="email" value={inlineNewSeller.email}
                            onChange={e => setInlineNewSeller(s => ({ ...s, email: e.target.value }))} />
                          <button type="button" style={{ ...ts.primaryBtn, marginTop: 8, padding: "8px 16px" }}
                            onClick={() => handleInlineCreateSeller((id, code) => {
                              setNewProduct(p => ({ ...p, sellerId: id, sellerCode: code }));
                            })} disabled={publishing}>
                            {publishing ? "Creating..." : "Create & Select"}
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={ts.card}>
                      <h2 style={ts.cardTitle}>Occasion Categories</h2>
                      <div style={ts.chipGrid}>
                        {(occasionCatalogEntries.length > 0 ? occasionCatalogEntries : occasionCategories).map(occ => (
                          <button type="button" key={occ.id}
                            onClick={() => setNewProduct(p => ({
                              ...p,
                              occasions: p.occasions.includes(occ.id) ? p.occasions.filter(o => o !== occ.id) : [...p.occasions, occ.id]
                            }))}
                            style={newProduct.occasions.includes(occ.id) ? ts.chipActive : ts.chip}>
                            {occ.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={ts.card}>
                      <h2 style={ts.cardTitle}>Flags</h2>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {["inStock", "popular", "featured"].map(flag => (
                          <label key={flag} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "#333" }}>
                            <input type="checkbox" checked={!!newProduct[flag]} onChange={() => setNewProduct(p => ({ ...p, [flag]: !p[flag] }))} />
                            <span style={{ textTransform: "capitalize" }}>{flag}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={ts.card}>
                      <h2 style={ts.cardTitle}>Images *</h2>
                      <div style={{ ...ts.dropzone, ...(dragOver ? ts.dropzoneActive : {}) }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)} onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                          onChange={e => processFiles(e.target.files)} />
                        <div style={ts.dropzoneIcon}>↑</div>
                        <p style={ts.dropzoneText}>Drop images or click to browse</p>
                        <p style={ts.dropzoneHint}>First image = primary thumbnail</p>
                      </div>
                      {imageFiles.length > 0 && (
                        <>
                          <p style={ts.fieldHint}>Drag to reorder · × to remove</p>
                          <div style={ts.thumbGrid}>
                            {imageFiles.map((img, i) => (
                              <div key={img.name + i} style={{ ...ts.thumb, cursor: "grab" }}
                                draggable
                                onDragStart={e => e.dataTransfer.setData("imgIdx", String(i))}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                  e.preventDefault();
                                  const from = parseInt(e.dataTransfer.getData("imgIdx"));
                                  if (isNaN(from) || from === i) return;
                                  setImageFiles(prev => {
                                    const files = [...prev];
                                    const [moved] = files.splice(from, 1);
                                    files.splice(i, 0, moved);
                                    return files;
                                  });
                                  setNewProduct(p => ({
                                    ...p,
                                    colors: (p.colors || []).map(c => {
                                      if (typeof c !== "object") return c;
                                      if (c.imageIndex === from) return { ...c, imageIndex: i };
                                      if (c.imageIndex === i) return { ...c, imageIndex: from };
                                      return c;
                                    }),
                                  }));
                                }}>
                                <img src={img.preview} alt="" style={ts.thumbImg} />
                                {i === 0 && <span style={ts.primaryBadge}>Primary</span>}
                                <button type="button" onClick={() => setImageFiles(prev => prev.filter((_, j) => j !== i))} style={ts.removeBtn}>x</button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {newProduct.title && (
                      <div style={ts.card}>
                        <h2 style={ts.cardTitle}>Live Preview</h2>
                        <ProductCard product={{ ...newProduct, id: 0, price: Number(newProduct.price) || 0, images: imageFiles.map(f => f.preview) }} categories={categories} />
                      </div>
                    )}
                  </div>
                </div>
                {formError && <p style={ts.errorText}>{formError}</p>}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                  <button type="button" style={ts.ghostBtn} onClick={() => {
                    setFormError("");
                    if (!newProduct.title.trim()) return setFormError("Title required.");
                    if (!newProduct.categoryId) return setFormError("Select a category.");
                    if (!newProduct.price || isNaN(Number(newProduct.price)) || Number(newProduct.price) <= 0) return setFormError("Valid price required.");
                    if (imageFiles.length === 0) return setFormError("Upload at least one image.");
                    setProductQueue(q => [...q, { ...newProduct, _imageFiles: imageFiles }]);
                    setNewProduct({ title: "", categoryId: "", description: "", price: "", originalPrice: "", tags: "", keywords: "", occasions: [], colors: [], sizes: [], sizePrices: {}, moq: "", delivery_time: "", inStock: true, popular: false, featured: false, secondaryCategories: [], sellerId: "", sellerCode: "", personalisation_options: [], personalisation_prices: [] });
                    setNewColorInput(""); setNewColorImageIdx(0); setNewSizeInput(""); setImageFiles([]);
                    showToast("Added to queue!", "info");
                  }}>+ Add to Queue</button>
                  <button type="submit" style={ts.primaryBtn}>Preview & Publish This →</button>
                </div>
                {productQueue.length > 0 && (
                  <div style={{ ...ts.card, marginTop: 16, background: "#fffbf3", border: "1px solid #e8d9b8" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <h3 style={{ ...ts.cardTitle, margin: 0 }}>Queue ({productQueue.length} product{productQueue.length > 1 ? "s" : ""})</h3>
                      <button style={ts.primaryBtn} disabled={publishing} onClick={handlePublishQueue}>
                        {publishing ? "Publishing..." : `Publish All (${productQueue.length}) →`}
                      </button>
                    </div>
                    {productQueue.map((qp, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #f0ede8" }}>
                        <span style={{ fontSize: 13, color: "#555" }}>{qp.title} — ₹{qp.price} — {qp._imageFiles.length} image(s)</span>
                        <button type="button" onClick={() => setProductQueue(q => q.filter((_, j) => j !== i))} style={ts.colorChipX}>× Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            )}
            {productStep === "preview" && (
              <div style={ts.card}>
                <h2 style={ts.cardTitle}>Confirm and Publish</h2>
                <div style={ts.previewGrid}>
                  <div>
                    {imageFiles[0] && <img src={imageFiles[0].preview} style={ts.previewImg} alt="" />}
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      {imageFiles.slice(1).map((img, i) => <img key={i} src={img.preview} style={ts.previewThumb} alt="" />)}
                    </div>
                  </div>
                  <div>
                    {[
                      ["Title", newProduct.title],
                      ["Category", categories.find(c => c.id === newProduct.categoryId)?.name],
                      ["Price", `Rs.${newProduct.price}`],
                      ["Description", newProduct.description.replace(/\r?\n/g, " ").replace(/\*\*/g, "").replace(/__/g, "")],
                      ["Tags", newProduct.tags || "none"],
                      ["Keywords", newProduct.keywords || "none"],
                      ["Colours", (newProduct.colors||[]).map(c => typeof c === "object" ? c.name : c).join(", ") || "none"],
                      ["Sizes", (newProduct.sizes||[]).join(", ") || "none"],
                      ["Delivery Time", newProduct.delivery_time || "none"],
                      ["MOQ", newProduct.moq || "none"],
                      ["Also in", (newProduct.secondaryCategories||[]).map(id => categories.find(c=>c.id===id)?.name).filter(Boolean).join(", ") || "none"],
                      ["Occasions", newProduct.occasions.map(o => (occasionCatalogEntries.find(oc => oc.id === o) || occasionCategories.find(oc => oc.id === o))?.name).filter(Boolean).join(", ") || "None"],
                      ["Images", imageFiles.map(f => f.name).join(", ")],
                    ].map(([label, val]) => (
                      <div key={label} style={{ marginBottom: 10 }}>
                        <p style={ts.previewLabel}>{label}</p>
                        <p style={ts.previewValue}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {publishing && <div style={ts.logBox}>{publishLog.map((l, i) => <p key={i} style={ts.logLine}>{l}</p>)}</div>}
                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <button style={ts.ghostBtn} onClick={() => setProductStep("form")} disabled={publishing}>Back</button>
                  <button style={ts.primaryBtn} onClick={handlePublishProduct} disabled={publishing}>
                    {publishing ? "Publishing..." : "Publish to GitHub"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {activeTab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h1 style={{ ...ts.pageTitle, marginBottom: 4 }}>Products ({filteredProducts.length})</h1>
                {Object.keys(pendingChanges).length > 0 && (
                  <p style={{ margin: 0, fontSize: 12, color: "#a07840" }}>
                    {Object.keys(pendingChanges).length} unsaved change(s)
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {Object.keys(localOrderByCat).length > 0 && (
                  <button style={{ ...ts.ghostBtn, color: "#2a7a2a", borderColor: "#b8ddb8" }} onClick={handlePublishOrder} disabled={publishing}>
                    {publishing ? "Publishing..." : `Publish Order ↕`}
                  </button>
                )}
                {Object.keys(pendingChanges).length > 0 && (
                  <button style={ts.ghostBtn} onClick={() => setPendingChanges({})}>Discard All</button>
                )}
                <button style={ts.primaryBtn}
                  onClick={Object.keys(pendingChanges).length > 0 ? handlePublishAllChanges : () => setActiveTab("add-product")}
                  disabled={publishing}>
                  {publishing ? "Publishing..." : Object.keys(pendingChanges).length > 0 ? `Publish All (${Object.keys(pendingChanges).length})` : "+ Add Product"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <input style={{ ...ts.input, flex: 1, margin: 0 }} placeholder="Search products by name or ID..." value={productFilter} onChange={e => setProductFilter(e.target.value)} />
              <select style={{ ...ts.input, width: 200, margin: 0 }} value={productFilterCat} onChange={e => setProductFilterCat(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={ts.productTable}>
              <div style={ts.productTableHeader}>
                <span style={{ flex: 3 }}>Product {productFilterCat !== "all" && <span style={{ fontSize: 10, color: "#c8a96e", marginLeft: 6 }}>⠿ drag to reorder</span>}</span>
                <span style={{ flex: 1 }}>Price</span>
                <span style={{ flex: 1 }}>Stock</span>
                <span style={{ flex: 1 }}>Popular</span>
                <span style={{ flex: 1 }}>Featured</span>
                <span style={{ flex: 1 }}>Actions</span>
              </div>
              {getDisplayedProducts().map(product => {
                const p = pendingChanges[product.id] || product;
                const isDirty = !!pendingChanges[product.id];
                const isEditingThis = editingProduct?.id === product.id;
                return (
                  <React.Fragment key={product.id}>
                  <div
                    draggable={productFilterCat !== "all"}
                    onDragStart={e => handleDragStart(e, product.id)}
                    onDragOver={e => handleDragOver(e, product.id)}
                    onDrop={handleDragEnd}
                    onDragEnd={handleDragEnd}
                    style={{ ...ts.productTableRow, background: isDirty ? "#fffbf3" : draggingId === product.id ? "#e8f0fe" : "#fff", opacity: draggingId === product.id ? 0.5 : 1, borderBottom: isEditingThis ? "none" : undefined }}>
                    {productFilterCat !== "all" && (
                      <span title="Drag to reorder" style={{ cursor: "grab", color: "#ccc", fontSize: 18, marginRight: 8, flexShrink: 0, userSelect: "none" }}>⠿</span>
                    )}
                    <div style={{ flex: 3, display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={p.images[0]} alt="" style={ts.rowThumb} onError={e => { e.target.style.display = "none"; }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#222" }}>
                          {isDirty && <span style={{ color: "#c8a96e", marginRight: 4 }}>*</span>}
                          {p.title}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "#999" }}>{categories.find(c => c.id === p.categoryId)?.name} · ID {p.id}</p>
                      </div>
                    </div>
                    <span style={{ flex: 1, fontSize: 13 }}>Rs.{p.price}</span>
                    <span style={{ flex: 1 }}>
                      <button onClick={() => handleToggleFlag(product, "inStock")}
                        style={{ ...ts.flagToggle, background: p.inStock ? "#e8f5e8" : "#feeeed", color: p.inStock ? "#2a7a2a" : "#c00" }}>
                        {p.inStock ? "In Stock" : "Out"}
                      </button>
                    </span>
                    <span style={{ flex: 1 }}>
                      <button onClick={() => handleToggleFlag(product, "popular")}
                        style={{ ...ts.flagToggle, background: p.popular ? "#fff3e0" : "#f5f5f5", color: p.popular ? "#e65100" : "#999" }}>
                        {p.popular ? "Yes" : "No"}
                      </button>
                    </span>
                    <span style={{ flex: 1 }}>
                      <button onClick={() => handleToggleFlag(product, "featured")}
                        style={{ ...ts.flagToggle, background: p.featured ? "#e8eaf6" : "#f5f5f5", color: p.featured ? "#3949ab" : "#999" }}>
                        {p.featured ? "Yes" : "No"}
                      </button>
                    </span>
                    <span style={{ flex: 1, display: "flex", gap: 4, alignItems: "center" }}>
                      <button style={ts.editBtn} onClick={() => {
                        if (sellers.length === 0) loadSellers();
                        setEditingProduct(isEditingThis ? null : { ...p });
                        setEditImageFiles([]);
                        setEditColorInput(""); setEditColorImageIdx(0); setEditSizeInput("");
                        setShowInlineAddSeller(false);
                        setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
                      }}>{isEditingThis ? "Close" : "Edit"}</button>
                      <button style={{ ...ts.editBtn, padding: "3px 7px", background: "#feeeed", color: "#c00", border: "1px solid #f5c6c6" }} title="Delete product"
                        onClick={() => handleDeleteProduct(product)}>✕</button>
                    </span>
                  </div>
                  {isEditingThis && (
                    <div ref={editFormRef} style={{ background: "#fdf8f0", border: "1px solid #e8d9b8", borderTop: "none", padding: 20, marginBottom: 0 }}>
                      <div style={ts.grid2}>
                        <div>
                          {/* ── AI Generation Panel (Edit) ── */}
                          <div style={{ background: "linear-gradient(135deg,#fdf6ee 0%,#faf0f0 100%)", border: "1.5px solid #e8d4b8", borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <span style={{ fontSize: 15, color: "#c8a96e" }}>✦</span>
                              <span style={{ fontWeight: 700, fontSize: 13, color: "#7a4f1a", fontFamily: "Georgia,serif" }}>Regenerate with AI</span>
                              <span style={{ fontSize: 10, color: "#bbb", marginLeft: 2 }}>Gemini</span>
                            </div>
                            <label style={ts.label}>Extra details <span style={ts.labelHint}>(optional — material, dimensions, occasion, etc.)</span></label>
                            <textarea
                              style={{ ...ts.input, height: 58, resize: "vertical", fontFamily: "inherit", marginBottom: 10 }}
                              placeholder="e.g. Made with 925 sterling silver, 18cm length, perfect for gifting"
                              value={aiEditExtraDetails}
                              onChange={e => setAiEditExtraDetails(e.target.value)}
                            />
                            <button
                              type="button"
                              disabled={aiEditGenerating}
                              onClick={handleGenerateAIEdit}
                              style={{ ...ts.primaryBtn, opacity: aiEditGenerating ? 0.55 : 1, display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", fontSize: 12 }}
                            >
                              {aiEditGenerating
                                ? <><span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #c8a96e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Generating…</>
                                : <><span>✦</span>Regenerate title, description &amp; tags</>}
                            </button>
                            {aiEditError && <p style={{ ...ts.fieldHint, color: "#c00", marginTop: 6 }}>{aiEditError}</p>}
                            <p style={{ ...ts.fieldHint, marginTop: 6 }}>Uses the product's existing image (or a newly uploaded one if added below).</p>
                          </div>

                          <label style={ts.label}>Title</label>
                          <input style={ts.input} value={editingProduct.title} onChange={e => setEditingProduct(p => ({ ...p, title: e.target.value }))} />
                          <label style={ts.label}>Category</label>
                          <select style={ts.input} value={editingProduct.categoryId} onChange={e => setEditingProduct(p => ({ ...p, categoryId: e.target.value }))}>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <label style={ts.label}>Also appears in <span style={ts.labelHint}>(optional)</span></label>
                          <div style={ts.chipGrid}>
                            {categories.filter(c => c.id !== editingProduct.categoryId).map(c => {
                              const active = (editingProduct.secondaryCategories||[]).includes(c.id);
                              return (
                                <button type="button" key={c.id}
                                  onClick={() => setEditingProduct(p => ({
                                    ...p,
                                    secondaryCategories: active
                                      ? (p.secondaryCategories||[]).filter(x => x !== c.id)
                                      : [...(p.secondaryCategories||[]), c.id]
                                  }))}
                                  style={active ? ts.chipActive : ts.chip}>{c.name}</button>
                              );
                            })}
                          </div>
                          <label style={ts.label}>Price (Rs.)</label>
                          <input style={ts.input} type="number" value={editingProduct.price} onChange={e => setEditingProduct(p => ({ ...p, price: Number(e.target.value) }))} />
                          <label style={ts.label}>Original Price (Rs.) <span style={ts.labelHint}>(optional — shown crossed out if higher than price)</span></label>
                          <input style={ts.input} type="number" placeholder="e.g. 999" value={editingProduct.originalPrice || ""} onChange={e => setEditingProduct(p => ({ ...p, originalPrice: e.target.value }))} />
                          <label style={ts.label}>Description</label>
                          <div style={ts.descToolbar}>
                            <button type="button" style={ts.descToolbarBtn} title="Bold"
                              onClick={() => wrapDescSelection(editDescRef, editingProduct.description, v => setEditingProduct(p => ({ ...p, description: v })), "**")}>
                              <strong>B</strong>
                            </button>
                            <button type="button" style={ts.descToolbarBtn} title="Underline"
                              onClick={() => wrapDescSelection(editDescRef, editingProduct.description, v => setEditingProduct(p => ({ ...p, description: v })), "__")}>
                              <u>U</u>
                            </button>
                            <button type="button" style={ts.descToolbarBtn} title="Add bullet point"
                              onClick={() => insertDescBullet(editDescRef, editingProduct.description, v => setEditingProduct(p => ({ ...p, description: v })))}>
                              ✨ Bullet
                            </button>
                          </div>
                          <textarea ref={editDescRef} style={{ ...ts.input, height: 100, resize: "vertical", borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }} value={editingProduct.description}
                            onChange={e => setEditingProduct(p => ({ ...p, description: e.target.value }))} />
                          <p style={ts.fieldHint}>Line breaks become paragraph breaks. **bold** and __underline__ render as real formatting on the product page.</p>
                          <label style={ts.label}>Tags (comma-separated)</label>
                          <input style={ts.input} value={editingProduct.tags.join(", ")}
                            onChange={e => setEditingProduct(p => ({ ...p, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))} />
                          <label style={ts.label}>Keywords (comma-separated)</label>
                          <input style={ts.input} value={(editingProduct.keywords || []).join(", ")}
                            onChange={e => setEditingProduct(p => ({ ...p, keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean) }))} />
                          <label style={ts.label}>Colour Options <span style={ts.labelHint}>(optional)</span></label>
                          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                            <input style={{ ...ts.input, flex: 1, marginTop: 0 }} placeholder="Add a colour"
                              value={editColorInput}
                              onChange={e => setEditColorInput(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = editColorInput.trim(); if (v) { setEditingProduct(p => ({ ...p, colors: [...(p.colors||[]), { name: v, imageIndex: editColorImageIdx }] })); setEditColorInput(""); setEditColorImageIdx(0); } } }} />
                            <select style={{ ...ts.input, width: 110, marginTop: 0 }} value={editColorImageIdx}
                              onChange={e => setEditColorImageIdx(Number(e.target.value))}>
                              {(editingProduct.images.length === 0 ? ["Image 1"] : editingProduct.images).map((_, i) => (
                                <option key={i} value={i}>Image {i + 1}</option>
                              ))}
                            </select>
                            <button type="button" style={{ ...ts.primaryBtn, padding: "9px 14px", flexShrink: 0 }}
                              onClick={() => { const v = editColorInput.trim(); if (v) { setEditingProduct(p => ({ ...p, colors: [...(p.colors||[]), { name: v, imageIndex: editColorImageIdx }] })); setEditColorInput(""); setEditColorImageIdx(0); } }}>+</button>
                          </div>
                          <p style={ts.fieldHint}>Select which image number this colour links to.</p>
                          {(editingProduct.colors||[]).length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                              {editingProduct.colors.map((c, i) => {
                                const name = typeof c === "object" ? c.name : c;
                                const imgIdx = typeof c === "object" ? (c.imageIndex ?? 0) : 0;
                                return (
                                  <span key={i} style={ts.colorChip}>
                                    {name} → Img {imgIdx + 1}
                                    <button type="button" onClick={() => setEditingProduct(p => ({ ...p, colors: p.colors.filter((_,j)=>j!==i) }))} style={ts.colorChipX}>×</button>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <label style={ts.label}>Size Options <span style={ts.labelHint}>(optional)</span></label>
                          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                            <input style={{ ...ts.input, flex: 2, marginTop: 0 }} placeholder="Size name e.g. Small, 6 inch"
                              value={editSizeInput}
                              onChange={e => setEditSizeInput(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = editSizeInput.trim(); if (v) { setEditingProduct(p => ({ ...p, sizes: [...(p.sizes||[]), v] })); setEditSizeInput(""); } } }} />
                            <button type="button" style={{ ...ts.primaryBtn, padding: "9px 14px", flexShrink: 0 }}
                              onClick={() => { const v = editSizeInput.trim(); if (v) { setEditingProduct(p => ({ ...p, sizes: [...(p.sizes||[]), v] })); setEditSizeInput(""); } }}>+</button>
                          </div>
                          {(editingProduct.sizes||[]).length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 12, color: "#888" }}>Set a price per size? If yes, product will show "₹X onwards" on listings.</span>
                              </div>
                              {editingProduct.sizes.map((s, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                  <span style={{ ...ts.colorChip, margin: 0, minWidth: 90 }}>{s}</span>
                                  <input
                                    style={{ ...ts.input, width: 110, marginTop: 0 }}
                                    type="number" min="0" placeholder="Price (₹)"
                                    value={(editingProduct.sizePrices||{})[s] || ""}
                                    onChange={e => setEditingProduct(p => ({
                                      ...p,
                                      sizePrices: { ...(p.sizePrices||{}), [s]: e.target.value }
                                    }))} />
                                  <button type="button" onClick={() => setEditingProduct(p => {
                                    const sizes = p.sizes.filter((_,j)=>j!==i);
                                    const sp = { ...(p.sizePrices||{}) };
                                    delete sp[s];
                                    return { ...p, sizes, sizePrices: sp };
                                  })} style={{ ...ts.colorChipX, fontSize: 16, padding: "0 6px", lineHeight: 1 }}>×</button>
                                </div>
                              ))}
                              {Object.values(editingProduct.sizePrices||{}).some(v => v !== "") && (
                                <p style={ts.fieldHint}>Min price: ₹{Math.min(...Object.values(editingProduct.sizePrices||{}).filter(v=>v!=="").map(Number))} — will be auto-set as the product price.</p>
                              )}
                            </div>
                          )}
                          <label style={ts.label}>Minimum Order Quantity <span style={ts.labelHint}>(optional)</span></label>
                          <input style={ts.input} type="number" placeholder="e.g. 15" value={editingProduct.moq || ""}
                            onChange={e => setEditingProduct(p => ({ ...p, moq: e.target.value }))} />
                          <label style={ts.label}>Delivery Time <span style={ts.labelHint}>(shown on product page)</span></label>
                          <input style={ts.input} placeholder="e.g. 3–5 business days" value={editingProduct.delivery_time || editingProduct.meta?.delivery_time || ""}
                            onChange={e => setEditingProduct(p => ({ ...p, delivery_time: e.target.value }))} />
                          <label style={ts.label}>Personalisation Options <span style={ts.labelHint}>(each shown as a checkbox on product page)</span></label>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {(editingProduct.personalisation_options || editingProduct.meta?.personalisation_options || []).map((opt, i) => {
                              const prices = editingProduct.personalisation_prices || editingProduct.meta?.personalisation_prices || [];
                              return (
                                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                  <input
                                    style={{ ...ts.input, flex: 1, marginTop: 0 }}
                                    placeholder="e.g. Add name on product"
                                    value={opt}
                                    onChange={e => setEditingProduct(p => {
                                      const options = [...(p.personalisation_options || p.meta?.personalisation_options || [])];
                                      options[i] = e.target.value;
                                      return { ...p, personalisation_options: options };
                                    })}
                                  />
                                  <span style={{ color: "#888", fontSize: 13, flexShrink: 0 }}>₹</span>
                                  <input
                                    style={{ ...ts.input, width: 80, marginTop: 0 }}
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={prices[i] ?? ""}
                                    onChange={e => setEditingProduct(p => {
                                      const ps = [...(p.personalisation_prices || p.meta?.personalisation_prices || [])];
                                      ps[i] = e.target.value;
                                      return { ...p, personalisation_prices: ps };
                                    })}
                                  />
                                  <button type="button"
                                    onClick={() => setEditingProduct(p => ({
                                      ...p,
                                      personalisation_options: (p.personalisation_options || p.meta?.personalisation_options || []).filter((_, j) => j !== i),
                                      personalisation_prices: (p.personalisation_prices || p.meta?.personalisation_prices || []).filter((_, j) => j !== i),
                                    }))}
                                    style={{ ...ts.colorChipX, fontSize: 16, padding: "0 6px", lineHeight: 1 }}>×</button>
                                </div>
                              );
                            })}
                            <button type="button"
                              onClick={() => setEditingProduct(p => ({
                                ...p,
                                personalisation_options: [...(p.personalisation_options || p.meta?.personalisation_options || []), ""],
                                personalisation_prices: [...(p.personalisation_prices || p.meta?.personalisation_prices || []), ""],
                              }))}
                              style={{ ...ts.ghostBtn, alignSelf: "flex-start", fontSize: 13, padding: "5px 12px" }}>
                              + Add option
                            </button>
                          </div>
                          <label style={ts.label}>Customer Reviews <span style={ts.labelHint}>(optional — add manually)</span></label>
                          <div style={{ background: "#faf7f5", border: "1px solid #ede0e0", borderRadius: 8, padding: "10px 12px", marginTop: 2 }}>
                            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                              <input style={{ ...ts.input, flex: 2, marginTop: 0 }} placeholder="Customer name" value={editReviewInput.name} onChange={e => setEditReviewInput(r => ({ ...r, name: e.target.value }))} />
                              <select style={{ ...ts.input, width: 80, marginTop: 0 }} value={editReviewInput.rating} onChange={e => setEditReviewInput(r => ({ ...r, rating: Number(e.target.value) }))}>
                                {[5,4,3,2,1].map(n => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                              </select>
                              <input style={{ ...ts.input, width: 110, marginTop: 0 }} placeholder="Date" value={editReviewInput.date} onChange={e => setEditReviewInput(r => ({ ...r, date: e.target.value }))} />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <input type="file" accept="image/*" id="edit-review-photo-input" style={{ display: "none" }}
                                onChange={e => { readReviewPhoto(e.target.files[0], setEditReviewInput); e.target.value = ""; }} />
                              <label htmlFor="edit-review-photo-input" title="Attach customer photo (optional)"
                                style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 8, border: "1px dashed #d8c9c9", background: editReviewInput.photoFile ? `url(${editReviewInput.photoFile.preview}) center/cover` : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                                {!editReviewInput.photoFile && <span style={{ fontSize: 16, color: "#c9b8b8" }}>📷</span>}
                                {editReviewInput.photoFile && (
                                  <span onClick={e => { e.preventDefault(); setEditReviewInput(r => ({ ...r, photoFile: null })); }}
                                    style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%", background: "#1a1714", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>×</span>
                                )}
                              </label>
                              <input style={{ ...ts.input, flex: 1, marginTop: 0 }} placeholder="Review text (optional)" value={editReviewInput.text} onChange={e => setEditReviewInput(r => ({ ...r, text: e.target.value }))} />
                              <button type="button" disabled={editReviewUploading} style={{ ...ts.primaryBtn, padding: "9px 14px", flexShrink: 0, opacity: editReviewUploading ? 0.6 : 1 }}
                                onClick={handleAddEditReview}>{editReviewUploading ? "…" : "+"}</button>
                            </div>
                            {(editingProduct.reviews||[]).length > 0 && (
                              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                                {editingProduct.reviews.map((r, i) => (
                                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                                    {r.image ? <img src={r.image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} /> : null}
                                    <span>{"★".repeat(r.rating)}</span>
                                    <span style={{ fontWeight: 600 }}>{r.name}</span>
                                    {r.text && <span style={{ color: "#888", flex: 1 }}>{r.text}</span>}
                                    <button type="button" onClick={() => setEditingProduct(p => ({ ...p, reviews: p.reviews.filter((_,j)=>j!==i) }))} style={{ ...ts.colorChipX, fontSize: 16, padding: "0 6px" }}>×</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <label style={ts.label}>Seller / Maker <span style={ts.labelHint}>(optional)</span></label>
                          <select style={ts.input} value={editingProduct.sellerId || ""}
                            onChange={e => {
                              const sel = sellers.find(s => s.id === e.target.value);
                              setEditingProduct(p => ({ ...p, sellerId: e.target.value, sellerCode: sel?.seller_code || "" }));
                            }}>
                            <option value="">— Select seller —</option>
                            {sellers.map(s => <option key={s.id} value={s.id}>{s.seller_code ? `${s.seller_code} — ` : ""}{s.business_name}</option>)}
                          </select>
                          <button type="button" style={{ ...ts.ghostBtn, padding: "6px 12px", fontSize: 11, marginTop: 4 }}
                            onClick={() => setShowInlineAddSeller(s => !s)}>
                            {showInlineAddSeller ? "Cancel new seller" : "+ Create new seller"}
                          </button>
                          {showInlineAddSeller && (
                            <div style={{ background: "#fff", border: "1px solid #e8d9b8", borderRadius: 8, padding: 14, marginTop: 8 }}>
                              <p style={{ ...ts.label, marginTop: 0 }}>New Seller (quick add)</p>
                              <input style={ts.input} placeholder="Business name *" value={inlineNewSeller.business_name}
                                onChange={e => setInlineNewSeller(s => ({ ...s, business_name: e.target.value }))} />
                              <input style={{ ...ts.input, marginTop: 6 }} placeholder="Owner name" value={inlineOwnerInput}
                                onChange={e => setInlineOwnerInput(e.target.value)} />
                              <input style={{ ...ts.input, marginTop: 6 }} placeholder="Location (city)" value={inlineNewSeller.location}
                                onChange={e => setInlineNewSeller(s => ({ ...s, location: e.target.value }))} />
                              <button type="button" style={{ ...ts.primaryBtn, marginTop: 8, padding: "8px 16px" }}
                                onClick={() => handleInlineCreateSeller((id, code) => {
                                  setEditingProduct(p => ({ ...p, sellerId: id, sellerCode: code }));
                                })} disabled={publishing}>
                                {publishing ? "Creating..." : "Create & Select"}
                              </button>
                            </div>
                          )}
                        </div>
                        <div>
                          <label style={ts.label}>Flags</label>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "8px 0 16px" }}>
                            {["inStock", "popular", "featured"].map(flag => (
                              <label key={flag} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "#333" }}>
                                <input type="checkbox" checked={editingProduct[flag]} onChange={() => setEditingProduct(p => ({ ...p, [flag]: !p[flag] }))} />
                                <span style={{ textTransform: "capitalize" }}>{flag}</span>
                              </label>
                            ))}
                          </div>
                          <label style={ts.label}>Images <span style={ts.labelHint}>(drag to reorder · × to remove)</span></label>
                          {editingProduct.images.length > 0 && (
                            <div style={{ ...ts.thumbGrid, marginBottom: 10 }}>
                              {editingProduct.images.map((src, i) => (
                                <div key={src + i} style={{ ...ts.thumb, cursor: "grab" }}
                                  draggable
                                  onDragStart={e => e.dataTransfer.setData("imgIdx", String(i))}
                                  onDragOver={e => e.preventDefault()}
                                  onDrop={e => {
                                    e.preventDefault();
                                    const from = parseInt(e.dataTransfer.getData("imgIdx"));
                                    if (from === i) return;
                                    setEditingProduct(p => {
                                      const imgs = [...p.images];
                                      imgs.splice(from, 1);
                                      imgs.splice(i, 0, src);
                                      // Update color imageIndex references after reorder
                                      const colors = (p.colors || []).map(c => {
                                        if (typeof c !== "object") return c;
                                        if (c.imageIndex === from) return { ...c, imageIndex: i };
                                        if (c.imageIndex === i) return { ...c, imageIndex: from };
                                        return c;
                                      });
                                      return { ...p, images: imgs, colors };
                                    });
                                  }}>
                                  <img src={src} alt="" style={ts.thumbImg} onError={e => { e.target.style.display = "none"; }} />
                                  {i === 0 && <span style={ts.primaryBadge}>Primary</span>}
                                  <button type="button"
                                    onClick={() => setEditingProduct(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                                    style={ts.removeBtn}>×</button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ ...ts.editDropzone, marginBottom: 8 }} onClick={() => editFileInputRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); processEditFiles(e.dataTransfer.files); }}>
                            <input ref={editFileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                              onChange={e => processEditFiles(e.target.files)} />
                            <span style={{ fontSize: 12, color: "#aaa" }}>↑ Drop or click to add images</span>
                          </div>
                          {editImageFiles.length > 0 && (
                            <div style={{ background: "#fffbf3", border: "1px solid #e8d9b8", borderRadius: 8, padding: 10 }}>
                              <p style={{ margin: "0 0 8px", fontSize: 11, color: "#a07840", fontWeight: 600 }}>
                                {editImageFiles.length} new image(s) ready — upload to GitHub to add them to the product
                              </p>
                              <div style={{ ...ts.thumbGrid, marginBottom: 8 }}>
                                {editImageFiles.map((img, i) => (
                                  <div key={i} style={ts.thumb}>
                                    <img src={img.preview} alt="" style={ts.thumbImg} />
                                    <button type="button" onClick={() => setEditImageFiles(prev => prev.filter((_, j) => j !== i))} style={ts.removeBtn}>×</button>
                                  </div>
                                ))}
                              </div>
                              <button type="button" style={{ ...ts.primaryBtn, padding: "8px 16px", fontSize: 12, width: "100%" }}
                                onClick={uploadEditImages} disabled={publishing}>
                                {publishing ? "Uploading to GitHub..." : `Upload ${editImageFiles.length} image(s) to GitHub →`}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                        <button style={ts.ghostBtn} onClick={() => { setEditingProduct(null); setEditImageFiles([]); setEditColorInput(""); setEditColorImageIdx(0); setEditSizeInput(""); setShowInlineAddSeller(false); }}>Cancel</button>
                        <button style={ts.primaryBtn} onClick={() => { handleStageProductEdit(editingProduct); setShowInlineAddSeller(false); }}>Stage Changes</button>
                      </div>
                    </div>
                  )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CATEGORIES ── */}
        {activeTab === "categories" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h1 style={ts.pageTitle}>Categories</h1>
              <button style={ts.primaryBtn} onClick={() => setShowAddCategory(s => !s)}>+ Add Category</button>
            </div>

            {showAddCategory && (
              <div style={{ ...ts.card, border: "2px solid #c8a96e", marginBottom: 24 }}>
                <h2 style={ts.cardTitle}>New Category</h2>
                <div style={ts.grid2}>
                  <div>
                    <label style={ts.label}>Name *</label>
                    <input style={ts.input} placeholder="e.g. Pottery" value={newCategory.name}
                      onChange={e => setNewCategory(c => ({ ...c, name: e.target.value }))} />
                    <label style={ts.label}>Description</label>
                    <input style={ts.input} placeholder="Short description..." value={newCategory.description}
                      onChange={e => setNewCategory(c => ({ ...c, description: e.target.value }))} />
                    <label style={ts.label}>Icon</label>
                    <select style={ts.input} value={newCategory.icon}
                      onChange={e => setNewCategory(c => ({ ...c, icon: e.target.value }))}>
                      {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ textAlign: "center", color: "#aaa" }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
                      <p style={{ fontSize: 13, margin: 0 }}>ID: <strong style={{ color: "#333" }}>{slugify(newCategory.name || "category-name")}</strong></p>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button style={ts.ghostBtn} onClick={() => setShowAddCategory(false)}>Cancel</button>
                  <button style={ts.primaryBtn} onClick={handleAddCategory} disabled={publishing}>{publishing ? "Adding..." : "Add Category"}</button>
                </div>
              </div>
            )}

            {editingCategory && (
              <div style={{ ...ts.card, border: "2px solid #c8a96e", marginBottom: 24 }}>
                <h2 style={ts.cardTitle}>Edit: {editingCategory.name}</h2>
                <div style={ts.grid2}>
                  <div>
                    <label style={ts.label}>Name</label>
                    <input style={ts.input} value={editingCategory.name} onChange={e => setEditingCategory(c => ({ ...c, name: e.target.value }))} />
                    <label style={ts.label}>Description</label>
                    <input style={ts.input} value={editingCategory.description} onChange={e => setEditingCategory(c => ({ ...c, description: e.target.value }))} />
                    <label style={ts.label}>Icon</label>
                    <select style={ts.input} value={editingCategory.icon} onChange={e => setEditingCategory(c => ({ ...c, icon: e.target.value }))}>
                      {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <label style={ts.label}>Display Order</label>
                    <input style={ts.input} type="number" value={editingCategory.order} onChange={e => setEditingCategory(c => ({ ...c, order: parseInt(e.target.value) }))} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ textAlign: "center", color: "#888" }}>
                      <p style={{ fontSize: 13 }}>ID (fixed): <strong style={{ color: "#333" }}>{editingCategory.id}</strong></p>
                      <p style={{ fontSize: 13 }}>Products: <strong style={{ color: "#333" }}>{products.filter(p => p.categoryId === editingCategory.id).length}</strong></p>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button style={ts.ghostBtn} onClick={() => setEditingCategory(null)}>Cancel</button>
                  <button style={ts.primaryBtn} onClick={handleSaveCategory} disabled={publishing}>{publishing ? "Saving..." : "Save Changes"}</button>
                </div>
              </div>
            )}

            <div style={ts.catGrid}>
              {categories.map(cat => {
                const count = products.filter(p => p.categoryId === cat.id).length;
                return (
                  <div key={cat.id} style={ts.catCard}>
                    <div style={ts.catCardTop}>
                      <span style={ts.catCardOrder}>#{cat.order}</span>
                      <button style={ts.editBtn} onClick={() => setEditingCategory({ ...cat })}>Edit</button>
                    </div>
                    <div style={ts.catCardName}>{cat.name}</div>
                    <div style={ts.catCardDesc}>{cat.description}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={ts.flag}>{count} products</span>
                      <span style={{ ...ts.flag, background: "#f0f0f0", color: "#888" }}>icon: {cat.icon}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── OCCASIONS ── */}
        {/* ── BY CATEGORY ── */}
        {activeTab === "by-category" && (() => {
          const hasChanges = Object.keys(byCatOrder).length > 0;

          const getOrder = (catId) => {
            if (byCatOrder[catId]) return byCatOrder[catId];
            return products.filter(p => p.categoryId === catId).map(p => p.id);
          };

          const handleByCatPublish = async () => {
            setByCatPublishing(true);
            try {
              let { source, sha } = await fetchCatalog(creds);
              for (const catId of Object.keys(byCatOrder)) {
                const newOrder = byCatOrder[catId];
                const catProds = products.filter(p => p.categoryId === catId);
                const entries = catProds
                  .map(p => { const r = getEntryRange(source, p.id); return r ? { id: p.id, range: r } : null; })
                  .filter(Boolean).sort((a, b) => a.range.start - b.range.start);
                if (!entries.length) continue;
                const entryTexts = {};
                for (const e of entries) entryTexts[e.id] = source.slice(e.range.start, e.range.end);
                const blockStart = entries[0].range.start;
                const blockEnd = entries[entries.length - 1].range.end;
                const orderedTexts = newOrder.map(id => entryTexts[id]).filter(Boolean).join("\n");
                source = source.slice(0, blockStart) + orderedTexts + source.slice(blockEnd);
              }
              await commitCatalog(source, sha, `Reorder products by category (${Object.keys(byCatOrder).join(", ")})`, creds);
              loadCatalogData(source, sha);
              setByCatOrder({});
              showToast("Category order published!");
            } catch (err) { showToast(err.message, "error"); }
            finally { setByCatPublishing(false); }
          };

          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h1 style={ts.pageTitle}>By Category</h1>
                {hasChanges && (
                  <button style={ts.primaryBtn} onClick={handleByCatPublish} disabled={byCatPublishing}>
                    {byCatPublishing ? "Publishing..." : `Publish Order`}
                  </button>
                )}
              </div>
              <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
                Drag ⠿ to reorder products within each category. Hit Publish Order when done.
              </p>
              {categories.map(cat => {
                const catProds = getOrder(cat.id).map(id => products.find(p => p.id === id)).filter(Boolean);
                const isOpen = openCats[cat.id];
                return (
                  <div key={cat.id} style={{ ...ts.card, marginBottom: 12 }}>
                    <div
                      onClick={() => setOpenCats(o => ({ ...o, [cat.id]: !o[cat.id] }))}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                      <h2 style={{ ...ts.cardTitle, margin: 0 }}>{cat.name}</h2>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {byCatOrder[cat.id] && <span style={{ fontSize: 11, color: "#c8a96e", fontWeight: 600 }}>● unsaved</span>}
                        <span style={ts.flag}>{catProds.length} products</span>
                        <span style={{ fontSize: 12, color: "#aaa" }}>{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ marginTop: 12, border: "1px solid #f0ede8", borderRadius: 8, overflow: "hidden" }}>
                        <div style={{ padding: "8px 12px", background: "#faf8f5", fontSize: 11, color: "#999", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                          ⠿ Drag to reorder
                        </div>
                        {catProds.map((p) => (
                          <div key={p.id}
                            draggable
                            onDragStart={() => setByCatDragging({ catId: cat.id, productId: p.id })}
                            onDragOver={e => {
                              e.preventDefault();
                              if (!byCatDragging || byCatDragging.catId !== cat.id || byCatDragging.productId === p.id) return;
                              const cur = getOrder(cat.id);
                              const newOrder = [...cur];
                              const posA = newOrder.indexOf(byCatDragging.productId);
                              const posB = newOrder.indexOf(p.id);
                              if (posA !== -1 && posB !== -1) {
                                newOrder.splice(posA, 1);
                                newOrder.splice(posB, 0, byCatDragging.productId);
                                setByCatOrder(prev => ({ ...prev, [cat.id]: newOrder }));
                              }
                            }}
                            onDragEnd={() => setByCatDragging(null)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderTop: "1px solid #f5f2ee", background: byCatDragging?.productId === p.id ? "#f0ede8" : "#fff", cursor: "grab", userSelect: "none", opacity: byCatDragging?.productId === p.id ? 0.5 : 1 }}>
                            <span style={{ color: "#ccc", fontSize: 18, flexShrink: 0 }}>⠿</span>
                            <img src={p.images[0]} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0, border: "1px solid #eee" }} onError={e => { e.target.style.display = "none"; }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#222" }}>{p.title}</p>
                              <p style={{ margin: 0, fontSize: 11, color: "#999" }}>ID {p.id} · ₹{p.price}</p>
                            </div>
                            <span style={{ ...ts.flagToggle, background: p.inStock ? "#e8f5e8" : "#feeeed", color: p.inStock ? "#2a7a2a" : "#c00", fontSize: 11, padding: "3px 8px", borderRadius: 5 }}>
                              {p.inStock ? "In Stock" : "Out"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {activeTab === "occasions" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h1 style={ts.pageTitle}>Occasion Map</h1>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={ts.ghostBtn} onClick={() => setShowAddOccasion(s => !s)}>+ Add Occasion</button>
                {occasionOrderDirty && (
                  <button style={ts.primaryBtn} onClick={handleSaveOccasionOrder} disabled={publishing}>
                    {publishing ? "Saving..." : "Save Occasion Order"}
                  </button>
                )}
                <button style={ts.primaryBtn} onClick={handleSaveOccasions} disabled={publishing}>
                  {publishing ? "Saving..." : "Save All"}
                </button>
              </div>
            </div>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
              Use the ▲▼ on each occasion card to reorder them in the nav bar and Shop by Occasion page — hit "Save Occasion Order" once you're happy.
              Within a card, toggle which products belong to it and drag them to reorder — hit "Save All" for those.
            </p>

            {showAddOccasion && (
              <div style={{ ...ts.card, border: "2px solid #c8a96e", marginBottom: 24 }}>
                <h2 style={ts.cardTitle}>New Occasion</h2>
                <div style={ts.grid2}>
                  <div>
                    <label style={ts.label}>Name *</label>
                    <input style={ts.input} placeholder="e.g. For Your Roommate" value={newOccasion.name}
                      onChange={e => setNewOccasion(o => ({ ...o, name: e.target.value }))} />
                    <label style={ts.label}>Emoji</label>
                    <input style={ts.input} placeholder="e.g. 🏠" value={newOccasion.emoji}
                      onChange={e => setNewOccasion(o => ({ ...o, emoji: e.target.value }))} />
                    <label style={ts.label}>Description</label>
                    <textarea style={{ ...ts.input, height: 70, resize: "vertical" }} placeholder="Short, playful blurb shown on the By Occasion page..."
                      value={newOccasion.description} onChange={e => setNewOccasion(o => ({ ...o, description: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ textAlign: "center", color: "#aaa" }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>{newOccasion.emoji || "🎁"}</div>
                      <p style={{ fontSize: 13, margin: 0 }}>ID: <strong style={{ color: "#333" }}>{slugify(newOccasion.name || "occasion-name")}</strong></p>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button style={ts.ghostBtn} onClick={() => setShowAddOccasion(false)}>Cancel</button>
                  <button style={ts.primaryBtn} onClick={handleAddOccasion} disabled={publishing}>{publishing ? "Adding..." : "Add Occasion"}</button>
                </div>
              </div>
            )}

            {editingOccasion && (
              <div style={{ ...ts.card, border: "2px solid #c8a96e", marginBottom: 24 }}>
                <h2 style={ts.cardTitle}>Edit: {editingOccasion.name}</h2>
                <div style={ts.grid2}>
                  <div>
                    <label style={ts.label}>Name</label>
                    <input style={ts.input} value={editingOccasion.name} onChange={e => setEditingOccasion(o => ({ ...o, name: e.target.value }))} />
                    <label style={ts.label}>Emoji</label>
                    <input style={ts.input} value={editingOccasion.emoji} onChange={e => setEditingOccasion(o => ({ ...o, emoji: e.target.value }))} />
                    <label style={ts.label}>Description</label>
                    <textarea style={{ ...ts.input, height: 70, resize: "vertical" }} value={editingOccasion.description}
                      onChange={e => setEditingOccasion(o => ({ ...o, description: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ textAlign: "center", color: "#888" }}>
                      <p style={{ fontSize: 13 }}>ID (fixed): <strong style={{ color: "#333" }}>{editingOccasion.id}</strong></p>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button style={ts.ghostBtn} onClick={() => setEditingOccasion(null)}>Cancel</button>
                  <button style={ts.primaryBtn} onClick={handleSaveOccasionMeta} disabled={publishing}>{publishing ? "Saving..." : "Save Changes"}</button>
                </div>
              </div>
            )}

            {occasionCatalogEntries.map((occ, occIdx) => {
              const currentIds = occasionEdits[occ.id] || [];
              const selectedProducts = currentIds.map(id => products.find(p => p.id === id)).filter(Boolean);
              return (
                <div key={occ.id} style={{ ...ts.card, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <h2 style={{ ...ts.cardTitle, margin: 0 }}>{occ.emoji ? `${occ.emoji} ` : ""}{occ.name}</h2>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={ts.flag}>{currentIds.length} products</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <button type="button" style={{ ...ts.editBtn, padding: "1px 8px", fontSize: 10, lineHeight: 1.4, opacity: occIdx === 0 ? 0.35 : 1 }}
                          disabled={occIdx === 0} onClick={() => moveOccasion(occ.id, -1)} aria-label="Move up">▲</button>
                        <button type="button" style={{ ...ts.editBtn, padding: "1px 8px", fontSize: 10, lineHeight: 1.4, opacity: occIdx === occasionCatalogEntries.length - 1 ? 0.35 : 1 }}
                          disabled={occIdx === occasionCatalogEntries.length - 1} onClick={() => moveOccasion(occ.id, 1)} aria-label="Move down">▼</button>
                      </div>
                      <button style={ts.editBtn} onClick={() => setEditingOccasion({ ...occ })}>Edit</button>
                    </div>
                  </div>
                  {occ.description && <p style={{ fontSize: 12, color: "#999", margin: "0 0 12px" }}>{occ.description}</p>}

                  {/* Ordered list with ↑↓ reorder */}
                  {selectedProducts.length > 0 && (
                    <div style={{ marginBottom: 16, border: "1px solid #f0ede8", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ padding: "8px 12px", background: "#faf8f5", fontSize: 11, color: "#999", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        Display order (drag ↑↓ to reorder)
                      </div>
                      {selectedProducts.map((p, idx) => (
                        <div key={p.id}
                          draggable
                          onDragStart={() => setDraggingOcc({ occId: occ.id, productId: p.id })}
                          onDragOver={e => {
                            e.preventDefault();
                            if (!draggingOcc || draggingOcc.occId !== occ.id || draggingOcc.productId === p.id) return;
                            const newIds = [...currentIds];
                            const posA = newIds.indexOf(draggingOcc.productId);
                            const posB = newIds.indexOf(p.id);
                            if (posA !== -1 && posB !== -1) {
                              newIds.splice(posA, 1);
                              newIds.splice(posB, 0, draggingOcc.productId);
                              setOccasionEdits(e2 => ({ ...e2, [occ.id]: newIds }));
                            }
                          }}
                          onDragEnd={() => setDraggingOcc(null)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderTop: "1px solid #f5f2ee", background: draggingOcc?.productId === p.id ? "#f0ede8" : "#fff", cursor: "grab", opacity: draggingOcc?.productId === p.id ? 0.5 : 1 }}>
                          <span style={{ color: "#ccc", fontSize: 16, flexShrink: 0, userSelect: "none" }}>⠿</span>
                          <span style={{ fontSize: 11, color: "#ccc", width: 20, textAlign: "center", flexShrink: 0 }}>{idx + 1}</span>
                          <img src={p.images[0]} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} onError={e => { e.target.style.display = "none"; }} />
                          <span style={{ flex: 1, fontSize: 12, color: "#333" }}>{p.title} <span style={{ color: "#bbb" }}>ID {p.id}</span></span>
                          <button type="button"
                            onClick={() => toggleOccasionProduct(occ.id, p.id)}
                            style={{ ...ts.editBtn, padding: "3px 8px", color: "#c00", flexShrink: 0 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Toggle grid to add more products */}
                  <details>
                    <summary style={{ cursor: "pointer", fontSize: 12, color: "#c8a96e", fontWeight: 600, marginBottom: 10, userSelect: "none" }}>
                      + Add / remove products ({products.length} total)
                    </summary>
                    <div style={{ ...ts.occasionProductGrid, marginTop: 10 }}>
                      {products.map(p => {
                        const active = currentIds.includes(p.id);
                        return (
                          <button key={p.id} type="button" onClick={() => toggleOccasionProduct(occ.id, p.id)}
                            style={{ ...ts.occasionProductBtn, ...(active ? ts.occasionProductBtnActive : {}) }}>
                            <div style={ts.occasionProductImg}>
                              {p.images[0] && <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />}
                            </div>
                            <p style={ts.occasionProductName}>{p.title}</p>
                            <p style={ts.occasionProductId}>ID {p.id}</p>
                          </button>
                        );
                      })}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SELLERS ── */}
        {activeTab === "sellers" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h1 style={ts.pageTitle}>Sellers / Makers</h1>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Internal only — not shown on site</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {Object.keys(pendingChanges).length > 0 && (
                  <>
                    <span style={{ fontSize: 12, color: "#c8a96e" }}>{Object.keys(pendingChanges).length} unsaved product change(s)</span>
                    <button style={ts.primaryBtn} onClick={handlePublishAllChanges} disabled={publishing}>
                      {publishing ? "Publishing..." : `Publish All (${Object.keys(pendingChanges).length})`}
                    </button>
                  </>
                )}
                <button style={ts.ghostBtn} onClick={loadSellers} disabled={sellersLoading}>
                  {sellersLoading ? "Loading..." : "↺ Refresh"}
                </button>
                <button style={ts.primaryBtn} onClick={() => setShowAddSeller(s => !s)}>+ Add Seller</button>
              </div>
            </div>

            {/* Seller <-> Catalog Link Audit — recovers links from before the
                linking bug fix, where Supabase's product_ids was updated but
                catalog.js's meta.sellerCode never was. */}
            <div style={{ ...ts.card, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h3 style={ts.cardTitle}>Seller ↔ Catalog Link Audit</h3>
                  <p style={{ ...ts.labelHint, marginTop: 4 }}>Finds products Supabase says are linked to a seller that catalog.js doesn't reflect yet.</p>
                </div>
                <button style={ts.ghostBtn} onClick={runLinkAudit}>🔍 Check for unsynced links</button>
              </div>
              {linkAudit && (
                linkAudit.length === 0 ? (
                  <p style={{ color: "#2a7a2a", marginTop: 12, fontSize: 13 }}>✓ Everything is in sync — no mismatches found.</p>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>{linkAudit.length} mismatch(es) found — review before applying:</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
                      {linkAudit.map((m, i) => (
                        <label key={m.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, background: "#faf7f5", padding: "8px 10px", borderRadius: 6, border: "1px solid #ede0e0" }}>
                          <input type="checkbox" checked={m.checked}
                            onChange={() => setLinkAudit(prev => prev.map((x, j) => j === i ? { ...x, checked: !x.checked } : x))} />
                          <span><strong>{m.productTitle}</strong> (ID {m.productId}) — catalog has "{m.currentSellerCode}", Supabase says it belongs to <strong>{m.sellerCode}</strong> ({m.sellerName})</span>
                        </label>
                      ))}
                    </div>
                    <button style={{ ...ts.primaryBtn, marginTop: 12 }} onClick={applyLinkAudit} disabled={publishing || !linkAudit.some(m => m.checked)}>
                      {publishing ? "Applying..." : `Apply ${linkAudit.filter(m => m.checked).length} change(s) to catalog`}
                    </button>
                  </div>
                )
              )}
            </div>

            {/* Add Seller Form */}
            {showAddSeller && (
              <div style={{ ...ts.card, border: "2px solid #c8a96e", marginBottom: 24 }}>
                <h2 style={ts.cardTitle}>New Seller</h2>
                <div style={ts.grid2}>
                  <div>
                    <label style={ts.label}>Business Name *</label>
                    <input style={ts.input} placeholder="e.g. Bloom & Thread" value={newSeller.business_name}
                      onChange={e => setNewSeller(s => ({ ...s, business_name: e.target.value }))} />
                    <label style={ts.label}>Owner(s)</label>
                    <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                      <input style={{ ...ts.input, flex: 1, marginTop: 0 }} placeholder="Add owner name"
                        value={newOwnerInput} onChange={e => setNewOwnerInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = newOwnerInput.trim(); if (v) { setNewSeller(s => ({ ...s, owners: [...s.owners, v] })); setNewOwnerInput(""); } } }} />
                      <button type="button" style={{ ...ts.primaryBtn, padding: "9px 14px" }}
                        onClick={() => { const v = newOwnerInput.trim(); if (v) { setNewSeller(s => ({ ...s, owners: [...s.owners, v] })); setNewOwnerInput(""); } }}>+</button>
                    </div>
                    {newSeller.owners.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                        {newSeller.owners.map((o, i) => (
                          <span key={i} style={ts.colorChip}>{o}
                            <button type="button" onClick={() => setNewSeller(s => ({ ...s, owners: s.owners.filter((_,j)=>j!==i) }))} style={ts.colorChipX}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <label style={ts.label}>Location (City)</label>
                    <input style={ts.input} placeholder="e.g. Mumbai, Maharashtra" value={newSeller.location}
                      onChange={e => setNewSeller(s => ({ ...s, location: e.target.value }))} />
                    <label style={ts.label}>Full Address</label>
                    <textarea style={{ ...ts.input, height: 60, resize: "vertical" }} placeholder="Street, Area, City"
                      value={newSeller.address || ''} onChange={e => setNewSeller(s => ({ ...s, address: e.target.value }))} />
                    <label style={ts.label}>Pincode <span style={ts.labelHint}>(for delivery estimation)</span></label>
                    <input style={ts.input} placeholder="e.g. 400001" maxLength={6}
                      value={newSeller.pincode} onChange={e => setNewSeller(s => ({ ...s, pincode: e.target.value.replace(/\D/g, '') }))} />
                    <label style={ts.label}>Mobile Number</label>
                    <input style={ts.input} placeholder="e.g. 9876543210" value={newSeller.phone}
                      onChange={e => setNewSeller(s => ({ ...s, phone: e.target.value }))} />
                    <label style={ts.label}>Email ID</label>
                    <input style={ts.input} type="email" placeholder="e.g. seller@example.com" value={newSeller.email}
                      onChange={e => setNewSeller(s => ({ ...s, email: e.target.value }))} />
                    <label style={ts.label}>GST Registered?</label>
                    <div style={{ display: "flex", gap: 12, margin: "4px 0 8px" }}>
                      {["Yes", "No"].map(opt => (
                        <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                          <input type="radio" name="new_gst" value={opt} checked={newSeller.gst_registered === (opt === "Yes")}
                            onChange={() => setNewSeller(s => ({ ...s, gst_registered: opt === "Yes", gst_number: opt === "No" ? "" : s.gst_number }))} />
                          {opt}
                        </label>
                      ))}
                    </div>
                    {newSeller.gst_registered && (
                      <>
                        <label style={ts.label}>GST Number</label>
                        <input style={ts.input} placeholder="e.g. 27AAAAA0000A1Z5" value={newSeller.gst_number}
                          onChange={e => setNewSeller(s => ({ ...s, gst_number: e.target.value.toUpperCase() }))} />
                      </>
                    )}
                    <label style={ts.label}>HSN Codes <span style={ts.labelHint}>(comma-separated)</span></label>
                    <input style={ts.input} placeholder="e.g. 6702, 9405"
                      value={(newSeller.hsn_codes || []).join(", ")}
                      onChange={e => setNewSeller(s => ({ ...s, hsn_codes: e.target.value.split(",").map(h => h.trim()).filter(Boolean) }))} />
                    <label style={ts.label}>Delivery Handled By</label>
                    <div style={{ display: "flex", gap: 12, margin: "4px 0 8px" }}>
                      {[["seller", "Seller ships"], ["maqers", "Maqers ships"]].map(([val, label]) => (
                        <label key={val} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                          <input type="radio" name="new_delivery" value={val} checked={newSeller.delivery_handled_by === val}
                            onChange={() => setNewSeller(s => ({ ...s, delivery_handled_by: val }))} />
                          {label}
                        </label>
                      ))}
                    </div>
                    <label style={ts.label}>Commission % <span style={ts.labelHint}>(Maqers fee on each order)</span></label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <input style={{ ...ts.input, width: 100, marginTop: 0 }} type="number" min="0" max="100" step="0.5"
                        value={newSeller.commission_pct}
                        onChange={e => setNewSeller(s => ({ ...s, commission_pct: e.target.value }))} />
                      <span style={{ fontSize: 13, color: "#888" }}>%</span>
                    </div>
                    <label style={ts.label}>Internal Notes</label>
                    <textarea style={{ ...ts.input, height: 80, resize: "vertical" }} placeholder="Any notes..."
                      value={newSeller.notes} onChange={e => setNewSeller(s => ({ ...s, notes: e.target.value }))} />
                  </div>
                  <div>
                    <label style={ts.label}>KYC Documents</label>
                    <div style={ts.editDropzone} onClick={() => kycInputRef.current?.click()}>
                      <input ref={kycInputRef} type="file" accept="image/*,.pdf" multiple style={{ display: "none" }}
                        onChange={e => setKycFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                      <span style={{ fontSize: 12, color: "#aaa" }}>+ Upload ID / KYC documents</span>
                    </div>
                    <p style={ts.fieldHint}>Stored privately in Supabase — not publicly accessible.</p>
                    {kycFiles.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {kycFiles.map((f, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", background: "#f9f7f4", borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
                            <span style={{ color: "#555" }}>📄 {f.name}</span>
                            <button type="button" onClick={() => setKycFiles(prev => prev.filter((_,j)=>j!==i))} style={ts.colorChipX}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button style={ts.ghostBtn} onClick={() => { setShowAddSeller(false); setNewSeller({ business_name: "", owners: [], location: "", notes: "" }); setKycFiles([]); }}>Cancel</button>
                  <button style={ts.primaryBtn} onClick={handleCreateSeller} disabled={publishing || kycUploading}>
                    {kycUploading ? "Uploading docs..." : publishing ? "Creating..." : "Create Seller"}
                  </button>
                </div>
              </div>
            )}

            {/* Seller Detail View — internal-only, full business info + product
                grid with IDs, no cart/wishlist. Distinct from the public
                /maker/:sellerCode storefront (SellerStorefront.jsx), which is
                shoppable and shows no business info at all.
                Wrapped + ref'd so View/Edit (clicked from anywhere in a long
                seller grid) scrolls the panel into view instead of leaving
                the admin to scroll all the way up to find it. */}
            <div ref={sellerPanelRef}>
            {viewingSeller && (() => {
              const catalogProducts = products.filter(p => p.sellerCode === viewingSeller.seller_code);
              const rawDetailProducts = catalogProducts.length > 0
                ? catalogProducts
                : products.filter(p => (viewingSeller.product_ids || []).includes(p.id));
              const detailProducts = rawDetailProducts.map(p => pendingChanges[p.id] ? { ...p, ...pendingChanges[p.id] } : p);
              return (
                <div style={{ ...ts.card, border: "2px solid #c8a96e", marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <h2 style={ts.cardTitle}>{viewingSeller.business_name}</h2>
                      <span style={{ fontSize: 12, color: "#c8a96e", fontWeight: 700, fontFamily: "monospace" }}>{viewingSeller.seller_code}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {viewingSeller.seller_code && (
                        <a href={`/maker/${viewingSeller.seller_code}`} target="_blank" rel="noreferrer" style={{ ...ts.ghostBtn, textDecoration: "none" }}>↗ Public storefront</a>
                      )}
                      <button style={ts.ghostBtn} onClick={() => setViewingSeller(null)}>✕ Close</button>
                    </div>
                  </div>

                  <div style={{ ...ts.grid2, marginTop: 16 }}>
                    <div>
                      <label style={ts.label}>Owner(s)</label>
                      <p style={{ margin: "2px 0 0", fontSize: 14 }}>{(viewingSeller.owners || []).length > 0 ? viewingSeller.owners.join(", ") : "—"}</p>
                    </div>
                    <div>
                      <label style={ts.label}>City</label>
                      <p style={{ margin: "2px 0 0", fontSize: 14 }}>{viewingSeller.location || "—"}</p>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={ts.label}>Address</label>
                      <p style={{ margin: "2px 0 0", fontSize: 14 }}>{viewingSeller.address || "—"}</p>
                    </div>
                    <div>
                      <label style={ts.label}>Pincode</label>
                      <p style={{ margin: "2px 0 0", fontSize: 14 }}>{viewingSeller.pincode || "—"}</p>
                    </div>
                    <div>
                      <label style={ts.label}>GST</label>
                      <p style={{ margin: "2px 0 0", fontSize: 14 }}>{viewingSeller.gst_registered ? (viewingSeller.gst_number || "Registered") : "Not registered"}</p>
                    </div>
                    {(viewingSeller.hsn_codes || []).length > 0 && (
                      <div>
                        <label style={ts.label}>HSN Codes</label>
                        <p style={{ margin: "2px 0 0", fontSize: 14 }}>{viewingSeller.hsn_codes.join(", ")}</p>
                      </div>
                    )}
                    <div>
                      <label style={ts.label}>Delivery / Commission</label>
                      <p style={{ margin: "2px 0 0", fontSize: 14 }}>{viewingSeller.delivery_handled_by === "maqers" ? "Maqers ships" : "Seller ships"} · {viewingSeller.commission_pct ?? 10}%</p>
                    </div>
                    {viewingSeller.notes && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={ts.label}>Notes</label>
                        <p style={{ margin: "2px 0 0", fontSize: 14, fontStyle: "italic", color: "#888" }}>{viewingSeller.notes}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
                    <h3 style={{ ...ts.cardTitle, marginBottom: 12 }}>Products <span style={{ fontWeight: 400, color: "#888" }}>({detailProducts.length})</span></h3>
                    {detailProducts.length === 0 ? (
                      <p style={{ color: "#aaa", fontSize: 13 }}>No products linked yet.</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                        {detailProducts.map(p => (
                          <div key={p.id} style={{ border: pendingChanges[p.id] ? "1px solid #c8a96e" : "1px solid #eee", borderRadius: 8, overflow: "hidden", background: pendingChanges[p.id] ? "#fffbf3" : "#fff" }}>
                            <div style={{ width: "100%", aspectRatio: "1", background: "#f5f3f0" }}>
                              <img src={p.images?.[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
                            </div>
                            <div style={{ padding: "8px 10px" }}>
                              <p style={{ margin: "0 0 2px", fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 }}>{p.categoryId}</p>
                              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{p.title}</p>
                              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#760909" }}>₹{Number(p.price).toLocaleString("en-IN")}</p>
                              <p style={{ margin: "0 0 6px", fontSize: 10, color: "#bbb", fontFamily: "monospace" }}>ID {p.id}{pendingChanges[p.id] ? " · unsaved" : ""}</p>
                              <button type="button" style={{ ...ts.editBtn, width: "100%" }}
                                onClick={() => {
                                  setProductFilter(String(p.id));
                                  setProductFilterCat("all");
                                  setEditingProduct({ ...p });
                                  setActiveTab("products");
                                }}>Edit</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Edit Seller Form */}
            {editingSeller && (
              <div style={{ ...ts.card, border: "2px solid #c8a96e", marginBottom: 24 }}>
                <h2 style={ts.cardTitle}>Edit: {editingSeller.business_name}</h2>
                <label style={ts.label}>Seller URL <span style={ts.labelHint}>(share this on their story/QR code)</span></label>
                {editingSeller.seller_code ? (
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <input readOnly style={{ ...ts.input, flex: 1, marginTop: 0, background: "#faf7f5", color: "#888" }}
                      value={`${window.location.origin}/maker/${editingSeller.seller_code}`}
                      onFocus={e => e.target.select()} />
                    <button type="button" style={{ ...ts.ghostBtn, flexShrink: 0 }}
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/maker/${editingSeller.seller_code}`);
                        showToast("Seller URL copied!");
                      }}>Copy</button>
                    <a href={`/maker/${editingSeller.seller_code}`} target="_blank" rel="noreferrer" style={{ ...ts.ghostBtn, flexShrink: 0, textDecoration: "none", display: "flex", alignItems: "center" }}>↗ View</a>
                  </div>
                ) : (
                  <p style={{ ...ts.labelHint, marginBottom: 16 }}>Set a seller code below to generate their storefront link.</p>
                )}
                <div style={ts.grid2}>
                  <div>
                    <label style={ts.label}>Business Name</label>
                    <input style={ts.input} value={editingSeller.business_name}
                      onChange={e => setEditingSeller(s => ({ ...s, business_name: e.target.value }))} />
                    <label style={ts.label}>Owner(s)</label>
                    <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                      <input style={{ ...ts.input, flex: 1, marginTop: 0 }} placeholder="Add owner"
                        id="editOwnerInput"
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = e.target.value.trim(); if (v) { setEditingSeller(s => ({ ...s, owners: [...(s.owners||[]), v] })); e.target.value = ""; } } }} />
                      <button type="button" style={{ ...ts.primaryBtn, padding: "9px 14px" }}
                        onClick={() => { const inp = document.getElementById("editOwnerInput"); const v = inp.value.trim(); if (v) { setEditingSeller(s => ({ ...s, owners: [...(s.owners||[]), v] })); inp.value = ""; } }}>+</button>
                    </div>
                    {(editingSeller.owners||[]).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                        {editingSeller.owners.map((o, i) => (
                          <span key={i} style={ts.colorChip}>{o}
                            <button type="button" onClick={() => setEditingSeller(s => ({ ...s, owners: s.owners.filter((_,j)=>j!==i) }))} style={ts.colorChipX}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <label style={ts.label}>Location (City)</label>
                    <input style={ts.input} value={editingSeller.location || ""}
                      onChange={e => setEditingSeller(s => ({ ...s, location: e.target.value }))} />
                    <label style={ts.label}>Full Address</label>
                    <textarea style={{ ...ts.input, height: 60, resize: "vertical" }} placeholder="Street, Area, City"
                      value={editingSeller.address || ""}
                      onChange={e => setEditingSeller(s => ({ ...s, address: e.target.value }))} />
                    <label style={ts.label}>Pincode <span style={ts.labelHint}>(for delivery estimation)</span></label>
                    <input style={ts.input} placeholder="e.g. 400001" maxLength={6}
                      value={editingSeller.pincode || ""}
                      onChange={e => setEditingSeller(s => ({ ...s, pincode: e.target.value.replace(/\D/g, '') }))} />
                    <label style={ts.label}>Mobile Number</label>
                    <input style={ts.input} placeholder="e.g. 9876543210" value={editingSeller.phone || ""}
                      onChange={e => setEditingSeller(s => ({ ...s, phone: e.target.value }))} />
                    <label style={ts.label}>Email ID</label>
                    <input style={ts.input} type="email" placeholder="e.g. seller@example.com" value={editingSeller.email || ""}
                      onChange={e => setEditingSeller(s => ({ ...s, email: e.target.value }))} />
                    <label style={ts.label}>GST Registered?</label>
                    <div style={{ display: "flex", gap: 12, margin: "4px 0 8px" }}>
                      {["Yes", "No"].map(opt => (
                        <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                          <input type="radio" name="edit_gst" value={opt} checked={(editingSeller.gst_registered === true ? "Yes" : "No") === opt}
                            onChange={() => setEditingSeller(s => ({ ...s, gst_registered: opt === "Yes", gst_number: opt === "No" ? "" : s.gst_number }))} />
                          {opt}
                        </label>
                      ))}
                    </div>
                    {editingSeller.gst_registered && (
                      <>
                        <label style={ts.label}>GST Number</label>
                        <input style={ts.input} placeholder="e.g. 27AAAAA0000A1Z5" value={editingSeller.gst_number || ""}
                          onChange={e => setEditingSeller(s => ({ ...s, gst_number: e.target.value.toUpperCase() }))} />
                      </>
                    )}
                    <label style={ts.label}>HSN Codes <span style={ts.labelHint}>(comma-separated)</span></label>
                    <input style={ts.input} placeholder="e.g. 6702, 9405"
                      value={(editingSeller.hsn_codes || []).join(", ")}
                      onChange={e => setEditingSeller(s => ({ ...s, hsn_codes: e.target.value.split(",").map(h => h.trim()).filter(Boolean) }))} />
                    <label style={ts.label}>Delivery Handled By</label>
                    <div style={{ display: "flex", gap: 12, margin: "4px 0 8px" }}>
                      {[["seller", "Seller ships"], ["maqers", "Maqers ships"]].map(([val, label]) => (
                        <label key={val} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                          <input type="radio" name="edit_delivery" value={val} checked={(editingSeller.delivery_handled_by || "seller") === val}
                            onChange={() => setEditingSeller(s => ({ ...s, delivery_handled_by: val }))} />
                          {label}
                        </label>
                      ))}
                    </div>
                    <label style={ts.label}>Commission % <span style={ts.labelHint}>(Maqers fee on each order)</span></label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <input style={{ ...ts.input, width: 100, marginTop: 0 }} type="number" min="0" max="100" step="0.5"
                        value={editingSeller.commission_pct ?? 10}
                        onChange={e => setEditingSeller(s => ({ ...s, commission_pct: e.target.value }))} />
                      <span style={{ fontSize: 13, color: "#888" }}>%</span>
                    </div>
                    <label style={ts.label}>Internal Notes</label>
                    <textarea style={{ ...ts.input, height: 80, resize: "vertical" }} value={editingSeller.notes || ""}
                      onChange={e => setEditingSeller(s => ({ ...s, notes: e.target.value }))} />
                  </div>
                  <div>
                    <label style={ts.label}>KYC Documents</label>
                    {(editingSeller.kyc_documents||[]).length > 0 ? (
                      <div style={{ marginBottom: 10 }}>
                        {editingSeller.kyc_documents.map((path, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#f9f7f4", borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
                            <button type="button" onClick={() => openKYCDoc(path)} style={{ background: "none", border: "none", color: "#c8a96e", cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "Georgia, serif" }}>
                              📄 View document {i + 1}
                            </button>
                            <button type="button" onClick={() => handleDeleteKYC(editingSeller, path)} style={ts.colorChipX}>×</button>
                          </div>
                        ))}
                      </div>
                    ) : <p style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>No documents uploaded.</p>}
                    <div style={ts.editDropzone} onClick={() => kycInputRef.current?.click()}>
                      <input ref={kycInputRef} type="file" accept="image/*,.pdf" multiple style={{ display: "none" }}
                        onChange={e => setKycFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                      <span style={{ fontSize: 12, color: "#aaa" }}>+ Upload more documents</span>
                    </div>
                    {kycFiles.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {kycFiles.map((f, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", background: "#f9f7f4", borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
                            <span style={{ color: "#555" }}>📄 {f.name}</span>
                            <button type="button" onClick={() => setKycFiles(prev => prev.filter((_,j)=>j!==i))} style={ts.colorChipX}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Linked Products */}
                <div style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
                  <h3 style={{ ...ts.cardTitle, marginBottom: 12 }}>Linked Products ({(editingSeller.product_ids||[]).length})</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                    {products.map(p => {
                      const linked = (editingSeller.product_ids||[]).includes(p.id);
                      return (
                        <button key={p.id} type="button"
                          onClick={() => handleLinkProductToSeller(editingSeller.id, p.id).then(() => setEditingSeller(s => ({ ...s, product_ids: linked ? s.product_ids.filter(id=>id!==p.id) : [...(s.product_ids||[]), p.id] })))}
                          style={{ ...linked ? ts.chipActive : ts.chip, fontSize: 11 }}>
                          {linked ? "✓ " : ""}{p.title} (ID {p.id})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "space-between" }}>
                  <button style={{ ...ts.ghostBtn, color: "#c00", borderColor: "#e8b8b8" }} onClick={() => handleDeleteSeller(editingSeller)} disabled={publishing}>
                    Delete Seller
                  </button>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button style={ts.ghostBtn} onClick={() => { setEditingSeller(null); setKycFiles([]); }}>Cancel</button>
                    <button style={ts.primaryBtn} onClick={handleUpdateSeller} disabled={publishing || kycUploading}>
                      {kycUploading ? "Uploading..." : publishing ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* Sellers List */}
            {sellersLoading ? (
              <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Loading sellers...</div>
            ) : sellers.length === 0 ? (
              <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>No sellers yet. Add your first one above.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {sellers.map(seller => {
                  const sellerProducts = products.filter(p => (seller.product_ids||[]).includes(p.id));
                  // The live site (storefront page + "more from this maker") reads
                  // meta.sellerCode from catalog.js, not this Supabase record's
                  // product_ids — the two can drift apart. Surface that gap here.
                  const catalogLinkedCount = products.filter(p => p.sellerCode === seller.seller_code).length;
                  return (
                    <div key={seller.id} style={ts.catCard}>
                      <div style={ts.catCardTop}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#c8a96e", fontFamily: "monospace" }}>{seller.seller_code || seller.id}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={ts.editBtn} onClick={() => setViewingSeller(seller)}>View</button>
                          <button style={ts.editBtn} onClick={() => { setEditingSeller({ ...seller }); setKycFiles([]); }}>Edit</button>
                          <button style={{ ...ts.editBtn, color: "#c00", borderColor: "#e8b8b8" }} onClick={() => handleDeleteSeller(seller)}>Delete</button>
                        </div>
                      </div>
                      <div style={ts.catCardName}>{seller.business_name}</div>
                      {seller.location && <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>📍 {seller.location}</div>}
                      {seller.phone && <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>📞 {seller.phone}</div>}
                      {(seller.owners||[]).length > 0 && (
                        <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                          👤 {seller.owners.join(", ")}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={ts.flag}>{(seller.product_ids||[]).length} products</span>
                        {catalogLinkedCount === 0
                          ? <span style={{ ...ts.flag, background: "#feeeed", color: "#c00" }} title="No catalog products have this seller_code — their storefront link will be empty">⚠ 0 in catalog</span>
                          : <span style={{ ...ts.flag, background: "#e8f5e8", color: "#2a7a2a" }}>{catalogLinkedCount} in catalog</span>
                        }
                        <span style={{ ...ts.flag, background: "#f0f0f0", color: "#888" }}>
                          {(seller.kyc_documents||[]).length} doc(s)
                        </span>
                        {seller.gst_registered
                          ? <span style={{ ...ts.flag, background: "#e8f5e8", color: "#2a7a2a" }}>GST ✓</span>
                          : <span style={{ ...ts.flag, background: "#feeeed", color: "#c00" }}>No GST</span>
                        }
                      </div>
                      {seller.gst_number && <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>GST: {seller.gst_number}</div>}
                      {(seller.hsn_codes||[]).length > 0 && <div style={{ fontSize: 11, color: "#888" }}>HSN: {seller.hsn_codes.join(", ")}</div>}
                      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                        🚚 {seller.delivery_handled_by === "maqers" ? "Maqers ships" : "Seller ships"} &nbsp;·&nbsp; Commission: {seller.commission_pct ?? 10}%
                      </div>
                      {sellerProducts.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 11, color: "#999", lineHeight: 1.5 }}>
                          {sellerProducts.slice(0, 3).map(p => p.title).join(" · ")}
                          {sellerProducts.length > 3 && ` +${sellerProducts.length - 3} more`}
                        </div>
                      )}
                      {seller.notes && <div style={{ marginTop: 8, fontSize: 11, color: "#bbb", fontStyle: "italic" }}>{seller.notes}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ts = {
  shell: { display: "flex", minHeight: "100vh", background: "#f5f3f0", fontFamily: "Georgia, serif" },
  sidebar: { width: 220, background: "#111110", display: "flex", flexDirection: "column", padding: "28px 16px", position: "sticky", top: 0, height: "100vh", flexShrink: 0 },
  main: { flex: 1, padding: "36px 40px", overflowY: "auto" },
  sidebarLogo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 36, paddingBottom: 20, borderBottom: "1px solid #222" },
  logoM: { fontSize: 26, fontWeight: 700, color: "#c8a96e" },
  logoText: { fontSize: 14, color: "#e8e4dc", fontWeight: 600 },
  logoSub: { fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1.5 },
  nav: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
  navBtn: { display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", color: "#888", fontSize: 13, padding: "10px 12px", borderRadius: 8, cursor: "pointer", textAlign: "left", width: "100%" },
  navBtnActive: { background: "rgba(200,169,110,0.12)", color: "#c8a96e" },
  navIcon: { fontSize: 16, width: 20, textAlign: "center" },
  sidebarBottom: { borderTop: "1px solid #222", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 },
  refreshBtn: { background: "none", border: "1px solid #333", color: "#888", borderRadius: 6, padding: "7px 10px", cursor: "pointer", fontSize: 11 },
  repoBadge: { fontSize: 10, color: "#444", wordBreak: "break-all" },
  logoutBtn: { background: "none", border: "none", color: "#555", fontSize: 11, cursor: "pointer", textAlign: "left", padding: 0 },
  loginShell: { minHeight: "100vh", background: "#f5f3f0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" },
  loginCard: { background: "#fff", borderRadius: 16, padding: 40, width: 480, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #eee" },
  loginLogo: { display: "flex", alignItems: "center", gap: 14, marginBottom: 32 },
  loginLogoM: { fontSize: 36, fontWeight: 700, color: "#c8a96e" },
  loginLogoText: { fontSize: 18, fontWeight: 700, color: "#1a1a18" },
  loginLogoSub: { fontSize: 11, color: "#999", marginTop: 2 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "#1a1a18", margin: "0 0 24px", fontFamily: "Georgia, serif" },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: "#888", margin: "28px 0 12px", textTransform: "uppercase", letterSpacing: 0.5 },
  cardTitle: { fontSize: 15, fontWeight: 600, color: "#222", marginTop: 0, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginTop: 12, marginBottom: 4 },
  req: { color: "#c8a96e" },
  hint: { fontSize: 12, color: "#888", marginTop: 16, lineHeight: 1.6 },
  fieldHint: { fontSize: 11, color: "#bbb", margin: "3px 0 0", fontStyle: "italic" },
  errorText: { color: "#c00", fontSize: 12, marginTop: 6, padding: "8px 12px", background: "#fff0f0", borderRadius: 6 },
  input: { width: "100%", padding: "9px 11px", border: "1px solid #ddd", borderRadius: 7, fontSize: 13, color: "#222", background: "#fafaf9", outline: "none", boxSizing: "border-box", fontFamily: "Georgia, serif", marginTop: 2 },
  descToolbar: { display: "flex", gap: 4, marginTop: 2, border: "1px solid #ddd", borderBottom: "none", borderTopLeftRadius: 7, borderTopRightRadius: 7, background: "#f3f1ee", padding: 4 },
  descToolbarBtn: { padding: "4px 10px", fontSize: 12, border: "1px solid #ddd", borderRadius: 5, background: "#fff", color: "#444", cursor: "pointer" },
  primaryBtn: { background: "#1a1a18", color: "#c8a96e", border: "none", borderRadius: 8, padding: "11px 22px", fontSize: 13, cursor: "pointer", fontFamily: "Georgia, serif", fontWeight: 600 },
  ghostBtn: { background: "none", color: "#444", border: "1px solid #ddd", borderRadius: 8, padding: "11px 22px", fontSize: 13, cursor: "pointer", fontFamily: "Georgia, serif" },
  editBtn: { background: "#f5f0e8", color: "#a07840", border: "1px solid #e8d9b8", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "Georgia, serif" },
  card: { background: "#fff", borderRadius: 12, padding: 24, marginBottom: 20, border: "1px solid #eee", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" },
  chipGrid: { display: "flex", flexWrap: "wrap", gap: 7 },
  chip: { padding: "5px 11px", border: "1px solid #e0dbd2", borderRadius: 20, fontSize: 11, background: "#fafaf9", color: "#666", cursor: "pointer" },
  chipActive: { padding: "5px 11px", border: "1px solid #c8a96e", borderRadius: 20, fontSize: 11, background: "#fdf8f0", color: "#a07840", cursor: "pointer", fontWeight: 600 },
  editDropzone: { border: "1px dashed #d9d4cc", borderRadius: 8, padding: "10px 14px", textAlign: "center", cursor: "pointer", background: "#fafaf9" },
  dropzoneActive: { border: "2px dashed #c8a96e", background: "#fdf8f0" },
  dropzoneIcon: { fontSize: 24, color: "#ccc", marginBottom: 6 },
  dropzoneText: { fontSize: 13, color: "#666", margin: 0 },
  dropzoneHint: { fontSize: 11, color: "#bbb", margin: "3px 0 0" },
  thumbGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 },
  thumb: { position: "relative", borderRadius: 7, overflow: "hidden", border: "1px solid #eee" },
  thumbImg: { width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" },
  primaryBadge: { position: "absolute", top: 3, left: 3, background: "#c8a96e", color: "#fff", fontSize: 8, padding: "2px 4px", borderRadius: 3, fontWeight: 700, textTransform: "uppercase" },
  removeBtn: { position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 13, lineHeight: "18px", textAlign: "center", padding: 0 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginBottom: 28 },
  statCard: { background: "#fff", borderRadius: 10, padding: "18px 16px", border: "1px solid #eee", textAlign: "center" },
  statValue: { fontSize: 28, fontWeight: 700, fontFamily: "Georgia, serif" },
  statLabel: { fontSize: 10, color: "#888", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  catBreakdown: { background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #eee" },
  catBreakdownRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 },
  catBreakdownName: { fontSize: 12, color: "#555", width: 160, flexShrink: 0 },
  catBreakdownBar: { flex: 1, height: 6, background: "#f0ede8", borderRadius: 3, overflow: "hidden" },
  catBreakdownFill: { height: "100%", background: "#c8a96e", borderRadius: 3 },
  catBreakdownCount: { fontSize: 12, color: "#888", width: 24, textAlign: "right" },
  productTable: { background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" },
  productTableHeader: { display: "flex", padding: "12px 16px", background: "#f9f7f4", borderBottom: "1px solid #eee", fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  productTableRow: { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f0ede8" },
  rowThumb: { width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: "1px solid #eee", flexShrink: 0 },
  flagToggle: { border: "none", borderRadius: 5, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 },
  flag: { display: "inline-block", fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "#f0ede8", color: "#888", fontWeight: 600 },
  productCard: { border: "1px solid #eee", borderRadius: 10, overflow: "hidden", maxWidth: 200 },
  productCardImg: { width: "100%", aspectRatio: "1", background: "#f5f3f0", overflow: "hidden" },
  productCardBody: { padding: 12 },
  productCardCat: { fontSize: 10, color: "#aaa", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 },
  productCardTitle: { fontSize: 13, fontWeight: 600, color: "#222", margin: "0 0 4px" },
  productCardPrice: { fontSize: 14, fontWeight: 700, color: "#c8a96e", margin: "0 0 8px" },
  previewGrid: { display: "grid", gridTemplateColumns: "220px 1fr", gap: 28 },
  previewImg: { width: "100%", borderRadius: 10, objectFit: "cover", aspectRatio: "1", border: "1px solid #eee" },
  previewThumb: { width: 50, height: 50, borderRadius: 6, objectFit: "cover", border: "1px solid #eee" },
  previewLabel: { fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 },
  previewValue: { fontSize: 13, color: "#222", margin: "2px 0 0" },
  logBox: { background: "#111", borderRadius: 8, padding: 16, maxHeight: 200, overflowY: "auto", marginTop: 16 },
  logLine: { color: "#7ec87e", fontSize: 11, fontFamily: "monospace", margin: "2px 0" },
  catGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 },
  catCard: { background: "#fff", borderRadius: 10, padding: 18, border: "1px solid #eee" },
  catCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  catCardOrder: { fontSize: 11, color: "#bbb", fontWeight: 600 },
  catCardName: { fontSize: 15, fontWeight: 700, color: "#1a1a18", marginBottom: 4 },
  catCardDesc: { fontSize: 12, color: "#888", marginBottom: 10, lineHeight: 1.4 },
  occasionProductGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  occasionProductBtn: { border: "1px solid #e0dbd2", borderRadius: 8, padding: 8, background: "#fafaf9", cursor: "pointer", width: 90, textAlign: "center" },
  occasionProductBtnActive: { border: "1px solid #c8a96e", background: "#fdf8f0" },
  occasionProductImg: { width: "100%", aspectRatio: "1", background: "#f0ede8", borderRadius: 5, overflow: "hidden", marginBottom: 4 },
  occasionProductName: { fontSize: 9, color: "#555", margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  occasionProductId: { fontSize: 9, color: "#bbb", margin: "2px 0 0" },
  toast: { position: "fixed", top: 20, right: 20, color: "#fff", padding: "12px 20px", borderRadius: 8, fontSize: 13, fontFamily: "Georgia, serif", zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", fontWeight: 600 },
  colorChip: { display: "inline-flex", alignItems: "center", gap: 5, background: "#f0ede8", border: "1px solid #e0d8cc", borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#444" },
  colorChipX: { background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 14, padding: 0, lineHeight: 1, fontFamily: "Georgia, serif" },
  labelHint: { fontWeight: 400, color: "#aaa", textTransform: "none", letterSpacing: 0 },
};