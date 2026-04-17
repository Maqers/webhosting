/**
 * MAQERS ADMIN PORTAL v2.1
 * Key changes from v2:
 *   1. sanitizeForJS() — strips newlines/tabs before writing to catalog.js
 *      This prevents "Unterminated string constant" Vercel build errors
 *   2. Keywords field added to Add Product + Edit Product forms
 * Drop into src/pages/AdminPortal.jsx
 */

import { useState, useCallback, useRef, useEffect } from "react";

const OCCASION_CATEGORIES = [
  { id: "for-your-best-friend", name: "For Your Best Friend" },
  { id: "for-your-partner", name: "For Your Partner" },
  { id: "situationship", name: "Situationship" },
  { id: "self-love-kits", name: "Self Love Kits" },
  { id: "breakup-hampers", name: "Breakup Hampers" },
  { id: "late-night-cravings", name: "Late Night Cravings" },
  { id: "the-main-character", name: "The Main Character" },
  { id: "for-your-work-friend", name: "For Your Work Friend" },
  { id: "for-your-mom", name: "For Your Mom" },
  { id: "for-your-dad", name: "For Your Dad" },
  { id: "for-your-sibling", name: "For Your Sibling" },
  { id: "the-host-gift", name: "The Host Gift" },
  { id: "occasion-gifts", name: "Occasion Gifts" },
  { id: "shaadi-fever", name: "Shaadi Fever"},
];

const ICON_OPTIONS = ["home","gift","fashion","jewelry","kitchen","art","wedding","hampers","soaps","decor"];

// ─── GitHub API ───────────────────────────────────────────────────────────────

