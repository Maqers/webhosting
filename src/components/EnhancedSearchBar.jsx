import { useState, useEffect, useRef, useCallback, useMemo, useId } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { searchProducts, highlightMatch } from '../utils/search'
import { categories } from '../data/catalog'
import ImageWithFallback from './ImageWithFallback'
import { trackEvent } from '../utils/analytics'
import './SearchBar.css'

/**
 * Search field with a live suggestion dropdown.
 *
 * The dropdown previously only appeared between 769px and 968px wide: the
 * component refused to compute suggestions at <=768px ("no dropdown on mobile")
 * while SearchBar.css hid it outright at >=969px. On a phone and on a desktop —
 * the two cases that actually matter — typing produced no feedback of any kind,
 * and the form deliberately rendered no submit button, so there was nothing to
 * press either. Suggestions now run at every width and there is a real submit
 * control.
 *
 * Navigation lives here and only here. Previously executeSearch() navigated and
 * then handed the same results to onSearch, whose Navbar implementation
 * navigated a second time with identical state.
 */

const DEBOUNCE_MS = 160
const MAX_SUGGESTIONS = 8

const EnhancedSearchBar = ({ onSearch, autoFocus = false }) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)
  const listboxId = useId()

  const categoryNameById = useMemo(() => {
    const map = new Map()
    categories.forEach(c => map.set(c.id, c.name))
    return map
  }, [])

  const sanitize = useCallback(
    q => (q || '').trim().replace(/[^\w\s\-'.,!?&]/gi, '').replace(/\s+/g, ' ').slice(0, 100),
    []
  )

  const isValid = useCallback(q => q.length >= 1 && /\w/.test(q), [])

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
    return undefined
  }, [autoFocus])

  /* ---- live suggestions, at every viewport width ---- */
  useEffect(() => {
    const q = sanitize(query)
    if (!isValid(q)) {
      setSuggestions(null)
      setIsOpen(false)
      setActiveIndex(-1)
      return undefined
    }

    debounceRef.current = setTimeout(() => {
      try {
        const products = searchProducts(q, { limit: MAX_SUGGESTIONS, minScore: 5 })
        setSuggestions({ products, query: q })
        setIsOpen(true)
        setActiveIndex(-1)
      } catch {
        setSuggestions({ products: [], query: q })
        setIsOpen(true)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(debounceRef.current)
  }, [query, sanitize, isValid])

  const products = suggestions?.products ?? []

  const runSearch = useCallback(
    rawQuery => {
      const q = sanitize(rawQuery)
      if (!isValid(q)) return

      const results = searchProducts(q, { limit: 50, minScore: 3 })
      const payload = {
        query: q,
        products: results,
        all: results,
        totalResults: results.length,
        hasResults: results.length > 0,
      }

      trackEvent('SearchPerformed', { query: q, result_count: results.length })
      setIsOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()

      navigate('/products', {
        state: { searchQuery: q, searchResults: payload },
        replace: location.pathname === '/products',
      })
      onSearch?.(payload)
    },
    [sanitize, isValid, navigate, location.pathname, onSearch]
  )

  const openProduct = useCallback(
    product => {
      setIsOpen(false)
      setActiveIndex(-1)
      setQuery('')
      inputRef.current?.blur()
      navigate(`/product/${product.slug}`)
      onSearch?.({ query: '', products: [], hasResults: false, navigatedToProduct: true })
    },
    [navigate, onSearch]
  )

  const handleClear = useCallback(() => {
    setQuery('')
    setSuggestions(null)
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
    // Clearing used to leave the previous results on screen, because Products
    // reads its filter from location.state and nothing reset it.
    onSearch?.({ cleared: true, query: '', products: [], hasResults: false })
  }, [onSearch])

  const handleKeyDown = e => {
    if (e.key === 'ArrowDown' && products.length) {
      e.preventDefault()
      setIsOpen(true)
      setActiveIndex(i => (i < products.length - 1 ? i + 1 : 0))
    } else if (e.key === 'ArrowUp' && products.length) {
      e.preventDefault()
      setActiveIndex(i => (i > 0 ? i - 1 : products.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && products[activeIndex]) openProduct(products[activeIndex])
      else runSearch(query)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  /* ---- close on outside click ---- */
  useEffect(() => {
    if (!isOpen) return undefined
    const fn = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', fn, true)
    return () => document.removeEventListener('mousedown', fn, true)
  }, [isOpen])

  /* ---- reset when navigating somewhere that isn't this search's results ---- */
  useEffect(() => {
    const stateQuery = location.state?.searchQuery
    if (stateQuery) return
    setQuery('')
    setSuggestions(null)
    setIsOpen(false)
    setActiveIndex(-1)
  }, [location.pathname, location.state?.searchQuery])

  const trimmed = sanitize(query)
  const showDropdown = isOpen && isValid(trimmed) && suggestions !== null

  return (
    <div className="search-bar-container" ref={containerRef}>
      <form
        className="search-form"
        role="search"
        onSubmit={e => {
          e.preventDefault()
          runSearch(query)
        }}
      >
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <input
            ref={inputRef}
            type="search"
            className="search-input"
            placeholder="Search for gifts, candles, hampers…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (products.length) setIsOpen(true) }}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
            aria-label="Search products"
            autoComplete="off"
            enterKeyHint="search"
          />

          {query && (
            <button type="button" className="clear-search" onClick={handleClear} aria-label="Clear search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* There was previously no submit control at all, so on a phone the only
            way to search was the on-screen keyboard's Go key. */}
        <button type="submit" className="search-submit" disabled={!isValid(trimmed)} aria-label="Search">
          <span className="search-submit-text">Search</span>
          <svg className="search-submit-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </form>

      {showDropdown && (
        <div className="search-suggestions" id={listboxId} role="listbox" aria-label="Search suggestions">
          {products.length > 0 ? (
            <>
              {products.map((product, i) => (
                <button
                  key={product.id}
                  id={`${listboxId}-opt-${i}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === i}
                  className={`suggestion-item${activeIndex === i ? ' selected' : ''}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => openProduct(product)}
                >
                  <span className="suggestion-thumb">
                    <ImageWithFallback src={product.images[0]} alt="" />
                  </span>
                  <span className="suggestion-info">
                    <span
                      className="suggestion-title"
                      dangerouslySetInnerHTML={{ __html: highlightMatch(product.title, trimmed) }}
                    />
                    <span className="suggestion-meta">
                      <span>{categoryNameById.get(product.categoryId) || product.category || 'Gift'}</span>
                      <span aria-hidden="true">•</span>
                      <span>₹{product.price.toLocaleString('en-IN')}</span>
                    </span>
                  </span>
                </button>
              ))}
              <button type="button" className="suggestion-view-all" onClick={() => runSearch(query)}>
                See everything for “{trimmed}”
              </button>
            </>
          ) : (
            <div className="search-empty-state">
              <p>No matches for “{trimmed}”</p>
              <p className="search-empty-hint">Try a different word, or browse the categories.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedSearchBar
