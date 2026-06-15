/**
 * Cloudinary Migration Script
 *
 * 1. Uploads every image from /public/images/ to Cloudinary (folder: maqers/)
 * 2. Saves a mapping file: cloudinary-mapping.json  { "/images/foo.jpg": "https://..." }
 * 3. Updates src/data/catalog.js — replaces every local image path with the Cloudinary URL
 *
 * Run:
 *   node --env-file=.env.local scripts/migrate-to-cloudinary.js          # full run
 *   node --env-file=.env.local scripts/migrate-to-cloudinary.js --dry-run # preview only
 */

import { v2 as cloudinary } from 'cloudinary'
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs'
import { join, extname, basename } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname  = dirname(fileURLToPath(import.meta.url))
const ROOT       = join(__dirname, '..')
const IMAGES_DIR = join(ROOT, 'public', 'images')
const CATALOG    = join(ROOT, 'src', 'data', 'catalog.js')
const MAPPING    = join(ROOT, 'cloudinary-mapping.json')
const DRY_RUN    = process.argv.includes('--dry-run')
const SUPPORTED  = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
})

function formatBytes(b) {
  if (b >= 1_000_000) return (b / 1_000_000).toFixed(1) + ' MB'
  return Math.round(b / 1000) + ' KB'
}

function cloudinaryUrl(publicId) {
  // f_auto  = WebP for Chrome/Firefox, JPEG for Safari, etc — browser decides
  // q_auto  = Cloudinary picks the best quality automatically
  // w_1400  = cap width at 1400px (retina-safe)
  // c_limit = never upscale
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_1400,c_limit/${publicId}`
}

async function uploadOne(filePath) {
  const ext      = extname(filePath).toLowerCase()
  const filename = basename(filePath, ext)
  const publicId = `maqers/${filename}`

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id:     publicId,
      overwrite:     false,   // skip if already uploaded
      resource_type: 'image',
    })
    return { publicId: result.public_id, bytes: statSync(filePath).size }
  } catch (err) {
    // Already exists — just return the public_id without re-uploading
    if (err?.error?.http_code === 400 || err?.message?.includes('already exists')) {
      return { publicId, bytes: 0, skipped: true }
    }
    throw err
  }
}

async function run() {
  const files = readdirSync(IMAGES_DIR)
    .filter(f => SUPPORTED.has(extname(f).toLowerCase()))
    .map(f => ({ name: f, path: join(IMAGES_DIR, f) }))

  console.log(`\n☁️  Cloudinary Migration — ${DRY_RUN ? 'DRY RUN (no uploads)' : 'LIVE'}`)
  console.log(`   ${files.length} images found in /public/images/\n`)

  // Load existing mapping if any (so we can resume interrupted runs)
  let mapping = {}
  try { mapping = JSON.parse(readFileSync(MAPPING, 'utf8')) } catch {}

  let uploaded = 0, skipped = 0, failed = 0, totalBytes = 0

  for (const { name, path } of files) {
    const localKey = `/images/${name}`

    if (mapping[localKey]) {
      process.stdout.write(`  ↩  ${name.padEnd(60)} already mapped\n`)
      skipped++
      continue
    }

    if (DRY_RUN) {
      const size = statSync(path).size
      process.stdout.write(`  ✓  ${name.padEnd(60)} ${formatBytes(size)}  (dry-run)\n`)
      uploaded++
      totalBytes += size
      continue
    }

    try {
      const { publicId, bytes, skipped: wasSkipped } = await uploadOne(path)
      mapping[localKey] = cloudinaryUrl(publicId)

      if (wasSkipped) {
        process.stdout.write(`  ↩  ${name.padEnd(60)} already on Cloudinary\n`)
        skipped++
      } else {
        process.stdout.write(`  ✓  ${name.padEnd(60)} ${formatBytes(bytes)}\n`)
        uploaded++
        totalBytes += bytes
      }
    } catch (err) {
      process.stdout.write(`  ✗  ${name.padEnd(60)} FAILED: ${err.message}\n`)
      failed++
    }

    // Cloudinary free tier: ~500 req/hr — small delay to stay safe
    await new Promise(r => setTimeout(r, 120))
  }

  // Save mapping (only on real run)
  if (!DRY_RUN) {
    writeFileSync(MAPPING, JSON.stringify(mapping, null, 2))
    console.log(`\n  Mapping saved → cloudinary-mapping.json (${Object.keys(mapping).length} entries)`)
  }

  // Patch catalog.js
  let catalog = readFileSync(CATALOG, 'utf8')
  let replacements = 0

  for (const [localPath, cdnUrl] of Object.entries(mapping)) {
    // Match both quoted forms: "/images/foo.jpg" and '/images/foo.jpg'
    const escaped = localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(escaped, 'g')
    const before = catalog
    catalog = catalog.replace(re, cdnUrl)
    if (catalog !== before) replacements++
  }

  if (!DRY_RUN) {
    writeFileSync(CATALOG, catalog)
  }

  console.log(`\n${'─'.repeat(72)}`)
  console.log(`  Uploaded  : ${uploaded} images   (${formatBytes(totalBytes)})`)
  console.log(`  Skipped   : ${skipped} (already done)`)
  console.log(`  Failed    : ${failed}`)
  console.log(`  Catalog   : ${replacements} paths updated in catalog.js ${DRY_RUN ? '(dry-run, not written)' : ''}`)
  if (DRY_RUN) console.log('\n  Run without --dry-run to apply.')
  console.log()
}

run().catch(err => { console.error('\n  Fatal:', err.message); process.exit(1) })
