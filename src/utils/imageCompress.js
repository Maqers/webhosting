// Client-side resize/compress before uploading user photos (review photos,
// etc.) so a raw phone-camera shot doesn't land in storage at 8MB+.
export function compressImageFile(file, maxDim = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url)
        if (!blob) { reject(new Error('Could not process image')); return }
        const ext = outType === 'image/png' ? '.png' : '.jpg'
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, ext), { type: outType }))
      }, outType, quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')) }
    img.src = url
  })
}
