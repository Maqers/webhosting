import { useState, useMemo, useEffect, useRef, memo, useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getAllProducts, getSortedCategories, getProductsByCategory, occasionProductMap } from '../data/catalog'
import { searchAll } from '../utils/search'
import { sortProducts, extractRelevanceScores, SORT_TYPES, DEFAULT_SORT } from '../utils/sorting'
import ProductSort from '../components/ProductSort'
import ImageWithFallback from '../components/ImageWithFallback'
import ProductSkeleton from '../components/ProductSkeleton'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import './Products.css'

let cachedCategories = null
let cachedCategoryMap = null

// First product image per category — used in category circles
const CAT_IMAGES = {
  'Handbags':             '/images/photo-2026-05-12-09-25-50.jpg',
  'Handmade-Accessories': '/images/remove-the-white-text-box-with-kl-53-from-the-imag.jpeg',
  'Candles':              '/images/8.png',
  'Florals':              '/images/remove-the-background-make-it-transparent.jpeg',
  'Wedding-Gifts':        '/images/whatsapp-image-2026-04-17-at-15.22.22.jpeg',
  'Kids-Accessories':     '/images/dsc_8211.jpg',
  'Home-decor':           '/images/28.png',
  'Handmade-Soaps':       '/images/56.png',
  'Customised-Hampers':   '/images/48.png',
  'Cosmetics':            '/images/whatsapp-image-2026-05-01-at-2.16.13-pm-(1).jpeg',
  'resin-products':       '/images/29.png',
  'Charm-accessories':    '/images/enchanted_charm_watch_2.png',
  'Frames&Paintings':     '/images/17.png',
}

const getCachedCategories = () => {
  if (!cachedCategories) cachedCategories = getSortedCategories()
  return cachedCategories
}

const getCachedCategoryMap = () => {
  if (!cachedCategoryMap) {
    const cats = getCachedCategories()
    cachedCategoryMap = new Map(cats.map(cat => [cat.id, cat]))
    // also index by name for legacy lookups
    cats.forEach(cat => {
      if (!cachedCategoryMap.has(cat.name)) cachedCategoryMap.set(cat.name, cat)
    })
  }
  return cachedCategoryMap
}

const ALL_PRODUCTS_MAX = 30000

const PriceRangeFilter = ({ onApply }) => {
  const [min, setMin] = useState(0)
  const [max, setMax] = useState(ALL_PRODUCTS_MAX)
  const [active, setActive] = useState(false)
  const [open, setOpen] = useState(false)

  const handleApply = () => {
    onApply(min, max >= ALL_PRODUCTS_MAX ? Infinity : max)
    setActive(min > 0 || max < ALL_PRODUCTS_MAX)
    setOpen(false)
  }
  const handleReset = () => {
    setMin(0); setMax(ALL_PRODUCTS_MAX)
    onApply(0, Infinity); setActive(false); setOpen(false)
  }

  return (
    <div className="price-filter-wrap" style={{ position: 'relative' }}>
      <button
        className={`price-filter-toggle${active ? ' active' : ''}`}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        Price {active ? `· ₹${min.toLocaleString('en-IN')}–${max >= ALL_PRODUCTS_MAX ? '30k+' : '₹' + max.toLocaleString('en-IN')}` : ''}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 4 }}>
          <path d={open ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
        </svg>
      </button>
      {open && (
        <div className="price-filter-dropdown">
          <div className="price-filter-dropdown-header">
            <span>Price Range</span>
            <span className="price-slider-values">₹{min.toLocaleString('en-IN')} – {max >= ALL_PRODUCTS_MAX ? '₹30,000+' : '₹' + max.toLocaleString('en-IN')}</span>
          </div>
          <div className="price-slider-inputs">
            <input type="range" min={0} max={ALL_PRODUCTS_MAX} step={50} value={min}
              onChange={e => setMin(Math.min(Number(e.target.value), max - 50))}
              className="price-range-input" />
            <input type="range" min={0} max={ALL_PRODUCTS_MAX} step={50} value={max}
              onChange={e => setMax(Math.max(Number(e.target.value), min + 50))}
              className="price-range-input" />
          </div>
          <div className="price-slider-actions">
            <button className="price-filter-apply" onClick={handleApply}>Apply</button>
            {active && <button className="price-filter-clear" onClick={handleReset}>Reset</button>}
          </div>
        </div>
      )}
    </div>
  )
}

