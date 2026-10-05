/**
 * Crop / rotate a product photo in the admin before it's uploaded.
 *
 * Always edits from the original full-resolution photo (never a previous
 * edit), so re-cropping doesn't stack JPEG quality loss; the last settings
 * are passed back in so reopening shows the crop you made.
 *
 * onApply(dataUrl, mimeType, settings) receives the full-resolution result;
 * the caller re-runs its normal compression/WebP step on it.
 */

import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";

const ASPECTS = [
  { id: "original", label: "Original" },
  { id: "1:1", label: "Square (shop cards)", value: 1 },
  { id: "3:4", label: "3:4 portrait", value: 3 / 4 },
  { id: "4:5", label: "4:5 portrait", value: 4 / 5 },
  { id: "4:3", label: "4:3 landscape", value: 4 / 3 },
];

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

// Size of the box a w×h image occupies once rotated
function rotatedSize(w, h, deg) {
  const r = (deg * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(r) * w) + Math.abs(Math.sin(r) * h),
    height: Math.abs(Math.sin(r) * w) + Math.abs(Math.cos(r) * h),
  };
}

async function renderEdit(src, pixelCrop, rotation, mimeType) {
  const img = await loadImage(src);
  const box = rotatedSize(img.width, img.height, rotation);

  // 1. Draw the whole image rotated onto a canvas the size of its bounding box
  const rotatedCanvas = document.createElement("canvas");
  rotatedCanvas.width = Math.round(box.width);
  rotatedCanvas.height = Math.round(box.height);
  const rctx = rotatedCanvas.getContext("2d");
  rctx.translate(box.width / 2, box.height / 2);
  rctx.rotate((rotation * Math.PI) / 180);
  rctx.drawImage(img, -img.width / 2, -img.height / 2);

  // 2. Cut the crop out of it. JPEG has no transparency, so fill white first
  //    (otherwise any corner exposed by a slight straighten turns black).
  const out = document.createElement("canvas");
  out.width = Math.round(pixelCrop.width);
  out.height = Math.round(pixelCrop.height);
  const octx = out.getContext("2d");
  const outMime = mimeType === "image/png" ? "image/png" : "image/jpeg";
  if (outMime === "image/jpeg") { octx.fillStyle = "#fff"; octx.fillRect(0, 0, out.width, out.height); }
  octx.drawImage(rotatedCanvas, -Math.round(pixelCrop.x), -Math.round(pixelCrop.y));
  return { dataUrl: out.toDataURL(outMime, 0.95), mimeType: outMime };
}

