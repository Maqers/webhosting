/**
 * ZOOM UTILITY MODULE
 * 
 * Centralized, reusable zoom logic for images and content
 * Supports zoom levels below 100% (e.g., 50%, 75%, 90%)
 * 
 * Features:
 * - Configurable zoom range
 * - Smooth zoom transitions
 * - Prevents rounding errors
 * - Performance optimized
 */

/**
 * Default zoom configuration
 */
export const ZOOM_CONFIG = {
  MIN: 0.5,      // 50% minimum zoom
  MAX: 3.0,      // 300% maximum zoom
  DEFAULT: 1.0,  // 100% default zoom
  STEP: 0.1,     // 10% step increment
  PRECISION: 2   // Decimal precision for calculations
}

/**
 * Preset zoom levels for quick access
 */
export const ZOOM_PRESETS = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 0.9, label: '90%' },
  { value: 1.0, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
  { value: 2.0, label: '200%' },
  { value: 3.0, label: '300%' }
]

/**
 * Clamp zoom value to valid range
 * Prevents values outside MIN-MAX range
 */
export const clampZoom = (value, config = ZOOM_CONFIG) => {
  return Math.max(config.MIN, Math.min(config.MAX, value))
}

/**
 * Round zoom value to prevent cumulative errors
 * Uses configured precision
 */
export const roundZoom = (value, config = ZOOM_CONFIG) => {
  const factor = Math.pow(10, config.PRECISION)
  return Math.round(value * factor) / factor
}

/**
 * Normalize zoom value
 * Clamps and rounds to prevent errors
 */
export const normalizeZoom = (value, config = ZOOM_CONFIG) => {
  return roundZoom(clampZoom(value, config), config)
}

/**
 * Calculate zoom percentage for display
 */
export const getZoomPercentage = (zoomLevel) => {
  return Math.round(zoomLevel * 100)
}

/**
 * Increment zoom by step
 */
export const zoomIn = (currentZoom, step = ZOOM_CONFIG.STEP, config = ZOOM_CONFIG) => {
  return normalizeZoom(currentZoom + step, config)
}

/**
 * Decrement zoom by step
 */
export const zoomOut = (currentZoom, step = ZOOM_CONFIG.STEP, config = ZOOM_CONFIG) => {
  return normalizeZoom(currentZoom - step, config)
}

/**
 * Set zoom to specific value
 */
export const setZoom = (value, config = ZOOM_CONFIG) => {
  return normalizeZoom(value, config)
}

/**
 * Reset zoom to default
 */
export const resetZoom = (config = ZOOM_CONFIG) => {
  return config.DEFAULT
}

/**
 * Check if zoom is at minimum
 */
export const isMinZoom = (zoomLevel, config = ZOOM_CONFIG) => {
  return Math.abs(zoomLevel - config.MIN) < 0.01
}

/**
 * Check if zoom is at maximum
 */
export const isMaxZoom = (zoomLevel, config = ZOOM_CONFIG) => {
  return Math.abs(zoomLevel - config.MAX) < 0.01
}

/**
 * Check if zoom is at default (100%)
 */
export const isDefaultZoom = (zoomLevel, config = ZOOM_CONFIG) => {
  return Math.abs(zoomLevel - config.DEFAULT) < 0.01
}

/**
 * Calculate transform scale value for CSS
 * Ensures smooth scaling without pixelation
 */
export const getTransformScale = (zoomLevel) => {
  const normalized = normalizeZoom(zoomLevel)
  return normalized
}

/**
 * Calculate pan boundaries based on zoom level
 * Prevents panning beyond image bounds
 */
export const calculatePanBounds = (zoomLevel, containerWidth, containerHeight, imageWidth, imageHeight) => {
  if (zoomLevel <= 1) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  }

  const scaledWidth = imageWidth * zoomLevel
  const scaledHeight = imageHeight * zoomLevel
  
  const maxX = Math.max(0, (scaledWidth - containerWidth) / 2)
  const maxY = Math.max(0, (scaledHeight - containerHeight) / 2)

  return {
    minX: -maxX,
    maxX: maxX,
    minY: -maxY,
    maxY: maxY
  }
}

/**
 * Clamp pan position to bounds
 */
export const clampPanPosition = (position, bounds) => {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y))
  }
}

/**
 * Calculate zoom from wheel delta
 * Smooth zooming with mouse wheel
 */
export const calculateWheelZoom = (currentZoom, deltaY, sensitivity = 0.01, config = ZOOM_CONFIG) => {
  const delta = deltaY > 0 ? -sensitivity : sensitivity
  return normalizeZoom(currentZoom + delta, config)
}

/**
 * Calculate zoom from pinch gesture
 * For touch devices
 */
export const calculatePinchZoom = (currentZoom, initialDistance, currentDistance, config = ZOOM_CONFIG) => {
  if (initialDistance === 0) return currentZoom
  
  const scale = currentDistance / initialDistance
  return normalizeZoom(currentZoom * scale, config)
}

/**
 * Get zoom level from slider value (0-100)
 * Converts slider percentage to zoom level
 */
export const sliderValueToZoom = (sliderValue, config = ZOOM_CONFIG) => {
  const range = config.MAX - config.MIN
  const normalized = config.MIN + (sliderValue / 100) * range
  return normalizeZoom(normalized, config)
}

/**
 * Get slider value from zoom level (0-100)
 * Converts zoom level to slider percentage
 */
export const zoomToSliderValue = (zoomLevel, config = ZOOM_CONFIG) => {
  const range = config.MAX - config.MIN
  const normalized = (zoomLevel - config.MIN) / range
  return Math.round(normalized * 100)
}

