/**
 * ZOOM CONTROLS COMPONENT
 * 
 * Accessible, mobile-friendly zoom controls
 * - Desktop: Compact button controls + slider
 * - Mobile: Bottom sheet with full controls
 * - Keyboard accessible
 * - Touch-friendly
 */

import { useState, useEffect, useRef } from 'react'
import {
  ZOOM_CONFIG,
  ZOOM_PRESETS,
  getZoomPercentage,
  isMinZoom,
  isMaxZoom,
  isDefaultZoom,
  sliderValueToZoom,
  zoomToSliderValue
} from '../utils/zoom'
import './ZoomControls.css'

const ZoomControls = ({
  zoomLevel,
  onZoomChange,
  onReset,
  config = ZOOM_CONFIG,
  showSlider = true,
  showPresets = false,
  className = ''
}) => {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const [sliderValue, setSliderValue] = useState(zoomToSliderValue(zoomLevel, config))
  const sheetRef = useRef(null)
  const backdropRef = useRef(null)

  // Sync slider with zoom level
  useEffect(() => {
    setSliderValue(zoomToSliderValue(zoomLevel, config))
  }, [zoomLevel, config])

  /**
   * Handle zoom change
   */
  const handleZoomChange = (newZoom) => {
    if (onZoomChange) {
      onZoomChange(newZoom)
    }
  }

  /**
   * Handle slider change
   */
  const handleSliderChange = (e) => {
    const newValue = parseInt(e.target.value)
    setSliderValue(newValue)
    const newZoom = sliderValueToZoom(newValue, config)
    handleZoomChange(newZoom)
  }

  /**
   * Handle preset click
   */
  const handlePresetClick = (presetValue) => {
    handleZoomChange(presetValue)
    setIsMobileSheetOpen(false)
  }

  /**
   * Handle zoom in
   */
  const handleZoomIn = () => {
    const step = config.STEP
    const newZoom = Math.min(config.MAX, zoomLevel + step)
    handleZoomChange(newZoom)
  }

  /**
   * Handle zoom out
   */
  const handleZoomOut = () => {
    const step = config.STEP
    const newZoom = Math.max(config.MIN, zoomLevel - step)
    handleZoomChange(newZoom)
  }

  /**
   * Handle reset
   */
  const handleReset = () => {
    if (onReset) {
      onReset()
    } else {
      handleZoomChange(config.DEFAULT)
    }
    setIsMobileSheetOpen(false)
  }

  /**
   * Open mobile sheet
   */
  const openMobileSheet = () => {
    setIsMobileSheetOpen(true)
    document.body.style.overflow = 'hidden'
  }

  /**
   * Close mobile sheet
   */
  const closeMobileSheet = () => {
    setIsMobileSheetOpen(false)
    document.body.style.overflow = ''
  }

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      closeMobileSheet()
    }
  }

  /**
   * Handle escape key
   */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMobileSheetOpen) {
        closeMobileSheet()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileSheetOpen])

  /**
   * Cleanup body overflow
   */
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const zoomPercentage = getZoomPercentage(zoomLevel)
  const atMin = isMinZoom(zoomLevel, config)
  const atMax = isMaxZoom(zoomLevel, config)
  const atDefault = isDefaultZoom(zoomLevel, config)

  return (
    <div className={`zoom-controls-wrapper ${className}`}>
      {/* Desktop Controls */}
      <div className="zoom-controls-desktop">
        <div className="zoom-buttons-group">
          <button
            className="zoom-btn zoom-out-btn"
            onClick={handleZoomOut}
            disabled={atMin}
            aria-label={`Zoom out (current: ${zoomPercentage}%)`}
            aria-disabled={atMin}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>

          <div className="zoom-level-display" aria-live="polite" aria-atomic="true">
            {zoomPercentage}%
          </div>

          <button
            className="zoom-btn zoom-in-btn"
            onClick={handleZoomIn}
            disabled={atMax}
            aria-label={`Zoom in (current: ${zoomPercentage}%)`}
            aria-disabled={atMax}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>

          {!atDefault && (
            <button
              className="zoom-btn zoom-reset-btn"
              onClick={handleReset}
              aria-label="Reset zoom to 100%"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M3 21v-5h5"></path>
              </svg>
            </button>
          )}
        </div>

        {showSlider && (
          <div className="zoom-slider-wrapper">
            <label htmlFor="zoom-slider" className="zoom-slider-label">
              Zoom: {zoomPercentage}%
            </label>
            <input
              id="zoom-slider"
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={handleSliderChange}
              className="zoom-slider"
              aria-label="Zoom level"
              aria-valuemin={getZoomPercentage(config.MIN)}
              aria-valuemax={getZoomPercentage(config.MAX)}
              aria-valuenow={zoomPercentage}
              aria-valuetext={`${zoomPercentage}%`}
            />
            <div className="zoom-slider-labels">
              <span>{getZoomPercentage(config.MIN)}%</span>
              <span>{getZoomPercentage(config.MAX)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Button */}
      <button
        className="zoom-controls-mobile-button"
        onClick={openMobileSheet}
        aria-label={`Zoom controls (current: ${zoomPercentage}%)`}
        aria-expanded={isMobileSheetOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="11" y1="7" x2="11" y2="15"></line>
          <line x1="7" y1="11" x2="15" y2="11"></line>
        </svg>
        <span>{zoomPercentage}%</span>
      </button>

      {/* Mobile Bottom Sheet */}
      {isMobileSheetOpen && (
        <>
          <div
            ref={backdropRef}
            className="zoom-sheet-backdrop"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
          <div
            ref={sheetRef}
            className="zoom-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Zoom controls"
          >
            <div className="zoom-sheet-header">
              <h3>Zoom Controls</h3>
              <button
                className="zoom-sheet-close"
                onClick={closeMobileSheet}
                aria-label="Close zoom controls"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="zoom-sheet-content">
              {/* Current Zoom Display */}
              <div className="zoom-sheet-current">
                <div className="zoom-sheet-percentage">{zoomPercentage}%</div>
                <div className="zoom-sheet-status">
                  {atDefault && 'Default zoom'}
                  {atMin && 'Minimum zoom'}
                  {atMax && 'Maximum zoom'}
                  {!atDefault && !atMin && !atMax && 'Custom zoom'}
                </div>
              </div>

              {/* Slider */}
              {showSlider && (
                <div className="zoom-sheet-slider-wrapper">
                  <label htmlFor="zoom-sheet-slider" className="zoom-sheet-slider-label">
                    Adjust zoom level
                  </label>
                  <input
                    id="zoom-sheet-slider"
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    onChange={handleSliderChange}
                    className="zoom-sheet-slider"
                    aria-label="Zoom level"
                    aria-valuemin={getZoomPercentage(config.MIN)}
                    aria-valuemax={getZoomPercentage(config.MAX)}
                    aria-valuenow={zoomPercentage}
                  />
                  <div className="zoom-sheet-slider-labels">
                    <span>{getZoomPercentage(config.MIN)}%</span>
                    <span>{getZoomPercentage(config.MAX)}%</span>
                  </div>
                </div>
              )}

              {/* Preset Buttons */}
              {showPresets && (
                <div className="zoom-sheet-presets">
                  <div className="zoom-sheet-presets-label">Quick zoom:</div>
                  <div className="zoom-sheet-presets-grid">
                    {ZOOM_PRESETS.map(preset => (
                      <button
                        key={preset.value}
                        className={`zoom-preset-btn ${Math.abs(zoomLevel - preset.value) < 0.01 ? 'active' : ''}`}
                        onClick={() => handlePresetClick(preset.value)}
                        aria-pressed={Math.abs(zoomLevel - preset.value) < 0.01}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="zoom-sheet-actions">
                <button
                  className="zoom-action-btn zoom-action-out"
                  onClick={handleZoomOut}
                  disabled={atMin}
                  aria-disabled={atMin}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Zoom Out</span>
                </button>

                <button
                  className="zoom-action-btn zoom-action-reset"
                  onClick={handleReset}
                  disabled={atDefault}
                  aria-disabled={atDefault}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                    <path d="M3 21v-5h5"></path>
                  </svg>
                  <span>Reset</span>
                </button>

                <button
                  className="zoom-action-btn zoom-action-in"
                  onClick={handleZoomIn}
                  disabled={atMax}
                  aria-disabled={atMax}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Zoom In</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ZoomControls

