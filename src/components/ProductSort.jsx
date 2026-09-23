/**
 * PRODUCT SORT COMPONENT
 * 
 * Mobile-first, accessible sorting control
 * - Desktop: Dropdown select
 * - Mobile: Bottom sheet modal
 * - URL query param persistence
 * - Keyboard accessible
 */

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SORT_TYPES, SORT_LABELS, DEFAULT_SORT, getSortOptions } from '../utils/sorting'
import { trackEvent } from '../utils/analytics'
import { useScrollLock } from '../hooks/useScrollLock'
import './ProductSort.css'

const ProductSort = ({ onSortChange, className = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const sheetRef = useRef(null)

  useScrollLock(isMobileSheetOpen)
  const backdropRef = useRef(null)

  // Get sort from URL or default
  const currentSort = searchParams.get('sort') || DEFAULT_SORT
  const sortOptions = getSortOptions()

  /**
   * Handle sort change
   */
  const handleSortChange = (newSort) => {
    // Validate sort type
    const validSort = Object.values(SORT_TYPES).includes(newSort) 
      ? newSort 
      : DEFAULT_SORT

    // Close mobile sheet FIRST to restore scrolling immediately
    closeMobileSheet()

    // Update URL
    const newParams = new URLSearchParams(searchParams)
    if (validSort === DEFAULT_SORT) {
      newParams.delete('sort')
    } else {
      newParams.set('sort', validSort)
    }
    setSearchParams(newParams, { replace: true })

    trackEvent('ProductsSorted', { sort_by: validSort })

    // Notify parent
    if (onSortChange) {
      onSortChange(validSort)
    }
  }

  // Both handlers used to branch on a /iPhone|iPad|iPod/ user-agent test, which
  // has been wrong for iPads since iOS 13 (they report as "Macintosh"), and the
  // iOS branch then reached into .products-grid to force visibility back on.
  // useScrollLock handles all of it in one place.
  const openMobileSheet = () => setIsMobileSheetOpen(true)
  const closeMobileSheet = () => setIsMobileSheetOpen(false)

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

  // The two defensive cleanup effects that used to live here (an unmount reset
  // and a rAF that re-forced body overflow on iOS) are unnecessary now: the lock
  // is reference-counted and releases itself in useScrollLock's cleanup.

  return (
    <div className={`product-sort ${className}`}>
      {/* Desktop Dropdown */}
      <div className="product-sort-desktop">
        <label htmlFor="sort-select" className="sort-label">
          Sort by:
        </label>
        <select
          id="sort-select"
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="sort-select"
          aria-label="Sort products"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile Button */}
      <button
        className="product-sort-mobile-button"
        onClick={openMobileSheet}
        aria-label="Sort products"
        aria-expanded={isMobileSheetOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M7 12h10M11 18h2" />
        </svg>
        <span>{SORT_LABELS[currentSort] || SORT_LABELS[DEFAULT_SORT]}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Mobile Bottom Sheet */}
      {isMobileSheetOpen && (
        <>
          <div
            ref={backdropRef}
            className="sort-sheet-backdrop"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
          <div
            ref={sheetRef}
            className="sort-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Sort products"
          >
            <div className="sort-sheet-header">
              <h3>Sort Products</h3>
              <button
                className="sort-sheet-close"
                onClick={closeMobileSheet}
                aria-label="Close sort options"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="sort-sheet-content">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  className={`sort-option ${currentSort === option.value ? 'active' : ''}`}
                  onClick={() => handleSortChange(option.value)}
                  aria-pressed={currentSort === option.value}
                >
                  <span>{option.label}</span>
                  {currentSort === option.value && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ProductSort

