/**
 * CLIPBOARD UTILITIES
 * 
 * Cross-browser clipboard operations with graceful fallbacks
 * Handles modern Clipboard API and legacy fallbacks
 */

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export const copyToClipboard = async (text) => {
  // Clean text (remove any formatting, extra spaces)
  const cleanText = text.trim().replace(/\s+/g, ' ')

  // Try modern Clipboard API first (most browsers)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(cleanText)
      return true
    } catch (err) {
      console.warn('Clipboard API failed:', err)
      // Fall through to fallback method
    }
  }

  // Fallback for older browsers or insecure contexts
  try {
    const textArea = document.createElement('textarea')
    textArea.value = cleanText
    
    // Make textarea invisible but accessible
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.setAttribute('readonly', '')
    textArea.setAttribute('aria-hidden', 'true')
    
    document.body.appendChild(textArea)
    
    // Select and copy
    textArea.select()
    textArea.setSelectionRange(0, 99999) // For mobile devices
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    return successful
  } catch (err) {
    console.error('Fallback copy failed:', err)
    return false
  }
}

/**
 * Check if clipboard API is available
 * @returns {boolean}
 */
export const isClipboardSupported = () => {
  return (
    (navigator.clipboard && window.isSecureContext) ||
    document.execCommand !== undefined
  )
}

