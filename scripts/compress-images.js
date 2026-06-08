/**
 * Batch-compresses all images in /public/images in-place.
 * - JPEG/JPG → quality 82, max 1400px on longest side
 * - PNG      → quality 80 (lossy), max 1400px on longest side
 * - WEBP     → skipped (already optimal)
 * Run with: node scripts/compress-images.js
 * Run with --dry-run to preview without writing anything.
 */

import sharp from 'sharp'
import { readdirSync, statSync, renameSync } from 'fs'
import { join, extname, basename } from 'path'

const IMAGES_DIR = new URL('../public/images', import.meta.url).pathname
const MAX_PX    = 1400
const DRY_RUN   = process.argv.includes('--dry-run')

const SUPPORTED = new Set(['.jpg', '.jpeg', '.png'])

function formatBytes(b) {
  if (b >= 1_000_000) return (b / 1_000_000).toFixed(1) + ' MB'
  return Math.round(b / 1000) + ' KB'
}

async function compressImage(filePath) {
  const ext  = extname(filePath).toLowerCase()
  if (!SUPPORTED.has(ext)) return null

  const before = statSync(filePath).size
  const tmp    = filePath + '.tmp'

  try {
    const img = sharp(filePath).rotate() // auto-rotate from EXIF

    const meta = await img.metadata()
    const needsResize = (meta.width > MAX_PX || meta.height > MAX_PX)

    let pipeline = needsResize
      ? img.resize(MAX_PX, MAX_PX, { fit: 'inside', withoutEnlargement: true })
      : img

    if (ext === '.png') {
      await pipeline
        .png({ quality: 80, compressionLevel: 9, palette: true })
        .toFile(tmp)
    } else {
      await pipeline
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(tmp)
    }

    const after = statSync(tmp).size

    // Only keep if we actually saved space (sharp can sometimes add bytes on tiny images)
    if (after < before) {
      if (!DRY_RUN) renameSync(tmp, filePath)
      else {
        const fs = await import('fs')
        fs.unlinkSync(tmp)
      }
      return { before, after, saved: before - after }
    } else {
      const fs = await import('fs')
      fs.unlinkSync(tmp)
      return { before, after: before, saved: 0 }
    }
  } catch (err) {
    // Clean up tmp if it exists
    try { (await import('fs')).unlinkSync(tmp) } catch {}
    console.error(`  ✗ Error on ${basename(filePath)}: ${err.message}`)
    return null
  }
}

async function run() {
  const files = readdirSync(IMAGES_DIR)
    .filter(f => SUPPORTED.has(extname(f).toLowerCase()))
    .map(f => join(IMAGES_DIR, f))

  console.log(`\n🖼  Found ${files.length} images in /public/images`)
  if (DRY_RUN) console.log('   (dry-run — no files will be changed)\n')
  else console.log('   Compressing in-place...\n')

  let totalBefore = 0
  let totalAfter  = 0
  let skipped     = 0
  let compressed  = 0

  for (const file of files) {
    const result = await compressImage(file)
    if (!result) { skipped++; continue }

    totalBefore += result.before
    totalAfter  += result.after

    if (result.saved > 0) {
      compressed++
      const pct = Math.round((result.saved / result.before) * 100)
      console.log(`  ✓ ${basename(file).padEnd(55)} ${formatBytes(result.before).padStart(8)} → ${formatBytes(result.after).padStart(8)}  (-${pct}%)`)
    } else {
      skipped++
    }
  }

  const totalSaved = totalBefore - totalAfter
  const totalPct   = totalBefore > 0 ? Math.round((totalSaved / totalBefore) * 100) : 0

  console.log(`\n${'─'.repeat(80)}`)
  console.log(`  Compressed : ${compressed} images`)
  console.log(`  Unchanged  : ${skipped} images (already small / errors)`)
  console.log(`  Before     : ${formatBytes(totalBefore)}`)
  console.log(`  After      : ${formatBytes(totalAfter)}`)
  console.log(`  Saved      : ${formatBytes(totalSaved)} (${totalPct}% smaller)`)
  if (DRY_RUN) console.log('\n  Run without --dry-run to apply.')
  console.log()
}

run()
