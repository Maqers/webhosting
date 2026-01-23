/**
 * ENHANCED SEARCH BAR COMPONENT
 * 
 * Senior-level search implementation with:
 * - Product-only search (no categories in dropdown)
 * - Proper regex validation for search queries
 * - Enhanced focus management
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Text highlighting
 * - Clean dropdown UI
 * - Professional UX
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { searchProducts, highlightMatch } from '../utils/search'
import { categories } from '../data/catalog'
import ImageWithFallback from './ImageWithFallback'
import './SearchBar.css'

const EnhancedSearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef(null)
  const resultsRef = useRef(null)
  const debounceTimerRef = useRef(null)
  const previousPathnameRef = useRef(location.pathname)

  /**
   * Validate and sanitize search query using regex
   * Only allows alphanumeric characters, spaces, hyphens, and common punctuation
   * Removes invalid characters and excessive whitespace
   */
  const validateAndSanitizeQuery = useCallback((query) => {
    if (!query) return ''

    // Remove leading/trailing whitespace
    let sanitized = query.trim()

    // Remove any characters that could cause regex issues or are invalid
    // Allow: letters, numbers, spaces, hyphens, apostrophes, and common punctuation
    sanitized = sanitized.replace(/[^\w\s\-'.,!?]/gi, '')

    // Replace multiple spaces with single space
    sanitized = sanitized.replace(/\s+/g, ' ')

    // Limit query length to prevent performance issues
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100).trim()
    }

    return sanitized
  }, [])

  /**
   * Check if query is valid for searching
   * Minimum 1 character, must contain at least one letter or number
   */
  const isValidQuery = useCallback((query) => {
    if (!query || query.trim().length < 1) return false

    // Must contain at least one alphanumeric character
    const hasValidChars = /[\w]/.test(query.trim())

    return hasValidChars
  }, [])

  /**
   * Perform search with debouncing and validation
   * Enhanced debouncing: 300ms delay for better UX and performance
   * Only searches products (no categories in dropdown)
   */
  const performSearch = useCallback((query) => {
    // Validate and sanitize query
    const sanitizedQuery = validateAndSanitizeQuery(query)

    if (!isValidQuery(sanitizedQuery)) {
      setSearchResults(null)
      setShowResults(false)
      if (onSearch) {
        onSearch({ products: [], all: [], totalResults: 0, hasResults: false })
      }
      return
    }

    setIsLoading(true)

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Enhanced debouncing: 300ms delay for smoother UX
    debounceTimerRef.current = setTimeout(() => {
      try {
        // Only search products, not categories
        const productResults = searchProducts(sanitizedQuery, {
          limit: 10, // Show more products since we're not showing categories
          minScore: 5 // Higher threshold for better quality results
        })

        // Format results to match expected structure
        const results = {
          products: productResults,
          all: productResults, // Only products in dropdown
          totalResults: productResults.length,
          hasResults: productResults.length > 0,
          query: sanitizedQuery
        }

        setSearchResults(results)
        setShowResults(true)
        setSelectedIndex(-1)
        setIsLoading(false)

        // Focus management: ensure input stays focused
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus()
        }

        if (onSearch) {
          onSearch(results)
        }
      } catch (error) {
        console.error('Search error:', error)
        setIsLoading(false)
        setSearchResults({ products: [], all: [], totalResults: 0, hasResults: false })
        if (onSearch) {
          onSearch({ products: [], all: [], totalResults: 0, hasResults: false })
        }
      }
    }, 300) // 300ms debounce for optimal performance and UX
  }, [onSearch, validateAndSanitizeQuery, isValidQuery])

  /**
   * Handle input change with validation
   */
  const handleInputChange = (e) => {
    const value = e.target.value
    const sanitized = validateAndSanitizeQuery(value)
    setSearchQuery(sanitized)
    performSearch(sanitized)
  }

  /**
   * Handle keyboard navigation with improved focus management
   */
  const handleKeyDown = (e) => {
    if (!searchResults || !showResults) {
      // Allow normal typing if dropdown is closed
      return
    }

    const allResults = searchResults.all || []
    const maxIndex = allResults.length - 1

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        e.stopPropagation()
        if (maxIndex >= 0) {
          const newIndex = selectedIndex < maxIndex ? selectedIndex + 1 : 0
          setSelectedIndex(newIndex)
          // Ensure focus stays on input for better UX
          inputRef.current?.focus()
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        e.stopPropagation()
        if (maxIndex >= 0) {
          const newIndex = selectedIndex > 0 ? selectedIndex - 1 : maxIndex
          setSelectedIndex(newIndex)
          // Ensure focus stays on input for better UX
          inputRef.current?.focus()
        }
        break

      case 'Enter':
        e.preventDefault()
        e.stopPropagation()
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          handleResultClick(allResults[selectedIndex])
        } else if (isValidQuery(searchQuery)) {
          // Navigate to search results page with validated query
          const sanitizedQuery = validateAndSanitizeQuery(searchQuery)
          // Only navigate if not already on products page
          if (location.pathname !== '/products') {
            navigate('/products', {
              state: { searchQuery: sanitizedQuery },
              replace: false
            })
          }
          setShowResults(false)
        }
        break

      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        setShowResults(false)
        setSelectedIndex(-1)
        // Keep focus on input for better UX
        inputRef.current?.focus()
        break

      default:
        break
    }
  }

  /**
   * Handle result click - only products now
   */
  const handleResultClick = (item) => {
    // Only handle products (categories removed from dropdown)
    if (item._type === 'product' || !item._type) {
      // Navigate to product page
      navigate(`/product/${item.id}`)
    }

    // Close dropdown and reset state
    setShowResults(false)
    setSearchQuery('')
    setSelectedIndex(-1)

    // Maintain focus for better UX
    setTimeout(() => {
      inputRef.current?.blur()
    }, 100)
  }

  /**
   * Clear search with focus management
   */
  const handleClear = () => {
    setSearchQuery('')
    setSearchResults(null)
    setShowResults(false)
    setSelectedIndex(-1)
    if (onSearch) {
      onSearch({ products: [], all: [], totalResults: 0, hasResults: false })
    }
    // Maintain focus on input for better UX
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  /**
   * Handle form submit with validation
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    const sanitizedQuery = validateAndSanitizeQuery(searchQuery)

    if (isValidQuery(sanitizedQuery)) {
      // Perform search and navigate with results (products only)
      const productResults = searchProducts(sanitizedQuery, {
        limit: 50,
        minScore: 3
      })

      const results = {
        products: productResults,
        all: productResults,
        totalResults: productResults.length,
        hasResults: productResults.length > 0,
        query: sanitizedQuery
      }

      // Only navigate if not already on products page to prevent throttling
      if (location.pathname !== '/products') {
        navigate('/products', {
          state: {
            searchQuery: sanitizedQuery,
            searchResults: results
          },
          replace: false
        })
      } else {
        // Update URL state without navigation if already on products page
        window.history.replaceState(
          { searchQuery: sanitizedQuery, searchResults: results },
          '',
          location.pathname
        )
      }

      setShowResults(false)
      if (onSearch) {
        onSearch(results)
      }
    }
  }

  /**
   * Close results when clicking outside
   * Enhanced: Also handle scroll and resize events
   * Prevent body scroll when dropdown is open on mobile
   * Improved focus management
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowResults(false)
        setSelectedIndex(-1)
        // Maintain focus on input if it was focused
        if (document.activeElement === inputRef.current ||
          inputRef.current.contains(document.activeElement)) {
          inputRef.current.focus()
        }
      }
    }

    const handleResize = () => {
      // Recalculate dropdown position on resize
      if (showResults && resultsRef.current) {
        // Trigger reflow to ensure correct positioning
        const wasVisible = resultsRef.current.style.display !== 'none'
        resultsRef.current.style.display = 'none'
        setTimeout(() => {
          if (resultsRef.current && wasVisible) {
            resultsRef.current.style.display = ''
          }
        }, 0)
      }
    }

    // Prevent body scroll when dropdown is open on mobile
    if (showResults) {
      const originalOverflow = document.body.style.overflow
      const isMobile = window.matchMedia('(max-width: 768px)').matches

      if (isMobile) {
        // Prevent body scroll but allow dropdown scroll
        document.body.style.overflow = 'hidden'
      }

      // Ensure input maintains focus when dropdown is open
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus()
      }

      document.addEventListener('mousedown', handleClickOutside, true)
      window.addEventListener('resize', handleResize)

      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true)
        window.removeEventListener('resize', handleResize)
        if (isMobile) {
          document.body.style.overflow = originalOverflow
        }
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [showResults])

  /**
   * Clear search bar when navigating to different pages
   * This ensures the search query doesn't persist when user changes pages
   */
  useEffect(() => {
    // Only clear if pathname actually changed (not on initial mount or same page)
    if (previousPathnameRef.current !== location.pathname) {
      // Clear search state when location changes
      setSearchQuery('')
      setSearchResults(null)
      setShowResults(false)
      setSelectedIndex(-1)

      // Clear any pending debounce timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      // Update previous pathname
      previousPathnameRef.current = location.pathname
    }
    // Removed onSearch callback to prevent infinite loop
    // Parent component doesn't need to be notified on every route change
  }, [location.pathname]) // Only depend on pathname, not onSearch

  /**
   * Scroll selected item into view
   */
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      )
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }
    }
  }, [selectedIndex])

  /**
   * Calculate and update dropdown position dynamically
   * Ensures dropdown aligns with search input and appears above all elements
   */
  useEffect(() => {
    if (!showResults || !resultsRef.current || !inputRef.current) return

    const updatePosition = () => {
      const input = inputRef.current
      const dropdown = resultsRef.current
      const container = input?.closest('.search-bar-container')

      if (!input || !dropdown || !container) return

      const inputRect = input.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const scrollY = window.scrollY || window.pageYOffset

      // Calculate position: below search input, aligned with container
      let topPosition = inputRect.bottom + 8 // 8px gap below input
      let leftPosition = containerRect.left
      let containerWidth = containerRect.width

      // Ensure dropdown doesn't go off-screen
      const isMobile = window.matchMedia('(max-width: 768px)').matches
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Adjust left position if dropdown would overflow right edge
      if (leftPosition + containerWidth > viewportWidth - 8) {
        leftPosition = Math.max(8, viewportWidth - containerWidth - 8)
      }

      // Ensure minimum left margin on mobile
      if (isMobile && leftPosition < 8) {
        leftPosition = 8
        containerWidth = Math.min(containerWidth, viewportWidth - 16)
      }

      // Adjust width to fit viewport
      const maxWidth = isMobile
        ? Math.min(containerWidth, viewportWidth - 16) // 16px padding
        : Math.min(containerWidth, 700) // Max 700px on desktop

      // Ensure dropdown doesn't overflow bottom of viewport
      const dropdownMaxHeight = parseInt(getComputedStyle(dropdown).maxHeight) || 400
      const availableHeight = viewportHeight - topPosition - 8 // 8px bottom margin
      if (availableHeight < dropdownMaxHeight) {
        dropdown.style.maxHeight = `${Math.max(200, availableHeight)}px`
      } else {
        dropdown.style.maxHeight = ''
      }

      dropdown.style.top = `${topPosition}px`
      dropdown.style.left = `${leftPosition}px`
      dropdown.style.width = `${maxWidth}px`
      dropdown.style.maxWidth = `${maxWidth}px`
    }

    // Initial position calculation
    const timeoutId = setTimeout(updatePosition, 0)

    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [showResults, searchQuery])

  const allResults = searchResults?.all || []
  const hasResults = searchResults?.hasResults || allResults.length > 0
  const hasQuery = searchQuery.trim().length >= 1

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>

          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (hasQuery && searchResults) {
                setShowResults(true)
                // Ensure focus is maintained
                inputRef.current?.focus()
              }
            }}
            aria-label="Search products"
            aria-expanded={showResults}
            aria-controls="search-results"
            autoComplete="off"
          />

          {isLoading && (
            <div className="search-loading" aria-label="Searching">
              <div className="search-spinner"></div>
            </div>
          )}

          {searchQuery && !isLoading && (
            <button
              type="button"
              className="clear-search"
              onClick={handleClear}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <button
          type="submit"
          className="search-submit-btn"
          aria-label="Submit search"
        >
          Search
        </button>
      </form>

      {/* Search Results Dropdown */}
      {showResults && hasQuery && (
        <div
          id="search-results"
          ref={resultsRef}
          className="search-suggestions"
          role="listbox"
          aria-label="Search results"
        >
          {hasResults ? (
            <>
              {/* Products Only Section - No Categories */}
              {searchResults.products.length > 0 && (
                <div className="search-results-section">
                  <div className="search-results-header">
                    Products ({searchResults.products.length})
                  </div>
                  {searchResults.products.map((product, idx) => {
                    const globalIndex = allResults.indexOf(product)
                    return (
                      <div
                        key={product.id}
                        data-index={globalIndex}
                        className={`suggestion-item ${selectedIndex === globalIndex ? 'selected' : ''
                          }`}
                        onClick={() => handleResultClick(product)}
                        role="option"
                        aria-selected={selectedIndex === globalIndex}
                        tabIndex={-1}
                      >
                        <ImageWithFallback
                          src={product.images[0]}
                          alt={product.title}
                          className="suggestion-image"
                        />
                        <div className="suggestion-info">
                          <div
                            className="suggestion-title"
                            dangerouslySetInnerHTML={{
                              __html: highlightMatch(product.title, searchQuery)
                            }}
                          />
                          <div className="suggestion-meta">
                            <span>{(() => {
                              // Get category name from categoryId
                              if (product.categoryId) {
                                const category = categories.find(cat => cat.id === product.categoryId)
                                return category ? category.name : 'Product'
                              }
                              // Fallback for legacy products
                              return product.category || 'Product'
                            })()}</span>
                            <span>•</span>
                            <span>₹{product.price}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="search-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <p>No results found for "{searchQuery}"</p>
              <p className="search-empty-hint">Try different keywords or browse categories</p>
              <div className="search-suggestions-help">
                <p className="search-help-title">Search tips:</p>
                <ul className="search-help-list">
                  <li>Try synonyms (e.g., "house" for home decor)</li>
                  <li>Use singular or plural forms</li>
                  <li>Check spelling or try shorter keywords</li>
                  <li>Browse categories to discover products</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedSearchBar

