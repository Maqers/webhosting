import { useState, useMemo, useEffect, memo, useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getAllProducts, getSortedCategories, getProductsByCategory, occasionProductMap } from '../data/catalog'
import { searchAll } from '../utils/search'
import { sortProducts, extractRelevanceScores, SORT_TYPES, DEFAULT_SORT } from '../utils/sorting'
import ProductSort from '../components/ProductSort'
import ImageWithFallback from '../components/ImageWithFallback'
import ProductSkeleton from '../components/ProductSkeleton'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import SeoHead from '../components/SeoHead'
import './Products.css'

let cachedCategories = null
let cachedCategoryMap = null

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

const Products = () => {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategories, setSelectedCategories] = useState([])

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
      : (searchResultsData?.products ?? searchResults?.products ?? getAllProducts())

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

    return filtered
  }, [selectedCategories, sortBy, searchResults, searchResultsData, searchQuery, relevanceScores])

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
    : 'Browse 190+ handpicked handmade gifts from India\'s best independent artisans — jewellery, candles, home decor, skincare, hampers and more.'

  return (
    <div className="products-page">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        url="/products"
      />
      <div className="products-hero">
        <div className="container">
          <h1 className="products-title">Our Custom Collection</h1>
          <p className="products-subtitle">Discover unique, handcrafted gifts from Indian home businesses</p>
        </div>
      </div>

      <div className="products-filters-section">
        <div className="container">
          <div className="filters-wrapper">
            <div className="category-filters">
              <button
                className={`filter-chip ${selectedCategories.length === 0 ? 'active' : ''}`}
                onClick={handleClearAll}
                aria-label="Show all products"
                type="button"
              >
                All Products
                {selectedCategories.length > 0 && (
                  <span className="filter-count">({selectedCategories.length} selected)</span>
                )}
              </button>
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id)
                return (
                  <button
                    key={category.id}
                    className={`filter-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleCategoryToggle(category.id)}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${category.name}`}
                    aria-pressed={isSelected}
                    type="button"
                  >
                    <span>{category.emoji} {category.name}</span>
                    {isSelected && (
                      <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
            <ProductSort onSortChange={() => { }} />
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

  const categoryName = useMemo(() => {
    // Always look up by categoryId first — this returns the display name (e.g. "Handmade Florals" not "Crochet")
    const byId = categoryMap.get(product.categoryId)
    if (byId) return byId.name
    // Fallback: try the denormalised product.category string (may be stale)
    const byName = categoryMap.get(product.category)
    if (byName) return byName.name
    return 'Handmade Gift'
  }, [product.categoryId, product.category, categoryMap])

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
  }, [product, toggleItem])

  const handleCardClick = useCallback(() => {
    // Build the return URL including any active category filter
    const params = selectedCategories.length > 0
      ? `?category=${selectedCategories[0]}`
      : location.search
    navigate(`/product/${product.id}`, { state: { from: location.pathname + params } })
  }, [product.id, navigate, location, selectedCategories])

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
      <div className="feat-img-zone">
        <ImageWithFallback
          src={product.images[0]}
          alt={product.title}
          className="feat-img"
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.popular && <span className="feat-badge-popular">Popular</span>}
        {product.inStock === false && <span className="feat-badge-out-of-stock">Out of Stock</span>}
        <button
          className={`feat-wishlist-btn${wishlisted ? " active" : ""}`}
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
        <p className="feat-price">₹{product.price.toLocaleString("en-IN")}</p>

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