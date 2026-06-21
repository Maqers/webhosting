import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const imagesDir = path.join(__dirname, '..', 'public', 'images')

const MAX_WIDTH = 1200
const JPEG_QUALITY = 82
const PNG_QUALITY = 82
const WEBP_QUALITY = 80

const exts = ['.jpg', '.jpeg', '.png', '.webp']

const files = fs.readdirSync(imagesDir).filter(f => exts.includes(path.extname(f).toLowerCase()))

let totalBefore = 0
let totalAfter = 0
let skipped = 0
let failed = 0

console.log(`Found ${files.length} images. Compressing...\n`)

for (const file of files) {
  const filePath = path.join(imagesDir, file)
  const ext = path.extname(file).toLowerCase()
  const statBefore = fs.statSync(filePath)
  const sizeBefore = statBefore.size

  try {
    const img = sharp(filePath)
    const meta = await img.metadata()

    // Skip if already small enough (under 80KB)
    if (sizeBefore < 80 * 1024) {
      skipped++
      continue
    }

    const needsResize = meta.width && meta.width > MAX_WIDTH

    let pipeline = sharp(filePath)
    if (needsResize) {
      pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
    }

    let outputBuffer
    if (ext === '.jpg' || ext === '.jpeg') {
      outputBuffer = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer()
    } else if (ext === '.png') {
      outputBuffer = await pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9 }).toBuffer()
    } else if (ext === '.webp') {
      outputBuffer = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer()
    }

    // Only write if we actually made it smaller
    if (outputBuffer && outputBuffer.length < sizeBefore) {
      fs.writeFileSync(filePath, outputBuffer)
      const sizeAfter = outputBuffer.length
      const saved = sizeBefore - sizeAfter
      const pct = ((saved / sizeBefore) * 100).toFixed(0)
      totalBefore += sizeBefore
      totalAfter += sizeAfter
      console.log(`✓ ${file.padEnd(60)} ${(sizeBefore/1024).toFixed(0)}KB → ${(sizeAfter/1024).toFixed(0)}KB  (-${pct}%)`)
    } else {
      skipped++
      totalBefore += sizeBefore
      totalAfter += sizeBefore
    }
  } catch (err) {
    console.error(`✗ FAILED: ${file} — ${err.message}`)
    failed++
    totalBefore += sizeBefore
    totalAfter += sizeBefore
  }
}

console.log('\n' + '─'.repeat(80))
console.log(`Total before : ${(totalBefore / 1024 / 1024).toFixed(1)} MB`)
console.log(`Total after  : ${(totalAfter / 1024 / 1024).toFixed(1)} MB`)
console.log(`Saved        : ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(1)} MB  (${((1 - totalAfter/totalBefore)*100).toFixed(0)}% reduction)`)
console.log(`Skipped      : ${skipped} (already small or couldn't improve)`)
if (failed) console.log(`Failed       : ${failed}`)