async function ghGet(path, creds) {
  const res = await fetch(
    `https://api.github.com/repos/${creds.owner}/${creds.repo}/contents/${path}?ref=${creds.branch}&t=${Date.now()}`,
    { headers: { Authorization: `Bearer ${creds.token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`GitHub GET failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function ghPut(path, content, message, sha, creds) {
  const res = await fetch(
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

async function fetchCatalog(creds) {
  const file = await ghGet("src/data/catalog.js", creds);
  const source = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
  return { source, sha: file.sha };
}

async function commitCatalog(source, sha, message, creds) {
  const encoded = btoa(unescape(encodeURIComponent(source)));
  return ghPut("src/data/catalog.js", encoded, message, sha, creds);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * sanitizeForJS — THE KEY FIX
 * Strips newlines, tabs, and escapes quotes/backslashes before writing
 * any user-entered text into a JS single-line string literal in catalog.js.
 * Without this, pasted multi-line descriptions break the JS syntax
 * and cause Vercel build to fail with "Unterminated string constant".
 */
function sanitizeForJS(str) {
  return (str || "")
    .replace(/\r?\n|\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\s{2,}/g, " ")
    .trim();
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
      description: m[5].replace(/\\"/g, '"'),
      price: parseInt(m[6]),
      images: m[7].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean),
      popular: m[8] === "true", featured: m[9] === "true", inStock: m[10] === "true",
      tags: m[11].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean),
      keywords: [],
    });
  }
  // Parse keywords separately
  const kwRegex = /id:\s*(\d+)[\s\S]*?meta:\s*\{\s*keywords:\s*\[([^\]]*)\]/g;
  let km;
  while ((km = kwRegex.exec(source)) !== null) {
    const id = parseInt(km[1]);
    const kws = km[2].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
    const p = products.find(p => p.id === id);
    if (p) p.keywords = kws;
  }
  // Parse colors
  const colRegex = /id:\s*(\d+)[\s\S]*?meta:\s*\{[^}]*colors:\s*\[([^\]]*)\]/g;
  let cl;
  while ((cl = colRegex.exec(source)) !== null) {
    const id = parseInt(cl[1]);
    const cols = cl[2].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
    const p = products.find(p => p.id === id);
    if (p) p.colors = cols;
  }
  // Parse moq
  const moqRegex = /id:\s*(\d+)[\s\S]*?meta:\s*\{[^}]*moq:\s*(\d+)/g;
  let mq;
  while ((mq = moqRegex.exec(source)) !== null) {
    const id = parseInt(mq[1]);
    const p = products.find(p => p.id === id);
    if (p) p.moq = parseInt(mq[2]) || 0;
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
  const regex = /'([^']+)':\s*\[([^\]]*)\]/g;
  let m;
  while ((m = regex.exec(source)) !== null) {
    if (OCCASION_CATEGORIES.find(o => o.id === m[1])) {
      map[m[1]] = m[2].split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }
  }
  return map;
}

// ─── Catalog Writers ──────────────────────────────────────────────────────────

function updateProductInSource(source, product) {
  const slug = slugify(product.title);
  const imagesArr = product.images.map(img => `"${img}"`).join(", ");
  const tagsArr = product.tags.map(t => `"${sanitizeForJS(t)}"`).join(", ");
  const kwArr = (product.keywords || []).map(k => `"${sanitizeForJS(k)}"`).join(", ");
  const desc = sanitizeForJS(product.description);
  const title = sanitizeForJS(product.title);
  const id = product.id;
  let u = source;
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?categoryId:\\s*)"[^"]*"`), `$1"${product.categoryId}"`);
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?title:\\s*)"[^"]*"`), `$1"${title}"`);
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?slug:\\s*)"[^"]*"`), `$1"${slug}"`);
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?description:\\s*)"(?:[^"\\\\]|\\\\.)*"`), `$1"${desc}"`);
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?price:\\s*)\\d+`), `$1${product.price}`);
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?images:\\s*\\[)[^\\]]*(\\])`), `$1${imagesArr}$2`);
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?popular:\\s*)(true|false)`), `$1${product.popular}`);
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?featured:\\s*)(true|false)`), `$1${product.featured}`);
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?inStock:\\s*)(true|false)`), `$1${product.inStock}`);
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?tags:\\s*\\[)[^\\]]*(\\])`), `$1${tagsArr}$2`);
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?meta:\\s*\\{\\s*keywords:\\s*\\[)[^\\]]*(\\])`), `$1${kwArr}$2`);
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?meta:\\s*\\{[^}]*colors:\\s*\\[)[^\\]]*(\\])`), `$1${(product.colors||[]).map(c=>`"${sanitizeForJS(c)}"`).join(", ")}$2`);
  u = u.replace(new RegExp(`(id:\\s*${id},[\\s\\S]*?meta:\\s*\\{[^}]*moq:\\s*)\\d+`), `$1${product.moq ? Number(product.moq) : 0}`);
  return u;
}

function insertProductIntoSource(source, product, id) {
  const slug = slugify(product.title);
  const imagesArr = product.images.map(img => `"${img}"`).join(", ");
  const tagsArr = product.tags ? product.tags.split(",").map(t => `"${sanitizeForJS(t.trim())}"`).join(", ") : "";
  const kwArr = product.keywords ? product.keywords.split(",").map(k => `"${sanitizeForJS(k.trim())}"`).join(", ") : "";
  const desc = sanitizeForJS(product.description);
  const title = sanitizeForJS(product.title);
  const colorsArr = product.colors && product.colors.length > 0 ? product.colors.map(c => `"${sanitizeForJS(c)}"`).join(", ") : "";
  const moqVal = product.moq ? Number(product.moq) : 0;
  const entry = `    { id: ${id}, categoryId: "${product.categoryId}", title: "${title}", slug: "${slug}", description: "${desc}", price: ${product.price}, images: [${imagesArr}], popular: false, featured: false, inStock: true, tags: [${tagsArr}], meta: { keywords: [${kwArr}], colors: [${colorsArr}], moq: ${moqVal} } },`;
  const catKey = product.categoryId.match(/[&\-]/) ? `"${product.categoryId}"` : product.categoryId;
  const catPattern = new RegExp(`(${catKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*\\[)([\\s\\S]*?)(\\n  \\],)`, "m");
  const match = source.match(catPattern);
  if (!match) throw new Error(`Category block "${product.categoryId}" not found in catalog.js`);
  const insertPos = match.index + match[0].lastIndexOf(match[3]);
  return source.slice(0, insertPos) + "\n" + entry + "\n" + source.slice(insertPos);
}

