import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { searchProducts, highlightMatch } from '../utils/search'
import { categories } from '../data/catalog'
import ImageWithFallback from './ImageWithFallback'
import './SearchBar.css'

const EnhancedSearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery]     = useState('')
  const [showResults, setShowResults]     = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const navigate   = useNavigate()
  const location   = useLocation()
  const inputRef   = useRef(null)
  const resultsRef = useRef(null)
  const timerRef   = useRef(null)
  const prevPathRef = useRef(location.pathname)

  const sanitize = useCallback((q) => {
    if (!q) return ''
    return q.trim().replace(/[^\w\s\-'.,!?]/gi, '').replace(/\s+/g, ' ').substring(0, 100)
  }, [])

  const isValid = useCallback((q) => q && q.trim().length >= 1 && /[\w]/.test(q), [])

  // Updates dropdown suggestions only — never navigates
  const updateSuggestions = useCallback((q) => {
    const sq = sanitize(q)
    if (!isValid(sq)) { setSearchResults(null); setShowResults(false); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        const prods = searchProducts(sq, { limit: 10, minScore: 5 })
        setSearchResults({ products: prods, all: prods, totalResults: prods.length, hasResults: prods.length > 0, query: sq })
        setShowResults(true); setSelectedIndex(-1)
      } catch { setSearchResults(null) }
    }, 150)
  }, [sanitize, isValid])

  // Navigate — only on explicit Enter or result click
  const executeSearch = useCallback((q) => {
    const sq = sanitize(q)
    if (!isValid(sq)) return
    const prods = searchProducts(sq, { limit: 50, minScore: 3 })
    const results = { products: prods, all: prods, totalResults: prods.length, hasResults: prods.length > 0, query: sq }
    navigate('/products', { state: { searchQuery: sq, searchResults: results }, replace: location.pathname === '/products' })
    setShowResults(false)
    if (onSearch) onSearch(results)
  }, [sanitize, isValid, navigate, location.pathname, onSearch])

  const handleInputChange = (e) => {
    const v = sanitize(e.target.value)
    setSearchQuery(v); updateSuggestions(v)
  }

  const handleResultClick = (item) => {
    navigate(`/product/${item.id}`)
    setShowResults(false); setSearchQuery(''); setSelectedIndex(-1)
    setTimeout(() => inputRef.current?.blur(), 100)
  }

  const handleKeyDown = (e) => {
    const all = searchResults?.all || []
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (all.length) setSelectedIndex(i => i < all.length - 1 ? i + 1 : 0); break
      case 'ArrowUp':   e.preventDefault(); if (all.length) setSelectedIndex(i => i > 0 ? i - 1 : all.length - 1); break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && all[selectedIndex]) handleResultClick(all[selectedIndex])
        else if (isValid(searchQuery)) executeSearch(searchQuery)
        break
      case 'Escape': e.preventDefault(); setShowResults(false); setSelectedIndex(-1); break
      default: break
    }
  }

  const handleClear = () => {
    setSearchQuery(''); setSearchResults(null); setShowResults(false); setSelectedIndex(-1)
    if (onSearch) onSearch({ products: [], all: [], totalResults: 0, hasResults: false })
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSubmit = (e) => { e.preventDefault(); executeSearch(searchQuery) }

  // Outside click
  useEffect(() => {
    if (!showResults) return
    const fn = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) {
        setShowResults(false); setSelectedIndex(-1)
      }
    }
    document.addEventListener('mousedown', fn, true)
    return () => document.removeEventListener('mousedown', fn, true)
  }, [showResults])

  // Clear on route change
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setSearchQuery(''); setSearchResults(null); setShowResults(false); setSelectedIndex(-1)
      if (timerRef.current) clearTimeout(timerRef.current)
      prevPathRef.current = location.pathname
    }
  }, [location.pathname])

  // Scroll selected item
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const el = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedIndex])

  // Dropdown position
  useEffect(() => {
    if (!showResults || !resultsRef.current || !inputRef.current) return
    const update = () => {
      const inp = inputRef.current, drop = resultsRef.current
      const container = inp?.closest('.search-bar-container')
      if (!inp || !drop || !container) return
      const iRect = inp.getBoundingClientRect(), cRect = container.getBoundingClientRect()
      const vw = window.innerWidth, isMobile = vw <= 768
      let left = cRect.left, width = cRect.width
      if (left + width > vw - 8) left = Math.max(8, vw - width - 8)
      if (isMobile && left < 8) { left = 8; width = Math.min(width, vw - 16) }
      const maxW = isMobile ? Math.min(width, vw - 16) : Math.min(width, 700)
      drop.style.top = `${iRect.bottom + 8}px`; drop.style.left = `${left}px`
      drop.style.width = `${maxW}px`; drop.style.maxWidth = `${maxW}px`
    }
    const id = setTimeout(update, 0)
    window.addEventListener('scroll', update, true); window.addEventListener('resize', update)
    return () => { clearTimeout(id); window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update) }
  }, [showResults, searchQuery])

  const all = searchResults?.all || []
  const hasQuery = searchQuery.trim().length >= 1

  return (
    <div className="search-bar-container">
      {/* Form exists for Enter-key semantics — no submit button rendered */}
      <form onSubmit={handleSubmit} className="search-form search-form--no-btn">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef} type="text" className="search-input"
            placeholder="Search…" value={searchQuery}
            onChange={handleInputChange} onKeyDown={handleKeyDown}
            onFocus={() => { if (hasQuery && searchResults) setShowResults(true) }}
            aria-label="Search products" aria-expanded={showResults}
            aria-controls="search-results" autoComplete="off"
          />
          {searchQuery && (
            <button type="button" className="clear-search" onClick={handleClear} aria-label="Clear search">×</button>
          )}
        </div>
        {/* No submit button */}
      </form>

      {showResults && hasQuery && (
        <div id="search-results" ref={resultsRef} className="search-suggestions" role="listbox" aria-label="Search results">
          {searchResults?.hasResults ? (
            <div className="search-results-section">
              <div className="search-results-header">Products ({searchResults.products.length})</div>
              {searchResults.products.map((product) => {
                const idx = all.indexOf(product)
                return (
                  <div key={product.id} data-index={idx} className={`suggestion-item ${selectedIndex === idx ? 'selected' : ''}`} onClick={() => handleResultClick(product)} role="option" aria-selected={selectedIndex === idx} tabIndex={-1}>
                    <ImageWithFallback src={product.images[0]} alt={product.title} className="suggestion-image" />
                    <div className="suggestion-info">
                      <div className="suggestion-title" dangerouslySetInnerHTML={{ __html: highlightMatch(product.title, searchQuery) }} />
                      <div className="suggestion-meta">
                        <span>{(() => { const cat = categories.find(c => c.id === product.categoryId); return cat?.name || product.category || 'Product' })()}</span>
                        <span>•</span><span>₹{product.price}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="search-empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <p>No results for "{searchQuery}"</p>
              <p className="search-empty-hint">Try different keywords or browse categories</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedSearchBar