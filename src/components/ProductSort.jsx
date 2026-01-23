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
import './ProductSort.css'

const ProductSort = ({ onSortChange, className = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const sheetRef = useRef(null)
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

    // Notify parent
    if (onSortChange) {
      onSortChange(validSort)
    }
  }

  /**
   * Open mobile sheet
   */
  const openMobileSheet = () => {
    setIsMobileSheetOpen(true)
    
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // iPhone: Store scroll position and prevent scrolling
      const scrollY = window.scrollY
      document.body.classList.add('sort-modal-open')
      document.documentElement.classList.add('sort-modal-open')
      // Store scroll position for restoration
      document.body.style.top = `-${scrollY}px`
      document.body.dataset.scrollY = scrollY.toString()
    } else {
      // Non-iPhone devices
      document.body.classList.add('sort-modal-open')
      document.body.style.overflow = 'hidden'
    }
  }

  /**
   * Close mobile sheet
   */
  const closeMobileSheet = () => {
    setIsMobileSheetOpen(false)
    
    // iPhone fix: Restore scrolling immediately
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Restore scroll position
      const scrollY = document.body.dataset.scrollY || '0'
      
      // Remove classes immediately
      document.body.classList.remove('sort-modal-open')
      document.documentElement.classList.remove('sort-modal-open')
      
      // Reset all styles
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.overflow = ''
      document.body.style.width = ''
      document.body.style.height = ''
      delete document.body.dataset.scrollY
      
      // Reset html styles
      document.documentElement.style.overflow = ''
      document.documentElement.style.position = ''
      
      // Restore scroll position and ensure scrolling works
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(scrollY, 10))
        
        // Ensure products are visible
        const productsGrid = document.querySelector('.products-grid')
        const productsPage = document.querySelector('.products-page')
        const productsContent = document.querySelector('.products-content')
        
        if (productsGrid) {
          productsGrid.style.visibility = 'visible'
          productsGrid.style.opacity = '1'
        }
        
        if (productsPage) {
          productsPage.style.overflow = ''
          productsPage.style.position = 'relative'
        }
        
        if (productsContent) {
          productsContent.style.overflow = ''
          productsContent.style.position = 'relative'
        }
        
        // Force scrolling to work by ensuring body is scrollable
        requestAnimationFrame(() => {
          // Verify scrolling is restored
          document.body.style.overflow = 'auto'
          document.body.style.overflowX = 'hidden'
          document.body.style.overflowY = 'auto'
          // Force reflow
          void document.body.offsetHeight
        })
      })
    } else {
      // For non-iPhone devices
      document.body.classList.remove('sort-modal-open')
      document.body.style.overflow = ''
    }
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
   * Cleanup body overflow on unmount
   */
  useEffect(() => {
    return () => {
      // Ensure cleanup on unmount
      document.body.classList.remove('sort-modal-open')
      document.documentElement.classList.remove('sort-modal-open')
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.height = ''
      if (document.body.dataset.scrollY) {
        window.scrollTo(0, parseInt(document.body.dataset.scrollY, 10))
        delete document.body.dataset.scrollY
      }
      document.documentElement.style.overflow = ''
      document.documentElement.style.position = ''
    }
  }, [])
  
  /**
   * Additional cleanup: Ensure scrolling is restored if modal is closed externally
   */
  useEffect(() => {
    if (!isMobileSheetOpen) {
      // Modal is closed, ensure scrolling is restored
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        requestAnimationFrame(() => {
          if (!document.body.classList.contains('sort-modal-open')) {
            document.body.style.position = ''
            document.body.style.top = ''
            document.body.style.overflow = 'auto'
            document.body.style.overflowX = 'hidden'
            document.body.style.overflowY = 'auto'
            document.documentElement.style.overflow = ''
            if (document.body.dataset.scrollY) {
              delete document.body.dataset.scrollY
            }
          }
        })
      }
    }
  }, [isMobileSheetOpen])

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