export default function AdminImageEditor({ src, mimeType, initialSettings, onApply, onCancel, ts }) {
  const [crop, setCrop] = useState(initialSettings?.crop || { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialSettings?.zoom || 1);
  // Quarter turns from the buttons, plus a fine "straighten" angle
  const [quarterTurns, setQuarterTurns] = useState(initialSettings?.quarterTurns || 0);
  const [straighten, setStraighten] = useState(initialSettings?.straighten || 0);
  const [aspectId, setAspectId] = useState(initialSettings?.aspectId || "original");
  const [naturalAspect, setNaturalAspect] = useState(null);
  const [pixelCrop, setPixelCrop] = useState(null);
  const [mediaSize, setMediaSize] = useState(null);
  const [cropSize, setCropSize] = useState(null);
  const [saving, setSaving] = useState(false);

  const rotation = quarterTurns * 90 + straighten;

  useEffect(() => { loadImage(src).then(img => setNaturalAspect(img.width / img.height)); }, [src]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // "Original" follows the photo's own shape, flipped when turned sideways
  const sideways = quarterTurns % 2 !== 0;
  const aspect = aspectId === "original"
    ? (naturalAspect ? (sideways ? 1 / naturalAspect : naturalAspect) : 1)
    : ASPECTS.find(a => a.id === aspectId).value;

  const onCropComplete = useCallback((_, areaPixels) => setPixelCrop(areaPixels), []);

  // Smallest zoom at which the crop frame, turned by the rotation, still fits
  // inside the photo. Without it a straighten leaves white triangles in the
  // corners of the result. (Exact 90° turns come out at 1.)
  const r = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(r)), sin = Math.abs(Math.sin(r));
  const coverZoom = mediaSize && cropSize
    ? Math.max(1,
        (cropSize.width * cos + cropSize.height * sin) / mediaSize.width,
        (cropSize.width * sin + cropSize.height * cos) / mediaSize.height) - 0.0001
    : 1;
  const minZoom = Math.max(1, coverZoom);
  // Applied at use, not written back into `zoom`: right after a 90° turn there
  // is a render where the rotation has changed but the crop frame hasn't, and
  // storing that transient minimum would leave the photo stuck zoomed in.
  const effectiveZoom = Math.max(zoom, minZoom);

  function reset() {
    setCrop({ x: 0, y: 0 }); setZoom(1); setQuarterTurns(0); setStraighten(0); setAspectId("original");
  }

  async function apply() {
    if (!pixelCrop) return;
    setSaving(true);
    try {
      const { dataUrl, mimeType: outMime } = await renderEdit(src, pixelCrop, rotation, mimeType);
      await onApply(dataUrl, outMime, { crop, zoom: effectiveZoom, quarterTurns, straighten, aspectId });
    } finally {
      setSaving(false);
    }
  }

  const btn = { ...ts.ghostBtn, padding: "7px 12px", fontSize: 12 };

  return (
    <div style={es.overlay} onClick={onCancel}>
      <div style={es.modal} onClick={e => e.stopPropagation()} role="dialog" aria-label="Crop and rotate photo">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ ...ts.cardTitle, margin: 0, fontSize: 17 }}>Crop & rotate</h2>
          <button onClick={onCancel} style={{ ...ts.colorChipX, fontSize: 22 }} aria-label="Close">×</button>
        </div>

        <div style={es.stage}>
          {naturalAspect && (
            <Cropper
              image={src}
              crop={crop}
              zoom={effectiveZoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={m => setMediaSize({ width: m.width, height: m.height })}
              onCropSizeChange={setCropSize}
              objectFit="contain"
              minZoom={minZoom}
              maxZoom={4}
            />
          )}
        </div>
        <p style={{ ...ts.fieldHint, margin: "6px 0 0" }}>Drag to position · scroll or pinch to zoom</p>

        <label style={ts.label}>Shape</label>
        <div style={ts.chipGrid}>
          {ASPECTS.map(a => (
            <button key={a.id} type="button" onClick={() => setAspectId(a.id)}
              style={aspectId === a.id ? ts.chipActive : ts.chip}>{a.label}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 4 }}>
          <div>
            <label style={ts.label}>Rotate</label>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" style={btn} onClick={() => setQuarterTurns(t => (t + 3) % 4)}>↺ Left</button>
              <button type="button" style={btn} onClick={() => setQuarterTurns(t => (t + 1) % 4)}>↻ Right</button>
            </div>
          </div>
          <div>
            <label style={ts.label}>Straighten <span style={ts.labelHint}>{straighten > 0 ? "+" : ""}{straighten}°</span></label>
            <input type="range" min={-15} max={15} step={0.5} value={straighten}
              onChange={e => setStraighten(Number(e.target.value))} style={{ width: "100%" }} />
          </div>
        </div>

        <label style={ts.label}>Zoom</label>
        <input type="range" min={minZoom} max={4} step={0.01} value={effectiveZoom}
          onChange={e => setZoom(Number(e.target.value))} style={{ width: "100%" }} />

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 18 }}>
          <button type="button" style={btn} onClick={reset}>Reset to original</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={ts.ghostBtn} onClick={onCancel}>Cancel</button>
            <button type="button" style={ts.primaryBtn} onClick={apply} disabled={saving || !pixelCrop}>
              {saving ? "Applying…" : "Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const es = {
  overlay: { position: "fixed", inset: 0, background: "rgba(17,17,16,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
  modal: { background: "#fff", borderRadius: 14, padding: 22, width: "100%", maxWidth: 620, maxHeight: "94vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.25)", fontFamily: "Georgia, serif" },
  stage: { position: "relative", width: "100%", height: "min(56vh, 460px)", background: "#1a1a18", borderRadius: 10, overflow: "hidden" },
};