const Products = () => {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategories, setSelectedCategories] = useState([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity })

  const sortBy = searchParams.get('sort') || DEFAULT_SORT
  const searchQuery = location.state?.searchQuery
  const searchResults = location.state?.searchResults

  const categories = useMemo(() => getCachedCategories(), [])
  const categoryMap = useMemo(() => getCachedCategoryMap(), [])

  const searchResultsData = useMemo(() => {
    if (searchQuery && searchQuery.trim().length >= 1) {
      return searchAll(searchQuery, { productLimit: 50, categoryLimit: 10 })
    }
    return null
  }, [searchQuery])

  const relevanceScores = useMemo(() => {
    return extractRelevanceScores(searchResultsData || searchResults)
  }, [searchResultsData, searchResults])

  const filteredProducts = useMemo(() => {
    const hasSearch = searchQuery && searchQuery.trim().length >= 1

    let filtered = hasSearch
      ? (searchResultsData?.products ?? searchResults?.products ?? [])
      : getAllProducts()

    if (selectedCategories.length > 0) {
      const occasionSelected = selectedCategories.filter(id => occasionProductMap[id])
      const sourceSelected = selectedCategories.filter(id => !occasionProductMap[id])

      const occasionIds = new Set(
        occasionSelected.flatMap(id => occasionProductMap[id] || [])
      )
      const sourceSet = new Set(sourceSelected)

      filtered = filtered.filter(product => {
        if (occasionSelected.length > 0 && occasionIds.has(product.id)) return true;
        if (sourceSelected.length > 0 && sourceSet.has(product.categoryId)) return true;
        if (sourceSelected.length > 0 && product.meta?.secondaryCategories?.some(c => sourceSet.has(c))) return true;
        return false;
      });
    }

    filtered = sortProducts(filtered, sortBy, {
      searchQuery: searchQuery || null,
      relevanceScores
    })

    // Apply price range filter
    if (priceRange.min > 0 || priceRange.max < Infinity) {
      filtered = filtered.filter(p => p.price >= priceRange.min && p.price <= priceRange.max)
    }

    return filtered
  }, [selectedCategories, sortBy, searchResults, searchResultsData, searchQuery, relevanceScores, priceRange])

  const showSkeletons = filteredProducts.length === 0 && !searchQuery && !searchResults && selectedCategories.length === 0

  const handleCategoryToggle = useCallback((categoryId) => {
    setSelectedCategories(prev => {
      if (categoryId === 'All') return []
      if (prev.includes(categoryId)) return prev.filter(id => id !== categoryId)
      return [...prev, categoryId]
    })
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('page')
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams])

  const handleClearAll = useCallback(() => {
    setSelectedCategories([])
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('page')
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams])

  // Restore category filter from URL param (e.g. when navigating back from product detail)
  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat) {
      setSelectedCategories([cat])
      // Remove from URL so filter chip shows correctly
      setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('category'); return next }, { replace: true })
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    requestAnimationFrame(() => {
      const productsGrid = document.querySelector('.products-grid')
      if (productsGrid) void productsGrid.offsetHeight
      document.querySelectorAll('.feat-card').forEach(card => {
        card.style.visibility = 'visible'
        card.style.opacity = '1'
      })
    })
  }, [sortBy, selectedCategories.length, filteredProducts.length])

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('productsScrollY', window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem('productsScrollY')
    if (saved) {
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(saved, 10))
        sessionStorage.removeItem('productsScrollY')
      })
    }
  }, [])

  const seoTitle = searchQuery
    ? `Results for "${searchQuery}"`
    : selectedCategories.length === 1
      ? `${getCachedCategoryMap().get(selectedCategories[0])?.name || selectedCategories[0]} Gifts`
      : 'All Handcrafted Gifts'
  const seoDescription = searchQuery
    ? `Showing handmade gift results for "${searchQuery}" from India's finest independent artisans.`
    : "Browse 190+ handpicked handmade gifts from India's best independent artisans — jewellery, candles, home decor, skincare, hampers and more."

  return (
    <div className="products-page">
      <div className="products-filters-section">
        <div className="container">
          <div className="filters-wrapper">
            <div className="category-circles-strip category-circles-strip--products">
              <div className="category-circles-scroll">
                {/* All — always first */}
                <button
                  type="button"
                  className={`category-circle-item category-circle-item--btn ${selectedCategories.length === 0 ? 'circle-active' : ''}`}
                  onClick={handleClearAll}
                >
                  <div className="category-circle-all">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                  </div>
                  <span className="category-circle-label">All</span>
                </button>
                {/* Dynamic from catalog — picks up admin name/category changes automatically */}
                {getCachedCategories()
                  .filter(c => c.id !== 'Oxidised-jewellery')
                  .map(cat => {
                    const isSelected = selectedCategories.includes(cat.id)
                    const img = CAT_IMAGES[cat.id] || ''
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`category-circle-item category-circle-item--btn ${isSelected ? 'circle-active' : ''}`}
                        onClick={() => handleCategoryToggle(cat.id)}
                      >
                        <div className="category-circle-img">
                          {img
                            ? <img src={img} alt={cat.name} loading="lazy" onError={e => { e.target.style.display='none' }} />
                            : <span style={{ fontSize: '1.2rem' }}>{cat.icon || '🎁'}</span>
                          }
                        </div>
                        <span className="category-circle-label">{cat.name}</span>
                      </button>
                    )
                  })
                }
              </div>
            </div>
            <ProductSort onSortChange={() => { }} />
            <PriceRangeFilter onApply={(min, max) => setPriceRange({ min, max })} />
          </div>
        </div>
      </div>

      <div className="products-content">
        <div className="container">
          {(searchQuery || searchResults) && (
            <div className="search-results-header">
              <h2>{searchQuery ? `Search Results for "${searchQuery}"` : 'Search Results'}</h2>
              <p>{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found</p>
            </div>
          )}

          {showSkeletons ? (
            <div className="products-grid">
              {Array.from({ length: 12 }).map((_, index) => (
                <ProductSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  categoryMap={categoryMap}
                  priority={index < 12}
                  selectedCategories={selectedCategories}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="64" height="64">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ProductCard = ({ product, index, categoryMap, priority = false, selectedCategories = [] }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { toggleItem, isWishlisted } = useWishlist()
  const wishlisted = isWishlisted(product.id)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [heartPop, setHeartPop] = useState(false)
  const imgZoneRef = useRef(null)
  const secondImage = product.images[1] || null



  const categoryName = useMemo(() => {
    const byId = categoryMap.get(product.categoryId)
    if (byId) return byId.name
    const byName = categoryMap.get(product.category)
    if (byName) return byName.name
    return 'Handmade Gift'
  }, [product.categoryId, product.category, categoryMap])

  // Mobile: swap image when card scrolls into centre of viewport
  useEffect(() => {
    if (!secondImage || !imgZoneRef.current) return
    const el = imgZoneRef.current
    // Only run on touch devices
    const isTouch = window.matchMedia('(hover: none) and (max-width: 768px)').matches
    if (!isTouch) return
    let timer = null
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => { el.classList.add('mobile-swap') })
            })
          }, 250)
        } else {
          clearTimeout(timer)
          el.classList.remove('mobile-swap')
        }
      },
      { threshold: 0.85 }
    )
    obs.observe(el)
    return () => { obs.disconnect(); clearTimeout(timer) }
  }, [secondImage])

  const handleAddToCart = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1400)
  }, [product, addItem])

  const handleWishlist = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleItem(product)
    setHeartPop(true)
    setTimeout(() => setHeartPop(false), 400)
  }, [product, toggleItem])

  const handleCardClick = useCallback(() => {
    const params = selectedCategories.length > 0
      ? `?category=${selectedCategories[0]}`
      : location.search
    navigate(`/product/${product.slug}`, { state: { from: location.pathname + params } })
  }, [product.slug, navigate, location, selectedCategories])

  return (
    <article
      className="feat-card"
      style={{ "--i": index % 12, ...(product.inStock === false ? { opacity: 0.45, filter: 'grayscale(80%)' } : {}) }}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      aria-label={product.title}
    >
      <div ref={imgZoneRef} className={`feat-img-zone${secondImage ? ' has-second-img' : ''}`}>
        <ImageWithFallback
          src={product.images[0]}
          alt={product.title}
          className="feat-img"
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {secondImage && <img src={secondImage} alt="" className="feat-img-hover" aria-hidden="true" loading="lazy" />}
        {product.popular && <span className="feat-badge-popular">Popular</span>}
        {product.inStock === false && <span className="feat-badge-out-of-stock">Out of Stock</span>}
        <button
          className={`feat-wishlist-btn${wishlisted ? " active" : ""}${heartPop ? " heart-pop" : ""}`}
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          type="button"
        >
          <svg viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      <div className="feat-info-zone">
        <p className="feat-category">{categoryName}</p>
        <h3 className="feat-title">{product.title}</h3>
        <p className="feat-price">{product.meta?.sizePrices && Object.keys(product.meta.sizePrices).length > 0 ? `₹${product.price.toLocaleString("en-IN")} onwards` : `₹${product.price.toLocaleString("en-IN")}`}</p>

        <div className="feat-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`feat-add-btn${addedFeedback ? " added" : ""}`}
            onClick={product.inStock === false ? undefined : handleAddToCart}
            type="button"
            aria-label="Add to cart"
            disabled={product.inStock === false}
            style={product.inStock === false ? { background: '#aaa', cursor: 'not-allowed', pointerEvents: 'none' } : {}}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {product.inStock === false ? "Out of Stock" : addedFeedback ? "Added!" : "Add to Cart"}
          </button>
          <button
            className={`feat-wishlist-text-btn${wishlisted ? " active" : ""}`}
            onClick={handleWishlist}
            type="button"
            aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
          >
            <svg viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {wishlisted ? "Saved" : "Wishlist"}
          </button>
        </div>
      </div>
    </article>
  )
}

export default Products