function insertCategoryIntoSource(source, cat, order) {
  const entry = `  { id: "${cat.id}", name: "${sanitizeForJS(cat.name)}", slug: "${cat.slug || slugify(cat.name)}", description: "${sanitizeForJS(cat.description)}", icon: "${cat.icon}", order: ${order}, featured: false, meta: { keywords: [] } },`;
  return source.replace(/(export const categories = \[)([\s\S]*?)(\n\];)/m, (_, open, content, close) => `${open}${content}\n${entry}${close}`);
}

function addCategoryProductBlock(source, categoryId) {
  return source.replace(/(export const productsByCategory = \{)/, `$1\n  "${categoryId}": [],`);
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
        <p style={ts.productCardPrice}>&#8377;{product.price}</p>
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
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishLog, setPublishLog] = useState([]);
  const [newProduct, setNewProduct] = useState({ title: "", categoryId: "", description: "", price: "", tags: "", keywords: "", occasions: [], colors: [], moq: "" });
  const [newColorInput, setNewColorInput] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [formError, setFormError] = useState("");
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

  const showToast = (message, type = "success") => setToast({ message, type });

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError(""); setLoginLoading(true);
    try {
      const c = { token: loginForm.token, owner: loginForm.owner, repo: loginForm.repo, branch: loginForm.branch };
      const { source, sha } = await fetchCatalog(c);
      sessionStorage.setItem("maqers_admin_creds", JSON.stringify(c));
      setCreds(c); loadCatalogData(source, sha); setStep("app");
    } catch { setLoginError("Could not connect. Check your token, owner, repo, and branch."); }
    finally { setLoginLoading(false); }
  }

  function loadCatalogData(source, sha) {
    setProducts(parseProducts(source));
    setCategories(parseCategories(source));
    const oMap = parseOccasionMap(source);
    setOccasionMap(oMap);
    setOccasionEdits(JSON.parse(JSON.stringify(oMap)));
  }

  async function refreshCatalog() {
    setCatalogLoading(true);
    try { const { source, sha } = await fetchCatalog(creds); loadCatalogData(source, sha); showToast("Catalog refreshed"); }
    catch (err) { showToast("Refresh failed: " + err.message, "error"); }
    finally { setCatalogLoading(false); }
  }

  function handleLogout() { sessionStorage.removeItem("maqers_admin_creds"); setCreds({}); setStep("login"); }

  function processFiles(files) {
    Array.from(files).filter(f => f.type.startsWith("image/")).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImageFiles(prev => [...prev, { file, preview: ev.target.result, name: file.name.toLowerCase().replace(/\s+/g, "-"), base64: ev.target.result.split(",")[1], mime: file.type }]);
      reader.readAsDataURL(file);
    });
  }

  const onDrop = useCallback(e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }, []);

  function handleProductPreview(e) {
    e.preventDefault(); setFormError("");
    if (!newProduct.title.trim()) return setFormError("Title required.");
    if (!newProduct.categoryId) return setFormError("Select a category.");
    if (!newProduct.description.trim()) return setFormError("Description required.");
    if (!newProduct.price || isNaN(Number(newProduct.price)) || Number(newProduct.price) <= 0) return setFormError("Valid price required.");
    if (imageFiles.length === 0) return setFormError("Upload at least one image.");
    setProductStep("preview");
  }

  async function handlePublishProduct() {
    setPublishing(true); setPublishLog([]);
    const log = msg => setPublishLog(prev => [...prev, msg]);
    try {
      log("Uploading images...");
      const imagePaths = [];
      for (const img of imageFiles) {
        let sha; try { const ex = await ghGet(`public/images/${img.name}`, creds); sha = ex.sha; } catch {}
        await ghPut(`public/images/${img.name}`, img.base64, `Add image: ${img.name}`, sha, creds);
        imagePaths.push(`/images/${img.name}`);
      }
      log("Updating catalog.js...");
      const { source, sha } = await fetchCatalog(creds);
      const newId = getNextId(source);
      const fullProduct = { ...newProduct, price: Number(newProduct.price), images: imagePaths };
      let updated = insertProductIntoSource(source, fullProduct, newId);
      for (const occ of newProduct.occasions) {
        updated = updated.replace(
          new RegExp(`('${occ}'\\s*:\\s*\\[)([^\\]]*)(\\])`, "m"),
          (_, open, content, close) => { const t = content.trimEnd(); return `${open}${t}${t.endsWith(",") ? " " : ", "}${newId}${close}`; }
        );
      }
      await commitCatalog(updated, sha, `Add product: ${sanitizeForJS(newProduct.title)} (ID ${newId})`, creds);
      log(`Done! Product ID ${newId} live after Vercel redeploys (~45s).`);
      loadCatalogData(updated, sha);
      setNewProduct({ title: "", categoryId: "", description: "", price: "", tags: "", keywords: "", occasions: [], colors: [], moq: "" });
      setNewColorInput("");
      setImageFiles([]); setProductStep("form");
      showToast(`"${newProduct.title}" published!`); setActiveTab("products");
    } catch (err) { log("Error: " + err.message); showToast(err.message, "error"); }
    finally { setPublishing(false); }
  }

  function handleToggleFlag(product, flag) {
    const current = pendingChanges[product.id] || product;
    setPendingChanges(prev => ({ ...prev, [product.id]: { ...current, [flag]: !current[flag] } }));
  }

  function handleStageProductEdit(edited) {
    setPendingChanges(prev => ({ ...prev, [edited.id]: edited }));
    setEditingProduct(null); setEditImageFiles([]);
    showToast("Staged — hit Publish All to save.", "info");
  }

  function processEditFiles(files) {
    Array.from(files).filter(f => f.type.startsWith("image/")).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setEditImageFiles(prev => [...prev, {
        preview: ev.target.result,
        name: file.name.toLowerCase().replace(/\s+/g, "-"),
        base64: ev.target.result.split(",")[1],
      }]);
      reader.readAsDataURL(file);
    });
  }

  async function uploadEditImages() {
    if (!editImageFiles.length) return;
    setPublishing(true);
    try {
      const newPaths = [];
      for (const img of editImageFiles) {
        let sha; try { const ex = await ghGet(`public/images/${img.name}`, creds); sha = ex.sha; } catch {}
        await ghPut(`public/images/${img.name}`, img.base64, `Add image: ${img.name}`, sha, creds);
        newPaths.push(`/images/${img.name}`);
      }
      setEditingProduct(p => ({ ...p, images: [...p.images, ...newPaths] }));
      setEditImageFiles([]);
      showToast(`${newPaths.length} image(s) uploaded and added.`);
    } catch (err) { showToast(err.message, "error"); }
    finally { setPublishing(false); }
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
      loadCatalogData(updated, sha); setPendingChanges({});
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

  const filteredProducts = products.filter(p => {
    const matchText = p.title.toLowerCase().includes(productFilter.toLowerCase()) || p.description.toLowerCase().includes(productFilter.toLowerCase());
    return matchText && (productFilterCat === "all" || p.categoryId === productFilterCat);
  });

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
    { id: "categories", label: "Categories", icon: "⊞" },
    { id: "occasions", label: "Occasions", icon: "♡" },
  ];

  // ─── APP ──────────────────────────────────────────────────────────────────────

  return (
    <div style={ts.shell}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={ts.sidebar}>
        <div style={ts.sidebarLogo}>
          <span style={ts.logoM}>M</span>
          <div><div style={ts.logoText}>Maqers</div><div style={ts.logoSub}>Admin Portal</div></div>
        </div>
        <nav style={ts.nav}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
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
                      <label style={ts.label}>Title *</label>
                      <input style={ts.input} placeholder="e.g. Lavender Soy Candle" value={newProduct.title}
                        onChange={e => setNewProduct(p => ({ ...p, title: e.target.value }))} />
                      <label style={ts.label}>Category *</label>
                      <select style={ts.input} value={newProduct.categoryId}
                        onChange={e => setNewProduct(p => ({ ...p, categoryId: e.target.value }))}>
                        <option value="">— Select —</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <label style={ts.label}>Price (Rs.) *</label>
                      <input style={ts.input} type="number" placeholder="499" value={newProduct.price}
                        onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} />
                      <label style={ts.label}>Description *</label>
                      <textarea style={{ ...ts.input, height: 100, resize: "vertical" }}
                        placeholder="Keep it punchy. Line breaks are stripped automatically before saving."
                        value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} />
                      <p style={ts.fieldHint}>Line breaks are automatically removed to prevent build errors.</p>
                      <label style={ts.label}>Tags (comma-separated)</label>
                      <input style={ts.input} placeholder="candle, soy, gift" value={newProduct.tags}
                        onChange={e => setNewProduct(p => ({ ...p, tags: e.target.value }))} />
                      <label style={ts.label}>Keywords (comma-separated, for SEO)</label>
                      <input style={ts.input} placeholder="soy candle India, scented candle gift" value={newProduct.keywords}
                        onChange={e => setNewProduct(p => ({ ...p, keywords: e.target.value }))} />
                      <label style={ts.label}>Colour Options <span style={ts.labelHint}>(optional — shown as dropdown on site)</span></label>
                      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        <input style={{ ...ts.input, flex: 1, marginTop: 0 }} placeholder="e.g. Red, Blue, Green"
                          value={newColorInput} onChange={e => setNewColorInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = newColorInput.trim(); if (v) { setNewProduct(p => ({ ...p, colors: [...(p.colors||[]), v] })); setNewColorInput(""); } } }} />
                        <button type="button" style={{ ...ts.primaryBtn, padding: "9px 14px", flexShrink: 0 }}
                          onClick={() => { const v = newColorInput.trim(); if (v) { setNewProduct(p => ({ ...p, colors: [...(p.colors||[]), v] })); setNewColorInput(""); } }}>+</button>
                      </div>
                      {(newProduct.colors||[]).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                          {newProduct.colors.map((c, i) => (
                            <span key={i} style={ts.colorChip}>
                              {c}
                              <button type="button" onClick={() => setNewProduct(p => ({ ...p, colors: p.colors.filter((_,j)=>j!==i) }))} style={ts.colorChipX}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <label style={ts.label}>Minimum Order Quantity <span style={ts.labelHint}>(optional)</span></label>
                      <input style={ts.input} type="number" placeholder="e.g. 15" value={newProduct.moq}
                        onChange={e => setNewProduct(p => ({ ...p, moq: e.target.value }))} />
                    </div>
                    <div style={ts.card}>
                      <h2 style={ts.cardTitle}>Occasion Categories</h2>
                      <div style={ts.chipGrid}>
                        {OCCASION_CATEGORIES.map(occ => (
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
                        <div style={ts.thumbGrid}>
                          {imageFiles.map((img, i) => (
                            <div key={i} style={ts.thumb}>
                              <img src={img.preview} alt="" style={ts.thumbImg} />
                              {i === 0 && <span style={ts.primaryBadge}>Primary</span>}
                              <button type="button" onClick={() => setImageFiles(prev => prev.filter((_, j) => j !== i))} style={ts.removeBtn}>x</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {newProduct.title && (
                      <div style={ts.card}>
                        <h2 style={ts.cardTitle}>Live Preview</h2>
                        <ProductCard product={{ ...newProduct, id: 0, price: Number(newProduct.price) || 0, images: imageFiles.map(f => f.preview), popular: false, featured: false, inStock: true }} categories={categories} />
                      </div>
                    )}
                  </div>
                </div>
                {formError && <p style={ts.errorText}>{formError}</p>}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                  <button type="submit" style={ts.primaryBtn}>Preview and Publish</button>
                </div>
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
                      ["Description", newProduct.description.replace(/\r?\n/g, " ")],
                      ["Tags", newProduct.tags || "none"],
                      ["Keywords", newProduct.keywords || "none"],
                      ["Colours", (newProduct.colors||[]).join(", ") || "none"],
                      ["MOQ", newProduct.moq || "none"],
                      ["Occasions", newProduct.occasions.map(o => OCCASION_CATEGORIES.find(oc => oc.id === o)?.name).join(", ") || "None"],
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
              <input style={{ ...ts.input, flex: 1, margin: 0 }} placeholder="Search products..." value={productFilter} onChange={e => setProductFilter(e.target.value)} />
              <select style={{ ...ts.input, width: 200, margin: 0 }} value={productFilterCat} onChange={e => setProductFilterCat(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {editingProduct && (
              <div style={{ ...ts.card, border: "2px solid #c8a96e", marginBottom: 24 }}>
                <h2 style={ts.cardTitle}>Editing: {editingProduct.title}</h2>
                <div style={ts.grid2}>
                  <div>
                    <label style={ts.label}>Title</label>
                    <input style={ts.input} value={editingProduct.title} onChange={e => setEditingProduct(p => ({ ...p, title: e.target.value }))} />
                    <label style={ts.label}>Category</label>
                    <select style={ts.input} value={editingProduct.categoryId} onChange={e => setEditingProduct(p => ({ ...p, categoryId: e.target.value }))}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <label style={ts.label}>Price (Rs.)</label>
                    <input style={ts.input} type="number" value={editingProduct.price} onChange={e => setEditingProduct(p => ({ ...p, price: Number(e.target.value) }))} />
                    <label style={ts.label}>Description</label>
                    <textarea style={{ ...ts.input, height: 100, resize: "vertical" }} value={editingProduct.description}
                      onChange={e => setEditingProduct(p => ({ ...p, description: e.target.value }))} />
                    <p style={ts.fieldHint}>Line breaks removed before saving.</p>
                    <label style={ts.label}>Tags (comma-separated)</label>
                    <input style={ts.input} value={editingProduct.tags.join(", ")}
                      onChange={e => setEditingProduct(p => ({ ...p, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))} />
                    <label style={ts.label}>Keywords (comma-separated)</label>
                    <input style={ts.input} value={(editingProduct.keywords || []).join(", ")}
                      onChange={e => setEditingProduct(p => ({ ...p, keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean) }))} />
                    <label style={ts.label}>Colour Options <span style={ts.labelHint}>(optional)</span></label>
                    <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                      <input style={{ ...ts.input, flex: 1, marginTop: 0 }} placeholder="Add a colour"
                        id="editColorInput"
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = e.target.value.trim(); if (v) { setEditingProduct(p => ({ ...p, colors: [...(p.colors||[]), v] })); e.target.value = ""; } } }} />
                      <button type="button" style={{ ...ts.primaryBtn, padding: "9px 14px", flexShrink: 0 }}
                        onClick={() => { const inp = document.getElementById("editColorInput"); const v = inp.value.trim(); if (v) { setEditingProduct(p => ({ ...p, colors: [...(p.colors||[]), v] })); inp.value = ""; } }}>+</button>
                    </div>
                    {(editingProduct.colors||[]).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                        {editingProduct.colors.map((c, i) => (
                          <span key={i} style={ts.colorChip}>
                            {c}
                            <button type="button" onClick={() => setEditingProduct(p => ({ ...p, colors: p.colors.filter((_,j)=>j!==i) }))} style={ts.colorChipX}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <label style={ts.label}>Minimum Order Quantity <span style={ts.labelHint}>(optional)</span></label>
                    <input style={ts.input} type="number" placeholder="e.g. 15" value={editingProduct.moq || ""}
                      onChange={e => setEditingProduct(p => ({ ...p, moq: e.target.value }))} />
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
                    <label style={ts.label}>Images</label>
                    {/* Current images as removable thumbnails */}
                    {editingProduct.images.length > 0 && (
                      <div style={{ ...ts.thumbGrid, marginBottom: 10 }}>
                        {editingProduct.images.map((src, i) => (
                          <div key={i} style={ts.thumb}>
                            <img src={src} alt="" style={ts.thumbImg} onError={e => { e.target.style.display = "none"; }} />
                            {i === 0 && <span style={ts.primaryBadge}>Primary</span>}
                            <button type="button"
                              onClick={() => setEditingProduct(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                              style={ts.removeBtn}>x</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Upload new images */}
                    <div style={ts.editDropzone} onClick={() => editFileInputRef.current?.click()}>
                      <input ref={editFileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                        onChange={e => processEditFiles(e.target.files)} />
                      <span style={{ fontSize: 12, color: "#aaa" }}>+ Upload more images</span>
                    </div>
                    {editImageFiles.length > 0 && (
                      <div>
                        <div style={{ ...ts.thumbGrid, margin: "8px 0 6px" }}>
                          {editImageFiles.map((img, i) => (
                            <div key={i} style={ts.thumb}>
                              <img src={img.preview} alt="" style={ts.thumbImg} />
                              <button type="button" onClick={() => setEditImageFiles(prev => prev.filter((_, j) => j !== i))} style={ts.removeBtn}>x</button>
                            </div>
                          ))}
                        </div>
                        <button type="button" style={{ ...ts.ghostBtn, padding: "7px 14px", fontSize: 11 }}
                          onClick={uploadEditImages} disabled={publishing}>
                          {publishing ? "Uploading..." : `Upload ${editImageFiles.length} image(s) to GitHub`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button style={ts.ghostBtn} onClick={() => { setEditingProduct(null); setEditImageFiles([]); }}>Cancel</button>
                  <button style={ts.primaryBtn} onClick={() => handleStageProductEdit(editingProduct)}>Stage Changes</button>
                </div>
              </div>
            )}

            <div style={ts.productTable}>
              <div style={ts.productTableHeader}>
                <span style={{ flex: 3 }}>Product</span>
                <span style={{ flex: 1 }}>Price</span>
                <span style={{ flex: 1 }}>Stock</span>
                <span style={{ flex: 1 }}>Popular</span>
                <span style={{ flex: 1 }}>Featured</span>
                <span style={{ flex: 1 }}>Actions</span>
              </div>
              {filteredProducts.map(product => {
                const p = pendingChanges[product.id] || product;
                const isDirty = !!pendingChanges[product.id];
                return (
                  <div key={product.id} style={{ ...ts.productTableRow, background: isDirty ? "#fffbf3" : "#fff" }}>
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
                    <span style={{ flex: 1 }}>
                      <button style={ts.editBtn} onClick={() => { setEditingProduct({ ...p }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                    </span>
                  </div>
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
        {activeTab === "occasions" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h1 style={ts.pageTitle}>Occasion Map</h1>
              <button style={ts.primaryBtn} onClick={handleSaveOccasions} disabled={publishing}>
                {publishing ? "Saving..." : "Save All"}
              </button>
            </div>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
              Toggle which products appear in each occasion section. Hit Save All when done.
            </p>
            {OCCASION_CATEGORIES.map(occ => {
              const currentIds = occasionEdits[occ.id] || [];
              return (
                <div key={occ.id} style={{ ...ts.card, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h2 style={{ ...ts.cardTitle, margin: 0 }}>{occ.name}</h2>
                    <span style={ts.flag}>{currentIds.length} products</span>
                  </div>
                  <div style={ts.occasionProductGrid}>
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
                </div>
              );
            })}
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